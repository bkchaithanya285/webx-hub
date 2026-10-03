import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Team, ReviewSettings, ReviewMark, MemberReviewScore } from '../../types';
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
  EyeOff,
  User,
  Users,
  RefreshCw,
  Edit3,
  Check,
  ListFilter,
  CheckCircle
} from 'lucide-react';

type FilterTab = 'incomplete' | 'completed' | 'all';

export const ReviewerPortal: React.FC = () => {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>(eventStore.getTeams());
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(eventStore.getReviewSettings());
  const [reviewMarks, setReviewMarks] = useState<ReviewMark[]>(eventStore.getReviewMarks());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('WEB-001');
  const [filterTab, setFilterTab] = useState<FilterTab>('incomplete');
  
  // Rubric Scoring State (0-100 total)
  const [innovation, setInnovation] = useState(20); // max 25
  const [techFeasibility, setTechFeasibility] = useState(22); // max 25
  const [uiUxArchitecture, setUiUxArchitecture] = useState(21); // max 25
  const [presentationImpact, setPresentationImpact] = useState(22); // max 25
  const [feedbackNotes, setFeedbackNotes] = useState('');
  
  // Round 2 Individual Teammate Scores state (memberId -> score)
  const [memberScores, setMemberScores] = useState<Record<string, number>>({});
  const [memberFeedback, setMemberFeedback] = useState<Record<string, string>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const teamRawTotal = innovation + techFeasibility + uiUxArchitecture + presentationImpact;
  const activeRound = reviewSettings.activeRound || 1;

  useEffect(() => {
    const update = () => {
      setTeams(eventStore.getTeams());
      setReviewSettings(eventStore.getReviewSettings());
      setReviewMarks(eventStore.getReviewMarks());
    };
    update();
    return eventStore.subscribe(update);
  }, []);

  // Evaluated team set for this round across ALL reviewers (or this reviewer)
  const roundEvaluatedTeamIds = useMemo(() => {
    const set = new Set<string>();
    reviewMarks.forEach(m => {
      if (m.round === activeRound && (m.status === 'locked' || m.status === 'submitted')) {
        set.add(m.teamId);
      }
    });
    return set;
  }, [reviewMarks, activeRound]);

  // Evaluated specifically by this logged-in reviewer
  const myEvaluatedTeamIds = useMemo(() => {
    const set = new Set<string>();
    if (!currentUser) return set;
    reviewMarks.forEach(m => {
      if (m.round === activeRound && m.reviewerUid === currentUser.uid) {
        set.add(m.teamId);
      }
    });
    return set;
  }, [reviewMarks, activeRound, currentUser?.uid]);

  // Filtered teams based on tab & search query
  const filteredTeams = useMemo(() => {
    let list = teams;
    if (filterTab === 'incomplete') {
      list = teams.filter(t => !roundEvaluatedTeamIds.has(t.teamId));
    } else if (filterTab === 'completed') {
      list = teams.filter(t => roundEvaluatedTeamIds.has(t.teamId));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(t => 
      t.teamId.toLowerCase().includes(q) ||
      t.teamName.toLowerCase().includes(q)
    );
  }, [teams, filterTab, roundEvaluatedTeamIds, searchQuery]);

  // Selected Team resolution
  const currentTeam = useMemo(() => {
    const found = teams.find(t => t.teamId === selectedTeamId);
    if (found) return found;
    return filteredTeams[0] || teams[0];
  }, [teams, selectedTeamId, filteredTeams]);

  // Update selected team if the active selection gets filtered out
  useEffect(() => {
    if (filteredTeams.length > 0 && !filteredTeams.some(t => t.teamId === selectedTeamId)) {
      setSelectedTeamId(filteredTeams[0].teamId);
    }
  }, [filteredTeams, selectedTeamId]);

  // Load existing marks or initialize new rubric when team or round changes
  useEffect(() => {
    if (!currentTeam || !currentUser) return;
    const existing = reviewMarks.find(
      m => m.round === activeRound && m.teamId === currentTeam.teamId && m.reviewerUid === currentUser.uid
    );

    if (existing) {
      const inn = existing.rubric?.innovation ?? 20;
      const tech = existing.rubric?.technicalFeasibility ?? 20;
      const ui = existing.rubric?.uiUxArchitecture ?? 20;
      const pres = existing.rubric?.presentationImpact ?? 20;
      setInnovation(inn);
      setTechFeasibility(tech);
      setUiUxArchitecture(ui);
      setPresentationImpact(pres);
      setFeedbackNotes(existing.feedback || '');

      // Load individual scores if available
      const initialMemberScores: Record<string, number> = {};
      const initialMemberFeedback: Record<string, string> = {};
      if (existing.memberScores && Array.isArray(existing.memberScores)) {
        existing.memberScores.forEach(ms => {
          initialMemberScores[ms.memberId] = ms.score;
          if (ms.feedback) initialMemberFeedback[ms.memberId] = ms.feedback;
        });
      } else {
        currentTeam.members.forEach(m => {
          initialMemberScores[m.memberId] = existing.rawScore;
        });
      }
      setMemberScores(initialMemberScores);
      setMemberFeedback(initialMemberFeedback);
    } else {
      setInnovation(20);
      setTechFeasibility(20);
      setUiUxArchitecture(20);
      setPresentationImpact(20);
      setFeedbackNotes('');

      // Initialize all teammate scores to the baseline total (80)
      const defaultTotal = 80;
      const initialMemberScores: Record<string, number> = {};
      currentTeam.members.forEach(m => {
        initialMemberScores[m.memberId] = defaultTotal;
      });
      setMemberScores(initialMemberScores);
      setMemberFeedback({});
    }
  }, [currentTeam?.teamId, activeRound, currentUser?.uid, reviewMarks]);

  // When team raw total changes in Round 2, auto-cascade to members that haven't been manually decoupled
  const handleTeamScoreChange = (type: 'innovation' | 'tech' | 'ui' | 'pres', value: number) => {
    let newInn = innovation;
    let newTech = techFeasibility;
    let newUi = uiUxArchitecture;
    let newPres = presentationImpact;

    if (type === 'innovation') { newInn = value; setInnovation(value); }
    if (type === 'tech') { newTech = value; setTechFeasibility(value); }
    if (type === 'ui') { newUi = value; setUiUxArchitecture(value); }
    if (type === 'pres') { newPres = value; setPresentationImpact(value); }

    const newTotal = newInn + newTech + newUi + newPres;
    
    // Auto sync to all members in Round 2
    if (activeRound === 2 && currentTeam) {
      setMemberScores(prev => {
        const updated = { ...prev };
        currentTeam.members.forEach(m => {
          updated[m.memberId] = newTotal;
        });
        return updated;
      });
    }
  };

  // Sync all members to current team baseline score
  const handleSyncAllMembersToTeamScore = () => {
    if (!currentTeam) return;
    const updated: Record<string, number> = {};
    currentTeam.members.forEach(m => {
      updated[m.memberId] = teamRawTotal;
    });
    setMemberScores(updated);
    setNotice({ type: 'success', message: `All ${currentTeam.members.length} teammates synced to Team Baseline: ${teamRawTotal}/100` });
  };

  // Update specific individual member score
  const handleIndividualMemberScoreChange = (memberId: string, score: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(score) ? 0 : score));
    setMemberScores(prev => ({
      ...prev,
      [memberId]: clamped
    }));
  };

  // Update individual member remark
  const handleIndividualMemberFeedbackChange = (memberId: string, text: string) => {
    setMemberFeedback(prev => ({
      ...prev,
      [memberId]: text
    }));
  };

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
  
  // Check if existing marks exist for current round
  const existingMarks = currentTeam ? reviewMarks.find(
    m => m.round === activeRound && m.teamId === currentTeam.teamId && (m.reviewerUid === currentUser.uid || m.status === 'locked')
  ) : undefined;

  // Calculate average of individual teammate marks in Round 2
  const memberScoresArray = currentTeam ? currentTeam.members.map(m => memberScores[m.memberId] ?? teamRawTotal) : [];
  const avgMemberScore = memberScoresArray.length > 0 
    ? Math.round(memberScoresArray.reduce((acc, s) => acc + s, 0) / memberScoresArray.length) 
    : teamRawTotal;

  // Submit Score Handler
  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;

    if (!isRoundOpen) {
      setNotice({ type: 'error', message: `Round ${activeRound} is currently CLOSED by the Administrator.` });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    // Build member scores array if Round 2
    let payloadMemberScores: MemberReviewScore[] | undefined = undefined;
    if (activeRound === 2) {
      payloadMemberScores = currentTeam.members.map(m => ({
        memberId: m.memberId,
        name: m.name,
        registrationNumber: m.registrationNumber,
        isTeamLead: m.isTeamLead,
        score: memberScores[m.memberId] ?? teamRawTotal,
        feedback: memberFeedback[m.memberId] || ''
      }));
    }

    const res = eventStore.submitReviewMarks(
      currentUser.uid,
      currentUser.name,
      activeRound,
      currentTeam.teamId,
      teamRawTotal,
      {
        innovation,
        technicalFeasibility: techFeasibility,
        uiUxArchitecture,
        presentationImpact
      },
      feedbackNotes,
      payloadMemberScores
    );

    setSubmitting(false);

    if (!res.success) {
      setNotice({ type: 'error', message: res.error || "Failed to submit marks." });
    } else {
      setNotice({
        type: 'success',
        message: `Evaluation submitted & locked for ${currentTeam.teamId}! Team score: ${teamRawTotal}/100. Team moved to Completed.`
      });

      // Find next incomplete team
      const remainingIncomplete = teams.filter(t => t.teamId !== currentTeam.teamId && !roundEvaluatedTeamIds.has(t.teamId));
      if (remainingIncomplete.length > 0) {
        setSelectedTeamId(remainingIncomplete[0].teamId);
      }
    }
  };

  const incompleteCount = teams.filter(t => !roundEvaluatedTeamIds.has(t.teamId)).length;
  const completedCount = teams.filter(t => roundEvaluatedTeamIds.has(t.teamId)).length;

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
          <button onClick={() => setNotice(null)} className="hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Main Scoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Team Selector List & Filters */}
        <div className="lg:col-span-1 rounded-3xl bg-[#0c0c16] border border-zinc-800 p-5 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center space-x-1.5">
              <ListFilter className="w-3.5 h-3.5 text-sky-400" />
              <span>TEAMS EVALUATION QUEUE</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Round {activeRound}</span>
          </div>

          {/* Filter Tabs: Incomplete (Default) | Completed | All */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#121220] rounded-xl border border-zinc-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setFilterTab('incomplete')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
                filterTab === 'incomplete'
                  ? 'bg-red-600 text-white font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Pending</span>
              <span className="text-[9px] opacity-80">({incompleteCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
                filterTab === 'completed'
                  ? 'bg-emerald-600 text-white font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Done</span>
              <span className="text-[9px] opacity-80">({completedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
                filterTab === 'all'
                  ? 'bg-zinc-700 text-white font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>All</span>
              <span className="text-[9px] opacity-80">({teams.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Team ID or name..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          </div>

          {/* List of Teams */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredTeams.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#121220] border border-zinc-800 text-center space-y-3">
                {filterTab === 'incomplete' ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-xs font-bold text-white">All Teams Evaluated!</div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Great job! There are no remaining uncompleted teams in Round {activeRound}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilterTab('completed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold hover:bg-emerald-900 transition-colors"
                    >
                      View Completed Teams ({completedCount})
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-zinc-400 font-mono">No teams match this filter query.</div>
                )}
              </div>
            ) : (
              filteredTeams.map(t => {
                const isSelected = t.teamId === currentTeam?.teamId;
                const isEvaluated = roundEvaluatedTeamIds.has(t.teamId);

                return (
                  <button
                    key={t.teamId}
                    type="button"
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

                    {isEvaluated ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-900/60">
                        ✓ COMPLETED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 text-[10px] font-mono font-bold border border-amber-900/40">
                        PENDING
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Team Scoring Sheet */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Team & Assigned Problem Summary */}
          {currentTeam && (
            <div className="p-6 rounded-3xl bg-[#0c0c16] border border-zinc-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 font-mono text-xs font-bold border border-red-900/50">
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
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{problemStatement.problemDescription}</p>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">No Problem Statement Assigned</div>
                )}
              </div>

              {/* Team Members Chips */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center space-x-1">
                  <Users className="w-3 h-3 text-sky-400" />
                  <span>Team Members ({currentTeam.members.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentTeam.members.map(m => (
                    <span key={m.memberId} className="px-2.5 py-1 rounded-lg bg-[#141424] border border-zinc-800 text-xs text-zinc-300 font-mono flex items-center space-x-1">
                      <span>{m.name}</span>
                      <span className="text-zinc-500">({m.registrationNumber})</span>
                      {m.isTeamLead && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-red-950 text-red-300 font-bold rounded">
                          LEAD
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rubric Evaluation Form */}
          {currentTeam && (
            <form onSubmit={handleSubmitScore} className="p-6 md:p-8 rounded-3xl bg-[#0c0c16] border border-red-900/40 space-y-6 shadow-2xl">
              
              {/* Header of Marking Matrix */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
                <div>
                  <div className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>ROUND 0{activeRound} EVALUATION MATRIX</span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mt-0.5">
                    {activeRound === 2 ? 'Team & Individual Teammate Evaluation' : 'Team Marking Matrix (0–100 Scale)'}
                  </h3>
                </div>

                {/* Big Score Counter Display */}
                <div className="text-left sm:text-right bg-[#121220] px-4 py-2 rounded-2xl border border-zinc-800">
                  <div className="text-3xl font-black font-display text-amber-400">
                    {teamRawTotal} <span className="text-sm text-zinc-500 font-normal">/ 100</span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Team Total Score</div>
                </div>
              </div>

              {/* ROUND 2 HIGHLIGHT BANNER */}
              {activeRound === 2 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#181224] to-sky-950/30 border border-red-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white font-display uppercase tracking-wider">
                        Step 1: Enter Team Marks Below
                      </span>
                    </div>
                    {!existingMarks && (
                      <button
                        type="button"
                        onClick={handleSyncAllMembersToTeamScore}
                        className="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Sync All Teammates to {teamRawTotal}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Enter the overall team rubric marks first. They automatically cascade to all teammates below. You can then modify and customize individual teammate marks directly right there.
                  </p>
                </div>
              )}

              {/* 4 Rubric Sliders for Team */}
              <div className="space-y-4 bg-[#10101c] p-5 rounded-2xl border border-zinc-800/80">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center justify-between">
                  <span>{activeRound === 2 ? 'Team Baseline Rubric (4 Pillars)' : 'Scoring Rubric (4 Pillars)'}</span>
                  <span className="text-amber-400 font-bold">{teamRawTotal} / 100</span>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Pillar 1: Innovation */}
                  <div className="space-y-1.5">
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
                      onChange={(e) => handleTeamScoreChange('innovation', Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>

                  {/* Pillar 2: Technical Feasibility */}
                  <div className="space-y-1.5">
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
                      onChange={(e) => handleTeamScoreChange('tech', Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>

                  {/* Pillar 3: UI/UX & Polish */}
                  <div className="space-y-1.5">
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
                      onChange={(e) => handleTeamScoreChange('ui', Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>

                  {/* Pillar 4: Presentation & Impact */}
                  <div className="space-y-1.5">
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
                      onChange={(e) => handleTeamScoreChange('pres', Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* ROUND 2 INDIVIDUAL TEAMMATE MARKS SECTION */}
              {activeRound === 2 && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <div className="text-xs font-mono text-sky-400 uppercase tracking-widest font-bold flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Step 2: Individual Teammate Marks</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Customize or rewrite individual scores for any teammate as needed.
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-zinc-400">Teammate Avg: </span>
                      <span className="text-sm font-bold font-mono text-emerald-400">{avgMemberScore} / 100</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {currentTeam.members.map((member, idx) => {
                      const memberScore = memberScores[member.memberId] ?? teamRawTotal;
                      const isCustom = memberScore !== teamRawTotal;
                      const diff = memberScore - teamRawTotal;

                      return (
                        <div
                          key={member.memberId}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCustom
                              ? 'bg-[#151224] border-purple-800/60 shadow-md'
                              : 'bg-[#10101c] border-zinc-800/80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            
                            {/* Member Info */}
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-[#1e1e30] border border-zinc-700 flex items-center justify-center font-bold text-xs text-white">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-white text-sm">{member.name}</span>
                                  {member.isTeamLead && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-mono font-bold">
                                      TEAM LEAD
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-400 font-mono">
                                  Reg: <span className="text-zinc-300">{member.registrationNumber}</span>
                                </div>
                              </div>
                            </div>

                            {/* Score Display & Match Status Badge */}
                            <div className="flex items-center space-x-3">
                              {isCustom ? (
                                <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold">
                                  Custom: {diff > 0 ? `+${diff}` : diff} vs Team
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-400 text-[10px] font-mono">
                                  Matches Team ({teamRawTotal})
                                </span>
                              )}

                              {/* Numeric Input */}
                              <div className="flex items-center space-x-1 bg-[#0a0a12] p-1 rounded-xl border border-zinc-700">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={memberScore}
                                  disabled={!!existingMarks}
                                  onChange={(e) => handleIndividualMemberScoreChange(member.memberId, parseInt(e.target.value) || 0)}
                                  className="w-14 bg-transparent text-center font-mono font-black text-amber-400 text-sm outline-none"
                                />
                                <span className="text-xs text-zinc-500 font-mono pr-1.5">/ 100</span>
                              </div>
                            </div>
                          </div>

                          {/* Member Slider & Quick Micro-Adjusters */}
                          {!existingMarks && (
                            <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center gap-3">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={memberScore}
                                onChange={(e) => handleIndividualMemberScoreChange(member.memberId, Number(e.target.value))}
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                              />

                              {/* Quick Step Buttons */}
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore - 5)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono"
                                >
                                  -5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore - 1)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono"
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore + 1)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore + 5)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono"
                                >
                                  +5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIndividualMemberScoreChange(member.memberId, teamRawTotal)}
                                  title="Reset to team score"
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sky-400 text-[10px] font-mono font-bold"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Individual Remark input */}
                          <div className="mt-2.5">
                            <input
                              type="text"
                              value={memberFeedback[member.memberId] || ''}
                              disabled={!!existingMarks}
                              onChange={(e) => handleIndividualMemberFeedbackChange(member.memberId, e.target.value)}
                              placeholder={`Remark for ${member.name} (optional)...`}
                              className="w-full px-3 py-1.5 rounded-xl bg-[#0a0a12] border border-zinc-800 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Qualitative Feedback Notes */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Overall Qualitative Feedback & Jury Notes (Optional)
                </label>
                <textarea
                  value={feedbackNotes}
                  disabled={!!existingMarks}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Specific technical strengths, scalability remarks, architecture remarks, or recommendations..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#121220] border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs font-mono text-zinc-400">
                  {existingMarks 
                    ? '✓ Marks locked and immutable for this evaluation round.' 
                    : activeRound === 2 
                      ? 'Once submitted, team & individual marks will be locked and team removed from pending queue.' 
                      : 'Once submitted, marks cannot be altered.'
                  }
                </div>

                {existingMarks ? (
                  <span className="px-5 py-2.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold self-start sm:self-auto flex items-center space-x-1.5">
                    <Check className="w-4 h-4" />
                    <span>✓ SUBMITTED & LOCKED</span>
                  </span>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-crimson transition-all flex items-center justify-center space-x-2 self-start sm:self-auto cursor-pointer"
                  >
                    <span>
                      {submitting 
                        ? 'Locking Score...' 
                        : activeRound === 2 
                          ? `Submit & Lock Team (${teamRawTotal}/100) & ${currentTeam.members.length} Members` 
                          : `Submit & Lock ${teamRawTotal}/100 Marks`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
