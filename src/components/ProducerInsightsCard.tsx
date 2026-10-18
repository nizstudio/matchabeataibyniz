import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Copy,
  BookmarkPlus,
  Check,
  Cpu,
  Layers,
  Gauge,
} from 'lucide-react';
import { ProducerInsight } from '../types';

interface ProducerInsightsCardProps {
  insights: ProducerInsight;
  currentTitle: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRegenerate: () => void;
  onSaveBeat: () => void;
  isSaved?: boolean;
}

export const ProducerInsightsCard: React.FC<ProducerInsightsCardProps> = ({
  insights,
  currentTitle,
  isPlaying,
  onTogglePlay,
  onRegenerate,
  onSaveBeat,
  isSaved = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `MatchaBeats AI - ${currentTitle}\nMode: ${insights.mode}\nTempo: ${insights.tempoText}\nSynth: ${insights.synthesizer}\nScale: ${insights.keySignature || 'Pentatonic'}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#F8FAF7] rounded-2xl border border-[#DDE6DA] p-5 sm:p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#DDE6DA] text-[#1F3526]">
                <Cpu className="w-4 h-4 text-[#3E6248]" />
              </span>
              <h2 className="text-sm font-bold tracking-wider text-[#1E2A22] uppercase">
                Producer AI Insights
              </h2>
            </div>
            <p className="text-base font-bold text-[#1F3526] mt-2 tracking-tight">
              {currentTitle}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EEF3EC] border border-[#CAD8C6] text-[#3E6248]">
            <Sparkles className="w-3 h-3 text-[#3E6248]" />
            AI Ready
          </span>
        </div>

        {/* Studio Status Box */}
        <div className="bg-[#EEF3EC] rounded-xl p-4 border border-[#CAD8C6]/80 mb-4 space-y-2.5">
          <div className="text-xs font-bold text-[#1F3526] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3E6248]"></span>
            <span>MatchaBeats AI Studio Ready!</span>
          </div>

          <div className="space-y-1.5 text-xs text-[#1E2A22] pt-1 border-t border-[#DDE6DA]/80">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#68756B] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#3E6248]" /> Mode:
              </span>
              <span className="font-semibold text-[#1F3526]">{insights.mode}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#68756B] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#3E6248]" /> Tempo:
              </span>
              <span className="font-semibold text-[#1F3526]">{insights.tempoText}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#68756B] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#3E6248]" /> Synthesizer:
              </span>
              <span className="font-semibold text-[#1F3526]">{insights.synthesizer}</span>
            </div>
          </div>
        </div>

        {/* Short explanation */}
        <p className="text-xs text-[#68756B] leading-relaxed mb-5">
          Click <strong className="text-[#1F3526]">Play Beat</strong> above or type ANY prompt in the box to generate custom sound patterns instantly!
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-[#DDE6DA]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Play Beat Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
              isPlaying
                ? 'bg-[#3E6248] text-white hover:bg-[#2A4633]'
                : 'bg-[#1F3526] text-white hover:bg-[#2A4633]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play Beat</span>
              </>
            )}
          </button>

          {/* Re-generate Button */}
          <button
            type="button"
            onClick={onRegenerate}
            className="px-3 py-2.5 rounded-xl font-semibold text-xs bg-[#F8FAF7] hover:bg-[#EEF3EC] text-[#1E2A22] border border-[#DDE6DA] hover:border-[#CAD8C6] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            title="Create a variation of this beat"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#3E6248]" />
            <span>Re-generate</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2.5 rounded-xl font-semibold text-xs bg-[#F8FAF7] hover:bg-[#EEF3EC] text-[#1E2A22] border border-[#DDE6DA] hover:border-[#CAD8C6] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            title="Copy beat specs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#3E6248]" />
                <span className="text-[#3E6248]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#68756B]" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Save Beat Button */}
          <button
            type="button"
            onClick={onSaveBeat}
            className={`col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98 ${
              isSaved
                ? 'bg-[#EEF3EC] text-[#3E6248] border-[#CAD8C6]'
                : 'bg-[#F8FAF7] hover:bg-[#EEF3EC] text-[#1E2A22] border-[#DDE6DA] hover:border-[#CAD8C6]'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#3E6248]" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-[#3E6248]" />
                <span>Save Beat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
