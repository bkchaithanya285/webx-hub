import React from 'react';
import { ProblemStatement, ProblemStatementAllocation } from '../../types';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  Users,
  Lock,
  ArrowRight,
  Download,
  FileText,
  Compass,
  CheckSquare,
  Layers,
  BookOpen
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
  const maxTeams = 2;
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

  const handleDownloadSpec = () => {
    const spec = {
      event: "WEBX — INTO THE WEB OF INNOVATION 2026",
      problemStatementId: problem.problemStatementId,
      pdfProblemNumber: problem.pdfProblemNumber || problem.pdf_problem_number || "",
      title: problem.title,
      problemDescription: problem.problemDescription || problem.problem_description,
      detailedExplanation: problem.detailedDescription || problem.detailed_problem_explanation,
      implementationFocus: problem.implementationFocus || problem.implementation_focus,
      recommendedDemoFlow: problem.recommendedDemoFlow || problem.recommended_demo_flow,
      executionRequirements: problem.executionRequirements || problem.execution_requirements,
      submissionExpectations: problem.submissionExpectations || problem.submission_expectations,
      evaluationCriteria: problem.evaluationCriteria || problem.evaluation_criteria,
      scopeControl: problem.scopeControl || problem.scope_control,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WEBX_${problem.problemStatementId}_Specification.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const userTeam = currentUser?.teamId ? eventStore.getTeam(currentUser.teamId) : null;
  const hasAlreadySelectedThis = userTeam?.problemStatementId === problem.problemStatementId;
  const hasSelectedAnother = userTeam?.problemStatementId && userTeam.problemStatementId !== problem.problemStatementId;

  const detailedDesc = problem.detailedDescription || problem.detailed_problem_explanation;
  const impFocus = problem.implementationFocus || problem.implementation_focus;
  const demoFlow = problem.recommendedDemoFlow || problem.recommended_demo_flow;
  const scope = problem.scopeControl || problem.scope_control;

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
        <div className="sticky top-0 z-20 bg-[#0c0c16]/95 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-md bg-red-950/80 border border-red-800/60 font-mono text-xs font-bold text-red-400">
              {problem.problemStatementId}
            </span>
            {(problem.pdfProblemNumber || problem.pdf_problem_number) && (
              <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400">
                PDF Ref #{problem.pdfProblemNumber || problem.pdf_problem_number}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadSpec}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
              title="Download full problem statement specification in JSON"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Download Spec</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-7 flex-1">
          
          {/* Title & Allocation Badge */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-md bg-red-950/80 border border-red-800/60 font-mono text-xs font-bold text-red-400">
                {problem.problemStatementId}
              </span>
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

            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display tracking-tight leading-snug">
              {problem.title}
            </h2>
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

          {/* Section: Problem Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-red-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Problem Description</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 text-sm text-zinc-200 leading-relaxed font-light">
              {problem.problemDescription}
            </div>
          </div>

          {/* Section: Detailed Problem Explanation & Deep Dive */}
          {detailedDesc && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Detailed Problem Architecture & Context</span>
              </h3>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121226] via-[#101020] to-[#0c0c16] border border-amber-900/40 space-y-3 shadow-inner">
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light whitespace-pre-line">
                  {detailedDesc}
                </p>
                {impFocus && (
                  <div className="pt-3 border-t border-zinc-800/80 flex items-start space-x-2">
                    <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-300">
                      <strong className="text-amber-300 font-mono uppercase tracking-wider">Implementation Focus: </strong>
                      <span>{impFocus}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Recommended Demo Flow */}
          {demoFlow && demoFlow.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-rose-400 flex items-center space-x-2">
                <CheckSquare className="w-4 h-4" />
                <span>Recommended Demonstration Flow</span>
              </h3>
              <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 space-y-2.5">
                {demoFlow.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs text-zinc-300">
                    <span className="w-5 h-5 rounded-md bg-red-950/80 border border-red-800/60 font-mono text-[10px] font-bold text-red-300 flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-light">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Execution Requirements */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-rose-400" />
              <span>Execution Requirements</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {problem.executionRequirements.map((req, idx) => (
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

          {/* Section: Submission Expectations */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-red-400 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Submission Expectations</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 leading-relaxed font-light">
              {problem.submissionExpectations}
            </div>
          </div>

          {/* Section: Evaluation Criteria */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Evaluation Criteria</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#11111d] border border-zinc-800/80 space-y-2.5">
              {problem.evaluationCriteria.map((criterion, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-zinc-300">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed font-light">{criterion}</span>
                </div>
              ))}
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
