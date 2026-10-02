import React from 'react';
import { UserRole } from '../../types';
import { X } from 'lucide-react';
import { TeamLoginForm } from './TeamLoginForm';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Login Modal Card with Pure Glassmorphism */}
      <div className="relative w-full max-w-md rounded-3xl glass-modal-bg p-6 sm:p-8 z-10 overflow-hidden shadow-2xl">
        
        {/* Glow ambient halos */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Team Login Form */}
        <TeamLoginForm
          isModal={true}
          onSuccess={() => {
            onLoginSuccess('team_lead');
            onClose();
          }}
        />

      </div>
    </div>
  );
};

