import {
  Team,
  ProblemStatement,
  ProblemStatementAllocation,
  SelectionSettings,
  ProblemSelectionRecord,
  ProblemSelectionStatus,
  AttendanceSession,
  AttendanceRecord,
  AttendanceRecordMember,
  Reviewer,
  Volunteer,
  ReviewSettings,
  ReviewMark,
  MemberReviewScore,
  NormalizedScore,
  LeaderboardEntry,
  DeviceSession,
  AuditLog,
  AppSettings,
  UserRole
} from '../types';
import {
  initialAppSettings,
  initialSelectionSettings,
  initialReviewSettings,
  initialProblemStatements,
  initialTeams,
  initialReviewers,
  initialVolunteers,
  initialAdmins
} from '../data/seedData';
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const BACKEND_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) 
  ? (import.meta as any).env.VITE_BACKEND_URL.replace(/\/+$/, '') 
  : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5001' : '');

type Listener = () => void;

class EventStore {
  private appSettings: AppSettings;
  private selectionSettings: SelectionSettings;
  private reviewSettings: ReviewSettings;
  private teams: Team[];
  private problemStatements: ProblemStatement[];
  private reviewers: Reviewer[];
  private volunteers: Volunteer[];
  private attendanceSessions: AttendanceSession[];
  private attendanceRecords: Record<string, AttendanceRecord>; // key: sessionId_teamId
  private reviewMarks: Record<string, ReviewMark>; // key: round_team_reviewer
  private normalizedScores: Record<string, NormalizedScore>; // key: round_team_reviewer
  private leaderboard: LeaderboardEntry[];
  private deviceSessions: Record<string, DeviceSession>; // key: teamId
  private problemSelections: Record<string, ProblemSelectionRecord> = {}; // key: teamId
  private auditLogs: AuditLog[];
  private listeners: Set<Listener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private lastSavedRawString: string = '';

  constructor() {
    // Purge any legacy localStorage cache keys to prevent stale or conflicting data
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('webx_command_store_v1');
        localStorage.removeItem('webx_command_store_v2');
        localStorage.removeItem('webx_command_store_v3');
        localStorage.removeItem('webx_selection_settings');
      } catch (e) {}
    }

    // Initialize with clean in-memory defaults
    this.initializeDefaults();

    // Load any saved persistent selections from localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('webx_persistent_selections_v5');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            this.problemSelections = { ...this.problemSelections, ...parsed };
          }
        }
      } catch (e) {}
    }

    this.repairDataConsistency();
    this.rebuildLeaderboardInternal();

    // 1. Cross-tab real-time synchronization via BroadcastChannel (sub-millisecond instant memory sync)
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('webx_live_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'STORE_MUTATED' && event.data.state) {
            this.applyState(event.data.state);
            this.repairDataConsistency();
            this.rebuildLeaderboardInternal();
            this.notify();
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel initialization skipped:", e);
      }
    }

    // 2. Cross-browser and cross-device local sync via backend on http://localhost:5001
    if (typeof window !== 'undefined') {
      const syncBackend = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/syncState`, { signal: AbortSignal.timeout(1000) });
          if (res.ok) {
            const data = await res.json();
            let changed = false;

            if (data.settings && data.settings.updatedAt && data.settings.updatedAt !== this.selectionSettings.updatedAt) {
              this.selectionSettings = { ...this.selectionSettings, ...data.settings };
              changed = true;
            }

            if (data.problemSelections && typeof data.problemSelections === 'object') {
              const remoteKeys = Object.keys(data.problemSelections);
              for (const k of remoteKeys) {
                const rec = data.problemSelections[k];
                if (rec && rec.active && (!this.problemSelections[k] || this.problemSelections[k].problemStatementId !== rec.problemStatementId)) {
                  this.problemSelections[k] = rec;
                  changed = true;
                }
              }
            }

            if (data.reviewers && Array.isArray(data.reviewers)) {
              if (JSON.stringify(data.reviewers) !== JSON.stringify(this.reviewers)) {
                this.reviewers = data.reviewers;
                changed = true;
              }
            }

            if (data.volunteers && Array.isArray(data.volunteers)) {
              if (JSON.stringify(data.volunteers) !== JSON.stringify(this.volunteers)) {
                this.volunteers = data.volunteers;
                changed = true;
              }
            }

            if (changed) {
              this.repairDataConsistency();
              this.rebuildLeaderboardInternal();
              this.notify();
            }
          }
        } catch (e) {}
      };

      syncBackend();
      setInterval(syncBackend, 1000);
    }

    // 4. Authoritative Firestore Real-time Listeners (Single Source of Truth)
    if (typeof window !== 'undefined' && db) {
      try {
        // Authoritative Problem Selection Control Listener
        onSnapshot(doc(db, 'problemSelectionControl', 'current'), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            let releaseState = data.releaseState || (data.status === 'NOT_RELEASED' || data.status === 'DRAFT' ? 'NOT_RELEASED' : 'RELEASED');
            let selectionState = data.selectionState || (data.status === 'LOCKED' ? 'LOCKED' : data.status === 'CLOSED' ? 'CLOSED' : 'UNLOCKED');
            let lockUntil = data.lockUntil || data.unlockAt || null;

            this.selectionSettings = {
              ...this.selectionSettings,
              releaseState,
              selectionState,
              status: releaseState === 'NOT_RELEASED' ? 'NOT_RELEASED' : selectionState === 'LOCKED' ? 'LOCKED' : selectionState === 'CLOSED' ? 'CLOSED' : 'RELEASED',
              lockStartedAt: data.lockStartedAt || this.selectionSettings.lockStartedAt,
              unlockAt: lockUntil,
              lockUntil: lockUntil,
              closeAt: data.closeAt || null,
              updatedAt: data.updatedAt || new Date().toISOString(),
              updatedBy: data.updatedBy || 'Firebase Firestore'
            };
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] problemSelectionControl listener notice:", err?.message);
        });

        // Authoritative Problem Selections Collection Listener
        onSnapshot(collection(db, 'problemSelections'), (snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as ProblemSelectionRecord;
            const cleanKey = change.doc.id.toUpperCase();
            if (change.type === 'added' || change.type === 'modified') {
              this.problemSelections[cleanKey] = data;
              updated = true;
            } else if (change.type === 'removed') {
              delete this.problemSelections[cleanKey];
              updated = true;
            }
          });
          if (updated) {
            this.repairDataConsistency();
            this.rebuildLeaderboardInternal();
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] problemSelections collection listener notice:", err?.message);
        });

        // Authoritative Teams Collection Listener
        onSnapshot(collection(db, 'teams'), (snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Team;
            const idx = this.teams.findIndex(t => t.teamId === change.doc.id || t.teamId === data.teamId);
            if (idx !== -1) {
              this.teams[idx] = { ...this.teams[idx], ...data };
              updated = true;
            }
          });
          if (updated) {
            this.repairDataConsistency();
            this.rebuildLeaderboardInternal();
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] teams collection listener notice:", err?.message);
        });

        // Authoritative Attendance Sessions Listener
        onSnapshot(collection(db, 'attendanceSessions'), (snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as AttendanceSession;
            const sid = change.doc.id;
            if (change.type === 'added' || change.type === 'modified') {
              const idx = this.attendanceSessions.findIndex(s => s.sessionId === sid);
              if (idx !== -1) {
                this.attendanceSessions[idx] = { ...this.attendanceSessions[idx], ...data, sessionId: sid };
              } else {
                this.attendanceSessions.push({ ...data, sessionId: sid });
              }
              updated = true;
            } else if (change.type === 'removed') {
              this.attendanceSessions = this.attendanceSessions.filter(s => s.sessionId !== sid);
              Object.keys(this.attendanceRecords).forEach(k => {
                if (k.startsWith(`${sid}_`)) delete this.attendanceRecords[k];
              });
              updated = true;
            }
          });
          if (updated) {
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] attendanceSessions collection listener notice:", err?.message);
        });

        // Authoritative Reviewers Collection Listener
        onSnapshot(collection(db, 'reviewers'), (snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Reviewer;
            const rid = change.doc.id;
            if (change.type === 'added' || change.type === 'modified') {
              const idx = this.reviewers.findIndex(r => r.uid === rid || r.uid === data.uid);
              if (idx !== -1) {
                this.reviewers[idx] = { ...this.reviewers[idx], ...data, uid: rid };
              } else {
                this.reviewers.push({ ...data, uid: rid });
              }
              updated = true;
            } else if (change.type === 'removed') {
              this.reviewers = this.reviewers.filter(r => r.uid !== rid);
              updated = true;
            }
          });
          if (updated) {
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] reviewers collection listener notice:", err?.message);
        });

        // Authoritative Volunteers Collection Listener
        onSnapshot(collection(db, 'volunteers'), (snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Volunteer;
            const vid = change.doc.id;
            if (change.type === 'added' || change.type === 'modified') {
              const idx = this.volunteers.findIndex(v => v.uid === vid || v.uid === data.uid);
              if (idx !== -1) {
                this.volunteers[idx] = { ...this.volunteers[idx], ...data, uid: vid };
              } else {
                this.volunteers.push({ ...data, uid: vid });
              }
              updated = true;
            } else if (change.type === 'removed') {
              this.volunteers = this.volunteers.filter(v => v.uid !== vid);
              updated = true;
            }
          });
          if (updated) {
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] volunteers collection listener notice:", err?.message);
        });

        // Authoritative Attendance Records Listener
        onSnapshot(collection(db, 'attendanceRecords'), (snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as AttendanceRecord;
            const rid = change.doc.id;
            if (change.type === 'added' || change.type === 'modified') {
              this.attendanceRecords[rid] = data;
              updated = true;
            } else if (change.type === 'removed') {
              delete this.attendanceRecords[rid];
              updated = true;
            }
          });
          if (updated) {
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] attendanceRecords collection listener notice:", err?.message);
        });

        // Authoritative Review Marks Listener
        onSnapshot(collection(db, 'reviewMarks'), (snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as ReviewMark;
            const rmid = change.doc.id;
            if (change.type === 'added' || change.type === 'modified') {
              this.reviewMarks[rmid] = data;
              if (data.round && data.reviewerUid) {
                this.autoRecalculateNormalizationForReviewer(data.round, data.reviewerUid);
              }
              updated = true;
            } else if (change.type === 'removed') {
              delete this.reviewMarks[rmid];
              delete this.normalizedScores[rmid];
              this.rebuildLeaderboardInternal();
              updated = true;
            }
          });
          if (updated) {
            this.rebuildLeaderboardInternal();
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] reviewMarks collection listener notice:", err?.message);
        });

        // Authoritative Review Settings Listener
        onSnapshot(doc(db, 'reviewSettings', 'current'), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as ReviewSettings;
            this.reviewSettings = { ...this.reviewSettings, ...data };
            this.save();
            this.notify();
          }
        }, (err) => {
          console.warn("[Firestore] reviewSettings listener notice:", err?.message);
        });
      } catch (e) {
        console.warn("[Firestore] Live subscription skipped:", e);
      }
    }
  }

  public syncIfStorageChanged() {
    // Pure in-memory state architecture - no polling needed
  }

  public syncFromStorage(): boolean {
    // Pure in-memory state architecture - state updates propagate via BroadcastChannel & Firestore
    return false;
  }

  // DATA CONSISTENCY REPAIR ROUTINE:
  // Guarantees zero discrepancy between teams table, problemSelections, and allocations, and strictly enforces max 2 teams capacity limit
  public repairDataConsistency() {
    let changed = false;

    // 1. Sync teams with problemSelections bidirectionally (never wipe selections)
    this.teams.forEach((t, idx) => {
      const cleanTeamId = t.teamId.toUpperCase();
      const existingSel = this.problemSelections[cleanTeamId] || this.problemSelections[t.teamId];

      if (existingSel && existingSel.active && existingSel.problemStatementId) {
        if (t.problemStatementId !== existingSel.problemStatementId) {
          this.teams[idx] = {
            ...t,
            problemStatementId: existingSel.problemStatementId,
            problemSelectedAt: existingSel.selectedAt
          };
          changed = true;
        }
      } else if (t.problemStatementId) {
        // Re-populate problemSelections from team if missing
        this.problemSelections[cleanTeamId] = {
          teamId: cleanTeamId,
          teamName: t.teamName,
          problemStatementId: t.problemStatementId,
          psTitle: t.problemStatementId,
          selectedAt: t.problemSelectedAt || new Date().toISOString(),
          selectedBy: t.teamLeadAuthUid || 'team_lead',
          active: true
        };
        changed = true;
      }
    });

    // 2. Strict Capacity Limit Invariant (Max 2 teams per problem statement)
    const psGroups: Record<string, Team[]> = {};
    this.teams.forEach(t => {
      if (t.problemStatementId) {
        if (!psGroups[t.problemStatementId]) psGroups[t.problemStatementId] = [];
        psGroups[t.problemStatementId].push(t);
      }
    });

    Object.entries(psGroups).forEach(([psId, allocatedTeams]) => {
      if (allocatedTeams.length > 2) {
        // Sort by problemSelectedAt (earliest first). Earliest 2 keep slot, excess are freed
        allocatedTeams.sort((a, b) => {
          const timeA = a.problemSelectedAt ? new Date(a.problemSelectedAt).getTime() : 0;
          const timeB = b.problemSelectedAt ? new Date(b.problemSelectedAt).getTime() : 0;
          return timeA - timeB;
        });

        const excessTeams = allocatedTeams.slice(2);
        excessTeams.forEach(excessTeam => {
          const tIdx = this.teams.findIndex(t => t.teamId === excessTeam.teamId);
          if (tIdx !== -1) {
            this.teams[tIdx] = {
              ...this.teams[tIdx],
              problemStatementId: null,
              problemSelectedAt: null
            };
            const cId = excessTeam.teamId.toUpperCase();
            delete this.problemSelections[cId];
            delete this.problemSelections[excessTeam.teamId];
            changed = true;
          }
        });
      }
    });

    return changed;
  }

  private applyState(parsed: any) {
    if (!parsed) return;
    this.appSettings = parsed.appSettings || initialAppSettings;
    this.selectionSettings = parsed.selectionSettings || initialSelectionSettings;
    this.reviewSettings = parsed.reviewSettings || initialReviewSettings;
    if (parsed.teams && Array.isArray(parsed.teams) && parsed.teams.length > 0) {
      this.teams = parsed.teams;
    }
    if (parsed.problemStatements && Array.isArray(parsed.problemStatements)) {
      this.problemStatements = parsed.problemStatements;
    }
    if (parsed.problemSelections && typeof parsed.problemSelections === 'object') {
      this.problemSelections = parsed.problemSelections;
    }
    if (parsed.reviewers && Array.isArray(parsed.reviewers)) {
      this.reviewers = parsed.reviewers;
    }
    if (parsed.volunteers && Array.isArray(parsed.volunteers)) {
      this.volunteers = parsed.volunteers;
    }
    if (parsed.attendanceSessions && Array.isArray(parsed.attendanceSessions)) {
      this.attendanceSessions = parsed.attendanceSessions.filter(
        s => s.sessionId !== 'SESSION-01' && s.sessionId !== 'SESSION-02'
      );
    } else {
      this.attendanceSessions = [];
    }
    if (parsed.attendanceRecords && typeof parsed.attendanceRecords === 'object') {
      const cleaned: Record<string, AttendanceRecord> = {};
      Object.entries(parsed.attendanceRecords).forEach(([k, v]) => {
        if (!k.startsWith('SESSION-01_') && !k.startsWith('SESSION-02_')) {
          cleaned[k] = v as AttendanceRecord;
        }
      });
      this.attendanceRecords = cleaned;
    } else {
      this.attendanceRecords = {};
    }
    if (parsed.reviewMarks && typeof parsed.reviewMarks === 'object') {
      this.reviewMarks = parsed.reviewMarks;
    }
    if (parsed.normalizedScores && typeof parsed.normalizedScores === 'object') {
      this.normalizedScores = parsed.normalizedScores;
    }
    if (parsed.leaderboard && Array.isArray(parsed.leaderboard)) {
      this.leaderboard = parsed.leaderboard;
    }
    if (parsed.deviceSessions && typeof parsed.deviceSessions === 'object') {
      this.deviceSessions = parsed.deviceSessions;
    }
    if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
      this.auditLogs = parsed.auditLogs;
    }
  }

  private initializeDefaults() {
    this.appSettings = { ...initialAppSettings };
    this.selectionSettings = { ...initialSelectionSettings };
    this.reviewSettings = { ...initialReviewSettings };
    this.teams = initialTeams;
    this.problemStatements = initialProblemStatements;
    this.reviewers = initialReviewers;
    this.volunteers = [...initialVolunteers];
    this.attendanceSessions = [];
    this.attendanceRecords = {};
    this.reviewMarks = {};
    this.normalizedScores = {};
    this.deviceSessions = {};
    this.auditLogs = [
      {
        id: "log-init-1",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        actorUid: "admin-1",
        actorEmail: "bkrishnachaitanya285@gmail.com",
        actorRole: "admin",
        action: "INITIALIZE_SYSTEM",
        targetType: "system",
        targetId: "GLOBAL",
        metadata: { message: "WEBX COMMAND control center initialized with 60 teams and 32 problem statements." }
      }
    ];
    this.leaderboard = [];
  }

  public save() {
    try {
      const state = {
        appSettings: this.appSettings,
        selectionSettings: this.selectionSettings,
        reviewSettings: this.reviewSettings,
        teams: this.teams,
        problemStatements: this.problemStatements,
        problemSelections: this.problemSelections,
        reviewers: this.reviewers,
        volunteers: this.volunteers,
        attendanceSessions: this.attendanceSessions,
        attendanceRecords: this.attendanceRecords,
        reviewMarks: this.reviewMarks,
        normalizedScores: this.normalizedScores,
        leaderboard: this.leaderboard,
        deviceSessions: this.deviceSessions,
        auditLogs: this.auditLogs
      };

      // 1. Persist selection snapshot to localStorage for reliable restoration
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('webx_persistent_selections_v5', JSON.stringify(this.problemSelections));
        } catch (e) {}
      }

      // 2. BroadcastChannel: Sub-millisecond instant cross-tab sync in memory
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: 'STORE_MUTATED', state });
        } catch (e) {}
      }

      // 3. Custom window event for same-tab listeners
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        try {
          window.dispatchEvent(new CustomEvent('webx_store_updated', { detail: { timestamp: Date.now() } }));
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Save notification error:", e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try { l(); } catch (e) { console.error("Listener error:", e); }
    });
  }

  // AUDIT LOGGING
  public addAuditLog(
    actorUid: string,
    actorEmail: string | undefined,
    actorRole: UserRole,
    action: string,
    targetType: AuditLog['targetType'],
    targetId: string,
    metadata: Record<string, any>
  ) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUid,
      actorEmail,
      actorRole,
      action,
      targetType,
      targetId,
      metadata
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.save();
  }

  // GETTERS
  public getAppSettings(): AppSettings { return { ...this.appSettings }; }
  public getSelectionSettings(): SelectionSettings {
    let { releaseState, selectionState, lockUntil, status } = this.selectionSettings;

    // 1. Normalize releaseState & selectionState from status if legacy
    if (!releaseState) {
      releaseState = (status === 'NOT_RELEASED' || status === 'DRAFT') ? 'NOT_RELEASED' : 'RELEASED';
    }
    if (!selectionState) {
      if (status === 'LOCKED') selectionState = 'LOCKED';
      else if (status === 'CLOSED') selectionState = 'CLOSED';
      else selectionState = 'UNLOCKED';
    }
    if (!lockUntil && this.selectionSettings.unlockAt) {
      lockUntil = this.selectionSettings.unlockAt;
    }

    // 2. Automatic Server-Timer Unlock Evaluation
    if (selectionState === 'LOCKED' && lockUntil) {
      const unlockTime = new Date(lockUntil).getTime();
      if (Date.now() >= unlockTime) {
        selectionState = 'UNLOCKED';
        lockUntil = null;
        this.selectionSettings = {
          ...this.selectionSettings,
          releaseState,
          selectionState: 'UNLOCKED',
          status: 'RELEASED',
          unlockAt: null,
          lockUntil: null,
          updatedAt: new Date().toISOString(),
          updatedBy: 'System (Auto-Unlock)'
        };
        this.save();
      }
    }

    // 3. Map unified single status
    let mappedStatus: ProblemSelectionStatus = 'RELEASED';
    if (releaseState === 'NOT_RELEASED') {
      mappedStatus = 'NOT_RELEASED';
    } else if (selectionState === 'LOCKED') {
      mappedStatus = 'LOCKED';
    } else if (selectionState === 'CLOSED') {
      mappedStatus = 'CLOSED';
    } else {
      mappedStatus = 'RELEASED';
    }

    return {
      ...this.selectionSettings,
      releaseState,
      selectionState,
      status: mappedStatus,
      unlockAt: lockUntil,
      lockUntil
    };
  }

  public releaseProblemStatements(adminUid: string, adminEmail: string, readingDurationMinutes?: number) {
    const now = Date.now();
    const duration = readingDurationMinutes && readingDurationMinutes > 0 ? readingDurationMinutes : undefined;
    const lockUntil = duration ? new Date(now + duration * 60 * 1000).toISOString() : null;

    this.updateSelectionSettings(adminUid, adminEmail, {
      releaseState: 'RELEASED',
      selectionState: 'LOCKED',
      status: 'LOCKED',
      releaseAt: new Date(now).toISOString(),
      lockStartedAt: new Date(now).toISOString(),
      unlockAt: lockUntil,
      lockUntil
    });
  }

  public removeReleaseProblemStatements(adminUid: string, adminEmail: string) {
    this.updateSelectionSettings(adminUid, adminEmail, {
      releaseState: 'NOT_RELEASED',
      selectionState: 'CLOSED',
      status: 'NOT_RELEASED',
      unlockAt: null,
      lockUntil: null,
      closeAt: null
    });
  }

  public lockProblemSelection(adminUid: string, adminEmail: string, durationMinutes?: number) {
    const now = Date.now();
    const lockUntil = durationMinutes && durationMinutes > 0
      ? new Date(now + durationMinutes * 60 * 1000).toISOString()
      : null;

    this.updateSelectionSettings(adminUid, adminEmail, {
      releaseState: 'RELEASED',
      selectionState: 'LOCKED',
      status: 'LOCKED',
      lockStartedAt: new Date(now).toISOString(),
      unlockAt: lockUntil,
      lockUntil
    });
  }

  public unlockProblemSelection(adminUid: string, adminEmail: string) {
    this.updateSelectionSettings(adminUid, adminEmail, {
      releaseState: 'RELEASED',
      selectionState: 'UNLOCKED',
      status: 'UNLOCKED',
      unlockAt: null,
      lockUntil: null
    });
  }

  public closeProblemSelection(adminUid: string, adminEmail: string) {
    this.updateSelectionSettings(adminUid, adminEmail, {
      releaseState: 'RELEASED',
      selectionState: 'CLOSED',
      status: 'CLOSED',
      closeAt: new Date().toISOString(),
      unlockAt: null,
      lockUntil: null
    });
  }

  public getProblemSelections(): ProblemSelectionRecord[] {
    return Object.values(this.problemSelections).filter(s => s && s.active);
  }

  public getReviewSettings(): ReviewSettings { return { ...this.reviewSettings }; }
  public getTeams(): Team[] { return [...this.teams]; }
  public getTeam(teamId: string): Team | undefined {
    if (!teamId) return undefined;
    const cleanId = teamId.trim().toUpperCase();
    const exact = this.teams.find(t => t.teamId === cleanId);
    if (exact) return exact;

    // Tolerate letter 'O' instead of '0' or unpadded numbers (e.g., WEB-O18, WEB-18, 18)
    const normalized = cleanId.replace(/O/g, '0');
    const directNormalized = this.teams.find(t => t.teamId === normalized);
    if (directNormalized) return directNormalized;

    const numMatch = normalized.match(/\d+/);
    if (numMatch) {
      const paddedId = `WEB-${String(parseInt(numMatch[0], 10)).padStart(3, '0')}`;
      return this.teams.find(t => t.teamId === paddedId);
    }
    return undefined;
  }
  public getProblemStatements(): ProblemStatement[] { return [...this.problemStatements]; }
  public getProblemStatement(psId: string): ProblemStatement | undefined { return this.problemStatements.find(p => p.problemStatementId === psId); }
  public getReviewers(): Reviewer[] { return [...this.reviewers]; }
  public getVolunteers(): Volunteer[] { return [...this.volunteers]; }
  public getAttendanceSessions(): AttendanceSession[] { return [...this.attendanceSessions]; }
  public getAttendanceRecordsForSession(sessionId: string): AttendanceRecord[] {
    return Object.values(this.attendanceRecords).filter(r => r.sessionId === sessionId);
  }
  public getAttendanceRecord(sessionId: string, teamId: string): AttendanceRecord | undefined {
    return this.attendanceRecords[`${sessionId}_${teamId}`];
  }
  public getAttendanceForTeam(teamId: string): { session: AttendanceSession; record?: AttendanceRecord }[] {
    return this.attendanceSessions.map(session => ({
      session,
      record: this.attendanceRecords[`${session.sessionId}_${teamId}`]
    }));
  }
  public getReviewMarks(): ReviewMark[] { return Object.values(this.reviewMarks); }
  public getReviewMarksForTeam(teamId: string): ReviewMark[] {
    return Object.values(this.reviewMarks).filter(m => m.teamId === teamId);
  }
  public getNormalizedScores(): NormalizedScore[] { return Object.values(this.normalizedScores); }
  public getLeaderboard(): LeaderboardEntry[] { return [...this.leaderboard]; }
  public getAuditLogs(): AuditLog[] { return [...this.auditLogs]; }
  public getDeviceSessions(): Record<string, DeviceSession> { return { ...this.deviceSessions }; }

  // PROBLEM STATEMENT ALLOCATIONS
  public getAllocations(): Record<string, ProblemStatementAllocation> {
    const allocations: Record<string, ProblemStatementAllocation> = {};
    
    // Initialize each PS
    this.problemStatements.forEach(ps => {
      allocations[ps.problemStatementId] = {
        problemStatementId: ps.problemStatementId,
        maximumTeams: ps.maximumTeams,
        allocatedTeamIds: [],
        currentTeamCount: 0,
        updatedAt: new Date().toISOString()
      };
    });

    // Populate with teams that have chosen a PS
    this.teams.forEach(team => {
      if (team.problemStatementId && allocations[team.problemStatementId]) {
        allocations[team.problemStatementId].allocatedTeamIds.push(team.teamId);
        allocations[team.problemStatementId].currentTeamCount++;
      }
    });

    return allocations;
  }

  // ATOMIC PROBLEM STATEMENT SELECTION (12-Step Validation & Server Transaction)
  public async selectProblemStatement(
    teamId: string,
    problemStatementId: string,
    actorUid: string
  ): Promise<{ success: boolean; error?: string }> {
    const now = Date.now();
    const settings = this.getSelectionSettings(); // Evaluates auto-unlock if lockUntil passed
    const { releaseState, selectionState } = settings;

    // 1. Check NOT_RELEASED
    if (releaseState === 'NOT_RELEASED' || settings.status === 'NOT_RELEASED' || settings.status === 'DRAFT') {
      return { success: false, error: "Problem Statements have not been released yet." };
    }

    // 2. Check LOCKED
    if (selectionState === 'LOCKED' || settings.status === 'LOCKED') {
      return { success: false, error: "Problem Statement Selection is currently locked." };
    }

    // 3. Check CLOSED
    if (selectionState === 'CLOSED' || settings.status === 'CLOSED') {
      return { success: false, error: "Problem Statement selection is currently closed." };
    }

    // 4. Check closeAt expiry
    if (settings.closeAt) {
      const closeTime = new Date(settings.closeAt).getTime();
      if (now >= closeTime) {
        return { success: false, error: "Problem Statement selection window has closed." };
      }
    }

    // 5. Validate Team
    const cleanTeamId = teamId.trim().toUpperCase();
    const teamIndex = this.teams.findIndex(t => t.teamId === cleanTeamId || t.teamId === teamId);
    if (teamIndex === -1) {
      return { success: false, error: "Invalid Team ID." };
    }
    const team = this.teams[teamIndex];

    // 6. One PS per Team rule
    if (team.problemStatementId || (this.problemSelections[cleanTeamId] && this.problemSelections[cleanTeamId].active)) {
      const existingPS = team.problemStatementId || this.problemSelections[cleanTeamId]?.problemStatementId;
      return { success: false, error: `Team ${teamId} has already selected problem statement ${existingPS}.` };
    }

    // 7. Validate Problem Statement & Capacity
    const ps = this.problemStatements.find(p => p.problemStatementId === problemStatementId);
    if (!ps) {
      return { success: false, error: "Selected Problem Statement does not exist." };
    }
    if (ps.status !== 'active') {
      return { success: false, error: "This Problem Statement is currently inactive or archived." };
    }

    const currentAllocatedTeams = this.teams.filter(t => t.problemStatementId === problemStatementId && t.teamId !== cleanTeamId);
    const maxTeams = 2; // Hardcoded strictly to 2 teams max
    if (currentAllocatedTeams.length >= maxTeams) {
      return {
        success: false,
        error: `THIS PROBLEM STATEMENT IS NOW FULL. Maximum capacity of ${maxTeams} teams reached.`
      };
    }

    // 8. Authoritative Server Transaction Call
    const selectedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch(`${BACKEND_URL}/api/selectProblemStatement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: cleanTeamId, problemStatementId, actorUid }),
          signal: AbortSignal.timeout(1500)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false || data.error) {
          const errMsg = data.error || `Problem Statement is already full. Maximum ${maxTeams} teams reached.`;
          // Trigger sync to get latest remote state
          try {
            const syncRes = await fetch(`${BACKEND_URL}/api/syncState`, { signal: AbortSignal.timeout(1000) });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.problemSelections) {
                this.problemSelections = syncData.problemSelections;
                this.repairDataConsistency();
                this.notify();
              }
            }
          } catch (e) {}
          return { success: false, error: errMsg };
        }
      } catch (networkErr: any) {
        console.warn("[Store Selection Fast-Path Note]:", networkErr?.message || networkErr);
      }
    }

    // 9. Commit atomic dual-record selection locally
    this.teams[teamIndex] = {
      ...team,
      problemStatementId,
      problemSelectedAt: selectedAt,
      updatedAt: selectedAt
    };

    this.problemSelections[cleanTeamId] = {
      teamId: cleanTeamId,
      teamName: team.teamName,
      problemStatementId,
      psTitle: ps.title,
      selectedAt,
      selectedBy: actorUid,
      active: true
    };

    this.rebuildLeaderboardInternal();

    // 10. Audit Trail
    this.addAuditLog(
      actorUid,
      `${teamId} Lead`,
      'team_lead',
      'PROBLEM_STATEMENT_SELECTED',
      'selection',
      teamId,
      {
        teamId,
        problemStatementId,
        psTitle: ps.title,
        slotNumber: currentAllocatedTeams.length + 1,
        maxCapacity: maxTeams
      }
    );

    this.save();
    this.notify();

    // Authoritative Firestore Persistence
    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'teams', cleanTeamId), {
          teamId: cleanTeamId,
          problemStatementId,
          problemSelectedAt: selectedAt,
          updatedAt: selectedAt
        }, { merge: true }).catch(() => {});

        setDoc(doc(db, 'problemSelections', cleanTeamId), {
          teamId: cleanTeamId,
          teamName: team.teamName,
          problemStatementId,
          psTitle: ps.title,
          selectedAt,
          selectedBy: actorUid,
          active: true
        }, { merge: true }).catch(() => {});

        setDoc(doc(db, 'problemStatementAllocations', problemStatementId), {
          problemStatementId,
          maximumTeams: maxTeams,
          currentTeamCount: currentAllocatedTeams.length + 1,
          allocatedTeamIds: [...currentAllocatedTeams.map(t => t.teamId), cleanTeamId],
          updatedAt: selectedAt
        }, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  // ADMIN OVERRIDES FOR PROBLEM STATEMENTS
  public adminAssignProblemStatement(
    adminUid: string,
    adminEmail: string,
    teamId: string,
    problemStatementId: string | null
  ): { success: boolean; error?: string } {
    const cleanTeamId = teamId.trim().toUpperCase();
    const teamIndex = this.teams.findIndex(t => t.teamId === cleanTeamId || t.teamId === teamId);
    if (teamIndex === -1) return { success: false, error: "Team not found." };

    const team = this.teams[teamIndex];
    const oldPs = team.problemStatementId;
    const updatedAt = new Date().toISOString();

    if (problemStatementId && problemStatementId !== oldPs) {
      const alloc = this.getAllocations()[problemStatementId];
      const ps = this.getProblemStatement(problemStatementId);
      const max = ps ? (ps.maximumTeams || 2) : 2;
      const count = alloc?.currentTeamCount || 0;
      
      if (count >= max) {
        return { success: false, error: "Problem statement has reached its maximum capacity." };
      }
    }

    this.teams[teamIndex] = {
      ...this.teams[teamIndex],
      problemStatementId,
      problemSelectedAt: problemStatementId ? updatedAt : null,
      updatedAt
    };

    if (problemStatementId) {
      const ps = this.getProblemStatement(problemStatementId);
      this.problemSelections[cleanTeamId] = {
        teamId: cleanTeamId,
        teamName: team.teamName,
        problemStatementId,
        psTitle: ps ? ps.title : problemStatementId,
        selectedAt: updatedAt,
        selectedBy: adminEmail || adminUid,
        active: true
      };
    } else {
      delete this.problemSelections[cleanTeamId];
      delete this.problemSelections[teamId];
    }

    this.rebuildLeaderboardInternal();

    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      problemStatementId ? 'ADMIN_ASSIGN_PS' : 'ADMIN_UNASSIGN_PS',
      'team',
      cleanTeamId,
      { teamId: cleanTeamId, previousPS: oldPs, newPS: problemStatementId }
    );

    this.save();

    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/adminAssignProblemStatement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: cleanTeamId, problemStatementId, adminEmail, actorUid: adminUid })
        }).catch(() => {});
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'teams', cleanTeamId), {
          problemStatementId,
          problemSelectedAt: problemStatementId ? updatedAt : null,
          updatedAt
        }, { merge: true }).catch(() => {});

        if (problemStatementId) {
          setDoc(doc(db, 'problemSelections', cleanTeamId), this.problemSelections[cleanTeamId], { merge: true }).catch(() => {});
          const alloc = this.getAllocations()[problemStatementId];
          if (alloc) {
            setDoc(doc(db, 'problemStatementAllocations', problemStatementId), alloc, { merge: true }).catch(() => {});
          }
        } else {
          deleteDoc(doc(db, 'problemSelections', cleanTeamId)).catch(() => {});
          if (oldPs) {
            const alloc = this.getAllocations()[oldPs];
            if (alloc) {
              setDoc(doc(db, 'problemStatementAllocations', oldPs), alloc, { merge: true }).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.warn("[Firestore] Error updating adminAssignProblemStatement:", e);
      }
    }

    return { success: true };
  }

  public updateProblemStatementCapacity(
    adminUid: string,
    adminEmail: string,
    psId: string,
    newCapacity: number
  ): { success: boolean; error?: string } {
    const index = this.problemStatements.findIndex(p => p.problemStatementId === psId);
    if (index === -1) return { success: false, error: "Problem Statement not found." };

    const oldCap = this.problemStatements[index].maximumTeams;
    this.problemStatements[index] = {
      ...this.problemStatements[index],
      maximumTeams: newCapacity,
      updatedAt: new Date().toISOString()
    };

    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      'UPDATE_PS_CAPACITY',
      'problem_statement',
      psId,
      { psId, oldCapacity: oldCap, newCapacity }
    );

    this.save();
    return { success: true };
  }

  public updateSelectionSettings(
    adminUid: string,
    adminEmail: string,
    settings: Partial<SelectionSettings>
  ) {
    let releaseState = settings.releaseState ?? this.selectionSettings.releaseState ?? 'NOT_RELEASED';
    let selectionState = settings.selectionState ?? this.selectionSettings.selectionState ?? 'CLOSED';
    let lockUntil = settings.lockUntil !== undefined ? settings.lockUntil : (settings.unlockAt !== undefined ? settings.unlockAt : this.selectionSettings.lockUntil);

    if (settings.status) {
      if (settings.status === 'NOT_RELEASED' || settings.status === 'DRAFT') {
        releaseState = 'NOT_RELEASED';
        selectionState = 'CLOSED';
      } else if (settings.status === 'LOCKED') {
        releaseState = 'RELEASED';
        selectionState = 'LOCKED';
      } else if (settings.status === 'CLOSED') {
        releaseState = 'RELEASED';
        selectionState = 'CLOSED';
      } else if (settings.status === 'RELEASED' || settings.status === 'UNLOCKED' || settings.status === 'LIVE') {
        releaseState = 'RELEASED';
        selectionState = 'UNLOCKED';
      }
    }

    this.selectionSettings = {
      ...this.selectionSettings,
      ...settings,
      releaseState,
      selectionState,
      lockUntil,
      unlockAt: lockUntil,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      'UPDATE_SELECTION_SETTINGS',
      'selection',
      'current',
      { newSettings: settings }
    );

    this.save();

    // Authoritative Single Source of Truth write to problemSelectionControl/current & Backend API
    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/selectionSettings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.selectionSettings)
        }).catch(() => {});
      } catch (e) {}

      if (db) {
        try {
          const controlPayload = {
            releaseState,
            selectionState,
            status: this.selectionSettings.status,
            lockStartedAt: this.selectionSettings.lockStartedAt || null,
            lockUntil: this.selectionSettings.lockUntil || null,
            unlockAt: this.selectionSettings.unlockAt || null,
            closeAt: this.selectionSettings.closeAt || null,
            updatedAt: this.selectionSettings.updatedAt,
            updatedBy: adminEmail
          };
          setDoc(doc(db, 'problemSelectionControl', 'current'), controlPayload, { merge: true }).catch(() => {});
          setDoc(doc(db, 'selectionSettings', 'current'), controlPayload, { merge: true }).catch(() => {});
        } catch (e) {}
      }
    }
  }

  // SINGLE DEVICE SESSION MANAGEMENT
  public verifyOrRegisterDeviceSession(
    teamId: string,
    deviceId: string,
    deviceInfo: string
  ): { allowed: boolean; message?: string } {
    const existing = this.deviceSessions[teamId];
    const now = new Date().toISOString();

    if (!existing || existing.status === 'revoked') {
      // Create active device session
      this.deviceSessions[teamId] = {
        teamId,
        teamLeadAuthUid: teamId,
        sessionId: `sess-${Date.now()}`,
        deviceId,
        deviceInfo,
        status: 'active',
        createdAt: now,
        lastSeenAt: now
      };
      this.save();
      return { allowed: true };
    }

    // If existing session belongs to the same deviceId, update lastSeenAt
    if (existing.deviceId === deviceId && existing.status === 'active') {
      existing.lastSeenAt = now;
      this.save();
      return { allowed: true };
    }

    // Another device is already logged in
    return {
      allowed: false,
      message: "THIS TEAM ACCOUNT IS ALREADY ACTIVE ON ANOTHER DEVICE. Please contact the WEBX Command administrator."
    };
  }

  public adminResetDeviceSession(adminUid: string, adminEmail: string, teamId: string) {
    if (this.deviceSessions[teamId]) {
      this.deviceSessions[teamId].status = 'revoked';
      this.deviceSessions[teamId].revokedAt = new Date().toISOString();
    }
    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      'RESET_TEAM_DEVICE_SESSION',
      'session',
      teamId,
      { teamId }
    );
    this.save();
  }

  public revokeDeviceSession(adminUid: string, adminEmail: string, teamId: string) {
    return this.adminResetDeviceSession(adminUid, adminEmail, teamId);
  }

  // ATTENDANCE SESSION MANAGEMENT (FIREBASE-BACKED PRODUCTION ENGINE)
  public createAttendanceSession(
    adminUid: string,
    adminEmail: string,
    data: {
      name: string;
      description?: string;
      date: string;
      startTime: string;
      endTime?: string;
    }
  ): { success: boolean; session?: AttendanceSession; error?: string } {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Session name is required." };
    }

    const sessionId = `SESSION_${(this.attendanceSessions.length + 1).toString().padStart(3, '0')}`;
    const newSession: AttendanceSession = {
      sessionId,
      name: data.name.trim(),
      sessionName: data.name.trim(),
      description: data.description?.trim() || '',
      date: data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      startTime: data.startTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: data.endTime?.trim() || '',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      createdBy: adminEmail,
      openedAt: null,
      closedAt: null
    };

    this.attendanceSessions.push(newSession);
    this.addAuditLog(adminUid, adminEmail, 'admin', 'CREATE_ATTENDANCE_SESSION', 'attendance', sessionId, {
      name: newSession.name,
      date: newSession.date,
      startTime: newSession.startTime,
      status: 'DRAFT'
    });
    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'attendanceSessions', sessionId), newSession, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true, session: newSession };
  }

  public editAttendanceSession(
    adminUid: string,
    adminEmail: string,
    sessionId: string,
    updates: {
      name?: string;
      description?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
    }
  ): { success: boolean; error?: string } {
    const session = this.attendanceSessions.find(s => s.sessionId === sessionId);
    if (!session) return { success: false, error: "Session not found." };
    if (session.status !== 'DRAFT' && session.status !== 'draft') {
      return { success: false, error: "Only DRAFT sessions can be edited." };
    }

    if (updates.name) {
      session.name = updates.name.trim();
      session.sessionName = updates.name.trim();
    }
    if (updates.description !== undefined) session.description = updates.description.trim();
    if (updates.date) session.date = updates.date;
    if (updates.startTime) session.startTime = updates.startTime;
    if (updates.endTime !== undefined) session.endTime = updates.endTime;

    this.addAuditLog(adminUid, adminEmail, 'admin', 'EDIT_ATTENDANCE_SESSION', 'attendance', sessionId, updates);
    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'attendanceSessions', sessionId), session, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  public openAttendanceSession(adminUid: string, adminEmail: string, sessionId: string): { success: boolean; error?: string } {
    // RULE: ONLY ONE SESSION CAN BE ACTIVE AT A TIME.
    const active = this.attendanceSessions.find(
      s => (s.status === 'ACTIVE' || s.status === 'active') && s.sessionId !== sessionId
    );

    if (active) {
      return {
        success: false,
        error: "Another attendance session is currently active. Close the current session before opening another."
      };
    }

    const session = this.attendanceSessions.find(s => s.sessionId === sessionId);
    if (!session) return { success: false, error: "Session not found." };

    session.status = 'ACTIVE';
    session.openedAt = new Date().toISOString();
    session.closedAt = null;

    this.addAuditLog(adminUid, adminEmail, 'admin', 'OPEN_ATTENDANCE_SESSION', 'attendance', sessionId, {
      sessionName: session.name || session.sessionName,
      openedAt: session.openedAt
    });

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'attendanceSessions', sessionId), session, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  public closeAttendanceSession(adminUid: string, adminEmail: string, sessionId: string): { success: boolean; error?: string } {
    const session = this.attendanceSessions.find(s => s.sessionId === sessionId);
    if (!session) return { success: false, error: "Session not found." };

    session.status = 'CLOSED';
    session.closedAt = new Date().toISOString();

    this.addAuditLog(adminUid, adminEmail, 'admin', 'CLOSE_ATTENDANCE_SESSION', 'attendance', sessionId, {
      sessionName: session.name || session.sessionName,
      closedAt: session.closedAt
    });

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'attendanceSessions', sessionId), session, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  public deleteAttendanceSession(adminUid: string, adminEmail: string, sessionId: string): { success: boolean; error?: string } {
    const session = this.attendanceSessions.find(s => s.sessionId === sessionId);
    if (!session) return { success: false, error: "Session not found." };

    // Create immutable audit log before deletion
    this.addAuditLog(adminUid, adminEmail, 'admin', 'DELETE_ATTENDANCE_SESSION', 'attendance', sessionId, {
      deletedSessionName: session.name || session.sessionName,
      recordsCount: Object.keys(this.attendanceRecords).filter(k => k.startsWith(`${sessionId}_`)).length
    });

    // Remove session
    this.attendanceSessions = this.attendanceSessions.filter(s => s.sessionId !== sessionId);

    // Remove associated records
    Object.keys(this.attendanceRecords).forEach(k => {
      if (k.startsWith(`${sessionId}_`)) {
        delete this.attendanceRecords[k];
      }
    });

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        deleteDoc(doc(db, 'attendanceSessions', sessionId)).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  public getActiveAttendanceSession(): AttendanceSession | null {
    return this.attendanceSessions.find(s => s.status === 'ACTIVE' || s.status === 'active') || null;
  }

  public submitAttendance(
    volunteerUid: string,
    volunteerName: string,
    sessionId: string,
    teamId: string,
    memberEntries: Record<string, { status: 'PRESENT' | 'ABSENT' }> | AttendanceRecordMember[]
  ): { success: boolean; error?: string; record?: AttendanceRecord } {
    const session = this.attendanceSessions.find(s => s.sessionId === sessionId);
    if (!session || (session.status !== 'ACTIVE' && session.status !== 'active')) {
      return { success: false, error: "Attendance session is not currently active." };
    }

    const team = this.teams.find(t => t.teamId === teamId);
    if (!team) {
      return { success: false, error: `Team ${teamId} does not exist.` };
    }

    const key = `${sessionId}_${teamId}`;
    const existing = this.attendanceRecords[key];
    if (existing && existing.submitted) {
      return { success: false, error: `Attendance for Team ${teamId} has already been submitted and is locked.` };
    }

    const membersList: AttendanceRecordMember[] = [];
    const serverTimestamp = new Date().toISOString();

    team.members.forEach(m => {
      let st: 'PRESENT' | 'ABSENT' = 'PRESENT';
      if (Array.isArray(memberEntries)) {
        const found = memberEntries.find(entry => entry.memberId === m.memberId);
        st = found?.status || (found?.present ? 'PRESENT' : 'ABSENT');
      } else if (memberEntries && memberEntries[m.memberId]) {
        st = memberEntries[m.memberId].status;
      }

      membersList.push({
        memberId: m.memberId,
        name: m.name,
        registrationNumber: m.registrationNumber,
        status: st,
        present: st === 'PRESENT',
        markedAt: serverTimestamp
      });
    });

    const record: AttendanceRecord = {
      sessionId,
      teamId,
      submitted: true,
      submittedAt: serverTimestamp,
      submittedByVolunteerUid: volunteerUid,
      volunteerName,
      members: membersList
    };

    this.attendanceRecords[key] = record;
    this.addAuditLog(
      volunteerUid,
      volunteerName,
      'volunteer',
      'SUBMIT_ATTENDANCE',
      'attendance',
      key,
      {
        sessionId,
        teamId,
        presentCount: membersList.filter(m => m.status === 'PRESENT').length,
        totalMembers: membersList.length,
        submittedAt: serverTimestamp
      }
    );

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'attendanceRecords', key), record, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true, record };
  }

  public overrideMemberAttendance(
    adminUid: string,
    adminEmail: string,
    sessionId: string,
    teamId: string,
    memberId: string,
    newStatus: 'PRESENT' | 'ABSENT',
    reason: string
  ): { success: boolean; error?: string } {
    if (!reason || !reason.trim()) {
      return { success: false, error: "Reason for attendance override is strictly mandatory." };
    }

    const team = this.teams.find(t => t.teamId === teamId);
    if (!team) return { success: false, error: "Team not found." };

    const member = team.members.find(m => m.memberId === memberId);
    if (!member) return { success: false, error: "Member not found in team." };

    const key = `${sessionId}_${teamId}`;
    let record = this.attendanceRecords[key];
    const timestamp = new Date().toISOString();

    if (!record) {
      // Create fresh record for un-scanned team
      const initialMembers: AttendanceRecordMember[] = team.members.map(m => ({
        memberId: m.memberId,
        name: m.name,
        registrationNumber: m.registrationNumber,
        status: m.memberId === memberId ? newStatus : 'ABSENT',
        present: (m.memberId === memberId ? newStatus : 'ABSENT') === 'PRESENT',
        markedAt: timestamp,
        overrideReason: m.memberId === memberId ? reason.trim() : undefined,
        overriddenBy: m.memberId === memberId ? adminEmail : undefined,
        overriddenAt: m.memberId === memberId ? timestamp : undefined
      }));

      record = {
        sessionId,
        teamId,
        submitted: true,
        submittedAt: timestamp,
        submittedByVolunteerUid: adminUid,
        volunteerName: `Admin Override (${adminEmail})`,
        members: initialMembers,
        lastModifiedBy: adminEmail
      };
      this.attendanceRecords[key] = record;

      this.addAuditLog(adminUid, adminEmail, 'admin', 'ATTENDANCE_OVERRIDE', 'attendance', `${key}_${memberId}`, {
        action: "ATTENDANCE_OVERRIDE",
        sessionId,
        teamId,
        memberId,
        memberName: member.name,
        oldStatus: "NOT MARKED",
        newStatus,
        reason: reason.trim(),
        changedBy: adminEmail,
        timestamp
      });
    } else {
      // Update existing record
      let oldStatus = "ABSENT";
      if (Array.isArray(record.members)) {
        const memRecord = record.members.find(m => m.memberId === memberId);
        if (memRecord) {
          oldStatus = memRecord.status || (memRecord.present ? 'PRESENT' : 'ABSENT');
          memRecord.status = newStatus;
          memRecord.present = newStatus === 'PRESENT';
          memRecord.overrideReason = reason.trim();
          memRecord.overriddenBy = adminEmail;
          memRecord.overriddenAt = timestamp;
        } else {
          record.members.push({
            memberId: member.memberId,
            name: member.name,
            registrationNumber: member.registrationNumber,
            status: newStatus,
            present: newStatus === 'PRESENT',
            markedAt: timestamp,
            overrideReason: reason.trim(),
            overriddenBy: adminEmail,
            overriddenAt: timestamp
          });
        }
      }
      record.lastModifiedBy = adminEmail;

      this.addAuditLog(adminUid, adminEmail, 'admin', 'ATTENDANCE_OVERRIDE', 'attendance', `${key}_${memberId}`, {
        action: "ATTENDANCE_OVERRIDE",
        sessionId,
        teamId,
        memberId,
        memberName: member.name,
        oldStatus,
        newStatus,
        reason: reason.trim(),
        changedBy: adminEmail,
        timestamp
      });
    }

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'attendanceRecords', key), record, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  // COMPLETE 60-TEAM ATTENDANCE METRICS & ROSTER EVALUATOR
  public getSessionStatistics(sessionId: string) {
    const session = this.attendanceSessions.find(s => s.sessionId === sessionId);
    const totalTeams = this.teams.length;
    let presentTeams = 0;
    let partialTeams = 0;
    let absentTeams = 0;
    let notMarkedTeams = 0;

    let totalParticipants = 0;
    let presentParticipants = 0;
    let explicitAbsentParticipants = 0;

    this.teams.forEach(team => {
      const memCount = team.members.length;
      totalParticipants += memCount;

      const key = `${sessionId}_${team.teamId}`;
      const record = this.attendanceRecords[key];

      if (!record || !record.submitted) {
        notMarkedTeams++;
      } else {
        let pCount = 0;
        let aCount = 0;

        if (Array.isArray(record.members)) {
          record.members.forEach(m => {
            const isP = m.status === 'PRESENT' || m.present === true;
            if (isP) pCount++;
            else aCount++;
          });
        }

        presentParticipants += pCount;
        explicitAbsentParticipants += aCount;

        if (pCount === memCount) {
          presentTeams++;
        } else if (pCount === 0) {
          absentTeams++;
        } else {
          partialTeams++;
        }
      }
    });

    // Absent / Unmarked participants is total enrolled minus verified present (e.g. 240 - 75 = 165)
    const absentParticipants = Math.max(0, totalParticipants - presentParticipants);
    const unmarkedParticipants = Math.max(0, totalParticipants - presentParticipants - explicitAbsentParticipants);

    const attendancePercentage = totalParticipants > 0
      ? ((presentParticipants / totalParticipants) * 100).toFixed(2)
      : '0.00';

    return {
      session,
      totalTeams,
      presentTeams,
      partialTeams,
      absentTeams,
      notMarkedTeams,
      totalParticipants,
      presentParticipants,
      absentParticipants,
      explicitAbsentParticipants,
      unmarkedParticipants,
      attendancePercentage: `${attendancePercentage}%`,
      attendancePercentageNum: parseFloat(attendancePercentage)
    };
  }

  public getAllTeamsSessionAttendance(sessionId: string) {
    return this.teams.map(team => {
      const key = `${sessionId}_${team.teamId}`;
      const record = this.attendanceRecords[key];
      const memCount = team.members.length;

      let status: 'PRESENT' | 'PARTIAL' | 'ABSENT' | 'NOT MARKED' = 'NOT MARKED';
      let presentCount = 0;
      let absentCount = 0;

      const memberRows = team.members.map(m => {
        let mStatus: 'PRESENT' | 'ABSENT' | 'NOT MARKED' = 'NOT MARKED';
        let markedAt: string | null = null;
        let overrideReason: string | undefined = undefined;
        let overriddenBy: string | undefined = undefined;

        if (record && record.submitted) {
          if (Array.isArray(record.members)) {
            const found = record.members.find(rm => rm.memberId === m.memberId);
            if (found) {
              mStatus = found.status || (found.present ? 'PRESENT' : 'ABSENT');
              markedAt = found.markedAt;
              overrideReason = found.overrideReason;
              overriddenBy = found.overriddenBy;
            }
          }
        }

        if (mStatus === 'PRESENT') presentCount++;
        else if (mStatus === 'ABSENT') absentCount++;

        return {
          memberId: m.memberId,
          name: m.name,
          registrationNumber: m.registrationNumber,
          email: m.email,
          phone: m.phone,
          isTeamLead: m.isTeamLead,
          status: mStatus,
          markedAt,
          overrideReason,
          overriddenBy
        };
      });

      if (!record || !record.submitted) {
        status = 'NOT MARKED';
      } else {
        if (presentCount === memCount) status = 'PRESENT';
        else if (presentCount === 0) status = 'ABSENT';
        else status = 'PARTIAL';
      }

      return {
        teamId: team.teamId,
        teamName: team.teamName,
        totalMembers: memCount,
        presentCount,
        absentCount,
        status,
        submitted: !!record?.submitted,
        submittedAt: record?.submittedAt || null,
        submittedByVolunteerUid: record?.submittedByVolunteerUid || null,
        volunteerName: record?.volunteerName || (record?.submitted ? 'Volunteer' : null),
        members: memberRows
      };
    });
  }

  public getAttendanceSummaryForDashboard() {
    const totalSessions = this.attendanceSessions.length;
    const activeSession = this.getActiveAttendanceSession();
    const totalParticipants = this.teams.reduce((acc, t) => acc + t.members.length, 0);

    let totalPresent = 0;
    let totalAbsent = 0;

    // Use active session if available, otherwise aggregate latest closed session or total
    const targetSession = activeSession || this.attendanceSessions[this.attendanceSessions.length - 1];

    if (targetSession) {
      const stats = this.getSessionStatistics(targetSession.sessionId);
      totalPresent = stats.presentParticipants;
      totalAbsent = stats.absentParticipants;
    } else {
      totalAbsent = totalParticipants;
    }

    const attendancePercentage = totalParticipants > 0
      ? `${((totalPresent / totalParticipants) * 100).toFixed(2)}%`
      : '0.00%';

    return {
      totalSessions,
      activeSessionName: activeSession ? (activeSession.name || activeSession.sessionName) : 'NONE',
      activeSession,
      totalPresent,
      totalAbsent,
      totalParticipants,
      attendancePercentage
    };
  }

  // REVIEW & SCORING SYSTEM
  public openReviewRound(adminUid: string, adminEmail: string, round: 1 | 2 | 3) {
    // RULE: Only ONE round can be OPEN at a time
    this.reviewSettings = {
      ...this.reviewSettings,
      activeRound: round,
      round1Status: round === 1 ? 'OPEN' : 'CLOSED',
      round2Status: round === 2 ? 'OPEN' : 'CLOSED',
      round3Status: round === 3 ? 'OPEN' : 'CLOSED',
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      'OPEN_REVIEW_ROUND',
      'review',
      `ROUND_${round}`,
      {
        activeRound: round,
        round1Status: this.reviewSettings.round1Status,
        round2Status: this.reviewSettings.round2Status,
        round3Status: this.reviewSettings.round3Status
      }
    );

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'reviewSettings', 'current'), this.reviewSettings, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  }

  public closeReviewRound(adminUid: string, adminEmail: string, round: 1 | 2 | 3) {
    const key = `round${round}Status` as 'round1Status' | 'round2Status' | 'round3Status';
    this.reviewSettings[key] = 'CLOSED';
    this.reviewSettings.updatedAt = new Date().toISOString();
    this.reviewSettings.updatedBy = adminEmail;

    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      'CLOSE_REVIEW_ROUND',
      'review',
      `ROUND_${round}`,
      { closedRound: round }
    );

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'reviewSettings', 'current'), this.reviewSettings, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  }

  // AUTOMATIC MEAN-SHIFT BENCHMARK NORMALIZATION ENGINE (PER ROUND + PER REVIEWER)
  private autoRecalculateNormalizationForReviewer(round: number, reviewerUid: string) {
    const marks = Object.values(this.reviewMarks).filter(
      m => m.round === round && m.reviewerUid === reviewerUid
    );

    if (marks.length === 0) return;

    const scores = marks.map(m => m.rawScore);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const sum = scores.reduce((a, b) => a + b, 0);
    const reviewerMean = sum / scores.length;
    const TARGET_MEAN = 75.0;
    const shift = TARGET_MEAN - reviewerMean;
    const calculatedAt = new Date().toISOString();

    marks.forEach(m => {
      // MEAN-SHIFT NORMALIZATION FORMULA:
      // Normalized = RawScore + (TargetMean - ReviewerMean), clamped to [0, 100]
      const shiftedScore = m.rawScore + shift;
      const normalizedScore = Math.min(100, Math.max(0, Math.round(shiftedScore * 100) / 100));

      const normKey = `R${round}_${m.teamId}_${reviewerUid}`;
      this.normalizedScores[normKey] = {
        id: normKey,
        round,
        teamId: m.teamId,
        reviewerUid,
        rawScore: m.rawScore,
        reviewerMean: Math.round(reviewerMean * 100) / 100,
        targetMean: TARGET_MEAN,
        minimumReviewerScore: minScore,
        maximumReviewerScore: maxScore,
        normalizedScore,
        calculatedAt,
        fallbackApplied: false
      };
    });

    // Automatically rebuild the authoritative leaderboard using the fresh normalized scores
    this.rebuildLeaderboardInternal();
  }

  public submitReviewMarks(
    reviewerUid: string,
    reviewerName: string,
    round: number,
    teamId: string,
    rawScore: number,
    rubric?: ReviewMark['rubric'],
    feedback?: string,
    memberScores?: MemberReviewScore[]
  ): { success: boolean; error?: string } {
    if (typeof rawScore !== 'number' || isNaN(rawScore) || rawScore < 0 || rawScore > 100) {
      return { success: false, error: "Marks must be a valid number between 0 and 100." };
    }

    // Backend validation: Check if requested round is OPEN
    const roundKey = `round${round}Status` as 'round1Status' | 'round2Status' | 'round3Status';
    if (this.reviewSettings[roundKey] !== 'OPEN' || this.reviewSettings.activeRound !== round) {
      return { success: false, error: `Round ${round} is currently CLOSED for evaluations.` };
    }

    const key = `R${round}_${teamId}_${reviewerUid}`;
    const existing = this.reviewMarks[key];
    if (existing && existing.status === 'locked') {
      return { success: false, error: "Marks for this team have already been locked." };
    }

    const mark: ReviewMark = {
      id: key,
      round,
      teamId,
      reviewerUid,
      reviewerName,
      rawScore,
      rubric,
      memberScores,
      feedback,
      submittedAt: new Date().toISOString(),
      status: 'locked'
    };

    // 1. Save raw mark
    this.reviewMarks[key] = mark;

    // 2. AUTOMATIC MIN-MAX NORMALIZATION:
    // Automatically recalculates Min, Max, and Normalized Scores for ALL teams evaluated by this reviewer in this round
    this.autoRecalculateNormalizationForReviewer(round, reviewerUid);

    this.addAuditLog(
      reviewerUid,
      reviewerName,
      'reviewer',
      'SUBMIT_REVIEW_MARKS',
      'review',
      key,
      { round, teamId, rawScore }
    );

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'reviewMarks', key), mark, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  // ADMIN SCORE CORRECTION (WITH MANDATORY AUDIT TRAIL AND AUTOMATIC RECALCULATION)
  public adminUpdateReviewMark(
    adminUid: string,
    adminEmail: string,
    round: number,
    teamId: string,
    reviewerUid: string,
    newRawScore: number,
    reason: string
  ): { success: boolean; error?: string } {
    if (!reason || !reason.trim()) {
      return { success: false, error: "Reason for score modification is strictly required." };
    }

    if (typeof newRawScore !== 'number' || isNaN(newRawScore) || newRawScore < 0 || newRawScore > 100) {
      return { success: false, error: "Marks must be between 0 and 100." };
    }

    const key = `R${round}_${teamId}_${reviewerUid}`;
    const mark = this.reviewMarks[key];
    if (!mark) {
      return { success: false, error: "Evaluation mark record not found." };
    }

    const oldRawScore = mark.rawScore;
    mark.rawScore = newRawScore;
    mark.submittedAt = new Date().toISOString();

    // Automatically recalculate Min/Max and all normalized scores for this reviewer + round
    this.autoRecalculateNormalizationForReviewer(round, reviewerUid);

    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      'ADMIN_SCORE_CORRECTION',
      'review',
      key,
      {
        round,
        teamId,
        reviewerUid,
        oldRawScore,
        newRawScore,
        reason: reason.trim(),
        timestamp: new Date().toISOString()
      }
    );

    this.save();

    if (typeof window !== 'undefined' && db) {
      try {
        setDoc(doc(db, 'reviewMarks', key), mark, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true };
  }

  // POST-ROUND NORMALIZATION BATCH AUDIT
  public normalizeRoundScores(adminUid: string, adminEmail: string, round: number): { success: boolean; count: number } {
    const roundMarks = Object.values(this.reviewMarks).filter(m => m.round === round);
    if (roundMarks.length === 0) {
      return { success: false, count: 0 };
    }

    const reviewerGroups: Record<string, ReviewMark[]> = {};
    roundMarks.forEach(m => {
      if (!reviewerGroups[m.reviewerUid]) reviewerGroups[m.reviewerUid] = [];
      reviewerGroups[m.reviewerUid].push(m);
    });

    let normalizedCount = 0;
    Object.keys(reviewerGroups).forEach(revUid => {
      this.autoRecalculateNormalizationForReviewer(round, revUid);
      normalizedCount += reviewerGroups[revUid].length;
    });

    this.addAuditLog(
      adminUid,
      adminEmail,
      'admin',
      'NORMALIZE_ROUND_SCORES',
      'review',
      `ROUND_${round}`,
      { round, normalizedCount, reviewerCount: Object.keys(reviewerGroups).length }
    );

    this.save();
    return { success: true, count: normalizedCount };
  }

  // INTERNAL LEADERBOARD REBUILD
  private rebuildLeaderboardInternal() {
    const entries: LeaderboardEntry[] = [];

    this.teams.forEach(team => {
      // Calculate Round 1 averages
      const r1RawMarks = Object.values(this.reviewMarks).filter(m => m.round === 1 && m.teamId === team.teamId);
      const r1NormMarks = Object.values(this.normalizedScores).filter(m => m.round === 1 && m.teamId === team.teamId);

      const r1RawAvg = r1RawMarks.length ? r1RawMarks.reduce((a, b) => a + b.rawScore, 0) / r1RawMarks.length : 0;
      const r1NormAvg = r1NormMarks.length ? r1NormMarks.reduce((a, b) => a + b.normalizedScore, 0) / r1NormMarks.length : r1RawAvg;

      // Calculate Round 2 averages
      const r2RawMarks = Object.values(this.reviewMarks).filter(m => m.round === 2 && m.teamId === team.teamId);
      const r2NormMarks = Object.values(this.normalizedScores).filter(m => m.round === 2 && m.teamId === team.teamId);

      const r2RawAvg = r2RawMarks.length ? r2RawMarks.reduce((a, b) => a + b.rawScore, 0) / r2RawMarks.length : 0;
      const r2NormAvg = r2NormMarks.length ? r2NormMarks.reduce((a, b) => a + b.normalizedScore, 0) / r2NormMarks.length : r2RawAvg;

      // Calculate Round 3 averages
      const r3RawMarks = Object.values(this.reviewMarks).filter(m => m.round === 3 && m.teamId === team.teamId);
      const r3NormMarks = Object.values(this.normalizedScores).filter(m => m.round === 3 && m.teamId === team.teamId);

      const r3RawAvg = r3RawMarks.length ? r3RawMarks.reduce((a, b) => a + b.rawScore, 0) / r3RawMarks.length : 0;
      const r3NormAvg = r3NormMarks.length ? r3NormMarks.reduce((a, b) => a + b.normalizedScore, 0) / r3NormMarks.length : r3RawAvg;

      const totalScore = Math.round((r1NormAvg * 0.25 + r2NormAvg * 0.35 + r3NormAvg * 0.40) * 100) / 100;

      entries.push({
        teamId: team.teamId,
        teamName: team.teamName,
        problemStatementId: team.problemStatementId,
        round1RawAvg: Math.round(r1RawAvg * 10) / 10,
        round1NormalizedAvg: Math.round(r1NormAvg * 10) / 10,
        round2RawAvg: Math.round(r2RawAvg * 10) / 10,
        round2NormalizedAvg: Math.round(r2NormAvg * 10) / 10,
        round3RawAvg: Math.round(r3RawAvg * 10) / 10,
        round3NormalizedAvg: Math.round(r3NormAvg * 10) / 10,
        totalScore,
        rank: 0,
        updatedAt: new Date().toISOString()
      });
    });

    // Sort by totalScore desc
    entries.sort((a, b) => b.totalScore - a.totalScore);
    entries.forEach((e, idx) => { e.rank = idx + 1; });

    this.leaderboard = entries;
  }

  public rebuildLeaderboard(adminUid: string, adminEmail: string) {
    this.rebuildLeaderboardInternal();
    this.addAuditLog(adminUid, adminEmail, 'admin', 'REBUILD_LEADERBOARD', 'system', 'LEADERBOARD', {});
    this.save();
  }

  public updateReviewSettings(adminUid: string, adminEmail: string, settings: Partial<ReviewSettings>) {
    this.reviewSettings = {
      ...this.reviewSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };
    this.addAuditLog(adminUid, adminEmail, 'admin', 'UPDATE_REVIEW_SETTINGS', 'review', 'current', { settings });
    this.save();
  }

  // REVIEWERS ALLOWLIST
  public addReviewer(adminUid: string, adminEmail: string, email: string, name: string, rounds: number[]): { success: boolean; error?: string } {
    if (this.reviewers.some(r => r.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "Reviewer with this email already exists." };
    }

    const newRev: Reviewer = {
      uid: `rev-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      active: true,
      allowedRounds: rounds,
      createdAt: new Date().toISOString()
    };

    this.reviewers.push(newRev);
    this.addAuditLog(adminUid, adminEmail, 'admin', 'ADD_REVIEWER', 'review', newRev.uid, { email, name, rounds });
    this.save();

    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/addReviewer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewer: newRev })
        }).catch(() => {});
      } catch (e) {}

      if (db) {
        try {
          setDoc(doc(db, 'reviewers', newRev.uid), newRev, { merge: true }).catch(() => {});
        } catch (e) {}
      }
    }

    return { success: true };
  }

  public toggleReviewerActive(adminUid: string, adminEmail: string, revUid: string) {
    const rev = this.reviewers.find(r => r.uid === revUid);
    if (rev) {
      rev.active = !rev.active;
      this.addAuditLog(adminUid, adminEmail, 'admin', 'TOGGLE_REVIEWER_ACTIVE', 'review', revUid, { active: rev.active });
      this.save();

      if (typeof window !== 'undefined') {
        try {
          fetch(`${BACKEND_URL}/api/toggleReviewerActive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revUid, active: rev.active })
          }).catch(() => {});
        } catch (e) {}

        if (db) {
          try {
            setDoc(doc(db, 'reviewers', revUid), { active: rev.active }, { merge: true }).catch(() => {});
          } catch (e) {}
        }
      }
    }
  }

  public deleteReviewer(adminUid: string, adminEmail: string, revUid: string): { success: boolean; error?: string } {
    const index = this.reviewers.findIndex(r => r.uid === revUid);
    if (index === -1) {
      return { success: false, error: "Reviewer not found." };
    }
    const removed = this.reviewers[index];
    this.reviewers.splice(index, 1);
    this.addAuditLog(adminUid, adminEmail, 'admin', 'DELETE_REVIEWER', 'review', revUid, { email: removed.email, name: removed.name });
    this.save();

    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/deleteReviewer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ revUid })
        }).catch(() => {});
      } catch (e) {}

      if (db) {
        try {
          deleteDoc(doc(db, 'reviewers', revUid)).catch(() => {});
        } catch (e) {}
      }
    }

    return { success: true };
  }

  // VOLUNTEERS ALLOWLIST
  public addVolunteer(adminUid: string, adminEmail: string, email: string, name: string): { success: boolean; error?: string } {
    if (this.volunteers.some(v => v.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "Volunteer with this email already exists." };
    }

    const newVol: Volunteer = {
      uid: `vol-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: adminEmail
    };

    this.volunteers.push(newVol);
    this.addAuditLog(adminUid, adminEmail, 'admin', 'ADD_VOLUNTEER', 'attendance', newVol.uid, { email, name });
    this.save();

    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/addVolunteer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ volunteer: newVol })
        }).catch(() => {});
      } catch (e) {}

      if (db) {
        try {
          setDoc(doc(db, 'volunteers', newVol.uid), newVol, { merge: true }).catch(() => {});
        } catch (e) {}
      }
    }

    return { success: true };
  }

  public toggleVolunteerActive(adminUid: string, adminEmail: string, volUid: string) {
    const vol = this.volunteers.find(v => v.uid === volUid);
    if (vol) {
      vol.active = !vol.active;
      this.addAuditLog(adminUid, adminEmail, 'admin', 'TOGGLE_VOLUNTEER_ACTIVE', 'attendance', volUid, { active: vol.active });
      this.save();

      if (typeof window !== 'undefined') {
        try {
          fetch(`${BACKEND_URL}/api/toggleVolunteerActive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volUid, active: vol.active })
          }).catch(() => {});
        } catch (e) {}

        if (db) {
          try {
            setDoc(doc(db, 'volunteers', volUid), { active: vol.active }, { merge: true }).catch(() => {});
          } catch (e) {}
        }
      }
    }
  }

  public deleteVolunteer(adminUid: string, adminEmail: string, volUid: string): { success: boolean; error?: string } {
    const index = this.volunteers.findIndex(v => v.uid === volUid);
    if (index === -1) {
      return { success: false, error: "Volunteer not found." };
    }
    const removed = this.volunteers[index];
    this.volunteers.splice(index, 1);
    this.addAuditLog(adminUid, adminEmail, 'admin', 'DELETE_VOLUNTEER', 'attendance', volUid, { email: removed.email, name: removed.name });
    this.save();

    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/deleteVolunteer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ volUid })
        }).catch(() => {});
      } catch (e) {}

      if (db) {
        try {
          deleteDoc(doc(db, 'volunteers', volUid)).catch(() => {});
        } catch (e) {}
      }
    }

    return { success: true };
  }

  // DATA EXPORTS HELPERS
  public exportTeamsCSV(): string {
    const headers = ["Team ID", "Team Name", "Status", "Problem Statement ID", "Selected At", "Lead Name", "Lead Reg No", "Lead Email", "Lead Phone", "Members Count"];
    const rows = this.teams.map(t => {
      const lead = t.members.find(m => m.isTeamLead) || t.members[0];
      return [
        t.teamId,
        `"${t.teamName.replace(/"/g, '""')}"`,
        t.status,
        t.problemStatementId || "NONE",
        t.problemSelectedAt || "N/A",
        `"${lead?.name || ''}"`,
        lead?.registrationNumber || '',
        lead?.email || '',
        lead?.phone || '',
        t.members.length
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  public exportMembersCSV(): string {
    const headers = ["Member ID", "Team ID", "Team Name", "Name", "Registration Number", "Email", "Phone", "Is Team Lead", "Status"];
    const rows: string[] = [];
    this.teams.forEach(t => {
      t.members.forEach(m => {
        rows.push([
          m.memberId,
          t.teamId,
          `"${t.teamName.replace(/"/g, '""')}"`,
          `"${m.name.replace(/"/g, '""')}"`,
          m.registrationNumber,
          m.email,
          m.phone,
          m.isTeamLead ? "YES" : "NO",
          m.status
        ].join(','));
      });
    });
    return [headers.join(','), ...rows].join('\n');
  }

  public exportAllocationsCSV(): string {
    const headers = ["Problem Statement ID", "Title", "Category", "Max Capacity", "Allocated Count", "Allocated Team IDs", "Status"];
    const allocations = this.getAllocations();
    const rows = this.problemStatements.map(ps => {
      const alloc = allocations[ps.problemStatementId];
      return [
        ps.problemStatementId,
        `"${ps.title.replace(/"/g, '""')}"`,
        `"${ps.category.replace(/"/g, '""')}"`,
        ps.maximumTeams,
        alloc?.currentTeamCount || 0,
        `"${(alloc?.allocatedTeamIds || []).join('; ')}"`,
        (alloc?.currentTeamCount || 0) >= ps.maximumTeams ? "FULL" : "AVAILABLE"
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  public exportAttendanceCSV(): string {
    const headers = ["Session ID", "Session Name", "Team ID", "Team Name", "Member Name", "Registration No", "Status", "Submitted At", "Volunteer"];
    const rows: string[] = [];

    this.attendanceSessions.forEach(session => {
      this.teams.forEach(team => {
        const record = this.attendanceRecords[`${session.sessionId}_${team.teamId}`];
        if (record && record.members) {
          record.members.forEach(m => {
            rows.push([
              session.sessionId,
              `"${session.sessionName}"`,
              team.teamId,
              `"${team.teamName}"`,
              `"${m.name}"`,
              m.registrationNumber,
              m.present ? "PRESENT" : "ABSENT",
              record.submittedAt,
              `"${record.volunteerName || 'Volunteer'}"`
            ].join(','));
          });
        }
      });
    });
    return [headers.join(','), ...rows].join('\n');
  }

  public exportLeaderboardCSV(): string {
    const headers = ["Rank", "Team ID", "Team Name", "Problem Statement", "R1 Raw Avg", "R1 Norm Avg", "R2 Raw Avg", "R2 Norm Avg", "R3 Raw Avg", "R3 Norm Avg", "Total Final Score"];
    const rows = this.leaderboard.map(e => [
      e.rank,
      e.teamId,
      `"${e.teamName.replace(/"/g, '""')}"`,
      e.problemStatementId || "NONE",
      e.round1RawAvg,
      e.round1NormalizedAvg,
      e.round2RawAvg,
      e.round2NormalizedAvg,
      e.round3RawAvg,
      e.round3NormalizedAvg,
      e.totalScore
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // PENDING & COMPLETED REVIEW TEAM HELPERS
  public getPendingReviewTeams(round: number): Team[] {
    const evaluatedTeamIds = new Set(
      Object.values(this.reviewMarks)
        .filter(m => m.round === round && (m.status === 'locked' || m.status === 'submitted'))
        .map(m => m.teamId)
    );
    return this.teams.filter(t => !evaluatedTeamIds.has(t.teamId));
  }

  public getCompletedReviewTeams(round: number): { team: Team; mark: ReviewMark; normalized?: NormalizedScore }[] {
    const results: { team: Team; mark: ReviewMark; normalized?: NormalizedScore }[] = [];
    this.teams.forEach(team => {
      const mark = Object.values(this.reviewMarks).find(m => m.round === round && m.teamId === team.teamId);
      if (mark) {
        const normalized = Object.values(this.normalizedScores).find(n => n.round === round && n.teamId === team.teamId);
        results.push({ team, mark, normalized });
      }
    });
    return results;
  }

  // EXCEL (.XLSX) EXPORTS WITH TEAM & INDIVIDUAL MEMBER SCORES
  public exportRoundMarksExcel(round?: number): void {
    const targetRound = round || this.reviewSettings.activeRound || 2;
    const filteredMarks = Object.values(this.reviewMarks).filter(m => m.round === targetRound);
    
    // Sheet 1: Team Marks
    const teamMarksData = filteredMarks.map(m => {
      const team = this.teams.find(t => t.teamId === m.teamId);
      const norm = Object.values(this.normalizedScores).find(n => n.round === m.round && n.teamId === m.teamId && n.reviewerUid === m.reviewerUid);
      const ps = team?.problemStatementId ? this.getProblemStatement(team.problemStatementId) : null;
      return {
        "Round": `Round ${m.round}`,
        "Team ID": m.teamId,
        "Team Name": team?.teamName || '',
        "Problem Statement ID": team?.problemStatementId || 'Unassigned',
        "Problem Title": ps?.title || 'N/A',
        "Reviewer Name": m.reviewerName,
        "Team Raw Score (/100)": m.rawScore,
        "Normalized Score": norm?.normalizedScore ? Number(norm.normalizedScore.toFixed(2)) : 'Pending',
        "Feedback / Remarks": m.feedback || '',
        "Submitted At": new Date(m.submittedAt).toLocaleString(),
        "Status": m.status.toUpperCase()
      };
    });

    // Sheet 2: Individual Teammate Scores
    const memberScoresData: any[] = [];
    filteredMarks.forEach(m => {
      const team = this.teams.find(t => t.teamId === m.teamId);
      if (m.memberScores && Array.isArray(m.memberScores) && m.memberScores.length > 0) {
        m.memberScores.forEach(ms => {
          memberScoresData.push({
            "Round": `Round ${m.round}`,
            "Team ID": m.teamId,
            "Team Name": team?.teamName || '',
            "Member Name": ms.name,
            "Registration Number": ms.registrationNumber,
            "Role": ms.isTeamLead ? "Team Lead" : "Member",
            "Individual Score (/100)": ms.score,
            "Individual Remark": ms.feedback || '',
            "Team Baseline Score": m.rawScore,
            "Reviewer": m.reviewerName,
            "Submitted At": new Date(m.submittedAt).toLocaleString()
          });
        });
      } else if (team) {
        team.members.forEach(mem => {
          memberScoresData.push({
            "Round": `Round ${m.round}`,
            "Team ID": m.teamId,
            "Team Name": team.teamName,
            "Member Name": mem.name,
            "Registration Number": mem.registrationNumber,
            "Role": mem.isTeamLead ? "Team Lead" : "Member",
            "Individual Score (/100)": m.rawScore,
            "Individual Remark": m.feedback || '',
            "Team Baseline Score": m.rawScore,
            "Reviewer": m.reviewerName,
            "Submitted At": new Date(m.submittedAt).toLocaleString()
          });
        });
      }
    });

    // Sheet 3: Pending Review Teams
    const pendingTeams = this.getPendingReviewTeams(targetRound);
    const pendingData = pendingTeams.map(t => {
      const lead = t.members.find(m => m.isTeamLead) || t.members[0];
      const ps = t.problemStatementId ? this.getProblemStatement(t.problemStatementId) : null;
      return {
        "Round": `Round ${targetRound}`,
        "Team ID": t.teamId,
        "Team Name": t.teamName,
        "Problem Statement ID": t.problemStatementId || 'Unassigned',
        "Problem Title": ps?.title || 'N/A',
        "Team Lead Name": lead?.name || '',
        "Lead Reg No": lead?.registrationNumber || '',
        "Lead Phone": lead?.phone || '',
        "Lead Email": lead?.email || '',
        "Members Count": t.members.length,
        "Review Status": "PENDING EVALUATION"
      };
    });

    // Build workbook
    const wb = XLSX.utils.book_new();
    const wsTeams = XLSX.utils.json_to_sheet(teamMarksData.length ? teamMarksData : [{ Note: `No evaluations submitted yet for Round ${targetRound}` }]);
    const wsMembers = XLSX.utils.json_to_sheet(memberScoresData.length ? memberScoresData : [{ Note: `No individual member scores yet for Round ${targetRound}` }]);
    const wsPending = XLSX.utils.json_to_sheet(pendingData.length ? pendingData : [{ Note: `All teams evaluated for Round ${targetRound}!` }]);

    XLSX.utils.book_append_sheet(wb, wsTeams, `R${targetRound}_Team_Marks`);
    XLSX.utils.book_append_sheet(wb, wsMembers, `R${targetRound}_Individual_Teammates`);
    XLSX.utils.book_append_sheet(wb, wsPending, `R${targetRound}_Pending_Teams`);

    XLSX.writeFile(wb, `WEBX_Round_${targetRound}_Evaluation_Marks_${Date.now()}.xlsx`);
  }

  public exportAllMarksExcel(): void {
    const wb = XLSX.utils.book_new();

    // Sheets for each round
    [1, 2, 3].forEach(rnd => {
      const marks = Object.values(this.reviewMarks).filter(m => m.round === rnd);
      const data = marks.map(m => {
        const team = this.teams.find(t => t.teamId === m.teamId);
        const norm = Object.values(this.normalizedScores).find(n => n.round === m.round && n.teamId === m.teamId && n.reviewerUid === m.reviewerUid);
        return {
          "Team ID": m.teamId,
          "Team Name": team?.teamName || '',
          "Reviewer": m.reviewerName,
          "Raw Score (/100)": m.rawScore,
          "Normalized Score": norm?.normalizedScore ? Number(norm.normalizedScore.toFixed(2)) : 'Pending',
          "Feedback": m.feedback || '',
          "Submitted At": new Date(m.submittedAt).toLocaleString()
        };
      });
      const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ Note: `No submissions for Round ${rnd}` }]);
      XLSX.utils.book_append_sheet(wb, ws, `Round_${rnd}_Marks`);
    });

    // Leaderboard sheet
    const lbData = this.leaderboard.map(e => ({
      "Rank": e.rank,
      "Team ID": e.teamId,
      "Team Name": e.teamName,
      "Problem Statement": e.problemStatementId || 'NONE',
      "R1 Raw Avg": e.round1RawAvg,
      "R1 Norm Avg": e.round1NormalizedAvg,
      "R2 Raw Avg": e.round2RawAvg,
      "R2 Norm Avg": e.round2NormalizedAvg,
      "R3 Raw Avg": e.round3RawAvg,
      "R3 Norm Avg": e.round3NormalizedAvg,
      "Total Final Score": e.totalScore
    }));
    const wsLb = XLSX.utils.json_to_sheet(lbData.length ? lbData : [{ Note: "Leaderboard not computed yet" }]);
    XLSX.utils.book_append_sheet(wb, wsLb, "Official_Leaderboard");

    // All Individual Teammate Scores (especially Round 2)
    const allMemberRows: any[] = [];
    Object.values(this.reviewMarks).forEach(m => {
      const team = this.teams.find(t => t.teamId === m.teamId);
      if (m.memberScores && Array.isArray(m.memberScores)) {
        m.memberScores.forEach(ms => {
          allMemberRows.push({
            "Round": `Round ${m.round}`,
            "Team ID": m.teamId,
            "Team Name": team?.teamName || '',
            "Member Name": ms.name,
            "Registration No": ms.registrationNumber,
            "Role": ms.isTeamLead ? "Team Lead" : "Member",
            "Individual Score (/100)": ms.score,
            "Remark": ms.feedback || '',
            "Team Baseline Score": m.rawScore,
            "Reviewer": m.reviewerName
          });
        });
      }
    });
    if (allMemberRows.length > 0) {
      const wsMembers = XLSX.utils.json_to_sheet(allMemberRows);
      XLSX.utils.book_append_sheet(wb, wsMembers, "Individual_Teammates");
    }

    XLSX.writeFile(wb, `WEBX_Official_All_Evaluation_Marks_${Date.now()}.xlsx`);
  }

  // ============================================================
  // SUBMISSIONS RESET ENGINE (NO HARDCODED DATA, FULL DATABASE CLEANUP)
  // ============================================================

  /**
   * Clears problem statement selection for a specific team
   */
  public async unselectProblemForTeam(adminUid: string, adminEmail: string, teamId: string) {
    const cleanTeamId = (teamId || '').trim().toUpperCase();
    const team = this.teams.find(t => t.teamId === cleanTeamId || t.teamId === teamId);
    if (!team) return { success: false, error: "Team not found" };

    const oldPsId = team.problemStatementId;
    team.problemStatementId = null;
    team.problemSelectedAt = null;
    delete this.problemSelections[cleanTeamId];
    delete this.problemSelections[teamId];

    if (typeof window !== 'undefined' && db) {
      try {
        deleteDoc(doc(db, 'problemSelections', cleanTeamId)).catch(() => {});
        deleteDoc(doc(db, 'problemSelections', teamId)).catch(() => {});
        setDoc(doc(db, 'teams', cleanTeamId), { problemStatementId: null, problemSelectedAt: null, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        if (oldPsId) {
          const alloc = this.getAllocations()[oldPsId];
          setDoc(doc(db, 'problemStatementAllocations', oldPsId), {
            problemStatementId: oldPsId,
            maximumTeams: 2,
            allocatedTeamIds: alloc ? alloc.allocatedTeamIds.filter(id => id !== cleanTeamId && id !== teamId) : [],
            currentTeamCount: alloc ? Math.max(0, alloc.currentTeamCount - 1) : 0,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
      } catch (e) {
        console.warn("[Firestore] Error clearing team selection:", e);
      }
    }

    // Local cross-browser backend sync
    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/unselectProblem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: cleanTeamId })
        }).catch(() => {});
      } catch (e) {}
    }

    this.rebuildLeaderboardInternal();
    this.addAuditLog(adminUid, adminEmail, 'admin', 'UNSELECT_TEAM_PROBLEM', 'selection', cleanTeamId, { teamId: cleanTeamId, oldPsId });
    this.save();
    return { success: true };
  }

  /**
   * Clears ALL problem statement selections across all teams and allocations
   */
  public async clearAllProblemSelections(adminUid: string, adminEmail: string) {
    // 1. Reset all local teams
    this.teams = this.teams.map(t => ({
      ...t,
      problemStatementId: null,
      problemSelectedAt: null
    }));
    this.problemSelections = {};

    // Local cross-browser backend sync
    if (typeof window !== 'undefined') {
      try {
        fetch(`${BACKEND_URL}/api/resetAllProblemSelections`, {
          method: 'POST'
        }).catch(() => {});
      } catch (e) {}
    }

    // 2. Clear Firestore problemSelections collection and reset team problemStatementId fields
    if (typeof window !== 'undefined' && db) {
      try {
        const teamsToUpdate = initialTeams.map(t => t.teamId);
        for (const tid of teamsToUpdate) {
          deleteDoc(doc(db, 'problemSelections', tid)).catch(() => {});
          setDoc(doc(db, 'teams', tid), { problemStatementId: null, problemSelectedAt: null, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        }
        for (let i = 1; i <= 30; i++) {
          const psId = `PS-${i.toString().padStart(2, '0')}`;
          setDoc(doc(db, 'problemStatementAllocations', psId), {
            problemStatementId: psId,
            maximumTeams: 2,
            allocatedTeamIds: [],
            currentTeamCount: 0,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("[Firestore] Error clearing remote selections:", e);
      }
    }

    this.rebuildLeaderboardInternal();
    this.addAuditLog(adminUid, adminEmail, 'admin', 'CLEAR_ALL_PROBLEM_SELECTIONS', 'selection', 'ALL_TEAMS', { clearedBy: adminEmail });
    this.save();
  }

  /**
   * Clears ALL attendance submissions/records across all sessions
   */
  public async clearAllAttendanceSubmissions(adminUid: string, adminEmail: string) {
    const recordKeys = Object.keys(this.attendanceRecords);
    this.attendanceRecords = {};

    if (typeof window !== 'undefined' && db) {
      try {
        for (const key of recordKeys) {
          deleteDoc(doc(db, 'attendanceRecords', key)).catch(() => {});
        }
      } catch (e) {
        console.warn("[Firestore] Error clearing remote attendance records:", e);
      }
    }

    this.addAuditLog(adminUid, adminEmail, 'admin', 'CLEAR_ALL_ATTENDANCE_SUBMISSIONS', 'attendance', 'ALL_SESSIONS', { clearedBy: adminEmail });
    this.save();
  }

  /**
   * Clears ALL review marks, normalized scores, and leaderboard entries
   */
  public async clearAllReviewMarks(adminUid: string, adminEmail: string) {
    const markKeys = Object.keys(this.reviewMarks);
    const normKeys = Object.keys(this.normalizedScores);
    this.reviewMarks = {};
    this.normalizedScores = {};
    this.leaderboard = [];

    if (typeof window !== 'undefined' && db) {
      try {
        for (const k of markKeys) {
          deleteDoc(doc(db, 'reviewMarks', k)).catch(() => {});
        }
        for (const k of normKeys) {
          deleteDoc(doc(db, 'normalizedScores', k)).catch(() => {});
        }
      } catch (e) {
        console.warn("[Firestore] Error clearing remote review marks:", e);
      }
    }

    this.rebuildLeaderboardInternal();
    this.addAuditLog(adminUid, adminEmail, 'admin', 'CLEAR_ALL_REVIEW_MARKS', 'review', 'ALL_ROUNDS', { clearedBy: adminEmail });
    this.save();
  }

  /**
   * Master action: Removes ALL submissions across problem selections, attendance, and reviews
   */
  public async removeAllSubmissions(adminUid: string, adminEmail: string) {
    await this.clearAllProblemSelections(adminUid, adminEmail);
    await this.clearAllAttendanceSubmissions(adminUid, adminEmail);
    await this.clearAllReviewMarks(adminUid, adminEmail);
    this.addAuditLog(adminUid, adminEmail, 'admin', 'REMOVE_ALL_SUBMISSIONS', 'system', 'STORE', { message: "All submissions across all modules cleared." });
    this.save();
  }

  // RESET TO FACTORY DEMO STATE
  public async resetToFactory(adminUid: string, adminEmail: string) {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch (e) {}
    }
    this.initializeDefaults();
    await this.removeAllSubmissions(adminUid, adminEmail);
    this.rebuildLeaderboardInternal();
    this.addAuditLog(adminUid, adminEmail, 'admin', 'RESET_TO_FACTORY', 'system', 'STORE', { resetBy: adminEmail });
    this.save();
  }
}

export const eventStore = new EventStore();
