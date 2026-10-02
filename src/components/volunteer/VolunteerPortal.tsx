import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceSession, Team, AttendanceRecord } from '../../types';
import { eventStore } from '../../services/store';
import {
  QrCode,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Search,
  Camera,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const VolunteerPortal: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(
    eventStore.getActiveAttendanceSession()
  );
  const [scannedInput, setScannedInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | undefined>(undefined);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [scannerActive, setScannerActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    teamId: string;
    teamName: string;
    sessionName: string;
    submittedAt: string;
    presentCount: number;
    totalCount: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const session = eventStore.getActiveAttendanceSession();
      setActiveSession(session);
    };
    update();
    return eventStore.subscribe(update);
  }, []);

  // HTML5 QR Scanner
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (scannerActive && activeSession) {
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader-volunteer",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        scanner.render(
          (decodedText) => {
            // Parse payload: "WEBX:TEAM:WEB-023:TOKEN:xxx" or raw "WEB-023"
            let teamId = decodedText.trim();
            if (decodedText.includes('WEBX:TEAM:')) {
              const parts = decodedText.split(':');
              teamId = parts[2] || decodedText;
            }
            handleLoadTeam(teamId);
            setScannerActive(false);
            if (scanner) {
              scanner.clear().catch(() => {});
            }
          },
          (error) => {
            // Ignore scan frame search errors
          }
        );
      } catch (err) {
        console.error("Scanner init error:", err);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [scannerActive, activeSession]);

  const handleLoadTeam = (teamIdInput: string) => {
    setFeedback(null);
    setSubmittedReceipt(null);

    const cleanId = teamIdInput.trim().toUpperCase();
    if (!cleanId) {
      setFeedback({ type: 'error', message: 'Please provide a valid Team ID or scan a QR code.' });
      return;
    }

    const currentLiveSession = eventStore.getActiveAttendanceSession();
    if (!currentLiveSession) {
      setFeedback({ type: 'error', message: 'No attendance session is currently active. Scanning is disabled.' });
      return;
    }

    const t = eventStore.getTeam(cleanId);
    if (!t) {
      setFeedback({ type: 'error', message: `Team "${cleanId}" does not exist in the WEBX registry.` });
      return;
    }

    // Check existing record
    const rec = eventStore.getAttendanceRecord(currentLiveSession.sessionId, t.teamId);
    setSelectedTeam(t);
    setScannedInput(cleanId);
    setExistingRecord(rec);

    if (rec && rec.submitted) {
      setFeedback({
        type: 'error',
        message: `Attendance for Team ${t.teamId} (${t.teamName}) has already been submitted and is locked.`
      });
      // Populate member status from record
      const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
      t.members.forEach(m => {
        const found = rec.members.find(rm => rm.memberId === m.memberId);
        initial[m.memberId] = found?.status || (found?.present ? 'PRESENT' : 'ABSENT');
      });
      setMemberStatuses(initial);
    } else {
      // Do NOT automatically mark everyone present as per requirement
      // Initialize with unselected / individual state
      const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
      t.members.forEach(m => {
        initial[m.memberId] = 'PRESENT'; // default toggle choice
      });
      setMemberStatuses(initial);
    }
  };

  const setMemberStatus = (memberId: string, status: 'PRESENT' | 'ABSENT') => {
    if (existingRecord?.submitted) return; // Locked
    setMemberStatuses(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

  const handleSubmitAttendance = () => {
    const liveSession = eventStore.getActiveAttendanceSession();
    if (!liveSession || !selectedTeam) {
      setFeedback({ type: 'error', message: 'Active session or team is not available.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const memberPayload = selectedTeam.members.map(m => ({
      memberId: m.memberId,
      name: m.name,
      registrationNumber: m.registrationNumber,
      status: memberStatuses[m.memberId] || 'PRESENT',
      present: (memberStatuses[m.memberId] || 'PRESENT') === 'PRESENT',
      markedAt: new Date().toISOString()
    }));

    const res = eventStore.submitAttendance(
      currentUser?.uid || 'vol-uid',
      currentUser?.name || currentUser?.email || 'Volunteer Marshal',
      liveSession.sessionId,
      selectedTeam.teamId,
      memberPayload
    );

    setIsSubmitting(false);

    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to submit attendance.' });
    } else {
      const rec = eventStore.getAttendanceRecord(liveSession.sessionId, selectedTeam.teamId);
      setExistingRecord(rec);

      const pCount = Object.values(memberStatuses).filter(s => s === 'PRESENT').length;
      const submittedTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      setSubmittedReceipt({
        teamId: selectedTeam.teamId,
        teamName: selectedTeam.teamName,
        sessionName: liveSession.name || liveSession.sessionName,
        submittedAt: submittedTimeStr,
        presentCount: pCount,
        totalCount: selectedTeam.members.length
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-[#f1f1f5] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Volunteer Header */}
      <div className="rounded-3xl bg-[#0c0c16] border border-red-900/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-glow-crimson">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
              VOLUNTEER ATTENDANCE SCANNER
            </div>
            <h1 className="text-2xl font-black font-display text-white">
              Field Attendance Station
            </h1>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs font-mono text-zinc-400">
            Marshal: <strong className="text-white">{currentUser?.name || currentUser?.email || 'Volunteer'}</strong>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center sm:justify-end space-x-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span>Authorized Field Marshal</span>
          </div>
        </div>
      </div>

      {/* ACTIVE SESSION STATUS CARD */}
      {activeSession ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0e0e1a] to-[#0c0c16] border border-emerald-800/70 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  ACTIVE ATTENDANCE
                </span>
                <h2 className="text-xl font-black text-white font-display">
                  {activeSession.name || activeSession.sessionName}
                </h2>
              </div>
            </div>

            <span className="px-3.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-xs font-bold self-start sm:self-auto">
              {activeSession.date} • {activeSession.startTime}
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-zinc-400 font-mono">
              Ready to scan Team QR credentials and record member presence.
            </p>

            <button
              onClick={() => setScannerActive(!scannerActive)}
              className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                scannerActive
                  ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-crimson hover:from-red-500 hover:to-rose-500'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{scannerActive ? 'Close Scanner' : 'SCAN TEAM QR'}</span>
            </button>
          </div>

          {/* QR Camera Viewfinder */}
          {scannerActive && (
            <div className="p-4 rounded-2xl bg-black border border-red-900/60 overflow-hidden mt-4">
              <div id="qr-reader-volunteer" className="w-full max-w-sm mx-auto" />
              <div className="text-center text-[11px] font-mono text-zinc-400 mt-2">
                Point camera at Team Lead's verified QR code badge.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-[#0c0c16] border border-zinc-800 text-center space-y-3 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-200 font-display">
            No attendance session is currently active.
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            The administrator has not opened any attendance session at this time. Please wait for the Admin Control Center to open a session.
          </p>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between border shadow-lg ${
          feedback.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
            : 'bg-rose-950/90 border-rose-700 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Manual Input / Search Bar */}
      {activeSession && (
        <div className="p-5 rounded-3xl bg-[#0c0c16] border border-zinc-800 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            SEARCH OR MANUAL TEAM ID
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={scannedInput}
              onChange={(e) => setScannedInput(e.target.value.toUpperCase())}
              placeholder="e.g. WEB-023"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#121220] border border-zinc-700 text-xs font-mono text-white placeholder-zinc-500 uppercase outline-none focus:border-red-500"
            />
            <button
              onClick={() => handleLoadTeam(scannedInput)}
              className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider"
            >
              Load Team
            </button>
          </div>
        </div>
      )}

      {/* SUCCESSFUL SUBMISSION RECEIPT */}
      {submittedReceipt && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0b2416] via-[#0c1813] to-[#0c0c16] border border-emerald-600/70 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-display">
                ✓ ATTENDANCE SUBMITTED
              </h2>
              <p className="text-xs font-mono text-emerald-400">
                Attendance locked. Cannot be submitted again.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/40 border border-emerald-900/50 text-xs font-mono">
            <div>
              <span className="text-zinc-500 uppercase block text-[10px]">Team</span>
              <strong className="text-white text-sm">{submittedReceipt.teamId}</strong>
            </div>
            <div>
              <span className="text-zinc-500 uppercase block text-[10px]">Team Name</span>
              <strong className="text-white text-sm truncate block">{submittedReceipt.teamName}</strong>
            </div>
            <div>
              <span className="text-zinc-500 uppercase block text-[10px]">Session</span>
              <strong className="text-white text-sm">{submittedReceipt.sessionName}</strong>
            </div>
            <div>
              <span className="text-zinc-500 uppercase block text-[10px]">Submitted At</span>
              <strong className="text-emerald-400 text-sm">{submittedReceipt.submittedAt}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <span>Result: <strong className="text-emerald-400">{submittedReceipt.presentCount} Present</strong>, <strong className="text-rose-400">{submittedReceipt.totalCount - submittedReceipt.presentCount} Absent</strong></span>
            <button
              onClick={() => {
                setSelectedTeam(null);
                setSubmittedReceipt(null);
                setScannedInput('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 text-xs font-bold uppercase"
            >
              Scan Next Team
            </button>
          </div>
        </div>
      )}

      {/* TEAM DETAILS & MEMBER ATTENDANCE MARKING */}
      {selectedTeam && !submittedReceipt && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0c16] border border-red-900/40 space-y-6 shadow-2xl animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 font-mono text-xs font-bold border border-red-800/80">
                  TEAM ID: {selectedTeam.teamId}
                </span>
                <h3 className="text-xl font-bold text-white font-display">
                  {selectedTeam.teamName}
                </h3>
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-1">
                Lead: {selectedTeam.members.find(m => m.isTeamLead)?.name || 'Team Lead'} (Reg: {selectedTeam.teamLeadRegNo})
              </div>
            </div>

            {existingRecord?.submitted && (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center space-x-1.5 self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5" />
                <span>ATTENDANCE ALREADY LOCKED</span>
              </span>
            )}
          </div>

          {/* Members Table */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
              MARK ATTENDANCE FOR ALL MEMBERS ({selectedTeam.members.length} Members)
            </div>

            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-[#10101e]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#121224] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Registration No</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {selectedTeam.members.map(member => {
                    const currentStatus = memberStatuses[member.memberId] || 'PRESENT';
                    const isLocked = !!existingRecord?.submitted;

                    return (
                      <tr key={member.memberId} className="hover:bg-zinc-900/50">
                        <td className="px-4 py-3 font-sans font-semibold text-white">
                          <div className="flex items-center space-x-2">
                            <span>{member.name}</span>
                            {member.isTeamLead && (
                              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-mono">
                                LEAD
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {member.registrationNumber}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => setMemberStatus(member.memberId, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-glow-emerald'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                              } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                              PRESENT
                            </button>
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => setMemberStatus(member.memberId, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-glow-crimson'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                              } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                              ABSENT
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-zinc-400">
              Selected: <strong className="text-emerald-400">{Object.values(memberStatuses).filter(s => s === 'PRESENT').length} Present</strong>, <strong className="text-rose-400">{Object.values(memberStatuses).filter(s => s === 'ABSENT').length} Absent</strong>
            </div>

            {existingRecord?.submitted ? (
              <div className="text-xs font-mono text-zinc-400 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Attendance previously locked on {existingRecord.submittedAt ? new Date(existingRecord.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'file'}</span>
              </div>
            ) : (
              <button
                onClick={handleSubmitAttendance}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-crimson transition-all"
              >
                {isSubmitting ? 'Submitting & Locking...' : 'SUBMIT ATTENDANCE'}
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
