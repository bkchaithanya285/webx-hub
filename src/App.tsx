import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { AdminPortal } from './components/admin/AdminPortal';
import { TeamPortal } from './components/team/TeamPortal';
import { VolunteerPortal } from './components/volunteer/VolunteerPortal';
import { ReviewerPortal } from './components/reviewer/ReviewerPortal';
import { ProblemStatementDrawer } from './components/common/ProblemStatementDrawer';
import { LoginModal } from './components/auth/LoginModal';
import { TeamLoginForm } from './components/auth/TeamLoginForm';
import { ProblemStatement, UserRole } from './types';
import { eventStore } from './services/store';

const AppContent: React.FC = () => {
  const { currentUser, loginAsAdmin, loginAsVolunteer, loginAsReviewer } = useAuth();
  
  // Initial tab resolution based on browser URL pathname
  const getInitialTab = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/team')) return 'team';
    if (path.includes('/attend') || path.includes('/volunteer')) return 'volunteer';
    if (path.includes('/review')) return 'reviewer';
    if (path.includes('/problem-statements')) return 'problem-statements';
    return 'landing';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);
  const [selectedPSForDrawer, setSelectedPSForDrawer] = useState<ProblemStatement | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalDefaultRole, setLoginModalDefaultRole] = useState<UserRole>('team_lead');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    let targetPath = '/';
    if (tab === 'admin') targetPath = '/admin';
    else if (tab === 'team') targetPath = '/team';
    else if (tab === 'volunteer') targetPath = '/attend';
    else if (tab === 'reviewer') targetPath = '/review';
    else if (tab === 'problem-statements') targetPath = '/problem-statements';

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Listen to browser forward/back buttons
  React.useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenPSDrawer = (ps: ProblemStatement) => {
    setSelectedPSForDrawer(ps);
    setIsDrawerOpen(true);
  };

  const handleOpenLogin = (role?: UserRole) => {
    if (role) setLoginModalDefaultRole(role);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (role: UserRole) => {
    if (role === 'admin') setActiveTab('admin');
    else if (role === 'team_lead') setActiveTab('team');
    else if (role === 'volunteer') setActiveTab('volunteer');
    else if (role === 'reviewer') setActiveTab('reviewer');
  };

  return (
    <div className="min-h-screen bg-[#06060a] text-[#f1f1f5] flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openLoginModal={handleOpenLogin}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onEnterInnovation={() => handleOpenLogin('team_lead')}
            onNavigateLogin={(role) => handleOpenLogin(role)}
          />
        )}

        {activeTab === 'problem-statements' && (
          <LandingPage
            onEnterInnovation={() => handleOpenLogin('team_lead')}
            onNavigateLogin={(role) => handleOpenLogin(role)}
          />
        )}

        {activeTab === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminPortal />
          ) : (
            <div className="min-h-[75vh] flex items-center justify-center p-6">
              <div className="p-8 rounded-3xl bg-[#0d0d18] border border-red-900/50 text-center max-w-md space-y-4 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-400 font-bold text-xl">
                  🛡️
                </div>
                <h2 className="text-xl font-bold text-white">Admin Command Access</h2>
                <p className="text-xs text-zinc-400 font-light">
                  Sign in with an authorized administrator Google account to access the command center.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const { signInWithGooglePopup } = await import('./services/firebase');
                      const result = await signInWithGooglePopup();
                      const email = result.user.email || '';
                      const name = result.user.displayName || '';
                      const res = loginAsAdmin(email, name);
                      if (!res.success) {
                        alert(res.error || "Access Denied. Your Google account is not on the Admin Allowlist.");
                      }
                    } catch (e: any) {
                      alert(e?.message || "Google Sign-In failed or popup was closed.");
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google (Admin)</span>
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'team' && (
          currentUser?.role === 'team_lead' ? (
            <TeamPortal onOpenPSDrawer={handleOpenPSDrawer} />
          ) : (
            <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
              <div className="relative w-full max-w-md rounded-3xl glass-modal-bg p-6 sm:p-8 z-10 overflow-hidden shadow-2xl">
                <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
                <TeamLoginForm isModal={false} />
              </div>
            </div>
          )
        )}

        {activeTab === 'volunteer' && (
          currentUser?.role === 'volunteer' ? (
            <VolunteerPortal />
          ) : (
            <div className="min-h-[75vh] flex items-center justify-center p-6">
              <div className="p-8 rounded-3xl bg-[#0d0d18] border border-amber-900/50 text-center max-w-md space-y-4 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 flex items-center justify-center mx-auto text-amber-400 font-bold text-xl">
                  📱
                </div>
                <h2 className="text-xl font-bold text-white">Volunteer Marshal Access</h2>
                <p className="text-xs text-zinc-400 font-light">
                  Sign in with your authorized volunteer Google account to access the rapid QR attendance scanner.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const { signInWithGooglePopup } = await import('./services/firebase');
                      const result = await signInWithGooglePopup();
                      const email = result.user.email || '';
                      const res = loginAsVolunteer(email, '1234');
                      if (!res.success) {
                        alert(res.error || `Volunteer account "${email}" is not authorized or inactive.`);
                      }
                    } catch (e: any) {
                      alert(e?.message || "Google Sign-In failed or popup was closed.");
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google (Volunteer)</span>
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'reviewer' && (
          currentUser?.role === 'reviewer' ? (
            <ReviewerPortal />
          ) : (
            <div className="min-h-[75vh] flex items-center justify-center p-6">
              <div className="p-8 rounded-3xl bg-[#0d0d18] border border-sky-900/50 text-center max-w-md space-y-4 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-sky-950/80 border border-sky-800 flex items-center justify-center mx-auto text-sky-400 font-bold text-xl">
                  ⚖️
                </div>
                <h2 className="text-xl font-bold text-white">Reviewer Jury Access</h2>
                <p className="text-xs text-zinc-400 font-light">
                  Sign in with your admin-registered reviewer Google account to evaluate projects.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const { signInWithGooglePopup } = await import('./services/firebase');
                      const result = await signInWithGooglePopup();
                      const email = result.user.email || '';
                      const name = result.user.displayName || '';
                      const res = loginAsReviewer(email, name);
                      if (!res.success) {
                        alert(res.error || `Reviewer account "${email}" is not authorized. Please check with the Admin.`);
                      } else {
                        setActiveTab('reviewer');
                      }
                    } catch (e: any) {
                      alert(e?.message || "Google Sign-In failed or popup was closed.");
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google (Reviewer)</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Slide-out Problem Statement Drawer */}
      <ProblemStatementDrawer
        problem={selectedPSForDrawer}
        allocation={selectedPSForDrawer ? eventStore.getAllocations()[selectedPSForDrawer.problemStatementId] : undefined}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onShowLogin={() => {
          setIsDrawerOpen(false);
          handleOpenLogin('team_lead');
        }}
      />

      {/* Global Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole={loginModalDefaultRole}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
