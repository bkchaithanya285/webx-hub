import React, { useState } from 'react';
import { ProblemStatement, Team } from '../../types';
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  X,
  Target,
  Layers,
  Sparkles,
  AlertOctagon,
  Users
} from 'lucide-react';

interface ProblemSelectionConfirmModalProps {
  isOpen: boolean;
  problem: ProblemStatement | null;
  team: Team;
  currentSlotCount: number;
  maxSlotCount: number;
  onClose: () => void;
  onConfirm: (psId: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const ProblemSelectionConfirmModal: React.FC<ProblemSelectionConfirmModalProps> = ({
  isOpen,
  problem,
  team,
  currentSlotCount,
  maxSlotCount,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [agreedToLock, setAgreedToLock] = useState(false);

  if (!isOpen || !problem) return null;

  const remainingSlots = Math.max(0, maxSlotCount - currentSlotCount);
  const isFull = remainingSlots <= 0;

  const handleFinalConfirm = () => {
    if (isFull || isLoading) return;
    if (!agreedToLock) {
      setAgreedToLock(true);
      return;
    }
    onConfirm(problem.problemStatementId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Deep Immersive Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl transition-opacity animate-fade-in"
        onClick={() => !isLoading && onClose()}
      />

      {/* Center Spotlight Card */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#140b17] via-[#0d0d18] to-[#07070f] border-2 border-red-600/60 rounded-3xl p-6 sm:p-8 z-10 shadow-[0_0_80px_rgba(220,38,38,0.25)] overflow-hidden space-y-6 animate-scale-up">
        
        {/* Ambient Halo Glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar with Close Button */}
        <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-red-400 font-bold">
                Two-Step Selection Confirmation
              </span>
              <h2 className="text-lg font-black text-white">
                Lock Problem Statement
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focused Problem Statement Showcase */}
        <div className="relative z-10 p-5 rounded-2xl bg-[#120e1d]/90 border border-red-900/50 space-y-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-lg bg-red-950/90 border border-red-800 font-mono text-sm font-black text-red-400">
                {problem.problemStatementId}
              </span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono text-xs">
              <Users className="w-3.5 h-3.5" />
              <span>{remainingSlots} of {maxSlotCount} Slots Open</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-display leading-tight">
              {problem.title}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
              {problem.problemDescription || problem.problemDescription}
            </p>
          </div>

          {problem.executionRequirements && problem.executionRequirements.length > 0 && (
            <div className="pt-3 border-t border-zinc-800/60 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-red-400" />
                <span>Technical Requirements</span>
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-300 font-light">
                {problem.executionRequirements.slice(0, 4).map((d, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span className="line-clamp-1">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Lock Warning Notice */}
        <div className="relative z-10 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start space-x-3">
          <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-300">
              Irreversible Event Action
            </span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-light">
              This problem statement will be assigned exclusively to squad <strong className="text-white font-bold">{team.teamName} ({team.teamId})</strong>. Once locked, this allocation cannot be undone, switched, or cancelled.
            </p>
          </div>
        </div>

        {/* Step 2 Confirmation Checkbox */}
        <label className="relative z-10 flex items-center space-x-3 p-3.5 rounded-2xl bg-[#0e0c18] border border-zinc-800 hover:border-red-900/80 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={agreedToLock}
            onChange={(e) => setAgreedToLock(e.target.checked)}
            className="w-5 h-5 rounded-md accent-red-600 bg-zinc-900 border-zinc-700 text-red-600 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-zinc-200 select-none">
            I confirm on behalf of <strong className="text-white">{team.teamName}</strong> that we have chosen this problem statement and are ready to lock our slot.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Cancel & Review Others
          </button>

          <button
            type="button"
            onClick={handleFinalConfirm}
            disabled={!agreedToLock || isLoading || isFull}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xl ${
              isFull
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                : agreedToLock && !isLoading
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/50 cursor-pointer transform hover:scale-[1.02]'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
            }`}
          >
            {isFull ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Problem Statement Full (2/2)</span>
              </>
            ) : isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Locking Selection...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Confirm & Lock Problem Statement</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
