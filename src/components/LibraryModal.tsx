import React from 'react';
import {
  X,
  FolderHeart,
  Play,
  Trash2,
  Download,
  FileMusic,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Beat } from '../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedBeats: Beat[];
  currentBeatId: string;
  onLoadBeat: (beat: Beat) => void;
  onDeleteBeat: (beatId: string) => void;
  onExportWav: (beat: Beat) => void;
  onExportMidi: (beat: Beat) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  savedBeats,
  currentBeatId,
  onLoadBeat,
  onDeleteBeat,
  onExportWav,
  onExportMidi,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8FAF7] w-full max-w-2xl rounded-2xl border border-[#DDE6DA] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#DDE6DA] flex items-center justify-between bg-[#EEF3EC]/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#1F3526] text-white">
              <FolderHeart className="w-4 h-4 text-[#DDE6DA]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#1E2A22]">Matcha Library</h2>
              <p className="text-xs text-[#68756B]">
                Your saved sound creations and beat patterns ({savedBeats.length})
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

        {/* Beats List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {savedBeats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FolderHeart className="w-10 h-10 text-[#CAD8C6] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1E2A22]">Your library is empty</p>
              <p className="text-xs text-[#68756B] mt-1 max-w-sm mx-auto">
                Generate a beat or click &quot;Save Beat&quot; under Producer Insights to save your favorite patterns here!
              </p>
            </div>
          ) : (
            savedBeats.map((beat) => {
              const isCurrent = beat.id === currentBeatId;
              const formattedDate = new Date(beat.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={beat.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#EEF3EC] border-[#3E6248] ring-1 ring-[#3E6248]/30'
                      : 'bg-[#F8FAF7] border-[#DDE6DA] hover:border-[#CAD8C6] hover:bg-[#EEF3EC]/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Beat Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1F3526]">
                          {beat.title}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DDE6DA] text-[#1F3526]">
                          {beat.genre}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-[#3E6248] text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#68756B] line-clamp-1 italic">
                        &quot;{beat.prompt}&quot;
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#68756B] pt-0.5">
                        <span className="flex items-center gap-1 font-mono font-semibold text-[#1F3526]">
                          BPM {beat.bpm}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#3E6248]" />
                          {beat.tracks.length} Tracks
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8FA78A]" />
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onLoadBeat(beat);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1F3526] text-white hover:bg-[#2A4633] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        title="Load into sequencer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Load &amp; Play</span>
                      </button>

                      <button
                        onClick={() => onExportWav(beat)}
                        className="p-1.5 rounded-lg text-xs bg-[#EEF3EC] hover:bg-[#DDE6DA] text-[#1F3526] border border-[#CAD8C6] transition-colors cursor-pointer"
                        title="Export WAV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onExportMidi(beat)}
                        className="p-1.5 rounded-lg text-xs bg-[#EEF3EC] hover:bg-[#DDE6DA] text-[#1F3526] border border-[#CAD8C6] transition-colors cursor-pointer"
                        title="Export MIDI"
                      >
                        <FileMusic className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteBeat(beat.id)}
                        className="p-1.5 rounded-lg text-xs text-[#8FA78A] hover:text-rose-600 hover:bg-[#DDE6DA] transition-colors cursor-pointer"
                        title="Delete from Library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDE6DA] bg-[#EEF3EC]/50 flex items-center justify-between text-xs text-[#68756B]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3E6248]" />
            Saved locally in browser storage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAF7] border border-[#DDE6DA] hover:bg-[#EEF3EC] text-[#1E2A22] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
