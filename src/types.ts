export type InstrumentType =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'synth'
  | 'bass'
  | 'piano'
  | 'guitar'
  | 'pad'
  | 'clap'
  | 'tom'
  | 'percussion'
  | 'synthLead';

export interface InstrumentDefinition {
  type: InstrumentType;
  name: string;
  category: 'drums' | 'melodic';
  description: string;
  defaultNote?: number; // MIDI note (e.g. 60 = C4)
  iconName: string;
}

export interface Track {
  id: string;
  name: string;
  type: InstrumentType;
  muted: boolean;
  volume: number; // 0 to 1
  steps: boolean[]; // 16 steps
  notes?: number[]; // 16 pitch values (MIDI note numbers, default e.g. 60)
}

export interface AudioEffects {
  lowPassFreq: number; // 200 - 12000 Hz (default 3500)
  delayTime: number; // 50 - 1000 ms (default 250)
  delayFeedback: number; // 0 - 0.8 (default 0.35)
  delayMix: number; // 0 - 1
  reverbWet: number; // 0 - 100% (default 40)
  masterVolume: number; // 0 - 1 (default 0.85)
}

export interface ProducerInsight {
  title: string;
  mode: string;
  tempoText: string;
  synthesizer: string;
  description: string;
  keySignature?: string;
  tips: string[];
}

export interface Beat {
  id: string;
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  stepsCount: number; // 16
  prompt: string;
  tracks: Track[];
  effects: AudioEffects;
  insights: ProducerInsight;
  createdAt: string;
  version?: number;
}

export interface UserSession {
  isGuest: boolean;
  userEmail?: string;
  userName?: string;
  photoUrl?: string;
}
