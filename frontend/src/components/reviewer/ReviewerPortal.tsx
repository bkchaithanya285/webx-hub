import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Team, ProblemStatement, ReviewSettings, ReviewMark } from '../../types';
import { eventStore } from '../../services/store';
import {
  Award,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  Sliders,
  FileCode2,
  ArrowRight,
  ShieldCheck,
  EyeOff
} from 'lucide-react';

export const ReviewerPortal: React.FC = () => {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>(eventStore.getTeams());
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(eventStore.getReviewSettings());
  const [reviewMarks, setReviewMarks] = useState<ReviewMark[]>(eventStore.getReviewMarks());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('WEB-001');
  
  // Rubric Scoring State (0-100 total)
  const [innovation, setInnovation] = useState(20); // max 25
  const [techFeasibility, setTechFeasibility] = useState(22); // max 25
  const [uiUxArchitecture, setUiUxArchitecture] = useState(21); // max 25
  const [presentationImpact, setPresentationImpact] = useState(22); // max 25
  const [feedbackNotes, setFeedbackNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const rawTotal = innovation + techFeasibility + uiUxArchitecture + presentationImpact;

  const activeRound = reviewSettings.activeRound || 1;
  const currentTeam = teams.find(t => t.teamId === selectedTeamId) || teams[0];

  useEffect(() => {
    const update = () => {
      setTeams(eventStore.getTeams());
      setReviewSettings(eventStore.getReviewSettings());
      setReviewMarks(eventStore.getReviewMarks());
    };
    update();
    return eventStore.subscribe(update);
  }, []);

  // Evaluated team set for instant O(1) lookups
  const evaluatedTeamIds = useMemo(() => {
    const set = new Set<string>();
    if (!currentUser) return set;
    reviewMarks.forEach(m => {
      if (m.round === activeRound && m.reviewerUid === currentUser.uid) {
        set.add(m.teamId);
      }
    });
    return set;
  }, [reviewMarks, activeRound, currentUser?.uid]);

  // Memoized team filtering for zero typing lag
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase().trim();
    return teams.filter(t => 
      t.teamId.toLowerCase().includes(q) ||
      t.teamName.toLowerCase().includes(q)
    );
  }, [teams, searchQuery]);

  // When team or round changes, load that specific round's marks if already submitted, or reset to fresh rubric
  useEffect(() => {
    if (!currentTeam || !currentUser) return;
    const existing = reviewMarks.find(
      m => m.round === activeRound && m.teamId === currentTeam.teamId && m.reviewerUid === currentUser.uid
    );

    if (existing) {
      setInnovation(existing.rubric?.innovation ?? 20);
      setTechFeasibility(existing.rubric?.technicalFeasibility ?? 20);
      setUiUxArchitecture(existing.rubric?.uiUxArchitecture ?? 20);
      setPresentationImpact(existing.rubric?.presentationImpact ?? 20);
      setFeedbackNotes(existing.feedback || '');
    } else {
      setInnovation(20);
      setTechFeasibility(20);
      setUiUxArchitecture(20);
      setPresentationImpact(20);
      setFeedbackNotes('');
    }
  }, [selectedTeamId, activeRound, currentUser?.uid, reviewMarks]);

  if (!currentUser || currentUser.role !== 'reviewer') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="p-8 rounded-2xl bg-[#0e0e18] border border-red-900/40 text-center max-w-md space-y-4">
          <Award className="w-12 h-12 text-sky-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Reviewer Jury Authentication Required</h2>
          <p className="text-xs text-zinc-400">
            Please authenticate using an admin-authorized reviewer account.
          </p>
        </div>
      </div>
    );
  }

  const roundKey = `round${activeRound}Status` as 'round1Status' | 'round2Status' | 'round3Status';
  const isRoundOpen = reviewSettings[roundKey] === 'OPEN';
  const problemStatement = currentTeam?.problemStatementId ? eventStore.getProblemStatement(currentTeam.problemStatementId) : null;
  
  // Check if this reviewer already submitted marks for this round + team
  const existingMarks = currentTeam ? reviewMarks.find(
    m => m.round === activeRound && m.teamId === currentTeam.teamId && m.reviewerUid === currentUser.uid
  ) : undefined;

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;

    if (!isRoundOpen) {
      setNotice({ type: 'error', message: `Round ${activeRound} is currently CLOSED by the Administrator.` });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    const res = eventStore.submitReviewMarks(
      currentUser.uid,
      currentUser.name,
      activeRound,
      currentTeam.teamId,
      rawTotal,
      {
        innovation,
        technicalFeasibility: techFeasibility,
        uiUxArchitecture,
        presentationImpact
      },
      feedbackNotes
    );

    setSubmitting(false);

    if (!res.success) {
      setNotice({ type: 'error', message: res.error || "Failed to submit marks." });
    } else {
      setNotice({ type: 'success', message: `Evaluation locked for ${currentTeam.teamId}! Total Score: ${rawTotal}/100` });
    }
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-[#f1f1f5] p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#0c0c16] border border-sky-900/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-sky-400 uppercase tracking-widest font-bold">JURY EVALUATION PORTAL</div>
            <h1 className="text-2xl font-black font-display text-white">Reviewer Scoring Station</h1>
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="text-xs font-mono text-zinc-300">
            Jury: <span className="text-white font-bold">{currentUser.name}</span>
          </div>
          <div className="flex items-center space-x-2 justify-end">
            <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
              isRoundOpen
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              ROUND 0{activeRound}: {isRoundOpen ? 'OPEN FOR SCORING' : 'CLOSED BY ADMIN'}
            </span>
          </div>
        </div>
      </div>

      {/* Strict Privacy Assurance Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0d0d16] border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center space-x-2">
        <EyeOff className="w-4 h-4 text-zinc-500 shrink-0" />
        <span>
          Strict Jury Isolation: Peer reviewer marks, previous round scores, normalized rankings, and leaderboard are strictly masked to ensure unbiased scoring.
        </span>
      </div>

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
          <button onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      {/* Main Scoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Team Selector List */}
        <div className="lg:col-span-1 rounded-3xl bg-[#0c0c16] border border-zinc-800 p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
            SELECT TEAM TO EVALUATE
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Team ID or name..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredTeams.map(t => {
              const isSelected = t.teamId === selectedTeamId;
              const hasMarks = evaluatedTeamIds.has(t.teamId);

              return (
                <button
                  key={t.teamId}
                  onClick={() => setSelectedTeamId(t.teamId)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-950/70 border border-red-800/80 shadow-glow-subtle'
                      : 'bg-[#11111e] hover:bg-[#18182a] border border-zinc-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-red-400">{t.teamId}</span>
                      <span className="font-bold text-xs text-white truncate max-w-[130px]">{t.teamName}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      PS: {t.problemStatementId || 'Unassigned'}
                    </div>
                  </div>

                  {hasMarks && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">
                      ✓ EVALUATED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Team Scoring Sheet */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Team & Assigned Problem Summary */}
          {currentTeam && (
            <div className="p-6 rounded-3xl bg-[#0c0c16] border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 font-mono text-xs font-bold">
                      {currentTeam.teamId}
                    </span>
                    <h2 className="text-xl font-black text-white font-display">{currentTeam.teamName}</h2>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    Lead: {currentTeam.members.find(m => m.isTeamLead)?.name} (Reg: {currentTeam.teamLeadRegNo})
                  </div>
                </div>

                {existingMarks && (
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center space-x-1.5 self-start sm:self-auto">
                    <Lock className="w-3.5 h-3.5" />
                    <span>LOCKED: {existingMarks.rawScore} / 100</span>
                  </span>
                )}
              </div>

              {/* Assigned Problem Statement Details */}
              <div className="p-4 rounded-2xl bg-[#121220] border border-zinc-800 space-y-2">
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">
                  ASSIGNED PROBLEM STATEMENT
                </div>
                {problemStatement ? (
                  <div>
                    <div className="text-sm font-bold text-white font-display">{problemStatement.problemStatementId} — {problemStatement.title}</div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{problemStatement.shortDescription}</p>
                    <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                      Category: {problemStatement.category} • Objective: {problemStatement.objective}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">No Problem Statement Assigned</div>
                )}
              </div>

              {/* Team Members List */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Team Members</div>
                <div className="flex flex-wrap gap-2">
                  {currentTeam.members.map(m => (
                    <span key={m.memberId} className="px-2.5 py-1 rounded-lg bg-[#141424] border border-zinc-800 text-xs text-zinc-300 font-mono">
                      {m.name} ({m.registrationNumber})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rubric Evaluation Form */}
          <form onSubmit={handleSubmitScore} className="p-6 md:p-8 rounded-3xl bg-[#0c0c16] border border-red-900/40 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold">ROUND 0{activeRound} EVALUATION RUBRIC</div>
                <h3 className="text-lg font-bold text-white font-display">Marking Matrix (0–100 Scale)</h3>
              </div>

              {/* Large Score Counter Display */}
              <div className="text-right">
                <div className="text-3xl font-black font-display text-amber-400">
                  {rawTotal} <span className="text-sm text-zinc-500 font-normal">/ 100</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400">Total Raw Score</div>
              </div>
            </div>

            {/* 4 Rubric Sliders */}
            <div className="space-y-5">
              
              {/* Pillar 1: Innovation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">1. Innovation & Novelty (Max 25)</span>
                  <span className="font-mono font-bold text-amber-400">{innovation} / 25</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={innovation}
                  disabled={!!existingMarks}
                  onChange={(e) => setInnovation(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Pillar 2: Technical Feasibility */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">2. Technical Architecture & Execution (Max 25)</span>
                  <span className="font-mono font-bold text-amber-400">{techFeasibility} / 25</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={techFeasibility}
                  disabled={!!existingMarks}
                  onChange={(e) => setTechFeasibility(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Pillar 3: UI/UX & Polish */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">3. User Experience & Architecture Polish (Max 25)</span>
                  <span className="font-mono font-bold text-amber-400">{uiUxArchitecture} / 25</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={uiUxArchitecture}
                  disabled={!!existingMarks}
                  onChange={(e) => setUiUxArchitecture(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Pillar 4: Presentation & Impact */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">4. Presentation, Impact & Q&A Response (Max 25)</span>
                  <span className="font-mono font-bold text-amber-400">{presentationImpact} / 25</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={presentationImpact}
                  disabled={!!existingMarks}
                  onChange={(e) => setPresentationImpact(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

            </div>

            {/* Qualitative Feedback Notes */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                Qualitative Feedback & Jury Notes (Optional)
              </label>
              <textarea
                value={feedbackNotes}
                disabled={!!existingMarks}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Specific technical strengths, scalability remarks, or recommendations..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div className="text-xs font-mono text-zinc-400">
                {existingMarks ? 'Marks locked and immutable.' : 'Once submitted, marks cannot be altered.'}
              </div>

              {existingMarks ? (
                <span className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-mono font-bold">
                  ✓ SUBMITTED
                </span>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-crimson transition-all"
                >
                  {submitting ? 'Locking Score...' : `Submit & Lock ${rawTotal}/100 Marks`}
                </button>
              )}
            </div>
          </form>

        </div>

      </div>

    </div>
  );
};
