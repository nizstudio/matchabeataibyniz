import React from 'react';
import { X, Lightbulb, Sparkles, ArrowRight } from 'lucide-react';
import { CREATIVE_BEAT_IDEAS } from '../ai/promptAnalyzer';

interface CreativeIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIdea: (prompt: string) => void;
}

export const CreativeIdeasModal: React.FC<CreativeIdeasModalProps> = ({
  isOpen,
  onClose,
  onSelectIdea,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8FAF7] w-full max-w-lg rounded-2xl border border-[#DDE6DA] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#DDE6DA] flex items-center justify-between bg-[#EEF3EC]/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#1F3526] text-white">
              <Lightbulb className="w-4 h-4 text-[#DDE6DA]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#1E2A22]">5 Creative Beat Ideas</h2>
              <p className="text-xs text-[#68756B]">
                Curated vibes for video editing and content creation
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

        {/* Ideas List */}
        <div className="p-5 space-y-2.5 overflow-y-auto max-h-[70vh]">
          {CREATIVE_BEAT_IDEAS.map((idea, index) => (
            <div
              key={index}
              onClick={() => {
                onSelectIdea(idea.title);
                onClose();
              }}
              className="p-3.5 rounded-xl border border-[#DDE6DA] hover:border-[#3E6248] bg-[#EEF3EC]/50 hover:bg-[#EEF3EC] transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#1F3526] group-hover:text-[#3E6248] transition-colors">
                    {idea.title}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DDE6DA] text-[#1F3526]">
                    {idea.tag}
                  </span>
                </div>
                <p className="text-xs text-[#68756B] leading-relaxed">
                  {idea.desc}
                </p>
              </div>

              <div className="w-8 h-8 rounded-lg bg-[#DDE6DA] group-hover:bg-[#1F3526] group-hover:text-white flex items-center justify-center shrink-0 transition-colors text-[#1F3526]">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDE6DA] bg-[#EEF3EC]/50 flex items-center justify-between text-xs text-[#68756B]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3E6248]" />
            Click any idea to generate immediately
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAF7] border border-[#DDE6DA] hover:bg-[#EEF3EC] text-[#1E2A22] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
