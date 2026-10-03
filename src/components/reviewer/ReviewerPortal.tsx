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
  Sparkles,
  Sliders,
  ArrowRight,
  EyeOff,
  Users,
  RefreshCw,
  Check,
  ListFilter,
  CheckCircle,
  ShieldAlert
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
  
  // Direct Team Score (0-100 direct text/number input)
  const [directTeamScore, setDirectTeamScore] = useState<number>(80);

  // Rubric Scoring State (0-100 total fallback/breakdown)
  const [innovation, setInnovation] = useState(20); // max 25
  const [techFeasibility, setTechFeasibility] = useState(20); // max 25
  const [uiUxArchitecture, setUiUxArchitecture] = useState(20); // max 25
  const [presentationImpact, setPresentationImpact] = useState(20); // max 25
  const [feedbackNotes, setFeedbackNotes] = useState('');
  
  // Round 2 Individual Teammate Scores state (memberId -> score)
  const [memberScores, setMemberScores] = useState<Record<string, number>>({});
  const [memberFeedback, setMemberFeedback] = useState<Record<string, string>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal & Flow states
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<{
    teamId: string;
    teamName: string;
    score: number;
    memberCount?: number;
    nextPendingTeamId?: string;
    nextPendingTeamName?: string;
  } | null>(null);

  const activeRound = reviewSettings.activeRound || 1;
  const currentEffectiveTeamScore = activeRound === 2 ? directTeamScore : (innovation + techFeasibility + uiUxArchitecture + presentationImpact);

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

  // Handle explicit selection from left list
  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setSubmissionSuccessData(null);
  };

  // Handle "Take Review for Next Team" action
  const handleTakeReviewForNextTeam = (nextTeamId: string) => {
    setSelectedTeamId(nextTeamId);
    setSubmissionSuccessData(null);
    setFilterTab('incomplete');
  };

  // Load existing marks or initialize when team or round changes
  useEffect(() => {
    if (!currentTeam || !currentUser) return;
    const existing = reviewMarks.find(
      m => m.round === activeRound && m.teamId === currentTeam.teamId && m.reviewerUid === currentUser.uid
    );

    if (existing) {
      setDirectTeamScore(existing.rawScore);
      const inn = existing.rubric?.innovation ?? Math.round(existing.rawScore * 0.25);
      const tech = existing.rubric?.technicalFeasibility ?? Math.round(existing.rawScore * 0.25);
      const ui = existing.rubric?.uiUxArchitecture ?? Math.round(existing.rawScore * 0.25);
      const pres = existing.rubric?.presentationImpact ?? (existing.rawScore - inn - tech - ui);
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
      const defaultScore = 80;
      setDirectTeamScore(defaultScore);
      setInnovation(20);
      setTechFeasibility(20);
      setUiUxArchitecture(20);
      setPresentationImpact(20);
      setFeedbackNotes('');

      // Initialize all teammate scores to direct team score (80)
      const initialMemberScores: Record<string, number> = {};
      currentTeam.members.forEach(m => {
        initialMemberScores[m.memberId] = defaultScore;
      });
      setMemberScores(initialMemberScores);
      setMemberFeedback({});
    }
  }, [currentTeam?.teamId, activeRound, currentUser?.uid, reviewMarks]);

  // Direct team score change handler for Round 2
  const handleDirectTeamScoreChange = (score: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(score) ? 0 : score));
    setDirectTeamScore(clamped);
    
    // Auto-update member scores
    if (currentTeam) {
      setMemberScores(prev => {
        const updated = { ...prev };
        currentTeam.members.forEach(m => {
          updated[m.memberId] = clamped;
        });
        return updated;
      });
    }
  };

  // Sync all members to current team baseline score
  const handleSyncAllMembersToTeamScore = () => {
    if (!currentTeam) return;
    const score = currentEffectiveTeamScore;
    const updated: Record<string, number> = {};
    currentTeam.members.forEach(m => {
      updated[m.memberId] = score;
    });
    setMemberScores(updated);
    setNotice({ type: 'success', message: `All ${currentTeam.members.length} teammates synced to Team Score: ${score}/100` });
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
  const memberScoresArray = currentTeam ? currentTeam.members.map(m => memberScores[m.memberId] ?? currentEffectiveTeamScore) : [];
  const avgMemberScore = memberScoresArray.length > 0 
    ? Math.round(memberScoresArray.reduce((acc, s) => acc + s, 0) / memberScoresArray.length) 
    : currentEffectiveTeamScore;

  // Step 1: Trigger confirmation modal before submitting marks
  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;

    if (!isRoundOpen) {
      setNotice({ type: 'error', message: `Round ${activeRound} is currently CLOSED by the Administrator.` });
      return;
    }

    const finalTeamScore = currentEffectiveTeamScore;
    if (finalTeamScore < 0 || finalTeamScore > 100 || isNaN(finalTeamScore)) {
      setNotice({ type: 'error', message: "Please enter a valid team score between 0 and 100." });
      return;
    }

    setShowConfirmSubmitModal(true);
  };

  // Step 2: Confirmed submission action
  const handleConfirmSubmitScore = () => {
    if (!currentTeam || !currentUser) return;

    setSubmitting(true);
    setNotice(null);

    const finalTeamScore = currentEffectiveTeamScore;

    // Build member scores array if Round 2
    let payloadMemberScores: MemberReviewScore[] | undefined = undefined;
    if (activeRound === 2) {
      payloadMemberScores = currentTeam.members.map(m => ({
        memberId: m.memberId,
        name: m.name,
        registrationNumber: m.registrationNumber,
        isTeamLead: m.isTeamLead,
        score: memberScores[m.memberId] !== undefined ? memberScores[m.memberId] : finalTeamScore,
        feedback: memberFeedback[m.memberId] || ''
      }));
    }

    // Rubric distribution
    const quarter = Math.round(finalTeamScore / 4);
    const remainder = finalTeamScore - (quarter * 3);
    const rubricPayload = {
      innovation: quarter,
      technicalFeasibility: quarter,
      uiUxArchitecture: quarter,
      presentationImpact: remainder
    };

    const res = eventStore.submitReviewMarks(
      currentUser.uid,
      currentUser.name,
      activeRound,
      currentTeam.teamId,
      finalTeamScore,
      rubricPayload,
      feedbackNotes,
      payloadMemberScores
    );

    setSubmitting(false);
    setShowConfirmSubmitModal(false);

    if (!res.success) {
      setNotice({ type: 'error', message: res.error || "Failed to submit marks." });
    } else {
      // Find next remaining pending team
      const remainingIncomplete = teams.filter(t => t.teamId !== currentTeam.teamId && !roundEvaluatedTeamIds.has(t.teamId));
      const nextPending = remainingIncomplete.length > 0 ? remainingIncomplete[0] : null;

      setSubmissionSuccessData({
        teamId: currentTeam.teamId,
        teamName: currentTeam.teamName,
        score: finalTeamScore,
        memberCount: currentTeam.members.length,
        nextPendingTeamId: nextPending?.teamId,
        nextPendingTeamName: nextPending?.teamName
      });

      setNotice({
        type: 'success',
        message: `Marks entered successfully for Team ${currentTeam.teamId}! Evaluation locked at ${finalTeamScore}/100.`
      });
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
                      className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold hover:bg-emerald-900 transition-colors cursor-pointer"
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
                  <div
                    key={t.teamId}
                    onClick={() => handleSelectTeam(t.teamId)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
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

                    <div>
                      {isEvaluated ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-900/60">
                          ✓ DONE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 text-[10px] font-mono font-bold border border-amber-900/40">
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Team Scoring Sheet */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Post-Submission Success Card (if just submitted this team) */}
          {submissionSuccessData && submissionSuccessData.teamId === currentTeam?.teamId && (
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-emerald-950/90 via-[#0c1815] to-[#0c0c16] border-2 border-emerald-500/60 shadow-2xl space-y-6 text-center animate-in fade-in slide-in-from-bottom-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-300 text-xs font-mono font-bold border border-emerald-700">
                  ROUND 0{activeRound} EVALUATION COMPLETE
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-display pt-1">
                  Marks Entered Successfully!
                </h3>
                <p className="text-sm font-mono text-zinc-300">
                  Evaluation locked for Team <span className="text-emerald-400 font-black font-mono text-lg">{submissionSuccessData.teamId}</span> ({submissionSuccessData.teamName})
                </p>
              </div>

              <div className="inline-flex items-center space-x-3 bg-[#0a1410] border border-emerald-600/40 rounded-2xl px-6 py-3">
                <span className="text-xs font-mono uppercase text-zinc-400">Total Marks Awarded:</span>
                <span className="text-3xl font-black font-mono text-amber-400">{submissionSuccessData.score} <span className="text-sm text-zinc-500">/ 100</span></span>
              </div>

              {/* Next Step Actions */}
              <div className="pt-4 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-center gap-3">
                {submissionSuccessData.nextPendingTeamId ? (
                  <button
                    type="button"
                    onClick={() => handleTakeReviewForNextTeam(submissionSuccessData.nextPendingTeamId!)}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-900/50 flex items-center justify-center space-x-3 transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <span>Take Review for Next Team ({submissionSuccessData.nextPendingTeamId})</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-emerald-300 font-bold">🎉 All teams have been evaluated in this round!</div>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterTab('completed');
                        setSubmissionSuccessData(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      View All Completed Teams
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSubmissionSuccessData(null)}
                  className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Stay on {submissionSuccessData.teamId}
                </button>
              </div>
            </div>
          )}

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
            <form onSubmit={handleInitiateSubmit} className="p-6 md:p-8 rounded-3xl bg-[#0c0c16] border border-red-900/40 space-y-6 shadow-2xl">
              
              {/* Header of Marking Matrix */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
                <div>
                  <div className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>ROUND 0{activeRound} EVALUATION</span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mt-0.5">
                    {activeRound === 2 ? 'Direct Score & Individual Teammate Evaluation' : 'Team Direct Scoring (0–100 Scale)'}
                  </h3>
                </div>

                {/* Big Score Counter Display */}
                <div className="text-left sm:text-right bg-[#121220] px-4 py-2.5 rounded-2xl border border-zinc-800 flex items-center space-x-3 sm:space-x-0 sm:flex-col justify-between">
                  <div className="text-3xl font-black font-display text-amber-400">
                    {currentEffectiveTeamScore} <span className="text-sm text-zinc-500 font-normal">/ 100</span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Team Total Score</div>
                </div>
              </div>

              {/* DIRECT TEAM MARKS ENTRY SECTION */}
              <div className="p-5 rounded-2xl bg-[#10101c] border border-zinc-800/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span>{activeRound === 2 ? 'Step 1: Enter Team Marks (0–100)' : 'Enter Team Marks (0–100)'}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Direct text/number entry — auto-syncs to teammates below.
                    </div>
                  </div>

                  {!existingMarks && (
                    <button
                      type="button"
                      onClick={handleSyncAllMembersToTeamScore}
                      className="px-3 py-1.5 rounded-xl bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync All Teammates to {currentEffectiveTeamScore}</span>
                    </button>
                  )}
                </div>

                {/* Direct Team Score Input Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
                  
                  {/* Large Direct Number Input */}
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <span className="text-xs font-mono text-zinc-400 uppercase font-bold shrink-0">Marks:</span>
                    <div className="flex items-center bg-[#0a0a12] border-2 border-amber-500/60 focus-within:border-amber-400 rounded-2xl px-4 py-2 shadow-glow-subtle">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentEffectiveTeamScore}
                        disabled={!!existingMarks}
                        onChange={(e) => handleDirectTeamScoreChange(parseInt(e.target.value) || 0)}
                        placeholder="80"
                        className="w-20 bg-transparent text-center font-mono font-black text-2xl text-amber-400 outline-none"
                      />
                      <span className="text-sm font-mono text-zinc-500 font-bold pl-1">/ 100</span>
                    </div>

                    {/* Stepper Buttons for Team Marks */}
                    {!existingMarks && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleDirectTeamScoreChange(currentEffectiveTeamScore - 5)}
                          className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDirectTeamScoreChange(currentEffectiveTeamScore + 5)}
                          className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          +5
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Preset Buttons */}
                  {!existingMarks && (
                    <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-start md:justify-end">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Presets:</span>
                      {[65, 70, 75, 80, 85, 90, 95].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleDirectTeamScoreChange(preset)}
                          className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                            currentEffectiveTeamScore === preset
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'bg-[#18182a] hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* ROUND 2 INDIVIDUAL TEAMMATE MARKS SECTION */}
              {activeRound === 2 && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <div className="text-xs font-mono text-sky-400 uppercase tracking-widest font-bold flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Step 2: Individual Teammate Marks (0–100)</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Directly enter or adjust marks for each member in this team.
                      </div>
                    </div>
                    <div className="text-right bg-[#121220] px-3 py-1.5 rounded-xl border border-zinc-800 inline-block self-start sm:self-auto">
                      <span className="text-xs font-mono text-zinc-400">Teammate Avg: </span>
                      <span className="text-sm font-bold font-mono text-emerald-400">{avgMemberScore} / 100</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {currentTeam.members.map((member, idx) => {
                      const memberScore = memberScores[member.memberId] !== undefined ? memberScores[member.memberId] : currentEffectiveTeamScore;
                      const isCustom = memberScore !== currentEffectiveTeamScore;
                      const diff = memberScore - currentEffectiveTeamScore;

                      return (
                        <div
                          key={member.memberId}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCustom
                              ? 'bg-[#151224] border-purple-800/80 shadow-md'
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
                                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-mono font-bold border border-red-800/60">
                                      TEAM LEAD
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-400 font-mono">
                                  Reg: <span className="text-zinc-300">{member.registrationNumber}</span>
                                </div>
                              </div>
                            </div>

                            {/* Direct Marks Entry & Status */}
                            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                              {isCustom ? (
                                <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold">
                                  {diff > 0 ? `+${diff}` : diff} vs Team ({currentEffectiveTeamScore})
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-400 text-[10px] font-mono">
                                  Matches Team
                                </span>
                              )}

                              {/* Direct Number Input Box */}
                              <div className="flex items-center bg-[#0a0a12] px-3 py-1.5 rounded-xl border border-zinc-700 focus-within:border-sky-500">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={memberScore}
                                  disabled={!!existingMarks}
                                  onChange={(e) => handleIndividualMemberScoreChange(member.memberId, parseInt(e.target.value) || 0)}
                                  className="w-14 bg-transparent text-center font-mono font-black text-amber-400 text-base outline-none"
                                />
                                <span className="text-xs text-zinc-500 font-mono pr-1">/ 100</span>
                              </div>

                              {/* Micro step adjustments */}
                              {!existingMarks && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore - 5)}
                                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono font-bold cursor-pointer"
                                  >
                                    -5
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore - 1)}
                                    className="px-1.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono font-bold cursor-pointer"
                                  >
                                    -1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore + 1)}
                                    className="px-1.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono font-bold cursor-pointer"
                                  >
                                    +1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleIndividualMemberScoreChange(member.memberId, memberScore + 5)}
                                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono font-bold cursor-pointer"
                                  >
                                    +5
                                  </button>
                                  {isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => handleIndividualMemberScoreChange(member.memberId, currentEffectiveTeamScore)}
                                      title="Reset to team score"
                                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-400 text-[10px] font-mono font-bold cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Individual Remark input */}
                          <div className="mt-2.5">
                            <input
                              type="text"
                              value={memberFeedback[member.memberId] || ''}
                              disabled={!!existingMarks}
                              onChange={(e) => handleIndividualMemberFeedbackChange(member.memberId, e.target.value)}
                              placeholder={`Remark / feedback for ${member.name} (optional)...`}
                              className="w-full px-3.5 py-1.5 rounded-xl bg-[#0a0a12] border border-zinc-800 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-600"
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
                    ? '✓ Marks locked and immutable for this evaluation round. (Admin authorization required for changes).' 
                    : activeRound === 2 
                      ? `Submitting will lock Team score (${currentEffectiveTeamScore}/100) & all individual member marks.` 
                      : `Submitting will lock Team score (${currentEffectiveTeamScore}/100).`
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
                        ? 'Validating Score...' 
                        : activeRound === 2 
                          ? `Submit & Lock Team (${currentEffectiveTeamScore}/100) & ${currentTeam.members.length} Members` 
                          : `Submit & Lock ${currentEffectiveTeamScore}/100 Marks`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          )}

        </div>

      </div>

      {/* CONFIRMATION MODAL BEFORE SUBMITTING MARKS (WITH PROMINENT TEAM ID) */}
      {showConfirmSubmitModal && currentTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e1a] border-2 border-red-600/70 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm font-mono">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span>CONFIRM MARKS SUBMISSION</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmSubmitModal(false)}
                className="text-zinc-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Huge Team ID Banner */}
            <div className="text-center py-5 px-6 bg-[#131322] rounded-2xl border-2 border-red-900/60 shadow-inner space-y-1">
              <div className="text-[11px] font-mono text-red-400 uppercase tracking-widest font-bold">
                EVALUATION MARKS FOR TEAM
              </div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-red-400 tracking-widest drop-shadow-md py-1">
                {currentTeam.teamId}
              </div>
              <div className="text-base font-bold text-white">{currentTeam.teamName}</div>
              <div className="text-xs font-mono text-zinc-400 mt-1">Round 0{activeRound} Evaluation Station</div>
            </div>

            {/* Score Summary */}
            <div className="p-4 rounded-xl bg-[#16162a] border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-300">Total Team Score:</span>
                <span className="text-2xl font-black font-mono text-amber-400">{currentEffectiveTeamScore} / 100</span>
              </div>

              {activeRound === 2 && currentTeam.members && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-1 max-h-36 overflow-y-auto pr-1">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Teammate Marks Breakdown:</div>
                  {currentTeam.members.map(m => (
                    <div key={m.memberId} className="flex justify-between text-xs font-mono text-zinc-300">
                      <span className="truncate max-w-[200px]">{m.name} {m.isTeamLead ? '(Lead)' : ''}:</span>
                      <span className="text-amber-400 font-bold">{memberScores[m.memberId] ?? currentEffectiveTeamScore} / 100</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
              ⚠️ Are you sure you want to lock and submit marks for <strong className="text-white">{currentTeam.teamId}</strong>? Once submitted, marks become final and locked.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel / Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmitScore}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase font-mono tracking-wider shadow-glow-crimson transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>{submitting ? 'Locking Marks...' : `Yes, Submit Marks to ${currentTeam.teamId}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
