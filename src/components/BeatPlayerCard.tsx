import React from 'react';
import { Play, Pause, Download, FileMusic, Sliders } from 'lucide-react';

interface BeatPlayerCardProps {
  title: string;
  genre: string;
  bpm: number;
  stepsCount: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onBpmChange: (newBpm: number) => void;
  onExportWav: () => void;
  onExportMidi: () => void;
  isExportingWav: boolean;
}

export const BeatPlayerCard: React.FC<BeatPlayerCardProps> = ({
  title,
  genre,
  bpm,
  stepsCount,
  isPlaying,
  onTogglePlay,
  onBpmChange,
  onExportWav,
  onExportMidi,
  isExportingWav,
}) => {
  return (
    <div className="bg-[#1F3526] text-[#EEF3EC] rounded-2xl p-5 sm:p-6 shadow-md border border-[#2A4633] transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3E6248] text-[#EEF3EC] border border-[#4F7B5C]/60">
              {genre}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#DDE6DA]/80 tracking-wider">
            <span>{stepsCount} STEPS</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              BPM <strong className="text-white font-mono text-sm">{bpm}</strong>
            </span>
          </div>
        </div>

        {/* BPM Slider & Master Controls */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          {/* BPM Slider Control */}
          <div className="flex items-center gap-3 bg-[#2A4633]/60 px-3.5 py-2 rounded-xl border border-[#3E6248]/50">
            <Sliders className="w-3.5 h-3.5 text-[#DDE6DA]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#DDE6DA]/70 uppercase tracking-wider">
                TEMPO
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={bpm}
                  onChange={(e) => onBpmChange(Number(e.target.value))}
                  className="w-24 sm:w-28 h-1.5 bg-[#1F3526] rounded-lg appearance-none cursor-pointer accent-[#DDE6DA]"
                />
                <span className="font-mono text-xs font-bold w-7 text-right text-white">
                  {bpm}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Play/Pause, Export WAV, Export MIDI */}
          <div className="flex items-center gap-2">
            {/* Big Play / Pause button */}
            <button
              type="button"
              onClick={onTogglePlay}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95 ${
                isPlaying
                  ? 'bg-[#EEF3EC] text-[#1F3526] hover:bg-white'
                  : 'bg-[#3E6248] text-white hover:bg-[#4E7A5A] ring-2 ring-[#EEF3EC]/20'
              }`}
              title={isPlaying ? 'Pause Beat' : 'Play Beat'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Export WAV */}
            <button
              type="button"
              onClick={onExportWav}
              disabled={isExportingWav}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#2A4633] hover:bg-[#345840] disabled:opacity-50 text-white border border-[#3E6248] transition-all shadow-xs cursor-pointer active:scale-98"
              title="Download master audio in 16-bit WAV format"
            >
              <Download className="w-3.5 h-3.5 text-[#DDE6DA]" />
              <span>{isExportingWav ? 'Exporting...' : 'Export WAV'}</span>
            </button>

            {/* Export MIDI */}
            <button
              type="button"
              onClick={onExportMidi}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#2A4633] hover:bg-[#345840] text-white border border-[#3E6248] transition-all shadow-xs cursor-pointer active:scale-98"
              title="Download MIDI file compatible with any DAW (Ableton, FL Studio, Logic)"
            >
              <FileMusic className="w-3.5 h-3.5 text-[#DDE6DA]" />
              <span>Export MIDI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
