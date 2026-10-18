import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Music,
  Headphones,
  SlidersHorizontal,
} from 'lucide-react';
import { InstrumentType, Track } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface SequencerProps {
  tracks: Track[];
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (trackId: string, stepIndex: number) => void;
  onToggleMute: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onAddTrack: (type: InstrumentType, name: string) => void;
}

const AVAILABLE_INSTRUMENTS: { type: InstrumentType; name: string; category: string }[] = [
  { type: 'bass', name: 'Bass (808 / Sub)', category: 'Melodic' },
  { type: 'piano', name: 'Piano (Rhodes / Keys)', category: 'Melodic' },
  { type: 'guitar', name: 'Guitar Pluck', category: 'Melodic' },
  { type: 'pad', name: 'Warm Pad Chords', category: 'Melodic' },
  { type: 'clap', name: 'Hand Clap', category: 'Percussion' },
  { type: 'tom', name: 'Acoustic Tom', category: 'Percussion' },
  { type: 'percussion', name: 'Wood Percussion', category: 'Percussion' },
  { type: 'synthLead', name: 'Retro Synth Lead', category: 'Melodic' },
];

export const Sequencer: React.FC<SequencerProps> = ({
  tracks,
  currentStep,
  isPlaying,
  onToggleStep,
  onToggleMute,
  onDeleteTrack,
  onTrackVolumeChange,
  onAddTrack,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handlePreview = (track: Track) => {
    audioEngine.previewSound(track.type, track.notes ? track.notes[0] : 60);
  };

  const handleAddSelect = (inst: { type: InstrumentType; name: string }) => {
    onAddTrack(inst.type, inst.name.split(' (')[0]);
    setShowAddMenu(false);
  };

  return (
    <div className="bg-[#F8FAF7] rounded-2xl border border-[#DDE6DA] p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#DDE6DA] text-[#1F3526]">
            <SlidersHorizontal className="w-4 h-4 text-[#3E6248]" />
          </span>
          <h2 className="text-sm font-bold tracking-wider text-[#1E2A22] uppercase">
            Track / Step
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#68756B] hidden sm:block">
          16-Step Pattern Sequencer
        </span>
      </div>

      {/* Sequencer Scrollable Area */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[680px]">
          {/* Step Numbers Header */}
          <div className="grid grid-cols-[180px_repeat(16,1fr)] gap-1.5 items-center mb-2.5 pb-2 border-b border-[#DDE6DA]/80">
            <div className="text-[11px] font-bold text-[#68756B] uppercase tracking-wider pl-2">
              Instruments
            </div>
            {Array.from({ length: 16 }).map((_, idx) => {
              const isCurrent = isPlaying && currentStep === idx;
              const isBeatStart = idx % 4 === 0;
              return (
                <div
                  key={idx}
                  className={`text-center py-1 rounded text-[11px] font-mono font-bold transition-all ${
                    isCurrent
                      ? 'bg-[#1F3526] text-white shadow-xs scale-105'
                      : isBeatStart
                      ? 'text-[#1F3526] font-extrabold bg-[#DDE6DA]/60'
                      : 'text-[#68756B]'
                  }`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>

          {/* Instrument Rows */}
          <div className="space-y-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`grid grid-cols-[180px_repeat(16,1fr)] gap-1.5 items-center p-1.5 rounded-xl transition-colors ${
                  track.muted ? 'bg-[#EEF3EC]/40 opacity-60' : 'bg-[#EEF3EC]/70 hover:bg-[#EEF3EC]'
                }`}
              >
                {/* Track Left Controls: Name, Preview, Mute, Volume, Delete */}
                <div className="flex items-center justify-between pr-2 pl-1">
                  <div className="flex items-center gap-1.5 truncate mr-1">
                    <button
                      type="button"
                      onClick={() => handlePreview(track)}
                      title="Preview sound"
                      className="p-1 rounded-md text-[#3E6248] hover:bg-[#DDE6DA] transition-all cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                    </button>
                    <span
                      onClick={() => handlePreview(track)}
                      className="text-xs font-bold text-[#1E2A22] truncate cursor-pointer hover:text-[#3E6248] transition-colors"
                      title={track.name}
                    >
                      {track.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Mute button */}
                    <button
                      type="button"
                      onClick={() => onToggleMute(track.id)}
                      className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                        track.muted
                          ? 'bg-[#CAD8C6] text-[#68756B]'
                          : 'text-[#1F3526] hover:bg-[#DDE6DA]'
                      }`}
                      title={track.muted ? 'Unmute track' : 'Mute track'}
                    >
                      {track.muted ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete track (if more than 1 track) */}
                    {tracks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-1 rounded-md text-[#8FA78A] hover:text-rose-600 hover:bg-[#DDE6DA] transition-colors cursor-pointer"
                        title="Remove track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 16 Step Buttons */}
                {track.steps.map((isActive, stepIdx) => {
                  const isCurrent = isPlaying && currentStep === stepIdx;
                  const isBeatStart = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      type="button"
                      onClick={() => onToggleStep(track.id, stepIdx)}
                      className={`h-9 rounded-lg transition-all cursor-pointer relative flex items-center justify-center ${
                        isActive
                          ? 'bg-[#1F3526] hover:bg-[#2A4633] text-white shadow-xs'
                          : isBeatStart
                          ? 'bg-[#DDE6DA] hover:bg-[#CAD8C6]'
                          : 'bg-[#E5ECE3] hover:bg-[#D4DFD2]'
                      } ${
                        isCurrent
                          ? 'ring-2 ring-[#3E6248] ring-offset-1 scale-102'
                          : ''
                      }`}
                      title={`Step ${stepIdx + 1}: ${isActive ? 'Active' : 'Empty'}`}
                    >
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EEF3EC]"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Instrument Track Button */}
      <div className="mt-4 pt-3 border-t border-[#DDE6DA] relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#EEF3EC] hover:bg-[#DDE6DA] text-[#1F3526] border border-[#CAD8C6] transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 text-[#3E6248]" />
          <span>+ Add New Instrument Track</span>
        </button>

        {/* Add Instrument Dropdown */}
        {showAddMenu && (
          <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#F8FAF7] rounded-xl border border-[#CAD8C6] shadow-xl p-2 z-20 space-y-1">
            <div className="text-[11px] font-bold text-[#68756B] uppercase tracking-wider px-2 py-1">
              Select Instrument
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {AVAILABLE_INSTRUMENTS.map((inst, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddSelect(inst)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[#1E2A22] hover:bg-[#EEF3EC] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-[#3E6248]" />
                    <span>{inst.name}</span>
                  </span>
                  <span className="text-[10px] text-[#68756B] bg-[#DDE6DA] px-1.5 py-0.5 rounded">
                    {inst.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
