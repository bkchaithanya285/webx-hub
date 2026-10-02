import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  ShieldAlert,
  Users,
  QrCode,
  Award,
  LogIn,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openLoginModal: (role?: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openLoginModal }) => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#06060c]/60 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Chapter Crest */}
          <div className="flex items-center space-x-5">
            <button
              onClick={() => setActiveTab('landing')}
              className="flex items-center space-x-3 text-left group focus:outline-none"
            >
              <img
                src="/webx-logo.png"
                alt="WEBX COMMAND"
                className="title-card-logo h-11 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </button>

            <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-[#241722]">
              <img
                src="/csi-logo.png"
                alt="CSI KARE"
                className="h-8 w-auto opacity-85 hover:opacity-100 transition-opacity drop-shadow-sm"
              />
            </div>
          </div>

          {/* Navigation Items (Portals when authenticated) */}
          <div className="flex items-center space-x-2">
            
            {/* Authenticated Portal Shortcuts */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-crimson'
                    : 'text-red-400 hover:bg-red-950/40 border border-red-900/40'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Command</span>
              </button>
            )}

            {currentUser?.role === 'team_lead' && (
              <button
                onClick={() => setActiveTab('team')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'team'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-crimson'
                    : 'text-rose-400 hover:bg-rose-950/40 border border-rose-900/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Portal ({currentUser.teamId})</span>
              </button>
            )}

            {currentUser?.role === 'volunteer' && (
              <button
                onClick={() => setActiveTab('volunteer')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'volunteer'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-crimson'
                    : 'text-amber-400 hover:bg-amber-950/40 border border-amber-900/40'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Volunteer Scanner</span>
              </button>
            )}

            {currentUser?.role === 'reviewer' && (
              <button
                onClick={() => setActiveTab('reviewer')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'reviewer'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-crimson'
                    : 'text-sky-400 hover:bg-sky-950/40 border border-sky-900/40'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Reviewer Jury</span>
              </button>
            )}

            {/* Auth Action */}
            {currentUser ? (
              <div className="flex items-center space-x-3 pl-2">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white">{currentUser.name}</div>
                  <div className="text-[10px] font-mono text-red-400 uppercase">
                    {currentUser.role === 'team_lead' ? `Lead • ${currentUser.teamId}` : currentUser.role}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/70 border border-red-800/50 text-red-400 hover:text-white transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openLoginModal('team_lead')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-crimson-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black tracking-wider uppercase shadow-glow-crimson transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Team Login</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
};
