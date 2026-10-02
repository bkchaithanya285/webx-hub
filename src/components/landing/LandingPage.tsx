import React from 'react';
import {
  Calendar,
  MapPin,
  Zap,
  Trophy,
  ArrowRight,
  ShieldAlert,
  Users,
  QrCode,
  Award,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onEnterInnovation: () => void;
  onNavigateLogin: (role: 'team_lead' | 'admin' | 'volunteer' | 'reviewer') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterInnovation,
  onNavigateLogin
}) => {
  return (
    <div className="min-h-screen web-void-bg text-[#f1f1f5] flex flex-col justify-between overflow-hidden">
      
      {/* 1. HERO & EVENT TITLE CARD */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Subtle Background Radial Web Animation */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none animate-pulse" />
          <svg className="w-[700px] h-[700px] opacity-15 animate-web-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#e11d48" strokeWidth="0.2" fill="none" strokeDasharray="2 4" />
            <circle cx="50" cy="50" r="30" stroke="#ff1a40" strokeWidth="0.3" fill="none" />
            <circle cx="50" cy="50" r="15" stroke="#ffffff" strokeWidth="0.5" fill="none" strokeDasharray="3 3" />
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={50 + 48 * Math.cos((i * Math.PI) / 4)}
                y2={50 + 48 * Math.sin((i * Math.PI) / 4)}
                stroke="#e11d48"
                strokeWidth="0.25"
              />
            ))}
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10 space-y-8">
          
          {/* Official CSI KARE Chapter Badge */}
          <div className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-full glass-card-subtle shadow-glow-subtle">
            <img src="/csi-logo.png" alt="CSI KARE" className="h-7 w-auto drop-shadow-sm" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-red-300 uppercase">
              CSI KARE STUDENT CHAPTER
            </span>
          </div>

          {/* Prominent Transparent WEBX Logo */}
          <div className="flex flex-col items-center justify-center py-4">
            <img
              src="/webx-logo.png"
              alt="WEBX"
              className="h-44 sm:h-64 md:h-72 w-auto max-w-full object-contain filter drop-shadow-[0_0_35px_rgba(225,29,72,0.45)] transition-transform hover:scale-105 duration-300"
            />
          </div>

          {/* Core Event Details Matrix - Pure Glassmorphism */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-3xl mx-auto pt-2">
            <div className="p-4 rounded-2xl glass-card-subtle glass-panel-hover text-center">
              <Calendar className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-white uppercase font-display">3–4 October 2026</div>
              <div className="text-[10px] text-zinc-400 font-mono">24-Hour Hackathon</div>
            </div>

            <div className="p-4 rounded-2xl glass-card-subtle glass-panel-hover text-center">
              <MapPin className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-white uppercase font-display">8th Block Hall</div>
              <div className="text-[10px] text-zinc-400 font-mono">KARE Campus</div>
            </div>

            <div className="p-4 rounded-2xl glass-card-subtle glass-panel-hover text-center">
              <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-white uppercase font-display">2 EE Credits</div>
              <div className="text-[10px] text-zinc-400 font-mono">Official Academic</div>
            </div>

            <div className="p-4 rounded-2xl glass-card-subtle glass-panel-hover text-center">
              <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-white uppercase font-display">₹15,000 Pool</div>
              <div className="text-[10px] text-zinc-400 font-mono">Cash + Trophies</div>
            </div>
          </div>

          {/* MAIN PROMINENT CTA: ENTER THE INNOVATION */}
          <div className="pt-6">
            <button
              onClick={onEnterInnovation}
              className="group relative inline-flex items-center justify-center space-x-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-crimson-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-widest shadow-glow-crimson transition-all duration-300 hover:scale-105"
            >
              <span>ENTER THE INNOVATION</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>
      </section>

      {/* 2. PRIZE PODIUM SECTION - PURE GLASS */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <div className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold">
              OFFICIAL CASH PRIZES
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-display text-white">
              ₹15,000 <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">PRIZE PODIUM</span>
            </h2>
          </div>

          {/* Olympic-style Standing Podium (1st Taller Center) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end">
            
            {/* 2nd Place (Silver) */}
            <div className="order-2 md:order-1 relative rounded-3xl glass-card-subtle glass-panel-hover p-6 text-center space-y-4 shadow-xl transform md:translate-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-500/50 flex items-center justify-center font-display font-black text-xl text-slate-200">
                2
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600/50 text-slate-300 text-[11px] font-mono font-semibold uppercase">
                  Runner Up
                </span>
                <div className="text-3xl font-black text-white font-display mt-3">₹5,000</div>
                <div className="text-xs text-zinc-400 mt-1">Cash Prize + Silver Trophy</div>
              </div>
              <div className="h-20 bg-gradient-to-t from-slate-900/60 to-transparent rounded-xl flex items-center justify-center text-xs font-mono text-slate-400 border border-white/5">
                2ND RANK
              </div>
            </div>

            {/* 1st Place (Gold - Tallest & Prominent) */}
            <div className="order-1 md:order-2 relative rounded-3xl glass-crimson p-8 text-center space-y-5 shadow-glow-crimson transform md:-translate-y-4 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-[11px] uppercase tracking-widest shadow-lg">
                CHAMPIONS
              </div>

              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-amber-300 flex items-center justify-center font-display font-black text-3xl text-black shadow-lg">
                1
              </div>
              
              <div>
                <span className="px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs font-mono font-bold uppercase">
                  Grand Winner
                </span>
                <div className="text-4xl md:text-5xl font-black text-white font-display mt-3 text-glow-white">
                  ₹6,000
                </div>
                <div className="text-xs text-amber-200/90 mt-1">
                  Cash Prize + Winner Trophy + Incubation Fastrack
                </div>
              </div>

              <div className="h-28 bg-gradient-to-t from-amber-950/50 to-transparent rounded-xl flex items-center justify-center text-xs font-mono text-amber-400 font-bold border border-amber-500/30">
                ★ 1ST RANK CHAMPION ★
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="order-3 relative rounded-3xl glass-card-subtle glass-panel-hover p-6 text-center space-y-4 shadow-xl transform md:translate-y-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-950/80 border border-amber-800/60 flex items-center justify-center font-display font-black text-xl text-amber-400">
                3
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/50 text-amber-300 text-[11px] font-mono font-semibold uppercase">
                  2nd Runner Up
                </span>
                <div className="text-3xl font-black text-white font-display mt-3">₹4,000</div>
                <div className="text-xs text-zinc-400 mt-1">Cash Prize + Bronze Trophy</div>
              </div>
              <div className="h-14 bg-gradient-to-t from-amber-950/40 to-transparent rounded-xl flex items-center justify-center text-xs font-mono text-amber-500 border border-white/5">
                3RD RANK
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. OFFICIAL FOOTER WITH PURE GLASS */}
      <footer className="border-t border-white/5 glass-nav py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-5">
            <img src="/webx-logo.png" alt="WEBX" className="h-9 w-auto" />
            <div className="h-6 w-px bg-white/10" />
            <img src="/csi-logo.png" alt="CSI KARE" className="h-7 w-auto drop-shadow-sm" />
          </div>

          {/* Made with Love Tribute */}
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <span>Made with</span>
            <span className="text-red-500 animate-pulse text-sm">❤️</span>
            <span>by <strong className="text-zinc-200 font-bold">CSI KARE Student Team</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
};
