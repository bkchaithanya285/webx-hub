import React from 'react';
import { ProblemStatement, ProblemStatementAllocation } from '../../types';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  ShieldCheck,
  Flame,
  Users,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { eventStore } from '../../services/store';

interface ProblemStatementDrawerProps {
  problem: ProblemStatement | null;
  allocation?: ProblemStatementAllocation;
  isOpen: boolean;
  onClose: () => void;
  onSelectSuccess?: () => void;
  onShowLogin?: () => void;
  onRequestConfirmSelect?: (problem: ProblemStatement) => void;
}

export const ProblemStatementDrawer: React.FC<ProblemStatementDrawerProps> = ({
  problem,
  allocation,
  isOpen,
  onClose,
  onSelectSuccess,
  onShowLogin,
  onRequestConfirmSelect
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  if (!isOpen || !problem) return null;

  const settings = eventStore.getSelectionSettings();
  const isUnreleased = settings.releaseState === 'NOT_RELEASED' || settings.status === 'NOT_RELEASED' || settings.status === 'DRAFT';
  const isAdmin = currentUser?.role === 'admin';

  if (isUnreleased && !isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg bg-[#090912] border-l border-zinc-800 h-full p-8 flex flex-col items-center justify-center text-center space-y-5 z-10 animate-slide-left shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
              STATUS: NOT RELEASED
            </span>
            <h2 className="text-xl font-black font-display text-white">
              Problem Statements Not Released Yet
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto font-light">
              The Problem Statements will become available once the Admin releases them.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  const currentCount = allocation?.currentTeamCount || 0;
  const maxTeams = problem.maximumTeams || 2;
  const isFull = currentCount >= maxTeams;

  const handleSelectPS = () => {
    if (!currentUser || currentUser.role !== 'team_lead' || !currentUser.teamId) {
      if (onShowLogin) onShowLogin();
      return;
    }

    if (onRequestConfirmSelect) {
      onClose();
      onRequestConfirmSelect(problem);
      return;
    }

    setLoading(true);
    setError(null);

    const result = eventStore.selectProblemStatement(
      currentUser.teamId,
      problem.problemStatementId,
      currentUser.uid
    );

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to select problem statement.");
    } else {
      setSuccess(true);
      if (onSelectSuccess) onSelectSuccess();
    }
  };

  const userTeam = currentUser?.teamId ? eventStore.getTeam(currentUser.teamId) : null;
  const hasAlreadySelectedThis = userTeam?.problemStatementId === problem.problemStatementId;
  const hasSelectedAnother = userTeam?.problemStatementId && userTeam.problemStatementId !== problem.problemStatementId;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-[#090912] border-l border-red-900/30 h-full overflow-y-auto shadow-2xl z-10 flex flex-col animate-slide-left">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0c0c16]/95 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-md bg-red-950/80 border border-red-800/60 font-mono text-xs font-bold text-red-400">
              {problem.problemStatementId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-[11px] font-medium text-zinc-300">
              {problem.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-8 flex-1">
          
          {/* Title & Allocation Badge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isFull
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 mr-1" />
                  Capacity: {currentCount} / {maxTeams} Teams {isFull ? '(FULL)' : '(AVAILABLE)'}
                </span>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display tracking-tight leading-snug">
              {problem.title}
            </h2>
            <p className="mt-3 text-sm md:text-base text-zinc-300 leading-relaxed font-light">
              {problem.shortDescription}
            </p>
          </div>

          {/* Alert or Feedback Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start space-x-3 animate-shake">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Selection Error</div>
                <div className="mt-0.5 text-zinc-300">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Allocation Confirmed!</div>
                <div className="mt-0.5 text-zinc-300">
                  Problem Statement {problem.problemStatementId} is now locked to your team.
                </div>
              </div>
            </div>
          )}

          {/* Section: The Problem */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-red-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Core Problem & Challenge</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 text-sm text-zinc-300 leading-relaxed">
              {problem.problem}
            </div>
          </div>

          {/* Section: Background & Context */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Industry Background & Context</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 text-sm text-zinc-300 leading-relaxed">
              {problem.background}
            </div>
          </div>

          {/* Section: Objective & Expected Solution */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-red-400 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Objective & Expected Solution</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 text-sm text-zinc-300 leading-relaxed">
              <div className="font-semibold text-white mb-2">{problem.objective}</div>
              <p className="text-zinc-300">{problem.expectedSolution}</p>
            </div>
          </div>

          {/* Section: Technical Requirements */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span>Technical Stack & Architecture Guidelines</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {problem.technicalRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-3 rounded-lg bg-[#141424] border border-[#2a2035] text-xs text-zinc-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Constraints & Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Constraints</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>Expected Impact</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {problem.expectedImpact}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Action Bar */}
        <div className="sticky bottom-0 z-20 bg-[#0c0c16]/95 backdrop-blur-xl border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            {hasAlreadySelectedThis ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Selected by your team
              </span>
            ) : isFull ? (
              <span className="text-rose-400 font-semibold flex items-center">
                <Lock className="w-4 h-4 mr-1" /> Slots fully allocated
              </span>
            ) : (
              <span>Available for allocation (2 max)</span>
            )}
          </div>

          <div>
            {currentUser?.role === 'team_lead' ? (
              <button
                onClick={handleSelectPS}
                disabled={isFull || hasAlreadySelectedThis || loading}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${
                  hasAlreadySelectedThis
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 cursor-default'
                    : isFull
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-crimson'
                }`}
              >
                <span>{hasAlreadySelectedThis ? 'Selected' : loading ? 'Selecting...' : 'Select Problem Statement'}</span>
                {!hasAlreadySelectedThis && !isFull && <ArrowRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Close Details
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
