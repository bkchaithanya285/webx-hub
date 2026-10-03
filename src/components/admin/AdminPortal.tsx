import React, { useState, useEffect, useMemo } from 'react';
import {
  Team,
  ProblemStatement,
  ProblemStatementAllocation,
  SelectionSettings,
  AttendanceSession,
  AttendanceRecord,
  Reviewer,
  ReviewSettings,
  ReviewMark,
  NormalizedScore,
  LeaderboardEntry,
  AuditLog,
  AppSettings
} from '../../types';
import { eventStore } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileCode2,
  Sliders,
  CalendarCheck,
  UserCheck,
  Award,
  Trophy,
  Download,
  History,
  Settings,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Lock,
  Unlock,
  Eye,
  FileText,
  Clock,
  Radio,
  Trash2,
  QrCode,
  UserPlus,
  ShieldCheck,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Smartphone,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ProblemStatementDrawer } from '../common/ProblemStatementDrawer';
import { AttendanceControlCenter } from './AttendanceControlCenter';

interface AdminProblemSelectionControllerProps {
  selectionSettings: SelectionSettings;
  problemStatements: ProblemStatement[];
  allocations: Record<string, ProblemStatementAllocation>;
  teams: Team[];
  currentUser: any;
  showNotification: (type: 'success' | 'error', message: string) => void;
}

const AdminProblemSelectionController: React.FC<AdminProblemSelectionControllerProps> = React.memo(({
  selectionSettings,
  problemStatements,
  allocations,
  teams,
  currentUser,
  showNotification
}) => {
  const [nowTime, setNowTime] = useState(Date.now());
  const [customMinutes, setCustomMinutes] = useState(10);

  // 1-second timer tick ONLY runs when this tab is active
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const adminUid = currentUser?.uid || 'admin';
  const adminEmail = currentUser?.email || 'admin@webx.io';

  const unlockTimestamp = selectionSettings.unlockAt ? new Date(selectionSettings.unlockAt).getTime() : 0;
  const isLockedWithTimer = selectionSettings.status === 'LOCKED' && unlockTimestamp > 0;
  const unlockDiffSec = Math.max(0, Math.floor((unlockTimestamp - nowTime) / 1000));
  const unlockMins = Math.floor(unlockDiffSec / 60).toString().padStart(2, '0');
  const unlockSecs = (unlockDiffSec % 60).toString().padStart(2, '0');

  // Trigger auto-unlock check if timer expires
  useEffect(() => {
    if (isLockedWithTimer && nowTime >= unlockTimestamp) {
      eventStore.getSelectionSettings(); // Triggers store auto-unlock transition
    }
  }, [nowTime, isLockedWithTimer, unlockTimestamp]);

  const handleRelease = () => {
    eventStore.releaseProblemStatements(adminUid, adminEmail);
    showNotification('success', 'Problem Statements RELEASED. Team leads can now view problem statements.');
  };

  const handleRemoveRelease = () => {
    eventStore.removeReleaseProblemStatements(adminUid, adminEmail);
    showNotification('error', 'Problem Statements UNRELEASED. Team leads can no longer view problem statements.');
  };

  const handleLock = (durationMinutes?: number) => {
    eventStore.lockProblemSelection(adminUid, adminEmail, durationMinutes);
    if (durationMinutes && durationMinutes > 0) {
      showNotification('success', `Problem Selection LOCKED for ${durationMinutes} minutes with synchronized countdown.`);
    } else {
      showNotification('success', 'Problem Selection LOCKED. Team leads can view but cannot select.');
    }
  };

  const handleUnlock = () => {
    eventStore.unlockProblemSelection(adminUid, adminEmail);
    showNotification('success', 'Problem Selection UNLOCKED. Team leads can now select their Problem Statements.');
  };

  const handleClose = () => {
    eventStore.closeProblemSelection(adminUid, adminEmail);
    showNotification('error', 'Problem Selection CLOSED completely. All selection requests will be rejected.');
  };

  // Recent selections feed
  const selectedTeamsList = teams
    .filter(t => t.problemStatementId)
    .sort((a, b) => new Date(b.problemSelectedAt || 0).getTime() - new Date(a.problemSelectedAt || 0).getTime());

  const totalAllocatedSlots = Object.values(allocations).reduce((acc, a) => acc + (a.currentTeamCount || 0), 0);
  const totalMaxSlots = problemStatements.reduce((acc, p) => acc + (2), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header with Title & Live Telemetry Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-900/50 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black font-display text-white uppercase tracking-tight">
              Problem Statement Release & Selection Controller
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Backend is the single source of truth. State updates propagate instantly across all Team Leads in real time.
          </p>
        </div>

        {/* Current State Indicator Pill */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-400 font-mono">Current State:</span>
          <span className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider border shadow-lg ${
            selectionSettings.status === 'NOT_RELEASED' || selectionSettings.status === 'DRAFT'
              ? 'bg-zinc-900 text-zinc-400 border-zinc-700'
              : selectionSettings.status === 'LOCKED'
              ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
              : selectionSettings.status === 'UNLOCKED' || selectionSettings.status === 'LIVE' || selectionSettings.status === 'RELEASED'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800 shadow-glow-emerald'
              : 'bg-rose-950 text-rose-300 border-rose-800'
          }`}>
            {selectionSettings.status === 'NOT_RELEASED' || selectionSettings.status === 'DRAFT'
              ? '🔒 NOT RELEASED'
              : selectionSettings.status === 'LOCKED'
              ? '🔒 SELECTION LOCKED'
              : selectionSettings.status === 'UNLOCKED' || selectionSettings.status === 'LIVE' || selectionSettings.status === 'RELEASED'
              ? '⚡ UNLOCKED / SELECTION OPEN'
              : '⛔ CLOSED'}
          </span>
        </div>
      </div>

      {/* MASTER STATE CONTROL CONSOLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Release / Unrelease Controls */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-3 shadow-xl">
          <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>1. Release Control</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-light">
            Controls visibility of problem statements to Team Leads.
          </p>
          <div className="space-y-2 pt-1">
            <button
              onClick={handleRelease}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                selectionSettings.status === 'RELEASED' || selectionSettings.status === 'UNLOCKED'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 cursor-pointer'
              }`}
            >
              <span>🚀 RELEASE PROBLEM STATEMENTS</span>
            </button>
            <button
              onClick={handleRemoveRelease}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-800 text-zinc-300 hover:text-rose-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>🚫 REMOVE RELEASE</span>
            </button>
          </div>
        </div>

        {/* 2. Lock / Unlock Selection Controls */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-3 shadow-xl">
          <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>2. Selection Lock</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-light">
            Lock prevents selection while allowing teams to view requirements.
          </p>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleLock()}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                selectionSettings.status === 'LOCKED' && !selectionSettings.unlockAt
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 cursor-pointer'
              }`}
            >
              <span>🔒 LOCK SELECTION</span>
            </button>
            <button
              onClick={handleUnlock}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                selectionSettings.status === 'UNLOCKED'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-zinc-900 hover:bg-emerald-950/60 border border-zinc-700 hover:border-emerald-800 text-zinc-300 hover:text-emerald-200 cursor-pointer'
              }`}
            >
              <span>🔓 UNLOCK SELECTION</span>
            </button>
          </div>
        </div>

        {/* 3. Synchronized Server Countdown Timer Lock */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-3 shadow-xl">
          <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>3. Lock With Timer</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-light">
            Server timestamp countdown. Auto-unlocks when timer reaches 0.
          </p>
          
          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[5, 10, 15, 30, 60].map(mins => (
              <button
                key={mins}
                onClick={() => handleLock(mins)}
                className="py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-sky-950 border border-zinc-700 hover:border-sky-600 text-zinc-200 text-xs font-bold font-mono transition-all text-center cursor-pointer"
              >
                ⏱️ {mins}m
              </button>
            ))}
            <button
              onClick={() => handleLock(10)}
              className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-[11px] font-bold font-mono shadow-md cursor-pointer transition-all"
            >
              10m (Std)
            </button>
          </div>

          {/* Manual Custom Minutes Input */}
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Manual Custom Duration</span>
              <span className="text-zinc-500">1 - 1440 min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customMinutes || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCustomMinutes(isNaN(val) ? 0 : Math.max(1, Math.min(1440, val)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customMinutes && customMinutes > 0) {
                      handleLock(customMinutes);
                    }
                  }}
                  placeholder="e.g. 25"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs font-mono text-white placeholder-zinc-500 outline-none focus:border-sky-500 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono pointer-events-none">
                  mins
                </span>
              </div>
              <button
                onClick={() => handleLock(customMinutes)}
                disabled={!customMinutes || customMinutes < 1}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold font-mono shadow-md cursor-pointer transition-all shrink-0"
              >
                Set Lock
              </button>
            </div>
          </div>
        </div>

        {/* 4. Complete Close Control */}
        <div className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-3 shadow-xl">
          <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>4. Close Selection</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-light">
            Completely closes selection. Backend rejects all selection attempts.
          </p>
          <div className="pt-1">
            <button
              onClick={handleClose}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                selectionSettings.status === 'CLOSED'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 cursor-pointer'
              }`}
            >
              <span>⛔ CLOSE SELECTION</span>
            </button>
          </div>
        </div>

      </div>

      {/* QUICK PROBLEM SELECTIONS RESET CONTROLLER */}
      <div className="p-4 rounded-2xl bg-[#0c0c16] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-400">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">Problem Statement Selections Manager</div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {selectedTeamsList.length} of {teams.length} teams currently allocated
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to RESET ALL problem statement selections across the entire system?\n\nThis will unassign all 60 teams and reset all 30 challenge capacities back to 0/2 in local state and Firestore database.")) {
                await eventStore.clearAllProblemSelections(adminUid, adminEmail);
                showNotification('success', 'All team problem statement selections have been reset to empty.');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-950 to-rose-950 hover:from-red-900 hover:to-rose-900 border border-red-700 text-red-100 hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-lg"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Reset All Problem Selections ({selectedTeamsList.length})</span>
          </button>
        </div>
      </div>

      {/* SYNCHRONIZED COUNTDOWN BANNER (IF LOCKED WITH TIMER) */}
      {isLockedWithTimer && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/80 via-[#181210] to-[#0c0c16] border-2 border-amber-600/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 font-bold text-xl">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-900 text-amber-200 border border-amber-700">
                ACTIVE SYNCHRONIZED SERVER TIMER
              </span>
              <h3 className="text-base font-bold text-white">
                Selection is Locked. Automatically unlocks when server clock reaches 0.
              </h3>
              <p className="text-xs text-zinc-300 font-mono">
                Server Target Unlock Timestamp: {new Date(unlockTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono">
            <div className="px-4 py-2.5 rounded-2xl bg-black/80 border border-amber-900/80 text-center min-w-[64px]">
              <span className="text-3xl font-black text-amber-300">{unlockMins}</span>
              <span className="block text-[9px] text-zinc-500 uppercase font-sans">Mins</span>
            </div>
            <span className="text-amber-500 font-bold text-2xl">:</span>
            <div className="px-4 py-2.5 rounded-2xl bg-black/80 border border-amber-900/80 text-center min-w-[64px]">
              <span className="text-3xl font-black text-amber-300">{unlockSecs}</span>
              <span className="block text-[9px] text-zinc-500 uppercase font-sans">Secs</span>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME SELECTIONS TELEMETRY & LIVE ALLOCATION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 30 Problem Statements Capacity & Allocation Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-display uppercase tracking-wider">
                Problem Statements Allocation Matrix (30 Challenges)
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Total Allocated: <strong className="text-emerald-400">{totalAllocatedSlots}</strong> / {totalMaxSlots} Slots Filled
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#121220] text-zinc-400 font-mono uppercase text-[10px]">
                  <th className="p-3.5">PS ID</th>
                  <th className="p-3.5">Title & Category</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5">Allocated Teams (Live)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {problemStatements.map(ps => {
                  const alloc = allocations[ps.problemStatementId];
                  const count = alloc?.currentTeamCount || 0;
                  const max = 2;
                  const isFull = count >= max;

                  return (
                    <tr key={ps.problemStatementId} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-red-400">{ps.problemStatementId}</td>
                      <td className="p-3.5 max-w-xs">
                        <div className="text-white font-sans font-semibold truncate">{ps.title}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isFull
                            ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-glow-crimson'
                            : count > 0
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {count} / {max} {isFull ? 'FULL' : 'OPEN'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {alloc && alloc.allocatedTeamIds.length > 0 ? (
                            alloc.allocatedTeamIds.map(tid => {
                              const tObj = teams.find(t => t.teamId === tid);
                              return (
                                <span
                                  key={tid}
                                  className="px-2.5 py-0.5 rounded-lg bg-red-950/90 text-red-300 border border-red-800/80 text-[10px] font-semibold"
                                  title={tObj ? `${tObj.teamName} (Lead: ${tObj.members[0]?.name})` : tid}
                                >
                                  {tid} {tObj ? `• ${tObj.teamName}` : ''}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-zinc-600 italic">No teams yet</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Real-time Live Selection Feed */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white font-display uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Selections Feed</span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Real-time feed ({selectedTeamsList.length} of {teams.length} Teams Selected)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0c16] border border-zinc-800 max-h-[580px] overflow-y-auto space-y-3 shadow-xl">
            {selectedTeamsList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                No teams have selected a problem statement yet.
              </div>
            ) : (
              selectedTeamsList.map(t => {
                const psObj = problemStatements.find(p => p.problemStatementId === t.problemStatementId);
                const timeStr = t.problemSelectedAt
                  ? new Date(t.problemSelectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Just now';

                return (
                  <div
                    key={t.teamId}
                    className="p-3.5 rounded-xl bg-[#121222] border border-zinc-800/80 space-y-1.5 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-mono text-xs font-bold border border-red-900/60">
                        {t.teamId}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Selected at <strong className="text-zinc-200">{timeStr}</strong>
                      </span>
                    </div>

                    <div className="font-bold text-white text-sm">
                      {t.teamName}
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold">{t.problemStatementId}</span>
                      <span className="text-zinc-400 font-sans truncate">• {psObj?.title || 'Challenge'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
});

export const AdminPortal: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Navigation
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'teams' | 'problem_statements' | 'problem_selection' | 'attendance' | 'volunteers' | 'reviewers' | 'reviews' | 'leaderboard' | 'exports' | 'audit_logs' | 'settings'
  >('dashboard');

  // Store state
  const [teams, setTeams] = useState<Team[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [allocations, setAllocations] = useState<Record<string, ProblemStatementAllocation>>({});
  const [selectionSettings, setSelectionSettings] = useState<SelectionSettings>(eventStore.getSelectionSettings());
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>(eventStore.getVolunteers());
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(eventStore.getReviewSettings());
  const [reviewMarks, setReviewMarks] = useState<ReviewMark[]>([]);
  const [normalizedScores, setNormalizedScores] = useState<NormalizedScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(eventStore.getAppSettings());

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLogRound, setSelectedLogRound] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [reviewViewTab, setReviewViewTab] = useState<'submissions' | 'pending'>('submissions');
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [selectedPSForDrawer, setSelectedPSForDrawer] = useState<ProblemStatement | null>(null);
  const [selectedTeam360, setSelectedTeam360] = useState<Team | null>(null);
  const [assignPSModalTeam, setAssignPSModalTeam] = useState<Team | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionLockCode, setNewSessionLockCode] = useState('');
  const [newReviewerEmail, setNewReviewerEmail] = useState('');
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newVolunteerEmail, setNewVolunteerEmail] = useState('');
  const [newVolunteerName, setNewVolunteerName] = useState('');
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [reviewerRounds, setReviewerRounds] = useState<number[]>([1, 2, 3]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: 'volunteer' | 'reviewer';
    uid: string;
    name: string;
    email: string;
  } | null>(null);
  const [scoreCorrectionModal, setScoreCorrectionModal] = useState<{
    isOpen: boolean;
    markId: string;
    round: number;
    teamId: string;
    reviewerUid: string;
    reviewerName: string;
    oldScore: number;
    newScore: number;
    reason: string;
  } | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const update = () => {
      setTeams(eventStore.getTeams());
      setProblemStatements(eventStore.getProblemStatements());
      setAllocations(eventStore.getAllocations());
      const s = eventStore.getSelectionSettings();
      setSelectionSettings(s);
      setAttendanceSessions(eventStore.getAttendanceSessions());
      setVolunteers(eventStore.getVolunteers());
      setReviewers(eventStore.getReviewers());
      setReviewSettings(eventStore.getReviewSettings());
      setReviewMarks(eventStore.getReviewMarks());
      setNormalizedScores(eventStore.getNormalizedScores());
      setLeaderboard(eventStore.getLeaderboard());
      setAuditLogs(eventStore.getAuditLogs());
      setAppSettings(eventStore.getAppSettings());
    };
    update();
    return eventStore.subscribe(update);
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  // Memoized metrics calculations for zero lag
  const metrics = useMemo(() => {
    const totalTeams = teams.length;
    const totalMembers = teams.reduce((acc, t) => acc + t.members.length, 0);
    const totalAllocatedTeams = teams.filter(t => t.problemStatementId).length;
    const fullPSCount = Object.values(allocations).filter(a => a.currentTeamCount >= 2).length;
    const availablePSCount = problemStatements.length - fullPSCount;
    
    const activeSession = attendanceSessions.find(s => s.status === 'ACTIVE' || s.status === 'active');
    const activeSessionRecords = activeSession ? eventStore.getAttendanceRecordsForSession(activeSession.sessionId) : [];
    const totalPresentInActive = activeSessionRecords.reduce((acc, r) => acc + (Array.isArray(r.members) ? r.members.filter(m => m.status === 'PRESENT' || m.present).length : 0), 0);
    const totalAbsentInActive = Math.max(0, totalMembers - totalPresentInActive);

    const r1MarksCount = reviewMarks.filter(m => m.round === 1).length;
    const r2MarksCount = reviewMarks.filter(m => m.round === 2).length;
    const r3MarksCount = reviewMarks.filter(m => m.round === 3).length;

    const unallocatedTeamsCount = teams.filter(t => !t.problemStatementId).length;
    const activeSessionAllTeams = activeSession ? eventStore.getAllTeamsSessionAttendance(activeSession.sessionId) : [];
    const unmarkedTeamsCount = activeSession ? activeSessionAllTeams.filter(t => t.status === 'NOT MARKED').length : 0;
    const currentRoundMarksCount = reviewMarks.filter(m => m.round === reviewSettings.activeRound).length;
    const pendingReviewsCount = Math.max(0, totalTeams - currentRoundMarksCount);
    const reviewCompletionPct = totalTeams > 0 ? Math.round((currentRoundMarksCount / totalTeams) * 100) : 0;
    const attendanceRatePct = totalMembers > 0 ? ((totalPresentInActive / totalMembers) * 100).toFixed(1) : '100.0';

    return {
      totalTeams,
      totalMembers,
      totalAllocatedTeams,
      fullPSCount,
      availablePSCount,
      activeSession,
      totalPresentInActive,
      totalAbsentInActive,
      r1MarksCount,
      r2MarksCount,
      r3MarksCount,
      unallocatedTeamsCount,
      unmarkedTeamsCount,
      currentRoundMarksCount,
      pendingReviewsCount,
      reviewCompletionPct,
      attendanceRatePct
    };
  }, [teams, problemStatements, allocations, attendanceSessions, reviewMarks, reviewSettings]);

  const {
    totalTeams,
    totalMembers,
    totalAllocatedTeams,
    fullPSCount,
    availablePSCount,
    activeSession,
    totalPresentInActive,
    totalAbsentInActive,
    r1MarksCount,
    r2MarksCount,
    r3MarksCount,
    unallocatedTeamsCount,
    unmarkedTeamsCount,
    currentRoundMarksCount,
    pendingReviewsCount,
    reviewCompletionPct,
    attendanceRatePct
  } = metrics;

  return (
    <div className="min-h-screen bg-[#07070d] text-[#f1f1f5] flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#0a0a14] border-r border-[#241420] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 px-2 py-1">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            <div>
              <div className="text-sm font-black font-display text-white tracking-wider">COMMAND CTR</div>
              <div className="text-[10px] font-mono text-red-400 uppercase">{currentUser?.name || 'Administrator'}</div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'teams', label: 'Teams & Roster', icon: Users, badge: totalTeams },
              { id: 'problem_statements', label: 'Problem Statements', icon: FileCode2, badge: problemStatements.length },
              { id: 'problem_selection', label: 'Problem Selection', icon: Sliders },
              { id: 'attendance', label: 'Attendance Sessions', icon: CalendarCheck, badge: activeSession ? 'LIVE' : undefined },
              { id: 'volunteers', label: 'Volunteers Squad', icon: UserCheck, badge: volunteers.length },
              { id: 'reviewers', label: 'Reviewers Jury', icon: Award, badge: reviewers.length },
              { id: 'reviews', label: 'Review Control', icon: Sliders },
              { id: 'leaderboard', label: 'Admin Leaderboard', icon: Trophy },
              { id: 'exports', label: 'Data Exports & Reports', icon: Download },
              { id: 'audit_logs', label: 'Audit Logs', icon: History },
              { id: 'settings', label: 'Event Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-subtle font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                      item.badge === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-zinc-800 text-[10px] font-mono text-zinc-500">
          WEBX COMMAND v1.0 • KARE
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Notice Banner */}
        {notice && (
          <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
              <span>{notice.message}</span>
            </div>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {/* 1. COMPACT 1-PAGE COMMAND DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div className="space-y-3.5 animate-fade-in">
            
            {/* Top Bar: Title + Live status + State Sync */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-black font-display text-white tracking-wider uppercase">
                  WEBX COMMAND
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-mono text-[10px] font-bold inline-flex items-center space-x-1 shadow-glow-emerald">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    eventStore.syncFromStorage();
                    eventStore.rebuildLeaderboard(currentUser?.uid || 'admin', currentUser?.email || 'admin');
                    showNotification('success', 'Synchronized live hackathon telemetry.');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#141424] hover:bg-[#1e1e32] border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                  <span>SYNC STATE</span>
                </button>
              </div>
            </div>

            {/* 2. TOP KPI ROW (EXACTLY 5 COMPACT SHORT CARDS) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Card 1: TEAMS */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#121222] to-[#0c0c16] border border-zinc-800 space-y-0.5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">TEAMS</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{totalTeams}</div>
                <div className="text-[10px] text-zinc-500 font-mono">60 Registered</div>
              </div>

              {/* Card 2: MEMBERS */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#121222] to-[#0c0c16] border border-zinc-800 space-y-0.5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">MEMBERS</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{totalMembers}</div>
                <div className="text-[10px] text-zinc-500 font-mono">240 Enrolled</div>
              </div>

              {/* Card 3: PS ALLOCATED */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#121222] to-[#0c0c16] border border-zinc-800 space-y-0.5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">PS ALLOCATED</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{totalAllocatedTeams} <span className="text-xs text-zinc-500 font-normal">/ {totalTeams}</span></div>
                <div className="text-[10px] text-emerald-400 font-mono">{availablePSCount} Open • {fullPSCount} Full</div>
              </div>

              {/* Card 4: ATTENDANCE */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#0e1d16] to-[#0c0c16] border border-emerald-900/50 space-y-0.5">
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">ATTENDANCE</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {activeSession ? `${totalPresentInActive} / ${totalMembers}` : `${totalMembers} / ${totalMembers}`}
                </div>
                <div className="text-[10px] text-emerald-500/80 font-mono">{attendanceRatePct}% Turnout</div>
              </div>

              {/* Card 5: REVIEWS */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#1d0e20] to-[#0c0c16] border border-red-800/60 space-y-0.5">
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">REVIEWS (R{reviewSettings.activeRound})</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{currentRoundMarksCount} <span className="text-xs text-zinc-500 font-normal">/ {totalTeams}</span></div>
                <div className="text-[10px] text-red-400/80 font-mono">{reviewCompletionPct}% Completed</div>
              </div>
            </div>

            {/* 3. MAIN DASHBOARD AREA (2 COMPACT PANELS: EVENT STATUS & ACTION REQUIRED) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              
              {/* LEFT: EVENT STATUS */}
              <div className="lg:col-span-7 rounded-2xl bg-[#0c0c16] border border-zinc-800 p-3.5 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">EVENT STATUS</span>
                  <span className="text-[10px] font-mono text-zinc-500">Live Engine Diagnostics</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Row 1: Attendance */}
                  <div className="p-2.5 rounded-xl bg-[#11111e] border border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-white font-sans font-semibold text-xs flex items-center space-x-1.5">
                          <span>Attendance: {activeSession ? (activeSession.name || activeSession.sessionName) : 'Session 1'}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                            activeSession ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {activeSession ? 'ACTIVE' : 'STANDBY'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {totalPresentInActive} / {totalMembers} present • {attendanceRatePct}%
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSection('attendance')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-sans font-semibold transition-colors"
                    >
                      View Session →
                    </button>
                  </div>

                  {/* Row 2: Review */}
                  <div className="p-2.5 rounded-xl bg-[#11111e] border border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Award className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <div className="text-white font-sans font-semibold text-xs flex items-center space-x-1.5">
                          <span>Review: Round 0{reviewSettings.activeRound}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[9px] font-bold">
                            {reviewSettings[`round${reviewSettings.activeRound}Status` as 'round1Status' | 'round2Status' | 'round3Status']}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          R1: {r1MarksCount}/60 • R2: {r2MarksCount}/60 • R3: {r3MarksCount}/60
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSection('reviews')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-sans font-semibold transition-colors"
                    >
                      Review Control →
                    </button>
                  </div>

                  {/* Row 3: Problem Statements */}
                  <div className="p-2.5 rounded-xl bg-[#11111e] border border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FileCode2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="text-white font-sans font-semibold text-xs">Problem Statements</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {totalAllocatedTeams} / {totalTeams} allocated • {availablePSCount} open • {fullPSCount} full
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSection('problem_selection')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-sans font-semibold transition-colors"
                    >
                      Manage PS →
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: ACTION REQUIRED */}
              <div className="lg:col-span-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 p-3.5 space-y-2.5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>ACTION REQUIRED</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Attention Items</span>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    {unallocatedTeamsCount === 0 && unmarkedTeamsCount === 0 && pendingReviewsCount === 0 ? (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>✓ All systems normal</span>
                      </div>
                    ) : (
                      <>
                        {unallocatedTeamsCount > 0 && (
                          <div
                            onClick={() => setActiveSection('problem_selection')}
                            className="p-2.5 rounded-xl bg-[#140e14] border border-amber-900/40 hover:border-amber-700 text-xs font-mono flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2 text-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <span>{unallocatedTeamsCount} teams without PS</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-sans">Assign →</span>
                          </div>
                        )}

                        {unmarkedTeamsCount > 0 && (
                          <div
                            onClick={() => setActiveSection('attendance')}
                            className="p-2.5 rounded-xl bg-[#140e14] border border-rose-900/40 hover:border-rose-700 text-xs font-mono flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2 text-rose-300">
                              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                              <span>{unmarkedTeamsCount} teams not marked</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-sans">Scan →</span>
                          </div>
                        )}

                        {pendingReviewsCount > 0 && (
                          <div
                            onClick={() => setActiveSection('reviews')}
                            className="p-2.5 rounded-xl bg-[#111122] border border-sky-900/40 hover:border-sky-700 text-xs font-mono flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2 text-sky-300">
                              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                              <span>{pendingReviewsCount} reviews pending (R{reviewSettings.activeRound})</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-sans">Review →</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>Single-click navigation</span>
                  <span className="text-zinc-400">Click any card to jump</span>
                </div>
              </div>

            </div>

            {/* 4. LIVE OPERATIONS STRIP (COMPACT ~90px, MAX 3 ITEMS) */}
            <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xl">
              <div className="flex items-center space-x-2 shrink-0">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-wider">LIVE OPERATIONS</span>
              </div>

              <div className="flex-1 flex flex-wrap items-center gap-2 overflow-hidden text-[11px] font-mono">
                {auditLogs.slice(0, 3).map((log, idx) => (
                  <div key={log.id || idx} className="px-2.5 py-1 rounded-lg bg-[#11111e] border border-zinc-800 text-zinc-300 flex items-center space-x-1.5 truncate max-w-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="text-white font-bold">{log.targetId || log.targetType}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400 truncate">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <span className="text-zinc-500 text-xs">Waiting for live operational events...</span>
                )}
              </div>

              <button
                onClick={() => setActiveSection('audit_logs')}
                className="text-xs font-mono text-red-400 hover:text-red-300 font-semibold shrink-0 flex items-center space-x-1 transition-colors"
              >
                <span>View all audit logs →</span>
              </button>
            </div>

          </div>
        )}

        {/* 2. TEAMS MANAGEMENT & TEAM 360 DOSSIER */}
        {activeSection === 'teams' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black font-display text-white">Teams & Participant Registry</h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  60 Teams • 240 Registered Participants • Click any team for complete 360° Dossier.
                </p>
              </div>

              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Team ID, name, or reg no..."
                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#11111e] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Teams Table */}
            <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#121220] text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="p-3.5">Team ID</th>
                    <th className="p-3.5">Team Name</th>
                    <th className="p-3.5">Team Lead & Reg No</th>
                    <th className="p-3.5">Problem Statement</th>
                    <th className="p-3.5">Members</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {teams.filter(t => 
                    t.teamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.teamLeadRegNo.includes(searchQuery)
                  ).map(team => {
                    const lead = team.members.find(m => m.isTeamLead) || team.members[0];
                    return (
                      <tr key={team.teamId} className="hover:bg-zinc-900/50">
                        <td className="p-3.5 font-bold text-red-400">{team.teamId}</td>
                        <td className="p-3.5 text-white font-sans font-semibold">{team.teamName}</td>
                        <td className="p-3.5 text-zinc-300 font-sans">
                          <div>{lead?.name}</div>
                          <div className="text-[10px] font-mono text-zinc-500">Reg: {team.teamLeadRegNo}</div>
                        </td>
                        <td className="p-3.5">
                          {team.problemStatementId ? (
                            <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 font-semibold">
                              {team.problemStatementId}
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-sans italic">Not Selected</span>
                          )}
                        </td>
                        <td className="p-3.5 text-zinc-400">{team.members.length} Members</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => setSelectedTeam360(team)}
                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 hover:text-white text-[11px] font-sans font-semibold transition-colors"
                          >
                            Team 360°
                          </button>
                          <button
                            onClick={() => setAssignPSModalTeam(team)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-sans transition-colors"
                          >
                            Assign PS
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 2.5 PROBLEM STATEMENTS REPOSITORY */}
        {activeSection === 'problem_statements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black font-display text-white">Problem Statements Repository</h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  30 Official Engineering Problem Statements • Real-time Team Allocation & Capacity Metrics
                </p>
              </div>

              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PS ID, title, domain..."
                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#11111e] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {['ALL', 'Artificial Intelligence & ML', 'Blockchain & Web3', 'Cyber Security', 'Healthcare & Biotech', 'FinTech', 'Smart Cities & IoT', 'EdTech & Future of Work', 'Supply Chain & Logistics', 'Sustainability & CleanTech'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-subtle'
                      : 'bg-[#10101c] text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Problem Statements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {problemStatements.filter(ps => {
                const matchesSearch = ps.problemStatementId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ps.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  "".toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ps.problemDescription.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'ALL' || "" === selectedCategory;
                return matchesSearch && matchesCategory;
              }).map(ps => {
                const alloc = allocations[ps.problemStatementId];
                const count = alloc?.currentTeamCount || 0;
                const max = 2;
                const isFull = count >= max;

                return (
                  <div
                    key={ps.problemStatementId}
                    className="p-5 rounded-2xl bg-[#0c0c18] border border-zinc-800/90 hover:border-red-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800/60 font-mono text-xs font-bold text-red-400">
                          {ps.problemStatementId}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          isFull
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : count > 0
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        }`}>
                          {count}/{max} Teams {isFull ? '(FULL)' : 'Open'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white font-display mt-0.5 group-hover:text-red-300 transition-colors">
                          {ps.title}
                        </h3>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-3 font-light leading-relaxed">
                        {ps.problemDescription}
                      </p>

                      {/* Allocated Teams Pill if any */}
                      {alloc?.allocatedTeamIds && alloc.allocatedTeamIds.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800/60 flex items-center space-x-1.5 text-[11px] font-mono">
                          <span className="text-zinc-500">Allocated:</span>
                          <div className="flex flex-wrap gap-1">
                            {alloc.allocatedTeamIds.map(tid => (
                              <span key={tid} className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/50 text-[10px]">
                                {tid}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedPSForDrawer(ps)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center space-x-1"
                      >
                        <span>View 360° Specs</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            eventStore.updateProblemStatementCapacity(currentUser?.uid || 'admin', currentUser?.email || 'admin', ps.problemStatementId, max + 1);
                            showNotification('success', `Capacity increased for ${ps.problemStatementId} to ${max + 1}`);
                          }}
                          className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono"
                          title="Add capacity slot"
                        >
                          +1 Slot
                        </button>
                        {max > 1 && (
                          <button
                            onClick={() => {
                              eventStore.updateProblemStatementCapacity(currentUser?.uid || 'admin', currentUser?.email || 'admin', ps.problemStatementId, max - 1);
                              showNotification('success', `Capacity reduced for ${ps.problemStatementId} to ${max - 1}`);
                            }}
                            className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono"
                            title="Remove capacity slot"
                          >
                            -1 Slot
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. PROBLEM SELECTION CONTROLLER */}
        {activeSection === 'problem_selection' && (
          <AdminProblemSelectionController
            selectionSettings={selectionSettings}
            problemStatements={problemStatements}
            allocations={allocations}
            teams={teams}
            currentUser={currentUser}
            showNotification={showNotification}
          />
        )}

        {/* 4. ATTENDANCE MANAGEMENT (ATTENDANCE CONTROL CENTER) */}
        {activeSection === 'attendance' && (
          <AttendanceControlCenter />
        )}

        {/* 5. VOLUNTEERS SQUAD MANAGEMENT */}
        {activeSection === 'volunteers' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Quick Telemetry */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-900/50 text-red-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black font-display text-white uppercase tracking-tight">Volunteer Marshals Squad</h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Manage authorized ground marshals permitted to scan Team QR badges at Attendance Checkpoints.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/volunteer"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson flex items-center space-x-1.5 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Launch QR Scanner</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Telemetry Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121222] to-[#0c0c16] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">TOTAL REGISTERED MARSHALS</span>
                <div className="text-2xl font-black text-white font-mono">{volunteers.length}</div>
                <div className="text-[10px] font-mono text-zinc-500">Authorized Squad Accounts</div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0e1d16] to-[#0c0c16] border border-emerald-900/50 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">ACTIVE SCANNER MARSHALS</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">{volunteers.filter(v => v.active).length}</div>
                <div className="text-[10px] font-mono text-emerald-500/80">Permitted on Ground</div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1d0e20] to-[#0c0c16] border border-red-800/60 space-y-1">
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">ATTENDANCE CHECKPOINT ACCESS</span>
                <div className="text-2xl font-black text-white font-display tracking-tight">/volunteer</div>
                <div className="text-[10px] font-mono text-red-400/80">Camera QR + Manual Fallback</div>
              </div>
            </div>

            {/* Add Volunteer Form Card */}
            <div className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider border-b border-zinc-800/80 pb-3">
                <UserPlus className="w-4 h-4" />
                <span>AUTHORIZE NEW VOLUNTEER MARSHAL</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newVolunteerEmail.trim() || !newVolunteerName.trim()) {
                    showNotification('error', 'Please enter volunteer Google email and full name.');
                    return;
                  }
                  const res = eventStore.addVolunteer(
                    currentUser?.uid || 'admin',
                    currentUser?.email || 'admin',
                    newVolunteerEmail.trim(),
                    newVolunteerName.trim()
                  );
                  if (!res.success) {
                    showNotification('error', res.error || 'Failed to add volunteer.');
                  } else {
                    showNotification('success', `Authorized volunteer marshal ${newVolunteerName.trim()} (${newVolunteerEmail.trim()})`);
                    setNewVolunteerEmail('');
                    setNewVolunteerName('');
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3"
              >
                <div className="sm:col-span-5">
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Volunteer Google Email (e.g. aditya.vol@gmail.com)"
                      value={newVolunteerEmail}
                      onChange={(e) => setNewVolunteerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs font-mono text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Marshal Full Name"
                      value={newVolunteerName}
                      onChange={(e) => setNewVolunteerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-subtle flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Authorize Marshal</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3.5 rounded-2xl bg-[#0c0c16] border border-zinc-800 flex items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={volunteerSearch}
                  onChange={(e) => setVolunteerSearch(e.target.value)}
                  placeholder="Search marshals by name or Google email..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="text-xs font-mono text-zinc-400 shrink-0">
                Showing <strong className="text-white">{volunteers.filter(v => !volunteerSearch.trim() || v.name.toLowerCase().includes(volunteerSearch.toLowerCase()) || v.email.toLowerCase().includes(volunteerSearch.toLowerCase())).length}</strong> of {volunteers.length} Marshals
              </div>
            </div>

            {/* Marshals Table */}
            <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 overflow-x-auto shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#121220] text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="p-4">Marshal Details</th>
                    <th className="p-4">Google Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {volunteers
                    .filter(v => !volunteerSearch.trim() || v.name.toLowerCase().includes(volunteerSearch.toLowerCase()) || v.email.toLowerCase().includes(volunteerSearch.toLowerCase()))
                    .map(vol => (
                      <tr key={vol.uid} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-900/60 to-zinc-900 border border-red-900/50 flex items-center justify-center font-bold text-xs text-red-300 font-display">
                              {vol.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-sans font-semibold">{vol.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">Volunteer Marshal</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1.5 text-red-400 font-mono">
                            <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>{vol.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center space-x-1 ${
                            vol.active
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 shadow-glow-emerald'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${vol.active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            <span>{vol.active ? 'ACTIVE' : 'DISABLED'}</span>
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400">{new Date(vol.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                eventStore.toggleVolunteerActive(currentUser?.uid || 'admin', currentUser?.email || 'admin', vol.uid);
                                showNotification('success', `Toggled status for ${vol.name}`);
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-sans font-semibold transition-all ${
                                vol.active
                                  ? 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/80 text-emerald-300'
                              }`}
                            >
                              {vol.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmModal({
                                  type: 'volunteer',
                                  uid: vol.uid,
                                  name: vol.name,
                                  email: vol.email
                                });
                              }}
                              title="Delete Volunteer"
                              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600/30 border border-rose-900/50 hover:border-rose-600 text-rose-400 hover:text-rose-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {volunteers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500 font-sans">
                        No volunteer marshals registered. Authorize marshals above to grant scanner access.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5.5 REVIEWERS JURY REGISTRY (SINGLE UNIFIED PANEL) */}
        {activeSection === 'reviewers' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Telemetry */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-900/50 text-red-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black font-display text-white uppercase tracking-tight">Reviewers Jury Registry</h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Authorize jury panel Google accounts. Only registered and active reviewers can evaluate teams.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/reviewer"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson flex items-center space-x-1.5 transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Launch Reviewer Portal</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Telemetry Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121222] to-[#0c0c16] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">TOTAL JURY MEMBERS</span>
                <div className="text-2xl font-black text-white font-mono">{reviewers.length}</div>
                <div className="text-[10px] font-mono text-zinc-500">Authorized Academic & Industry Judges</div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0e1d16] to-[#0c0c16] border border-emerald-900/50 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">ACTIVE EVALUATORS</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">{reviewers.filter(r => r.active).length}</div>
                <div className="text-[10px] font-mono text-emerald-500/80">Can Submit Rubric Marks</div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1d0e20] to-[#0c0c16] border border-red-800/60 space-y-1">
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">EVALUATION ROUND ACCESS</span>
                <div className="text-2xl font-black text-white font-display tracking-tight">Round 0{reviewSettings.activeRound} LIVE</div>
                <div className="text-[10px] font-mono text-red-400/80">Automatic Min-Max Normalization</div>
              </div>
            </div>

            {/* Add Reviewer Form Card */}
            <div className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider border-b border-zinc-800/80 pb-3">
                <Plus className="w-4 h-4" />
                <span>AUTHORIZE NEW JURY REVIEWER</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newReviewerEmail.trim() || !newReviewerName.trim()) {
                    showNotification('error', 'Please enter reviewer Google email and full name.');
                    return;
                  }
                  const res = eventStore.addReviewer(
                    currentUser?.uid || 'admin',
                    currentUser?.email || 'admin',
                    newReviewerEmail.trim(),
                    newReviewerName.trim(),
                    reviewerRounds
                  );
                  if (!res.success) {
                    showNotification('error', res.error || 'Failed to add reviewer.');
                  } else {
                    showNotification('success', `Authorized reviewer ${newReviewerName.trim()} (${newReviewerEmail.trim()})`);
                    setNewReviewerEmail('');
                    setNewReviewerName('');
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3"
              >
                <div className="sm:col-span-5">
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Reviewer Google Email (e.g. dr.ramesh.cse@kare.ac.in)"
                      value={newReviewerEmail}
                      onChange={(e) => setNewReviewerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs font-mono text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name & Academic / Industry Title"
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-subtle flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Authorize Reviewer</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3.5 rounded-2xl bg-[#0c0c16] border border-zinc-800 flex items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reviewerSearch}
                  onChange={(e) => setReviewerSearch(e.target.value)}
                  placeholder="Search jury reviewers by name or email..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="text-xs font-mono text-zinc-400 shrink-0">
                Showing <strong className="text-white">{reviewers.filter(r => !reviewerSearch.trim() || r.name.toLowerCase().includes(reviewerSearch.toLowerCase()) || r.email.toLowerCase().includes(reviewerSearch.toLowerCase())).length}</strong> of {reviewers.length} Jury Members
              </div>
            </div>

            {/* Reviewers Table */}
            <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 overflow-x-auto shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#121220] text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="p-4">Reviewer Details</th>
                    <th className="p-4">Google Email</th>
                    <th className="p-4">Assigned Rounds</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {reviewers
                    .filter(r => !reviewerSearch.trim() || r.name.toLowerCase().includes(reviewerSearch.toLowerCase()) || r.email.toLowerCase().includes(reviewerSearch.toLowerCase()))
                    .map(rev => (
                      <tr key={rev.uid} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-900/60 to-zinc-900 border border-red-900/50 flex items-center justify-center font-bold text-xs text-red-300 font-display">
                              {rev.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-sans font-semibold">{rev.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">Jury Panel Member</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1.5 text-red-400 font-mono">
                            <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>{rev.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            {(rev.allowedRounds || [1, 2, 3]).map(rnd => (
                              <span key={rnd} className="px-2 py-0.5 rounded-md bg-[#16162a] border border-red-900/40 text-red-300 font-mono text-[10px] font-bold">
                                R{rnd}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center space-x-1 ${
                            rev.active
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 shadow-glow-emerald'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rev.active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            <span>{rev.active ? 'ACTIVE' : 'DISABLED'}</span>
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400">{new Date(rev.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                eventStore.toggleReviewerActive(currentUser?.uid || 'admin', currentUser?.email || 'admin', rev.uid);
                                showNotification('success', `Toggled status for ${rev.name}`);
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-sans font-semibold transition-all ${
                                rev.active
                                  ? 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/80 text-emerald-300'
                              }`}
                            >
                              {rev.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmModal({
                                  type: 'reviewer',
                                  uid: rev.uid,
                                  name: rev.name,
                                  email: rev.email
                                });
                              }}
                              title="Delete Reviewer"
                              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-600/30 border border-rose-900/50 hover:border-rose-600 text-rose-400 hover:text-rose-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {reviewers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500 font-sans">
                        No reviewers registered in jury panel. Add a reviewer above to grant scoring access.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. REVIEW CONTROL (SINGLE OPEN ROUND ENFORCEMENT & PENDING REVIEWS TRACKER) */}
        {activeSection === 'reviews' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black font-display text-white">REVIEW CONTROL & EVALUATION TRACKER</h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  RULE: <strong>Only ONE round can be OPEN at a time</strong>. Track pending vs completed teams and export verified marks in Excel.
                </p>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <button
                  onClick={() => {
                    eventStore.exportRoundMarksExcel(2);
                    showNotification('success', 'Generated & Downloaded Round 2 Marks Excel (.xlsx) with team and individual teammate scores.');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export R2 Excel (.xlsx)</span>
                </button>

                <button
                  onClick={() => {
                    eventStore.exportAllMarksExcel();
                    showNotification('success', 'Generated & Downloaded All Evaluation Marks Excel (.xlsx).');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export All (.xlsx)</span>
                </button>

                <div className="px-3.5 py-1.5 rounded-xl bg-[#141424] border border-red-900/40 text-xs font-mono text-red-400">
                  Active Round: <span className="text-white font-bold">ROUND 0{reviewSettings.activeRound}</span>
                </div>
              </div>
            </div>

            {/* Exact Specification Review Control Card */}
            <div className="rounded-3xl bg-[#0c0c16] border border-red-900/40 p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold flex items-center space-x-2 border-b border-zinc-800 pb-3">
                <Sliders className="w-4 h-4" />
                <span>ROUND STATUS CONTROL MATRIX</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { roundNum: 1 as const, title: "ROUND 1", desc: "Ideation & Architecture", status: reviewSettings.round1Status },
                  { roundNum: 2 as const, title: "ROUND 2", desc: "Mid-Way Implementation (Individual Marks)", status: reviewSettings.round2Status },
                  { roundNum: 3 as const, title: "ROUND 3", desc: "Final Demo & Presentation", status: reviewSettings.round3Status }
                ].map(r => {
                  const isOpen = r.status === 'OPEN';
                  const marksCount = reviewMarks.filter(m => m.round === r.roundNum).length;
                  const pendingCount = Math.max(0, teams.length - marksCount);

                  return (
                    <div
                      key={r.roundNum}
                      className={`p-6 rounded-2xl border space-y-5 transition-all ${
                        isOpen
                          ? 'bg-[#150d18] border-emerald-500 shadow-glow-subtle'
                          : 'bg-[#10101c] border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-black text-white">{r.title}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                          isOpen ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          Status: {r.status}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400 space-y-1">
                        <div className="font-semibold text-zinc-200">{r.desc}</div>
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                          <span className="text-emerald-400 font-bold">{marksCount} Done</span>
                          <span className="text-amber-400 font-bold">{pendingCount} Pending</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                        {isOpen ? (
                          <button
                            onClick={() => {
                              eventStore.closeReviewRound(currentUser?.uid || 'admin', currentUser?.email || 'admin', r.roundNum);
                              showNotification('success', `Closed Round ${r.roundNum}`);
                            }}
                            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
                          >
                            [ CLOSE ROUND {r.roundNum} ]
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              eventStore.openReviewRound(currentUser?.uid || 'admin', currentUser?.email || 'admin', r.roundNum);
                              showNotification('success', `OPENED Round ${r.roundNum} (all other rounds closed).`);
                            }}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
                          >
                            [ OPEN ROUND {r.roundNum} ]
                          </button>
                        )}

                        <div className="flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-xl bg-[#0b1b13] border border-emerald-900/50 text-[10px] font-mono text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Auto Min-Max: Real-Time Active</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submissions & Pending Review Teams Inspection Matrix */}
            <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 p-5 space-y-4">
              
              {/* Primary Tab Switcher: Evaluated Submissions vs Pending Review Teams */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setReviewViewTab('submissions')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
                      reviewViewTab === 'submissions'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Evaluated Submissions ({reviewMarks.length})</span>
                  </button>

                  <button
                    onClick={() => setReviewViewTab('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
                      reviewViewTab === 'pending'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Pending Review Teams ({
                        (() => {
                          const targetRnd = selectedLogRound === 'ALL' ? reviewSettings.activeRound : selectedLogRound;
                          const evaluated = new Set(reviewMarks.filter(m => m.round === targetRnd).map(m => m.teamId));
                          return teams.filter(t => !evaluated.has(t.teamId)).length;
                        })()
                      })
                    </span>
                  </button>
                </div>

                {/* Round Filter Tabs */}
                <div className="flex items-center space-x-1.5 font-mono text-xs">
                  <button
                    onClick={() => setSelectedLogRound('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      selectedLogRound === 'ALL'
                        ? 'bg-red-600 text-white font-bold shadow-md'
                        : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                    }`}
                  >
                    All Rounds
                  </button>
                  {[1, 2, 3].map(rnd => (
                    <button
                      key={rnd}
                      onClick={() => setSelectedLogRound(rnd as any)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        selectedLogRound === rnd
                          ? 'bg-red-600 text-white font-bold shadow-md'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Round {rnd}
                    </button>
                  ))}
                </div>
              </div>

              {/* VIEW 1: EVALUATED SUBMISSIONS */}
              {reviewViewTab === 'submissions' && (
                <div>
                  {(() => {
                    const filteredMarks = reviewMarks.filter(m => selectedLogRound === 'ALL' || m.round === selectedLogRound);

                    if (filteredMarks.length === 0) {
                      return (
                        <div className="py-12 text-center space-y-2">
                          <div className="text-zinc-500 font-mono text-xs">
                            {selectedLogRound === 'ALL'
                              ? 'No review evaluations recorded yet.'
                              : `No submissions recorded yet for Round ${selectedLogRound}. Awaiting jury evaluations.`}
                          </div>
                          <div className="text-[11px] text-zinc-600 font-light">
                            When reviewers submit marks on their scoring station during Round {selectedLogRound === 'ALL' ? '' : selectedLogRound}, they will appear here in real time.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                              <th className="pb-2">Round</th>
                              <th className="pb-2">Team</th>
                              <th className="pb-2">Reviewer</th>
                              <th className="pb-2">Raw Score</th>
                              <th className="pb-2">Reviewer Avg</th>
                              <th className="pb-2">Target Benchmark</th>
                              <th className="pb-2">Normalized Score</th>
                              <th className="pb-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 font-mono">
                            {filteredMarks.map(m => {
                              const norm = normalizedScores.find(n => n.round === m.round && n.teamId === m.teamId && n.reviewerUid === m.reviewerUid);
                              const t = teams.find(team => team.teamId === m.teamId);

                              return (
                                <tr key={m.id} className="hover:bg-zinc-900/40">
                                  <td className="py-2.5 text-red-400 font-bold">R{m.round}</td>
                                  <td className="py-2.5">
                                    <span className="font-bold text-white block">{m.teamId}</span>
                                    <span className="text-[10px] text-zinc-400 font-sans">{t?.teamName || ''}</span>
                                  </td>
                                  <td className="py-2.5 text-zinc-300 font-sans">{m.reviewerName}</td>
                                  <td className="py-2.5">
                                    <div className="text-amber-400 font-bold">{m.rawScore} / 100</div>
                                    {m.memberScores && m.memberScores.length > 0 && (
                                      <div className="text-[10px] text-zinc-400 font-sans mt-0.5 space-y-0.5">
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                          {m.memberScores.map(ms => (
                                            <span key={ms.memberId} className="px-1.5 py-0.5 bg-zinc-800/90 border border-zinc-700/60 rounded text-[9px] text-zinc-300 font-mono">
                                              {ms.name.split(' ')[0]}: <strong className="text-amber-300">{ms.score}</strong>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-zinc-400">
                                    {norm?.reviewerMean !== undefined ? `${norm.reviewerMean.toFixed(1)}` : norm?.minimumReviewerScore !== undefined ? `${norm.minimumReviewerScore}-${norm.maximumReviewerScore}` : '—'}
                                  </td>
                                  <td className="py-2.5 text-sky-400 font-mono text-[11px]">
                                    {norm?.targetMean !== undefined ? `75.0 (${(75.0 - (norm.reviewerMean || 75)).toFixed(1) >= '0' ? `+${(75.0 - (norm.reviewerMean || 75)).toFixed(1)}` : (75.0 - (norm.reviewerMean || 75)).toFixed(1)})` : '75.0'}
                                  </td>
                                  <td className="py-2.5">
                                    {norm ? (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[11px]">
                                        {norm.normalizedScore.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600">Pending</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      onClick={() => {
                                        setScoreCorrectionModal({
                                          isOpen: true,
                                          markId: m.id,
                                          round: m.round,
                                          teamId: m.teamId,
                                          reviewerUid: m.reviewerUid,
                                          reviewerName: m.reviewerName,
                                          oldScore: m.rawScore,
                                          newScore: m.rawScore,
                                          reason: ''
                                        });
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-300 hover:text-red-300 text-[10px] uppercase font-bold border border-zinc-700 transition-colors cursor-pointer"
                                      title="Authorized Admin score correction with audit trail"
                                    >
                                      Correct Score
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VIEW 2: PENDING REVIEW TEAMS (SPECIFICALLY FOR ADMIN TO TRACK WHO STILL NEEDS REVIEW) */}
              {reviewViewTab === 'pending' && (
                <div className="space-y-4">
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        value={pendingSearchQuery}
                        onChange={(e) => setPendingSearchQuery(e.target.value)}
                        placeholder="Filter pending teams by ID, name, lead..."
                        className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition-colors"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                    </div>

                    <button
                      onClick={() => {
                        const targetRnd = selectedLogRound === 'ALL' ? reviewSettings.activeRound : selectedLogRound;
                        eventStore.exportRoundMarksExcel(targetRnd);
                        showNotification('success', `Exported Round ${targetRnd} Excel spreadsheet including all Pending Review Teams.`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Pending Teams Excel (.xlsx)</span>
                    </button>
                  </div>

                  {/* Pending Teams Table */}
                  {(() => {
                    const targetRnd = selectedLogRound === 'ALL' ? reviewSettings.activeRound : selectedLogRound;
                    const evaluatedSet = new Set(reviewMarks.filter(m => m.round === targetRnd).map(m => m.teamId));
                    let pendingList = teams.filter(t => !evaluatedSet.has(t.teamId));

                    if (pendingSearchQuery.trim()) {
                      const q = pendingSearchQuery.toLowerCase().trim();
                      pendingList = pendingList.filter(t => 
                        t.teamId.toLowerCase().includes(q) ||
                        t.teamName.toLowerCase().includes(q) ||
                        (t.problemStatementId && t.problemStatementId.toLowerCase().includes(q)) ||
                        t.members.some(m => m.name.toLowerCase().includes(q) || m.registrationNumber.toLowerCase().includes(q))
                      );
                    }

                    if (pendingList.length === 0) {
                      return (
                        <div className="py-12 text-center space-y-2 bg-[#121220] rounded-2xl border border-zinc-800">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                          <div className="text-sm font-bold text-white">All Teams Evaluated in Round {targetRnd}!</div>
                          <p className="text-xs text-zinc-400">
                            There are zero pending teams remaining for this evaluation round.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                              <th className="pb-2.5">Team ID</th>
                              <th className="pb-2.5">Team Name</th>
                              <th className="pb-2.5">Problem Statement</th>
                              <th className="pb-2.5">Team Lead</th>
                              <th className="pb-2.5">Lead Contact</th>
                              <th className="pb-2.5">Members</th>
                              <th className="pb-2.5 text-right">Review Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {pendingList.map(team => {
                              const lead = team.members.find(m => m.isTeamLead) || team.members[0];
                              const ps = team.problemStatementId ? eventStore.getProblemStatement(team.problemStatementId) : null;

                              return (
                                <tr key={team.teamId} className="hover:bg-zinc-900/40">
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-900/60">
                                      {team.teamId}
                                    </span>
                                  </td>
                                  <td className="py-3 text-white font-sans font-bold">
                                    {team.teamName}
                                  </td>
                                  <td className="py-3 text-zinc-300">
                                    {team.problemStatementId ? (
                                      <div>
                                        <span className="font-bold text-red-300">{team.problemStatementId}</span>
                                        <span className="text-[11px] text-zinc-400 font-sans block truncate max-w-xs">{ps?.title || ''}</span>
                                      </div>
                                    ) : (
                                      <span className="text-zinc-600 italic">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-zinc-300 font-sans">
                                    {lead?.name || 'N/A'} <span className="text-zinc-500 text-[10px] font-mono">({lead?.registrationNumber})</span>
                                  </td>
                                  <td className="py-3 text-zinc-400">
                                    {lead?.phone || 'N/A'}
                                  </td>
                                  <td className="py-3 text-zinc-300">
                                    {team.members.length}
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/70 font-bold text-[10px]">
                                      ⏳ PENDING ROUND 0{targetRnd}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>

          </div>
        )}

        {/* 6. ADMIN-ONLY LEADERBOARD */}
        {activeSection === 'leaderboard' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-red-400 text-xs font-mono uppercase tracking-widest font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>ADMIN PRIVILEGED VIEW ONLY</span>
                </div>
                <h2 className="text-2xl font-black font-display text-white mt-1">Official Event Leaderboard</h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Calculated from normalized scores: R1 (25%) + R2 (35%) + R3 (40%).
                </p>
              </div>

              <button
                onClick={() => {
                  eventStore.rebuildLeaderboard(currentUser?.uid || 'admin', currentUser?.email || 'admin');
                  showNotification('success', 'Leaderboard recalculated from authoritative normalized data.');
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-glow-subtle"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalculate Leaderboard</span>
              </button>
            </div>

            {/* Leaderboard Table */}
            <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#121220] text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="p-3.5">Rank</th>
                    <th className="p-3.5">Team ID & Name</th>
                    <th className="p-3.5">Problem Statement</th>
                    <th className="p-3.5">R1 Norm</th>
                    <th className="p-3.5">R2 Norm</th>
                    <th className="p-3.5">R3 Norm</th>
                    <th className="p-3.5 text-right font-bold text-red-400">Total Final Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {leaderboard.map(entry => {
                    const isTop3 = entry.rank <= 3;
                    return (
                      <tr key={entry.teamId} className={`hover:bg-zinc-900/50 ${isTop3 ? 'bg-red-950/20' : ''}`}>
                        <td className="p-3.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            entry.rank === 1 ? 'bg-amber-400 text-black shadow-lg font-black' :
                            entry.rank === 2 ? 'bg-slate-300 text-black font-black' :
                            entry.rank === 3 ? 'bg-amber-700 text-white font-black' : 'text-zinc-400'
                          }`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="text-white font-sans font-bold">{entry.teamName}</div>
                          <div className="text-[10px] text-zinc-500">{entry.teamId}</div>
                        </td>
                        <td className="p-3.5">
                          {entry.problemStatementId ? (
                            <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60">
                              {entry.problemStatementId}
                            </span>
                          ) : (
                            <span className="text-zinc-600">--</span>
                          )}
                        </td>
                        <td className="p-3.5 text-zinc-300">{entry.round1NormalizedAvg}</td>
                        <td className="p-3.5 text-zinc-300">{entry.round2NormalizedAvg}</td>
                        <td className="p-3.5 text-zinc-300">{entry.round3NormalizedAvg}</td>
                        <td className="p-3.5 text-right font-bold text-base text-red-400">
                          {entry.totalScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 7. DATA EXPORTS & REPORTS */}
        {activeSection === 'exports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black font-display text-white">Data Exports & Official Reports</h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Download verified event datasets in CSV, Excel-ready, and formatted report documents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. ROUND 2 EXCEL REPORT (TEAMS + INDIVIDUAL TEAMMATES + PENDING) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0e1d16] to-[#0c0c16] border border-emerald-900/70 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                      EXCEL .XLSX
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">
                      ROUND 2
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-display mt-2">Round 2 Marks & Teammate Scores</h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Complete 3-sheet Excel spreadsheet containing Round 2 Team Scores, Individual Teammate Marks & Remarks, and Pending Review Teams.
                  </p>
                </div>
                <button
                  onClick={() => {
                    eventStore.exportRoundMarksExcel(2);
                    showNotification('success', 'Downloaded Round 2 Marks & Teammates Excel Workbook (.xlsx)');
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>

              {/* 2. ALL ROUNDS MARKS + LEADERBOARD EXCEL */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1d0e14] to-[#0c0c16] border border-red-900/70 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-mono font-bold">
                      EXCEL .XLSX
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">
                      ALL MODULES
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-display mt-2">All Evaluation Marks & Leaderboard</h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Multi-sheet Excel workbook with Round 1, 2, 3 raw & normalized scores, Official Leaderboard, and individual teammate scores.
                  </p>
                </div>
                <button
                  onClick={() => {
                    eventStore.exportAllMarksExcel();
                    showNotification('success', 'Downloaded Complete All Marks Excel Workbook (.xlsx)');
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>

              {[
                {
                  title: "Complete Teams & Leads",
                  desc: "Team IDs, names, status, and lead registration numbers.",
                  action: () => {
                    const csv = eventStore.exportTeamsCSV();
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `WEBX_Teams_${Date.now()}.csv`);
                    link.click();
                    showNotification('success', 'Downloaded Teams CSV');
                  }
                },
                {
                  title: "All 240 Participant Members",
                  desc: "Detailed member roster with registration numbers, emails, and phones.",
                  action: () => {
                    const csv = eventStore.exportMembersCSV();
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `WEBX_Members_${Date.now()}.csv`);
                    link.click();
                    showNotification('success', 'Downloaded Members CSV');
                  }
                },
                {
                  title: "Problem Statement Allocations",
                  desc: "All 30 problem statements with assigned team IDs and capacity status.",
                  action: () => {
                    const csv = eventStore.exportAllocationsCSV();
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `WEBX_PS_Allocations_${Date.now()}.csv`);
                    link.click();
                    showNotification('success', 'Downloaded PS Allocation CSV');
                  }
                },
                {
                  title: "Full Attendance Log by Participant",
                  desc: "Session-by-session present and absent records across all rounds.",
                  action: () => {
                    const csv = eventStore.exportAttendanceCSV();
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `WEBX_Attendance_${Date.now()}.csv`);
                    link.click();
                    showNotification('success', 'Downloaded Attendance CSV');
                  }
                },
                {
                  title: "Official Final Leaderboard",
                  desc: "Full ranking breakdown with raw marks, normalized scores, and total score.",
                  action: () => {
                    const csv = eventStore.exportLeaderboardCSV();
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `WEBX_Leaderboard_${Date.now()}.csv`);
                    link.click();
                    showNotification('success', 'Downloaded Leaderboard CSV');
                  }
                }
              ].map((exp, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">{exp.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{exp.desc}</p>
                  </div>
                  <button
                    onClick={exp.action}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#151526] hover:bg-red-950/60 border border-zinc-700 hover:border-red-800 text-xs font-semibold text-zinc-200 hover:text-white transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Dataset</span>
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}


        {/* 9. AUDIT LOGS */}
        {activeSection === 'audit_logs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black font-display text-white">Immutable Event Audit Trail</h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Cryptographically tracked record of all privileged administrative and transactional operations.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0c0c16] border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#121220] text-zinc-400 uppercase text-[10px]">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Actor Role</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Metadata Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-900/50">
                      <td className="p-3.5 text-zinc-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-red-400">{log.action}</td>
                      <td className="p-3.5 text-zinc-300">{log.actorRole} ({log.actorUid})</td>
                      <td className="p-3.5 text-white">{log.targetType}: {log.targetId}</td>
                      <td className="p-3.5 text-zinc-400 text-[11px] max-w-xs truncate font-sans">
                        {JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 10. SETTINGS & FACTORY RESET */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black font-display text-white">Event & System Control</h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Event parameters, single-device session resets, and factory demonstration controls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#0c0c16] border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-display">Event Metadata</h3>
                <div className="space-y-2 text-xs">
                  <div><span className="text-zinc-500 font-mono">Event:</span> {appSettings.eventName}</div>
                  <div><span className="text-zinc-500 font-mono">Date:</span> {appSettings.date}</div>
                  <div><span className="text-zinc-500 font-mono">Venue:</span> {appSettings.venue}</div>
                  <div><span className="text-zinc-500 font-mono">Credits:</span> {appSettings.credits}</div>
                  <div><span className="text-zinc-500 font-mono">Prize Pool:</span> {appSettings.prizePool}</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0c0c16] border border-red-900/40 space-y-4">
                <h3 className="text-sm font-bold text-red-400 font-display flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Administrative & Submissions Reset Hub</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Wipe live submissions, unassign teams, or perform a clean system-wide factory reset with zero mock data.
                </p>
                
                <div className="space-y-2.5">
                  {/* 1. MASTER REMOVE ALL SUBMISSIONS */}
                  <button
                    onClick={async () => {
                      if (confirm("CRITICAL: Are you sure you want to REMOVE ALL SUBMISSIONS across the entire system?\n\nThis will:\n1. Clear all Team Problem Statement Selections & reset capacities to 0\n2. Clear all Volunteer Attendance Submissions\n3. Clear all Jury Review Marks, Normalizations & Leaderboard\n\nAll 60 teams and 30 problem statements remain registered.")) {
                        await eventStore.removeAllSubmissions(currentUser?.uid || 'admin', currentUser?.email || 'admin');
                        showNotification('success', 'ALL submissions across problem selections, attendance, and reviews have been permanently cleared.');
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-950 to-rose-950 hover:from-red-900 hover:to-rose-900 border border-red-700 text-red-100 hover:text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Remove All Submissions (All Modules)</span>
                  </button>

                  {/* 2. CLEAR PROBLEM SELECTIONS */}
                  <button
                    onClick={async () => {
                      if (confirm("Reset all problem statement selections? All 60 teams will have their selected challenge cleared.")) {
                        await eventStore.clearAllProblemSelections(currentUser?.uid || 'admin', currentUser?.email || 'admin');
                        showNotification('success', 'All problem statement selections cleared.');
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <span>🎯 Reset All Problem Selections</span>
                  </button>

                  {/* 3. CLEAR ATTENDANCE SUBMISSIONS */}
                  <button
                    onClick={async () => {
                      if (confirm("Clear all attendance records submitted by volunteers?")) {
                        await eventStore.clearAllAttendanceSubmissions(currentUser?.uid || 'admin', currentUser?.email || 'admin');
                        showNotification('success', 'All volunteer attendance records cleared.');
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <span>📋 Clear All Attendance Records</span>
                  </button>

                  {/* 4. CLEAR REVIEW MARKS */}
                  <button
                    onClick={async () => {
                      if (confirm("Clear all jury evaluation marks, normalized scores, and leaderboard rankings?")) {
                        await eventStore.clearAllReviewMarks(currentUser?.uid || 'admin', currentUser?.email || 'admin');
                        showNotification('success', 'All review evaluation marks cleared.');
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <span>⚖️ Clear All Review Marks & Leaderboard</span>
                  </button>

                  {/* 5. RESET DEVICE SESSIONS */}
                  <button
                    onClick={() => {
                      teams.forEach(t => {
                        eventStore.adminResetDeviceSession(currentUser?.uid || 'admin', currentUser?.email || 'admin', t.teamId);
                      });
                      showNotification('success', 'Reset active device sessions for all 60 teams.');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <span>💻 Reset All Team Device Sessions</span>
                  </button>

                  {/* 6. FULL FACTORY RESET */}
                  <button
                    onClick={async () => {
                      if (confirm("Reset store to factory clean state with all 60 teams and 30 problem statements?")) {
                        await eventStore.resetToFactory(currentUser?.uid || 'admin', currentUser?.email || 'admin');
                        showNotification('success', 'System reset to clean factory defaults with 0 stale submissions.');
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <span>🔄 Full Factory Reset (Clean Seed Data)</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* TEAM 360° DOSSIER MODAL */}
      {selectedTeam360 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedTeam360(null)} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#0c0c16] border border-red-900/50 p-6 md:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="text-xs font-mono text-red-400 uppercase tracking-widest">TEAM 360° DOSSIER</div>
                <h3 className="text-2xl font-black text-white font-display">
                  {selectedTeam360.teamName} <span className="text-zinc-500 font-mono">({selectedTeam360.teamId})</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeam360(null)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase">Team Members & Registration Numbers</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedTeam360.members.map(m => (
                  <div key={m.memberId} className="p-3 rounded-xl bg-[#121220] border border-zinc-800 text-xs">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{m.name}</span>
                      {m.isTeamLead && <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[10px]">LEAD</span>}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Reg: {m.registrationNumber}</div>
                    <div className="text-[11px] text-zinc-500">{m.email} • {m.phone}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Problem Statement Selection */}
            <div className="p-4 rounded-xl bg-[#121220] border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-zinc-400 uppercase">Allocated Problem Statement</div>
                {selectedTeam360.problemStatementId && (
                  <button
                    onClick={async () => {
                      if (confirm(`Unassign problem statement ${selectedTeam360.problemStatementId} for ${selectedTeam360.teamName} (${selectedTeam360.teamId})?`)) {
                        await eventStore.unselectProblemForTeam(currentUser?.uid || 'admin', currentUser?.email || 'admin', selectedTeam360.teamId);
                        setSelectedTeam360(eventStore.getTeam(selectedTeam360.teamId) || null);
                        showNotification('success', `Unassigned problem statement for ${selectedTeam360.teamId}`);
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white text-[11px] font-mono font-bold cursor-pointer transition-all"
                  >
                    ✕ Unassign Challenge
                  </button>
                )}
              </div>
              <div className="text-sm font-bold text-white">
                {selectedTeam360.problemStatementId ? (
                  <span className="text-emerald-400">{selectedTeam360.problemStatementId} — {eventStore.getProblemStatement(selectedTeam360.problemStatementId)?.title}</span>
                ) : (
                  <span className="text-zinc-500 italic">No Problem Statement Assigned</span>
                )}
              </div>
              {selectedTeam360.problemSelectedAt && (
                <div className="text-[11px] font-mono text-zinc-500">
                  Selected At: {new Date(selectedTeam360.problemSelectedAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Attendance Records */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase">Attendance History</div>
              <div className="space-y-2">
                {eventStore.getAttendanceForTeam(selectedTeam360.teamId).map(({ session, record }) => (
                  <div key={session.sessionId} className="p-3 rounded-xl bg-[#121220] border border-zinc-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{session.sessionName}</div>
                      <div className="text-[11px] text-zinc-400">
                        {record ? `Checked by ${record.volunteerName || 'Volunteer'} at ${new Date(record.submittedAt).toLocaleTimeString()}` : 'No check-in record'}
                      </div>
                    </div>
                    <div>
                      {record ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-mono font-bold text-[11px]">
                          {record.members.filter(m => m.present).length} / {record.members.length} Present
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 font-mono text-[11px]">
                          Unrecorded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Round Marks & Normalization */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase">Evaluation Marks (Round 1–3)</div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(rnd => {
                  const marks = eventStore.getReviewMarksForTeam(selectedTeam360.teamId).filter(m => m.round === rnd);
                  const norm = normalizedScores.find(n => n.round === rnd && n.teamId === selectedTeam360.teamId);
                  return (
                    <div key={rnd} className="p-3 rounded-xl bg-[#121220] border border-zinc-800 text-xs text-center space-y-1">
                      <div className="font-mono text-[10px] text-zinc-400">ROUND {rnd}</div>
                      <div className="text-lg font-black text-amber-400">{marks[0]?.rawScore ?? '--'} <span className="text-xs text-zinc-500">/ 100</span></div>
                      <div className="text-[10px] font-mono text-emerald-400">
                        Norm: {norm?.normalizedScore ?? '--'}
                      </div>
                      {rnd === 2 && marks[0]?.memberScores && marks[0].memberScores.length > 0 && (
                        <div className="pt-1.5 border-t border-zinc-800/80 text-[9px] text-zinc-400 font-mono text-left space-y-0.5">
                          {marks[0].memberScores.map(ms => (
                            <div key={ms.memberId} className="flex justify-between items-center text-zinc-300">
                              <span className="truncate max-w-[80px]">{ms.name.split(' ')[0]}:</span>
                              <span className="text-amber-400 font-bold">{ms.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  eventStore.adminResetDeviceSession(currentUser?.uid || 'admin', currentUser?.email || 'admin', selectedTeam360.teamId);
                  showNotification('success', `Reset device session for ${selectedTeam360.teamId}`);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                Reset Device Session
              </button>
              <button
                onClick={() => setSelectedTeam360(null)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ASSIGN PS MODAL */}
      {assignPSModalTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setAssignPSModalTeam(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c0c16] border border-zinc-800 p-6 space-y-4 z-10 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display">
              Assign Problem Statement to {assignPSModalTeam.teamId}
            </h3>
            <p className="text-xs text-zinc-400">
              Select an available problem statement (max 2 teams capacity) or unassign.
            </p>

            <select
              defaultValue={assignPSModalTeam.problemStatementId || ''}
              id="ps-assign-select"
              className="w-full px-3 py-2.5 rounded-xl bg-[#141424] border border-zinc-700 text-xs text-white outline-none"
            >
              <option value="">-- No Problem Statement (Unassigned) --</option>
              {problemStatements.map(p => {
                const alloc = eventStore.getAllocations()[p.problemStatementId];
                const otherTeams = (alloc?.allocatedTeamIds || []).filter(t => t !== assignPSModalTeam.teamId);
                const count = otherTeams.length;
                const isFull = count >= 2;
                const isCurrentTeamPS = assignPSModalTeam.problemStatementId === p.problemStatementId;

                return (
                  <option
                    key={p.problemStatementId}
                    value={p.problemStatementId}
                    disabled={isFull}
                    className={isFull ? "text-zinc-500 bg-zinc-900" : "text-white"}
                  >
                    {p.problemStatementId} — {p.title.slice(0, 42)}... {isCurrentTeamPS ? '(CURRENTLY ASSIGNED)' : isFull ? '(CAPACITY REACHED - 2/2 TEAMS)' : `(${count}/2 Allocated)`}
                  </option>
                );
              })}
            </select>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setAssignPSModalTeam(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const sel = document.getElementById('ps-assign-select') as HTMLSelectElement;
                  const psId = sel.value || null;
                  const res = eventStore.adminAssignProblemStatement(
                    currentUser?.uid || 'admin',
                    currentUser?.email || 'admin',
                    assignPSModalTeam.teamId,
                    psId
                  );
                  if (res.success) {
                    showNotification('success', `Assigned ${psId || 'NONE'} to ${assignPSModalTeam.teamId}`);
                    setAssignPSModalTeam(null);
                  } else {
                    showNotification('error', res.error || 'Failed to assign problem statement.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN SCORE CORRECTION MODAL (AUDITED) */}
      {scoreCorrectionModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e0e1a] border border-red-800/80 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">ADMIN SCORE CORRECTION</h3>
                <p className="text-[11px] font-mono text-zinc-400">Audited modification • Auto-recalculates Min/Max & Normalization</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121222] border border-zinc-800 text-xs font-mono space-y-1">
              <div>Round: <strong className="text-red-400">ROUND 0{scoreCorrectionModal.round}</strong></div>
              <div>Team: <strong className="text-white">{scoreCorrectionModal.teamId}</strong></div>
              <div>Reviewer: <span className="text-zinc-300">{scoreCorrectionModal.reviewerName}</span></div>
              <div>Current Raw Score: <span className="text-amber-400 font-bold">{scoreCorrectionModal.oldScore} / 100</span></div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!scoreCorrectionModal.reason.trim()) {
                  showNotification('error', 'Reason for score change is strictly required.');
                  return;
                }
                const res = eventStore.adminUpdateReviewMark(
                  currentUser?.uid || 'admin',
                  currentUser?.email || 'admin',
                  scoreCorrectionModal.round,
                  scoreCorrectionModal.teamId,
                  scoreCorrectionModal.reviewerUid,
                  scoreCorrectionModal.newScore,
                  scoreCorrectionModal.reason.trim()
                );
                if (res.success) {
                  showNotification('success', `Score updated to ${scoreCorrectionModal.newScore} for ${scoreCorrectionModal.teamId}. Min/Max & Normalization recalculated.`);
                  setScoreCorrectionModal(null);
                } else {
                  showNotification('error', res.error || 'Failed to update score.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                  New Raw Score (0–100) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={scoreCorrectionModal.newScore}
                  onChange={(e) => setScoreCorrectionModal({ ...scoreCorrectionModal, newScore: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-sm font-mono text-white outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 font-bold mb-1">
                  Reason for Modification <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Jury tabulation reconciliation / verified with jury panel lead"
                  value={scoreCorrectionModal.reason}
                  onChange={(e) => setScoreCorrectionModal({ ...scoreCorrectionModal, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScoreCorrectionModal(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson"
                >
                  Commit & Auto-Normalize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (VOLUNTEERS & REVIEWERS) */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeleteConfirmModal(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#0e0e1a] border border-rose-900/60 p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  Remove {deleteConfirmModal.type === 'volunteer' ? 'Volunteer Marshal' : 'Jury Reviewer'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">This action will immediately revoke all access permissions.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141424] border border-zinc-800/80 space-y-2">
              <div className="text-xs text-zinc-300">
                Name: <strong className="text-white">{deleteConfirmModal.name}</strong>
              </div>
              <div className="text-xs text-zinc-300 font-mono">
                Email: <span className="text-red-400">{deleteConfirmModal.email}</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                {deleteConfirmModal.type === 'volunteer'
                  ? 'They will no longer be able to access the QR attendance scanner station.'
                  : 'They will no longer be able to log in to evaluate teams or submit rubric marks.'}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmModal.type === 'volunteer') {
                    const res = eventStore.deleteVolunteer(
                      currentUser?.uid || 'admin',
                      currentUser?.email || 'admin',
                      deleteConfirmModal.uid
                    );
                    if (res.success) {
                      showNotification('success', `Removed volunteer marshal ${deleteConfirmModal.name}`);
                    } else {
                      showNotification('error', res.error || 'Failed to delete volunteer.');
                    }
                  } else {
                    const res = eventStore.deleteReviewer(
                      currentUser?.uid || 'admin',
                      currentUser?.email || 'admin',
                      deleteConfirmModal.uid
                    );
                    if (res.success) {
                      showNotification('success', `Removed jury reviewer ${deleteConfirmModal.name}`);
                    } else {
                      showNotification('error', res.error || 'Failed to delete reviewer.');
                    }
                  }
                  setDeleteConfirmModal(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-glow-crimson flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Problem Statement 360 Drawer */}
      <ProblemStatementDrawer
        problem={selectedPSForDrawer}
        allocation={selectedPSForDrawer ? allocations[selectedPSForDrawer.problemStatementId] : undefined}
        isOpen={!!selectedPSForDrawer}
        onClose={() => setSelectedPSForDrawer(null)}
      />

    </div>
  );
};
