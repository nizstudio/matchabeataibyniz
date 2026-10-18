import React from 'react';
import { Music, FolderHeart, User, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  libraryCount: number;
  onOpenLibrary: () => void;
  onOpenAuth: () => void;
  userSession: UserSession;
}

export const Navbar: React.FC<NavbarProps> = ({
  libraryCount,
  onOpenLibrary,
  onOpenAuth,
  userSession,
}) => {
  return (
    <header className="border-b border-[#DDE6DA] bg-[#F8FAF7]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* LEFT BRANDING */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#1F3526] text-[#EEF3EC] flex items-center justify-center shadow-sm ring-1 ring-[#1F3526]/10">
            <Music className="w-5 h-5 text-[#DDE6DA]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-[#1E2A22]">
                MatchaBeats AI
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#DDE6DA] text-[#1F3526] border border-[#CAD8C6]">
                v2.5
              </span>
            </div>
            <p className="text-xs text-[#68756B] font-medium hidden sm:block">
              AI Sound Synthesizer &amp; Beat Assistant
            </p>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Guest Badge */}
          {userSession.isGuest ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EEF3EC] border border-[#DDE6DA] text-[#3E6248]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3E6248] animate-pulse"></span>
              <span>Guest</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DA] text-[#1F3526]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3E6248]" />
              <span className="truncate max-w-[120px]">{userSession.userName || 'Signed In'}</span>
            </div>
          )}

          {/* Matcha Library Button */}
          <button
            onClick={onOpenLibrary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#F8FAF7] hover:bg-[#EEF3EC] text-[#1E2A22] border border-[#DDE6DA] hover:border-[#CAD8C6] transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <FolderHeart className="w-4 h-4 text-[#3E6248]" />
            <span>Matcha Library</span>
            {libraryCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#1F3526] text-white">
                {libraryCount}
              </span>
            )}
          </button>

          {/* Google Sign-in / Account Button */}
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1F3526] hover:bg-[#2A4633] text-white transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <User className="w-4 h-4 text-[#DDE6DA]" />
            <span className="hidden sm:inline">
              {userSession.isGuest ? 'Google Sign-In' : 'Account'}
            </span>
          </button>
        </div>
      </div>
      {/* Mobile Subtitle */}
      <div className="sm:hidden px-4 pb-2 text-[11px] text-[#68756B] font-medium border-t border-[#DDE6DA]/50 pt-1">
        AI Sound Synthesizer &amp; Beat Assistant
      </div>
    </header>
  );
};
