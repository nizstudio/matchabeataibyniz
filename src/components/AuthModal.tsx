import React, { useState } from 'react';
import { X, User, CheckCircle2, LogOut, ShieldCheck, HardDrive } from 'lucide-react';
import { UserSession } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onUpdateSession: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onUpdateSession,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      onUpdateSession({
        isGuest: false,
        userName: 'Matcha Producer',
        userEmail: 'creator@matchabeats.ai',
      });
      setLoading(false);
      onClose();
    }, 600);
  };

  const handleSignOut = () => {
    onUpdateSession({
      isGuest: true,
      userName: undefined,
      userEmail: undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8FAF7] w-full max-w-md rounded-2xl border border-[#DDE6DA] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#DDE6DA] flex items-center justify-between bg-[#EEF3EC]/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#1F3526] text-white">
              <User className="w-4 h-4 text-[#DDE6DA]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#1E2A22]">
                {userSession.isGuest ? 'Sign In to MatchaBeats' : 'Account Details'}
              </h2>
              <p className="text-xs text-[#68756B]">
                {userSession.isGuest ? 'Optional Google Cloud Sync' : 'Session & Sync Status'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#68756B] hover:text-[#1E2A22] hover:bg-[#DDE6DA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {userSession.isGuest ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF3EC] border border-[#CAD8C6] flex items-center justify-center mx-auto text-[#1F3526]">
                <ShieldCheck className="w-7 h-7 text-[#3E6248]" />
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#1E2A22]">
                  You are currently using Guest Mode
                </h3>
                <p className="text-xs text-[#68756B] mt-1.5 leading-relaxed">
                  All beat generation, Web Audio synthesis, and WAV/MIDI exports work freely without logging in!
                </p>
              </div>

              <div className="bg-[#EEF3EC]/80 rounded-xl p-3.5 border border-[#DDE6DA] text-left text-xs text-[#1E2A22] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#1F3526]">
                  <HardDrive className="w-3.5 h-3.5 text-[#3E6248]" />
                  <span>Local Browser Storage Active</span>
                </div>
                <p className="text-[11px] text-[#68756B]">
                  Your saved library beats are safely stored in your browser. Sign in with Google to enable cross-device cloud sync.
                </p>
              </div>

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#1F3526] hover:bg-[#2A4633] text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#EEF3EC] border border-[#CAD8C6]">
                <div className="w-10 h-10 rounded-full bg-[#1F3526] text-white flex items-center justify-center font-bold text-sm">
                  MP
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1F3526] flex items-center gap-1.5">
                    <span>{userSession.userName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3E6248]" />
                  </div>
                  <div className="text-xs text-[#68756B]">{userSession.userEmail}</div>
                </div>
              </div>

              <div className="text-xs text-[#68756B] bg-[#EEF3EC]/50 p-3 rounded-lg border border-[#DDE6DA]">
                Connected to MatchaBeats Cloud Library. Your beat patterns are automatically synced.
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-xl border border-[#CAD8C6] hover:bg-[#EEF3EC] text-[#1E2A22] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#8FA78A]" />
                <span>Switch to Guest Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
