import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface TeamLoginFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const TeamLoginForm: React.FC<TeamLoginFormProps> = ({ onSuccess, isModal = false }) => {
  const { loginAsTeamLead } = useAuth();

  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedTeamId = teamId.trim().toUpperCase();
    const formattedPassword = password.trim();

    if (!formattedTeamId) {
      setError('Please enter your assigned Team ID (e.g. WEB-023)');
      return;
    }

    if (!formattedPassword) {
      setError('Please enter your Team Lead Registration Number');
      return;
    }

    setLoading(true);

    try {
      const res = loginAsTeamLead(formattedTeamId, formattedPassword);
      if (!res.success) {
        setError(res.error || 'Invalid credentials. Please verify your Team ID and Registration Number.');
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${isModal ? '' : 'max-w-md mx-auto'} space-y-6`}>
      {/* Top Header Card */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-red-800/40 text-red-300 text-[11px] font-mono tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>WEBX 2026 • TEAM LOGIN</span>
        </div>

        <div className="flex justify-center pt-1">
          <img
            src="/webx-logo.png"
            alt="WEBX"
            className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(225,29,72,0.4)]"
          />
        </div>

        <p className="text-xs text-zinc-400 font-light max-w-xs mx-auto">
          Enter your team credentials to access problem statement selection, attendance QR, and review scores.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-700/80 text-red-200 text-xs flex items-start space-x-2.5 shadow-lg animate-shake">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team ID */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-300">
            Team Identifier
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-red-400 transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value.toUpperCase())}
              placeholder="e.g. WEB-023"
              autoComplete="username"
              required
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#090914]/80 border border-white/10 hover:border-red-900/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-white font-mono text-sm uppercase placeholder-zinc-500 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Password (Lead Reg No) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-300">
              Lead Registration Number
            </label>
            <span className="text-[10px] font-mono text-zinc-500">Password</span>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-red-400 transition-colors">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. 9922004023"
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-11 py-3.5 rounded-2xl bg-[#090914]/80 border border-white/10 hover:border-red-900/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-white font-mono text-sm placeholder-zinc-500 outline-none transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-200 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security / Single Device Session Badge */}
        <div className="p-3 rounded-xl glass-card-subtle flex items-center space-x-2.5 text-[11px] text-zinc-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>Single active device session strictly enforced for Team Lead</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-4 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-crimson-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest shadow-glow-crimson hover:shadow-glow-crimson-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-2"
        >
          <span>{loading ? 'Authenticating Team...' : 'Authenticate & Enter Command'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
