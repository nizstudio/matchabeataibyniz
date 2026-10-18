import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Lightbulb } from 'lucide-react';

interface PromptCardProps {
  currentPrompt: string;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  onShowCreativeIdeas: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  currentPrompt,
  onGenerate,
  isGenerating,
  onShowCreativeIdeas,
}) => {
  const [inputText, setInputText] = useState(currentPrompt || '');

  const suggestions = [
    { label: 'Chill lo-fi hip hop beat', type: 'prompt' },
    { label: '8-bit retro arcade jump sound', type: 'prompt' },
    { label: 'Rainy cyberpunk background hum', type: 'prompt' },
    { label: '80s synthwave drive beat', type: 'prompt' },
    { label: 'Give me 5 creative beat ideas', type: 'ideas' },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onGenerate(inputText.trim());
  };

  const handleChipClick = (suggestion: { label: string; type: string }) => {
    if (suggestion.type === 'ideas') {
      onShowCreativeIdeas();
    } else {
      setInputText(suggestion.label);
      onGenerate(suggestion.label);
    }
  };

  return (
    <div className="bg-[#F8FAF7] rounded-2xl border border-[#DDE6DA] p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#DDE6DA] text-[#1F3526]">
              <Sparkles className="w-4 h-4 text-[#3E6248]" />
            </span>
            <h2 className="text-sm font-bold tracking-wider text-[#1E2A22] uppercase">
              AI Sound &amp; Beat Prompt
            </h2>
          </div>
          <p className="text-xs text-[#68756B] mt-1 font-medium">
            Ask ANYTHING sound or beat related
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask for a sound, beat, or lo-fi vibe..."
            className="w-full pl-4 pr-32 py-3.5 rounded-xl bg-[#EEF3EC]/80 border border-[#DDE6DA] focus:border-[#3E6248] focus:bg-[#F8FAF7] text-[#1E2A22] placeholder-[#8FA78A] text-sm font-medium outline-hidden transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={isGenerating || !inputText.trim()}
            className="absolute right-1.5 px-4 py-2 rounded-lg bg-[#1F3526] hover:bg-[#2A4633] disabled:opacity-50 disabled:hover:bg-[#1F3526] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Generate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div>
        <div className="text-[11px] font-semibold text-[#68756B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>Suggestions</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {suggestions.map((item, idx) => {
            const isSpecial = item.type === 'ideas';
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(item)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5 cursor-pointer active:scale-98 ${
                  isSpecial
                    ? 'bg-[#EEF3EC] border-[#CAD8C6] text-[#1F3526] font-semibold hover:bg-[#DDE6DA]'
                    : 'bg-[#F8FAF7] border-[#DDE6DA] text-[#1E2A22] hover:bg-[#EEF3EC] hover:border-[#CAD8C6]'
                }`}
              >
                {isSpecial && <Lightbulb className="w-3.5 h-3.5 text-[#3E6248]" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
