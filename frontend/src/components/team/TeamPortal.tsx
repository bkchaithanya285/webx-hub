import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Team, ProblemStatement, ProblemStatementAllocation, SelectionSettings, AttendanceSession, AttendanceRecord, ReviewMark } from '../../types';
import { eventStore } from '../../services/store';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  QrCode,
  FileCode2,
  CalendarCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Smartphone,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProblemSelectionConfirmModal } from './ProblemSelectionConfirmModal';

interface TeamProblemSelectionTabProps {
  team: Team;
  problemStatements: ProblemStatement[];
  allocations: Record<string, ProblemStatementAllocation>;
  selectionSettings: SelectionSettings;
  onOpenPSDrawer: (ps: ProblemStatement) => void;
  onSelectPS: (ps: ProblemStatement) => void;
  selectingPSId: string | null;
}

const TeamProblemSelectionTab: React.FC<TeamProblemSelectionTabProps> = React.memo(({
  team,
  problemStatements,
  allocations,
  selectionSettings,
  onOpenPSDrawer,
  onSelectPS,
  selectingPSId
}) => {
  const [nowTime, setNowTime] = useState(Date.now());
  const [searchPS, setSearchPS] = useState('');

  // Real-time ticking clock ONLY runs when selection tab is open
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const status = selectionSettings.status;
  const isNotReleased = status === 'NOT_RELEASED' || status === 'DRAFT';
  const isLocked = status === 'LOCKED';
  const isClosed = status === 'CLOSED';
  const isUnlocked = status === 'UNLOCKED' || status === 'LIVE' || status === 'RELEASED';

  const unlockTimestamp = selectionSettings.unlockAt ? new Date(selectionSettings.unlockAt).getTime() : 0;
  const isLockedWithTimer = isLocked && unlockTimestamp > 0;
  const unlockDiffSec = Math.max(0, Math.floor((unlockTimestamp - nowTime) / 1000));
  const unlockMins = Math.floor(unlockDiffSec / 60).toString().padStart(2, '0');
  const unlockSecs = (unlockDiffSec % 60).toString().padStart(2, '0');

  // Trigger automatic unlock check if timer reaches 0
  useEffect(() => {
    if (isLockedWithTimer && nowTime >= unlockTimestamp) {
      eventStore.getSelectionSettings(); // Promotes state in store and broadcasts update to all team leads
    }
  }, [nowTime, isLockedWithTimer, unlockTimestamp]);

  // Memoized search filtering for zero lag
  const filteredPS = useMemo(() => {
    if (!searchPS.trim()) return problemStatements;
    const q = searchPS.toLowerCase().trim();
    return problemStatements.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.problemStatementId.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [problemStatements, searchPS]);

  // 1. STATE: NOT RELEASED
  if (isNotReleased) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="p-10 md:p-14 rounded-3xl bg-[#0c0c16] border border-zinc-800 text-center max-w-lg space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
              STATUS: NOT RELEASED
            </span>
            <h2 className="text-2xl font-black font-display text-white">
              Problem Statements Not Released Yet
            </h2>
            <p className="text-xs text-zinc-400 font-light leading-relaxed max-w-sm mx-auto">
              The Problem Statements will become available once the Admin releases them.
            </p>
          </div>
          <div className="pt-2 text-[11px] font-mono text-zinc-500">
            Real-time listener active • Screen will auto-update when released.
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE: TEAM HAS ALREADY SELECTED A PROBLEM STATEMENT
  if (team.problemStatementId) {
    const selectedPS = eventStore.getProblemStatement(team.problemStatementId);
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-[#0a1811] to-[#0c0c16] border-2 border-emerald-600 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 border border-emerald-700 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                OFFICIALLY ALLOCATED & LOCKED
              </span>
              <h2 className="text-xl font-black text-white font-display">
                Your Challenge: {team.problemStatementId}
              </h2>
              <p className="text-xs text-zinc-300 font-mono">
                Selection is locked and confirmed. No other problem statements are available for your squad.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {selectedPS && (
              <button
                onClick={() => onOpenPSDrawer(selectedPS)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
              >
                VIEW FULL SPECS
              </button>
            )}
          </div>
        </div>

        {/* Full Details Card */}
        {selectedPS && (
          <div className="rounded-3xl bg-[#0c0c16] border border-zinc-800 p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-red-950/90 border border-red-800 font-mono text-sm font-black text-red-400">
                  {selectedPS.problemStatementId}
                </span>
                <span className="px-3 py-1 rounded-xl bg-zinc-800 font-mono text-xs text-zinc-300">
                  {selectedPS.category}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-semibold">
                ✓ ALLOCATION LOCKED FOR {team.teamId}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-black font-display text-white">
                {selectedPS.title}
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed font-light">
                {selectedPS.shortDescription}
              </p>
            </div>

            {/* Objective & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {selectedPS.objective && (
                <div className="p-4 rounded-2xl bg-[#121222] border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-red-400 font-mono uppercase tracking-wider">
                    Core Objective
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    {selectedPS.objective}
                  </p>
                </div>
              )}
              {selectedPS.background && (
                <div className="p-4 rounded-2xl bg-[#121222] border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                    Problem Background
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    {selectedPS.background}
                  </p>
                </div>
              )}
            </div>

            {/* Technical Requirements */}
            {selectedPS.technicalRequirements && selectedPS.technicalRequirements.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Key Technical Requirements
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPS.technicalRequirements.map((req, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#11111e] border border-zinc-800 text-xs text-zinc-300 flex items-start space-x-2">
                      <span className="text-red-400 font-mono font-bold">•</span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. STATES: RELEASED / LOCKED / UNLOCKED / CLOSED
  const canSelectGlobally = isUnlocked && !isClosed;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-display text-white">
            Problem Statements Selection
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Backend enforced • Max 2 teams capacity per challenge.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchPS}
            onChange={(e) => setSearchPS(e.target.value)}
            placeholder="Search PS ID, title, or category..."
            className="w-full px-4 py-2 rounded-xl bg-[#11111e] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* SYNCHRONIZED STATUS BANNER */}
      {isLocked && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/80 via-[#191110] to-[#0c0c16] border-2 border-amber-600/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 font-bold">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-900 text-amber-200 border border-amber-700">
                  PROBLEM STATEMENTS LOCKED
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Problem Statement Selection is currently locked.
              </h3>
              <p className="text-xs text-zinc-300 font-light">
                You can view the Problem Statements but cannot select until unlocked.
              </p>
            </div>
          </div>

          {isLockedWithTimer && (
            <div className="flex flex-col items-center md:items-end space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                Unlocks in
              </span>
              <div className="flex items-center space-x-2 font-mono">
                <div className="px-3.5 py-2 rounded-2xl bg-black/80 border border-amber-900/80 text-center min-w-[54px]">
                  <span className="text-2xl font-black text-amber-300">{unlockMins}</span>
                  <span className="block text-[8px] text-zinc-500 uppercase font-sans">Mins</span>
                </div>
                <span className="text-amber-500 font-bold text-xl">:</span>
                <div className="px-3.5 py-2 rounded-2xl bg-black/80 border border-amber-900/80 text-center min-w-[54px]">
                  <span className="text-2xl font-black text-amber-300">{unlockSecs}</span>
                  <span className="block text-[8px] text-zinc-500 uppercase font-sans">Secs</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isUnlocked && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-[#0d1612] to-[#0c0c16] border border-emerald-800/80 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                ⚡ SELECTION OPEN
              </span>
              <h3 className="text-sm font-bold text-white mt-1">
                Problem Selection is now open.
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Select your challenge before the capacity slots fill up!
              </p>
            </div>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/70 via-[#160d10] to-[#0c0c16] border border-rose-800/80 shadow-xl flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-rose-950 text-rose-400 border border-rose-800">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-900/60 text-rose-300 border border-rose-700">
              SELECTION CLOSED
            </span>
            <h3 className="text-sm font-bold text-white mt-1">
              Problem Statement selection is currently closed.
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              All problem allocations are finalized and frozen.
            </p>
          </div>
        </div>
      )}

      {team.problemStatementId && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Your team has locked <strong>{team.problemStatementId}</strong> ({eventStore.getProblemStatement(team.problemStatementId)?.title}).
            </span>
          </div>
        </div>
      )}

      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPS.map(ps => {
          const alloc = allocations[ps.problemStatementId];
          const count = alloc?.currentTeamCount || 0;
          const max = ps.maximumTeams || 2;
          const isFull = count >= max;
          const isSelectedByThisTeam = team.problemStatementId === ps.problemStatementId;
          const hasAnotherSelection = team.problemStatementId && !isSelectedByThisTeam;
          const canSelect = canSelectGlobally && !isFull && !hasAnotherSelection && !isSelectedByThisTeam;

          return (
            <div
              key={ps.problemStatementId}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isSelectedByThisTeam
                  ? 'bg-[#150e18] border-emerald-500 shadow-glow-subtle'
                  : isFull
                  ? 'bg-[#090910] border-zinc-800/60 opacity-75'
                  : 'bg-[#0c0c16] border-zinc-800 hover:border-red-600/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-red-950/80 border border-red-800/60 font-mono text-xs font-bold text-red-400">
                    {ps.problemStatementId}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                    isSelectedByThisTeam
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : isFull
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {isSelectedByThisTeam ? 'YOUR SELECTION' : `${count}/${max} Slots • ${isFull ? 'FULL' : 'OPEN'}`}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-zinc-500 uppercase">{ps.category}</div>
                <h3 className="text-base font-bold text-white font-display line-clamp-2">{ps.title}</h3>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed font-light">{ps.shortDescription}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenPSDrawer(ps)}
                  className="text-xs font-mono text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Details
                </button>

                {isSelectedByThisTeam ? (
                  <span className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                    ✓ Selected
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectPS(ps)}
                    disabled={!canSelect || selectingPSId === ps.problemStatementId}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      !canSelect
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-crimson cursor-pointer'
                    }`}
                  >
                    {selectingPSId === ps.problemStatementId
                      ? 'Selecting...'
                      : isLocked
                      ? isLockedWithTimer ? `Unlocks in ${unlockMins}:${unlockSecs}` : 'Selection Locked'
                      : isClosed
                      ? 'Closed'
                      : isFull
                      ? 'Full'
                      : 'Select & Review'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface TeamPortalProps {
  onOpenPSDrawer: (ps: ProblemStatement) => void;
}

export const TeamPortal: React.FC<TeamPortalProps> = ({ onOpenPSDrawer }) => {
  const { currentUser } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [allocations, setAllocations] = useState(eventStore.getAllocations());
  const [selectionSettings, setSelectionSettings] = useState(eventStore.getSelectionSettings());
  const [activeTab, setActiveTab] = useState<'overview' | 'select_ps' | 'attendance' | 'reviews'>('overview');
  const [selectingPSId, setSelectingPSId] = useState<string | null>(null);
  const [confirmingPS, setConfirmingPS] = useState<ProblemStatement | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<{ session: AttendanceSession; record?: AttendanceRecord }[]>(
    currentUser?.teamId ? eventStore.getAttendanceForTeam(currentUser.teamId) : []
  );

  useEffect(() => {
    const update = () => {
      if (currentUser?.teamId) {
        const t = eventStore.getTeam(currentUser.teamId);
        setTeam(t || null);
        setAttendanceHistory(eventStore.getAttendanceForTeam(currentUser.teamId));
      }
      setProblemStatements(eventStore.getProblemStatements());
      setAllocations(eventStore.getAllocations());
      setSelectionSettings(eventStore.getSelectionSettings());
    };
    update();
    return eventStore.subscribe(update);
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'team_lead' || !team) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="p-8 rounded-2xl bg-[#0e0e18] border border-red-900/40 text-center max-w-md space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-xl font-bold text-white">Team Lead Authentication Required</h2>
          <p className="text-xs text-zinc-400">
            Please log in with your assigned Team ID (<code className="text-red-400">WEB-001</code> to <code className="text-red-400">WEB-060</code>) and your Team Lead Registration Number password.
          </p>
        </div>
      </div>
    );
  }

  const isNotReleased = selectionSettings.releaseState === 'NOT_RELEASED' || selectionSettings.status === 'NOT_RELEASED' || selectionSettings.status === 'DRAFT';
  const selectedPS = team.problemStatementId ? eventStore.getProblemStatement(team.problemStatementId) : null;
  const reviewMarks = eventStore.getReviewMarksForTeam(team.teamId);

  // Review Statuses
  const r1Completed = reviewMarks.some(m => m.round === 1);
  const r2Completed = reviewMarks.some(m => m.round === 2);
  const r3Completed = reviewMarks.some(m => m.round === 3);

  const handleOpenConfirmModal = (ps: ProblemStatement) => {
    setConfirmingPS(ps);
  };

  const handleCommitSelectPS = (psId: string) => {
    setErrorNotice(null);
    setSuccessNotice(null);
    setSelectingPSId(psId);

    const res = eventStore.selectProblemStatement(team.teamId, psId, currentUser.uid);
    setSelectingPSId(null);
    setConfirmingPS(null);

    if (!res.success) {
      setErrorNotice(res.error || "Failed to select problem statement.");
    } else {
      setSuccessNotice(`Successfully selected problem statement ${psId}! Allocation locked.`);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen bg-[#07070e] text-[#f1f1f5] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Team Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1b0a16] via-[#0d0d18] to-[#0a0a14] border border-red-900/40 p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-lg bg-red-950/90 border border-red-800/80 font-mono text-xs font-bold text-red-400">
                {team.teamId}
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-semibold">
                ✓ Verified Squad
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black font-display text-white">
              {team.teamName}
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              Team Lead: <span className="text-white font-semibold">{currentUser.name}</span> (Reg: {team.teamLeadRegNo})
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-[#121222] border border-[#271a2d]">
            {[
              { id: 'overview', label: 'Overview & QR', icon: QrCode },
              {
                id: 'select_ps',
                label: 'Problem Selection',
                icon: FileCode2,
                badge: team.problemStatementId
                  ? 'Locked'
                  : selectionSettings.status === 'NOT_RELEASED' || selectionSettings.status === 'DRAFT'
                  ? 'Unreleased'
                  : selectionSettings.status === 'LOCKED'
                  ? 'Locked'
                  : selectionSettings.status === 'CLOSED'
                  ? 'Closed'
                  : 'LIVE',
                badgeColor: team.problemStatementId
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : selectionSettings.status === 'NOT_RELEASED' || selectionSettings.status === 'DRAFT'
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  : selectionSettings.status === 'LOCKED'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : selectionSettings.status === 'CLOSED'
                  ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  : 'bg-red-950 text-red-300 border-red-800 animate-pulse'
              },
              {
                id: 'attendance',
                label: 'Attendance',
                icon: CalendarCheck,
                badge: attendanceHistory.some(h => h.session.status === 'ACTIVE' || h.session.status === 'active') ? 'LIVE' : undefined,
                badgeColor: 'bg-red-950 text-red-300 border-red-800 animate-pulse'
              },
              { id: 'reviews', label: 'Review Status', icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-subtle'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold border ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorNotice && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-between animate-shake">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 1. OVERVIEW & TEAM QR SECTION */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* QR Code & Attendance Instruction */}
          <div className="lg:col-span-1 rounded-3xl bg-[#0d0d18] border border-red-900/40 p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-xl">
            <div className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold">
              OFFICIAL TEAM IDENTITY QR
            </div>

            {/* Generated QR Code */}
            <div className="p-5 rounded-2xl bg-white shadow-2xl border-4 border-red-600/30">
              <QRCodeSVG
                value={`WEBX:TEAM:${team.teamId}:TOKEN:${team.qrTokenHash}`}
                size={210}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                USE THIS QR DURING ATTENDANCE
              </div>
              <p className="text-[11px] text-zinc-400 font-light max-w-xs">
                Present this screen to volunteer marshals during morning and evening attendance sessions for instant verification.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-500">
              <Smartphone className="w-3.5 h-3.5 text-red-400" />
              <span>Session Locked to Active Device</span>
            </div>
          </div>

          {/* Team Roster & Assigned Problem Statement */}
          <div className="lg:col-span-2 space-y-6">

            {/* Live Check-in Checkpoint Alert Banner on Overview */}
            {attendanceHistory.filter(h => h.session.status === 'ACTIVE' || h.session.status === 'active').map(({ session, record }) => (
              <div key={session.sessionId} className="p-5 rounded-3xl bg-gradient-to-r from-red-950/90 via-[#180a14] to-[#0c0c16] border-2 border-red-600 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-900/80 border border-red-700 flex items-center justify-center text-red-300">
                    <CalendarCheck className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900 text-red-200 border border-red-700">
                        ⚡ LIVE ATTENDANCE CHECKPOINT
                      </span>
                      <span className="text-xs font-bold text-white font-mono">{session.sessionId}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5">{session.name || session.sessionName}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">Present your Team QR to volunteer marshals to verify attendance.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-lg transition-all"
                >
                  View Attendance Status →
                </button>
              </div>
            ))}
            
            {/* Assigned Problem Statement Summary Card */}
            <div className="rounded-3xl bg-[#0d0d18] border border-zinc-800 p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  ALLOCATED CHALLENGE
                </div>
                {isNotReleased ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-mono font-semibold">
                    STATUS: NOT RELEASED
                  </span>
                ) : selectedPS ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[11px] font-mono font-semibold">
                    ✓ LOCKED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 text-[11px] font-mono font-semibold">
                    SELECTION PENDING
                  </span>
                )}
              </div>

              {isNotReleased ? (
                <div className="p-6 rounded-2xl bg-[#121220] border border-zinc-800/80 text-center space-y-3">
                  <Lock className="w-10 h-10 text-zinc-500 mx-auto" />
                  <div className="text-sm font-bold text-white">Problem Statements Not Released Yet</div>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto font-light leading-relaxed">
                    Problem Statements have not been released yet. The challenges and specifications will become accessible once released by the Admin.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-zinc-500">
                    Real-time listener active • Screen will auto-update when released.
                  </div>
                </div>
              ) : selectedPS ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded bg-red-950 text-red-400 font-mono text-xs font-bold">
                      {selectedPS.problemStatementId}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{selectedPS.category}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white font-display">
                    {selectedPS.title}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    {selectedPS.shortDescription}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => onOpenPSDrawer(selectedPS)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Problem Specifications & Requirements</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#121220] border border-zinc-800/80 text-center space-y-3">
                  <FileCode2 className="w-10 h-10 text-red-400 mx-auto" />
                  <div className="text-sm font-bold text-white">
                    {selectionSettings.status === 'LOCKED'
                      ? 'Problem Statements Released (Selection Locked)'
                      : selectionSettings.status === 'CLOSED'
                      ? 'Problem Statement Selection Closed'
                      : 'Problem Statements Released — Selection Open!'}
                  </div>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto font-light">
                    {selectionSettings.status === 'LOCKED'
                      ? 'Review the 30 challenges and specifications now. Selection will unlock shortly.'
                      : selectionSettings.status === 'CLOSED'
                      ? 'Selection window has concluded. View problem statements and specs below.'
                      : 'Head to the Problem Selection tab to select one of the 30 challenges. Max 2 teams capacity.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('select_ps')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-crimson cursor-pointer transition-all"
                  >
                    VIEW PROBLEM STATEMENTS
                  </button>
                </div>
              )}
            </div>

            {/* Team Members List */}
            <div className="rounded-3xl bg-[#0d0d18] border border-zinc-800 p-6 md:p-8 space-y-4">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                TEAM SQUAD MEMBERS ({team.members.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {team.members.map(member => (
                  <div
                    key={member.memberId}
                    className="p-4 rounded-2xl bg-[#121222] border border-zinc-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{member.name}</span>
                      {member.isTeamLead && (
                        <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800/60 text-red-400 text-[10px] font-mono font-bold">
                          LEAD
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      Reg No: {member.registrationNumber}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-light truncate">
                      {member.email} • {member.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. PROBLEM STATEMENT SELECTION TAB */}
      {activeTab === 'select_ps' && (
        <TeamProblemSelectionTab
          team={team}
          problemStatements={problemStatements}
          allocations={allocations}
          selectionSettings={selectionSettings}
          onOpenPSDrawer={onOpenPSDrawer}
          onSelectPS={handleOpenConfirmModal}
          selectingPSId={selectingPSId}
        />
      )}

      {/* 3. TEAM ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black font-display text-white">Team Attendance Telemetry</h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Official attendance records for {team.teamId} ({team.teamName}). Read-only live telemetry.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Only authorized volunteers can mark attendance
            </span>
          </div>

          <div className="space-y-4">
            {attendanceHistory.length === 0 ? (
              <div className="p-10 rounded-3xl bg-[#0c0c16] border border-zinc-800 text-center space-y-2">
                <CalendarCheck className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-zinc-300">No Attendance Checkpoints Yet</h3>
                <p className="text-xs text-zinc-500">Attendance sessions created by event organizers will display here.</p>
              </div>
            ) : (
              attendanceHistory.map(({ session, record }) => {
                let teamStatus: 'PRESENT' | 'PARTIAL' | 'ABSENT' | 'NOT MARKED' = 'NOT MARKED';
                let presentCount = 0;
                const total = team.members.length;

                if (record && record.submitted && Array.isArray(record.members)) {
                  presentCount = record.members.filter(m => m.status === 'PRESENT' || m.present).length;
                  if (presentCount === total) teamStatus = 'PRESENT';
                  else if (presentCount === 0) teamStatus = 'ABSENT';
                  else teamStatus = 'PARTIAL';
                }

                return (
                  <div
                    key={session.sessionId}
                    className="p-6 rounded-3xl bg-[#0c0c16] border border-zinc-800 space-y-4 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 font-mono text-xs font-bold border border-red-800/80">
                            {session.sessionId}
                          </span>
                          <h3 className="text-lg font-bold text-white font-display">
                            {session.name || session.sessionName}
                          </h3>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          {session.date} • {session.startTime} {session.endTime ? `- ${session.endTime}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                          teamStatus === 'PRESENT'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : teamStatus === 'PARTIAL'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : teamStatus === 'ABSENT'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {teamStatus} {teamStatus !== 'NOT MARKED' ? `(${presentCount}/${total})` : ''}
                        </span>
                      </div>
                    </div>

                    {record && record.submitted ? (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {team.members.map(tm => {
                            const recMem = record.members.find(m => m.memberId === tm.memberId);
                            const isP = recMem?.status === 'PRESENT' || recMem?.present === true;

                            return (
                              <div
                                key={tm.memberId}
                                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                                  isP
                                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                                    : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-white">{tm.name}</div>
                                  <div className="text-[10px] font-mono text-zinc-400">Reg: {tm.registrationNumber}</div>
                                </div>
                                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isP ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                                }`}>
                                  {isP ? 'PRESENT' : 'ABSENT'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-[11px] font-mono text-zinc-500 pt-1 flex items-center justify-between">
                          <span>Verified at {record.submittedAt ? new Date(record.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Checkpoint'}</span>
                          <span>Marked by Volunteer Marshal</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-[#121222] border border-zinc-800 text-xs text-zinc-400 font-mono">
                        {session.status === 'ACTIVE' || session.status === 'active'
                          ? '⚡ Check-in checkpoint is currently LIVE. Please have your Team QR scanned by a volunteer marshal.'
                          : 'No attendance submission was recorded for this session.'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. 3-ROUND REVIEW STATUS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black font-display text-white">Review Rounds Evaluation Status</h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Live progression across all 3 jury rounds. Detailed marks are withheld until final valedictory per event privacy policy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { round: 1, title: "Round 1: Ideation & Architecture", completed: r1Completed, desc: "Problem breakdown, system architecture, database schema, and technical roadmap." },
              { round: 2, title: "Round 2: Mid-Way Implementation", completed: r2Completed, desc: "Working prototype, core API integrations, responsive UX, and edge cases." },
              { round: 3, title: "Round 3: Final Demo & Pitch", completed: r3Completed, desc: "Full end-to-end product demonstration, business impact, and jury Q&A." }
            ].map(r => (
              <div
                key={r.round}
                className={`p-6 rounded-3xl border space-y-4 flex flex-col justify-between ${
                  r.completed
                    ? 'bg-[#0f1814] border-emerald-600/50 shadow-glow-subtle'
                    : 'bg-[#0c0c16] border-zinc-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-red-950 text-red-400 font-mono text-xs font-bold">
                      ROUND 0{r.round}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      r.completed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {r.completed ? '✓ COMPLETED' : 'PENDING EVALUATION'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-display">{r.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{r.desc}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
                  {r.completed ? 'Jury evaluation submitted and locked.' : 'Awaiting reviewer evaluation.'}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 2-Step Problem Selection Spotlight Confirmation Modal */}
      <ProblemSelectionConfirmModal
        isOpen={!!confirmingPS}
        problem={confirmingPS}
        team={team}
        currentSlotCount={confirmingPS ? (allocations[confirmingPS.problemStatementId]?.currentTeamCount || 0) : 0}
        maxSlotCount={confirmingPS?.maximumTeams || 2}
        onClose={() => setConfirmingPS(null)}
        onConfirm={handleCommitSelectPS}
        isLoading={selectingPSId === confirmingPS?.problemStatementId}
      />

    </div>
  );
};
