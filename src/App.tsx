import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { PromptCard } from './components/PromptCard';
import { ProducerInsightsCard } from './components/ProducerInsightsCard';
import { BeatPlayerCard } from './components/BeatPlayerCard';
import { Sequencer } from './components/Sequencer';
import { AudioFxVisualizer } from './components/AudioFxVisualizer';
import { LibraryModal } from './components/LibraryModal';
import { AuthModal } from './components/AuthModal';
import { CreativeIdeasModal } from './components/CreativeIdeasModal';
import { AudioEffects, Beat, InstrumentType, Track, UserSession } from './types';
import { audioEngine } from './audio/audioEngine';
import { exportBeatToWav } from './audio/wavExporter';
import { exportBeatToMidi } from './audio/midiExporter';
import {
  analyzePromptAndGenerateBeat,
  INITIAL_DEFAULT_BEAT,
} from './ai/promptAnalyzer';

const STORAGE_KEY_BEATS = 'matchabeats_saved_library_v1';
const STORAGE_KEY_AUTH = 'matchabeats_user_session_v1';

export default function App() {
  // Current Beat State
  const [beat, setBeat] = useState<Beat>(INITIAL_DEFAULT_BEAT);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExportingWav, setIsExportingWav] = useState<boolean>(false);
  const [variationIndex, setVariationIndex] = useState<number>(1);

  // Saved Library
  const [savedBeats, setSavedBeats] = useState<Beat[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // Auth / Session
  const [userSession, setUserSession] = useState<UserSession>({ isGuest: true });
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Ideas Modal
  const [isIdeasOpen, setIsIdeasOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const beatRef = useRef<Beat>(beat);
  beatRef.current = beat;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BEATS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedBeats(parsed);
        } else {
          // Pre-populate with initial template
          setSavedBeats([INITIAL_DEFAULT_BEAT]);
        }
      } else {
        setSavedBeats([INITIAL_DEFAULT_BEAT]);
      }

      const authStored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (authStored) {
        setUserSession(JSON.parse(authStored));
      }
    } catch {
      setSavedBeats([INITIAL_DEFAULT_BEAT]);
    }
  }, []);

  // Sync engine when beat tracks or effects change
  useEffect(() => {
    audioEngine.setTracks(beat.tracks);
    audioEngine.setBpm(beat.bpm);
    audioEngine.updateEffects(beat.effects);
  }, [beat.tracks, beat.bpm, beat.effects]);

  // Hook step change callback from engine
  useEffect(() => {
    audioEngine.setOnStepChange((step) => {
      setCurrentStep(step);
    });

    return () => {
      audioEngine.stop();
    };
  }, []);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      audioEngine.setTracks(beat.tracks);
      audioEngine.setBpm(beat.bpm);
      audioEngine.updateEffects(beat.effects);
      audioEngine.start(beat.tracks, beat.bpm);
      setIsPlaying(true);
    }
  };

  // BPM change
  const handleBpmChange = (newBpm: number) => {
    setBeat((prev) => ({
      ...prev,
      bpm: newBpm,
      insights: {
        ...prev.insights,
        tempoText: `${newBpm} BPM`,
      },
    }));
    audioEngine.setBpm(newBpm);
  };

  // Toggle step in a track
  const handleToggleStep = (trackId: string, stepIndex: number) => {
    setBeat((prev) => {
      const updatedTracks = prev.tracks.map((t) => {
        if (t.id !== trackId) return t;
        const newSteps = [...t.steps];
        newSteps[stepIndex] = !newSteps[stepIndex];
        return { ...t, steps: newSteps };
      });
      return { ...prev, tracks: updatedTracks };
    });
  };

  // Mute / Unmute
  const handleToggleMute = (trackId: string) => {
    setBeat((prev) => {
      const updatedTracks = prev.tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      );
      return { ...prev, tracks: updatedTracks };
    });
  };

  // Delete Track
  const handleDeleteTrack = (trackId: string) => {
    setBeat((prev) => {
      if (prev.tracks.length <= 1) return prev;
      const updatedTracks = prev.tracks.filter((t) => t.id !== trackId);
      return { ...prev, tracks: updatedTracks };
    });
  };

  // Track Volume
  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setBeat((prev) => {
      const updatedTracks = prev.tracks.map((t) =>
        t.id === trackId ? { ...t, volume } : t
      );
      return { ...prev, tracks: updatedTracks };
    });
  };

  // Add new instrument track
  const handleAddTrack = (type: InstrumentType, name: string) => {
    const newId = `track-${type}-${Date.now()}`;
    const emptySteps = new Array(16).fill(false);

    // Provide friendly initial steps
    if (type === 'clap') {
      emptySteps[4] = true;
      emptySteps[12] = true;
    } else if (type === 'bass') {
      emptySteps[0] = true;
      emptySteps[6] = true;
      emptySteps[10] = true;
    } else if (type === 'tom' || type === 'percussion') {
      emptySteps[7] = true;
      emptySteps[15] = true;
    } else {
      emptySteps[0] = true;
      emptySteps[4] = true;
      emptySteps[8] = true;
      emptySteps[12] = true;
    }

    const newTrack: Track = {
      id: newId,
      name,
      type,
      muted: false,
      volume: 0.8,
      steps: emptySteps,
      notes: new Array(16).fill(60),
    };

    setBeat((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));

    // Trigger audio preview
    audioEngine.previewSound(type, 60);
    showToast(`Added ${name} track`);
  };

  // Audio FX change
  const handleEffectsChange = (updated: Partial<AudioEffects>) => {
    setBeat((prev) => ({
      ...prev,
      effects: { ...prev.effects, ...updated },
    }));
    audioEngine.updateEffects(updated);
  };

  // Generate Beat from Prompt
  const handleGenerate = (promptText: string) => {
    setIsGenerating(true);
    setVariationIndex(1);

    setTimeout(() => {
      const result = analyzePromptAndGenerateBeat(promptText, 1);
      const newBeat: Beat = {
        id: `beat-${Date.now()}`,
        title: result.title,
        genre: result.genre,
        mood: result.mood,
        bpm: result.bpm,
        stepsCount: 16,
        prompt: promptText,
        tracks: result.tracks,
        effects: result.effects,
        insights: result.insights,
        createdAt: new Date().toISOString(),
        version: 1,
      };

      setBeat(newBeat);
      audioEngine.setTracks(newBeat.tracks);
      audioEngine.setBpm(newBeat.bpm);
      audioEngine.updateEffects(newBeat.effects);

      setIsGenerating(false);
      showToast(`Generated: "${result.title}"`);
    }, 450);
  };

  // Re-generate variation with same prompt
  const handleRegenerate = () => {
    const nextVar = variationIndex + 1;
    setVariationIndex(nextVar);
    setIsGenerating(true);

    setTimeout(() => {
      const currentPrompt = beat.prompt || 'Chill lo-fi hip hop beat';
      const result = analyzePromptAndGenerateBeat(currentPrompt, nextVar);

      setBeat((prev) => ({
        ...prev,
        title: result.title,
        genre: result.genre,
        mood: result.mood,
        bpm: result.bpm,
        tracks: result.tracks,
        effects: result.effects,
        insights: result.insights,
        version: nextVar,
      }));

      audioEngine.setTracks(result.tracks);
      audioEngine.setBpm(result.bpm);
      audioEngine.updateEffects(result.effects);

      setIsGenerating(false);
      showToast(`Generated variation ${nextVar} (${result.bpm} BPM)`);
    }, 400);
  };

  // Save Beat to Library
  const handleSaveBeat = () => {
    const isAlreadySaved = savedBeats.some((b) => b.id === beat.id);
    let updated: Beat[];

    if (isAlreadySaved) {
      updated = savedBeats.map((b) => (b.id === beat.id ? beat : b));
    } else {
      updated = [beat, ...savedBeats];
    }

    setSavedBeats(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BEATS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(`Saved "${beat.title}" to Matcha Library`);
  };

  // Load Beat from Library
  const handleLoadBeat = (loaded: Beat) => {
    setBeat(loaded);
    audioEngine.setTracks(loaded.tracks);
    audioEngine.setBpm(loaded.bpm);
    audioEngine.updateEffects(loaded.effects);

    if (isPlaying) {
      audioEngine.stop();
      audioEngine.start(loaded.tracks, loaded.bpm);
    }
    showToast(`Loaded "${loaded.title}"`);
  };

  // Delete Beat from Library
  const handleDeleteBeat = (beatId: string) => {
    const updated = savedBeats.filter((b) => b.id !== beatId);
    setSavedBeats(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BEATS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast('Removed from library');
  };

  // Export WAV
  const handleExportWav = async (targetBeat?: Beat) => {
    const toExport = targetBeat || beat;
    setIsExportingWav(true);
    try {
      await exportBeatToWav(
        toExport.tracks,
        toExport.bpm,
        toExport.effects,
        toExport.title
      );
      showToast(`WAV exported: MatchaBeats_${toExport.title.replace(/\s+/g, '_')}.wav`);
    } catch (err) {
      console.error(err);
      showToast('WAV export error');
    } finally {
      setIsExportingWav(false);
    }
  };

  // Export MIDI
  const handleExportMidi = (targetBeat?: Beat) => {
    const toExport = targetBeat || beat;
    try {
      exportBeatToMidi(toExport.tracks, toExport.bpm, toExport.title);
      showToast(`MIDI exported: MatchaBeats_${toExport.title.replace(/\s+/g, '_')}.mid`);
    } catch (err) {
      console.error(err);
      showToast('MIDI export error');
    }
  };

  // Update Auth Session
  const handleUpdateSession = (session: UserSession) => {
    setUserSession(session);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
    } catch {
      // ignore
    }
    showToast(session.isGuest ? 'Switched to Guest Session' : 'Signed in with Google');
  };

  const isCurrentBeatSaved = savedBeats.some((b) => b.id === beat.id);

  return (
    <div className="min-h-screen bg-[#EEF3EC] flex flex-col text-[#1E2A22]">
      {/* 1. TOP NAVIGATION */}
      <Navbar
        libraryCount={savedBeats.length}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        userSession={userSession}
      />

      {/* 2. MAIN LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Prompt Card & Producer AI Insights Card */}
          <div className="lg:col-span-5 space-y-6">
            {/* 3. AI SOUND & BEAT PROMPT */}
            <PromptCard
              currentPrompt={beat.prompt}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onShowCreativeIdeas={() => setIsIdeasOpen(true)}
            />

            {/* 4. PRODUCER AI INSIGHTS */}
            <ProducerInsightsCard
              insights={beat.insights}
              currentTitle={beat.title}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onRegenerate={handleRegenerate}
              onSaveBeat={handleSaveBeat}
              isSaved={isCurrentBeatSaved}
            />
          </div>

          {/* RIGHT COLUMN: Beat Player Card, Sequencer, FX & Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            {/* 5. CURRENT BEAT PLAYER */}
            <BeatPlayerCard
              title={beat.title}
              genre={beat.genre}
              bpm={beat.bpm}
              stepsCount={beat.stepsCount}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onBpmChange={handleBpmChange}
              onExportWav={() => handleExportWav()}
              onExportMidi={() => handleExportMidi()}
              isExportingWav={isExportingWav}
            />

            {/* 7 & 8. TRACK / STEP SEQUENCER */}
            <Sequencer
              tracks={beat.tracks}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onToggleStep={handleToggleStep}
              onToggleMute={handleToggleMute}
              onDeleteTrack={handleDeleteTrack}
              onTrackVolumeChange={handleTrackVolumeChange}
              onAddTrack={handleAddTrack}
            />

            {/* 9. AUDIO FX & VISUALIZER */}
            <AudioFxVisualizer
              effects={beat.effects}
              isPlaying={isPlaying}
              onEffectsChange={handleEffectsChange}
            />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#DDE6DA] py-5 bg-[#F8FAF7]/80 text-xs text-[#68756B] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F3526]">MatchaBeats AI</span>
            <span>—</span>
            <span>Minimalist Audio Synthesizer &amp; Beat Assistant</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>16-Step Web Audio Engine</span>
            <span>•</span>
            <span>16-Bit PCM WAV Export</span>
            <span>•</span>
            <span>Standard MIDI Type 0/1</span>
          </div>
        </div>
      </footer>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F3526] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg border border-[#3E6248] animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* MODALS */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        savedBeats={savedBeats}
        currentBeatId={beat.id}
        onLoadBeat={handleLoadBeat}
        onDeleteBeat={handleDeleteBeat}
        onExportWav={(b) => handleExportWav(b)}
        onExportMidi={(b) => handleExportMidi(b)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userSession={userSession}
        onUpdateSession={handleUpdateSession}
      />

      <CreativeIdeasModal
        isOpen={isIdeasOpen}
        onClose={() => setIsIdeasOpen(false)}
        onSelectIdea={(prompt) => handleGenerate(prompt)}
      />
    </div>
  );
}
