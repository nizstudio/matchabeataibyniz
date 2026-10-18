import { AudioEffects, Beat, ProducerInsight, Track } from '../types';

export interface PromptAnalysisResult {
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  tracks: Track[];
  effects: AudioEffects;
  insights: ProducerInsight;
}

// Preset musical scales (MIDI note numbers in octave 4-5)
const SCALES = {
  // C minor pentatonic: C4, Eb4, F4, G4, Bb4, C5
  cMinorPentatonic: [60, 63, 65, 67, 70, 72],
  // F minor neo-soul: F3, Ab3, Bb3, C4, Eb4, F4
  fMinorSoul: [53, 56, 58, 60, 63, 65],
  // Eb Major lofi jazz: Eb4, F4, G4, Bb4, C5, Eb5
  ebMajorJazz: [63, 65, 67, 70, 72, 75],
  // Synthwave D minor: D3, F3, G3, A3, C4, D4
  dMinorSynthwave: [50, 53, 55, 57, 60, 62],
  // Cyberpunk Phrygian: C3, Db3, F3, G3, Ab3, C4
  cyberpunkPhrygian: [48, 49, 53, 55, 56, 60],
  // 8-bit Chiptune Major: C4, E4, G4, B4, C5, E5
  chiptuneMajor: [60, 64, 67, 71, 72, 76],
  // Ambient Dream: G3, B3, D4, E4, G4, A4
  ambientDream: [55, 59, 62, 64, 67, 69],
};

export const CREATIVE_BEAT_IDEAS = [
  {
    title: "Chill lo-fi hip hop beat",
    desc: "Dusty vinyl kicks, lazy swinging snares, and warm mellow Rhodes keys at 84 BPM.",
    tag: "Lofi / Study",
  },
  {
    title: "8-bit retro arcade jump sound",
    desc: "Fast nostalgic chip-tune arpeggios with punchy retro beats at 138 BPM.",
    tag: "Chiptune / Gaming",
  },
  {
    title: "Rainy cyberpunk background hum",
    desc: "Atmospheric dystopian synths with deep heavy sub-bass and neon echoes at 98 BPM.",
    tag: "Sci-Fi / Ambient",
  },
  {
    title: "80s synthwave drive beat",
    desc: "Driving four-on-the-floor kicks, gated snares, and retro analog basslines at 116 BPM.",
    tag: "Synthwave / Retro",
  },
  {
    title: "Midnight neo-soul groove",
    desc: "Intimate rimshots, velvety Rhodes chords, and smooth syncopated bass at 80 BPM.",
    tag: "Neo-Soul / R&B",
  },
];

// Helper to generate a random 16-step array from index list
function stepsFromIndices(indices: number[]): boolean[] {
  const steps = new Array(16).fill(false);
  indices.forEach((idx) => {
    if (idx >= 0 && idx < 16) steps[idx] = true;
  });
  return steps;
}

// Generate melodic note sequence mapped to active steps
function generateNotePattern(
  activeSteps: boolean[],
  scale: number[],
  patternType: 'arpeggio' | 'chord-walk' | 'melody' | 'bassline',
  variationSeed = 0
): number[] {
  const notes = new Array(16).fill(scale[0]);
  let scaleIndex = variationSeed % scale.length;

  for (let i = 0; i < 16; i++) {
    if (activeSteps[i]) {
      if (patternType === 'arpeggio') {
        scaleIndex = (scaleIndex + 1) % scale.length;
        notes[i] = scale[scaleIndex];
      } else if (patternType === 'chord-walk') {
        const stepInBar = i % 8;
        if (stepInBar < 4) {
          notes[i] = scale[0];
        } else {
          notes[i] = scale[(2 + variationSeed) % scale.length];
        }
      } else if (patternType === 'bassline') {
        notes[i] = i >= 8 ? scale[Math.min(scale.length - 1, 2)] - 12 : scale[0] - 12;
      } else {
        // melody
        const choice = (i * 3 + variationSeed) % scale.length;
        notes[i] = scale[choice];
      }
    }
  }
  return notes;
}

export function analyzePromptAndGenerateBeat(
  promptText: string,
  variation = 1
): PromptAnalysisResult {
  const query = (promptText || '').toLowerCase().trim();

  // 1. Detect Style & Parameters
  let genre = 'Lofi Hip-Hop';
  let mood = 'Chill';
  let title = 'Chill Lofi Matcha Sunset';
  let bpm = 84;
  let scale = SCALES.ebMajorJazz;
  let modeName = 'Lofi Hip-Hop Rhythms';
  let effects: AudioEffects = {
    lowPassFreq: 3200,
    delayTime: 250,
    delayFeedback: 0.35,
    delayMix: 0.28,
    reverbWet: 42,
    masterVolume: 0.85,
  };

  // Pattern variations based on seed
  const v = variation;

  if (query.includes('8-bit') || query.includes('retro') || query.includes('arcade') || query.includes('game') || query.includes('chiptune')) {
    genre = '8-Bit Chiptune';
    mood = 'Nostalgic & Energetic';
    title = variation > 1 ? `Emerald 8-Bit Quest (Var. ${v})` : 'Emerald 8-Bit Quest';
    bpm = 136 + ((v - 1) * 3 % 8);
    scale = SCALES.chiptuneMajor;
    modeName = 'Retro 8-Bit Pixel Pulse';
    effects = {
      lowPassFreq: 8500,
      delayTime: 180,
      delayFeedback: 0.2,
      delayMix: 0.15,
      reverbWet: 15,
      masterVolume: 0.85,
    };
  } else if (query.includes('synthwave') || query.includes('80s') || query.includes('drive') || query.includes('retrowave')) {
    genre = '80s Synthwave';
    mood = 'Driving & Euphoric';
    title = variation > 1 ? `Neon Sunset Highway (Var. ${v})` : 'Neon Sunset Highway';
    bpm = 118 + ((v - 1) * 2 % 6);
    scale = SCALES.dMinorSynthwave;
    modeName = 'Outrun Analog Synth Drive';
    effects = {
      lowPassFreq: 5200,
      delayTime: 340,
      delayFeedback: 0.45,
      delayMix: 0.32,
      reverbWet: 48,
      masterVolume: 0.85,
    };
  } else if (query.includes('cyberpunk') || query.includes('rainy') || query.includes('dystopian') || query.includes('dark')) {
    genre = 'Cyberpunk Ambient';
    mood = 'Dark & Cinematic';
    title = variation > 1 ? `Rainy Neo-Shinjuku (Var. ${v})` : 'Rainy Neo-Shinjuku';
    bpm = 96 + ((v - 1) * 2 % 6);
    scale = SCALES.cyberpunkPhrygian;
    modeName = 'Dystopian Industrial Pulse';
    effects = {
      lowPassFreq: 2600,
      delayTime: 380,
      delayFeedback: 0.52,
      delayMix: 0.4,
      reverbWet: 55,
      masterVolume: 0.85,
    };
  } else if (query.includes('trap') || query.includes('energetic') || query.includes('drill') || query.includes('bass')) {
    genre = 'Chill Trap';
    mood = 'Energetic & Bouncy';
    title = variation > 1 ? `Matcha 808 Nightride (Var. ${v})` : 'Matcha 808 Nightride';
    bpm = 138 + ((v - 1) * 2 % 6);
    scale = SCALES.cMinorPentatonic;
    modeName = 'Heavy 808 Trap Cadence';
    effects = {
      lowPassFreq: 4500,
      delayTime: 220,
      delayFeedback: 0.3,
      delayMix: 0.22,
      reverbWet: 30,
      masterVolume: 0.88,
    };
  } else if (query.includes('piano') || query.includes('study') || query.includes('relax') || query.includes('peaceful') || query.includes('slow')) {
    genre = 'Study Piano & Beats';
    mood = 'Calm & Mindful';
    title = variation > 1 ? `Raindrop Study Session (Var. ${v})` : 'Raindrop Study Session';
    bpm = 76 + ((v - 1) * 2 % 6);
    scale = SCALES.ambientDream;
    modeName = 'Peaceful Melodic Ambience';
    effects = {
      lowPassFreq: 3000,
      delayTime: 320,
      delayFeedback: 0.4,
      delayMix: 0.35,
      reverbWet: 50,
      masterVolume: 0.82,
    };
  } else {
    // Default Lo-Fi Hip Hop
    genre = 'Lofi Hip-Hop';
    mood = 'Chill & Nostalgic';
    title = variation > 1 ? `Chill Lofi Matcha Sunset (Var. ${v})` : 'Chill Lofi Matcha Sunset';
    bpm = 84 + ((v - 1) * 2 % 6);
    scale = SCALES.ebMajorJazz;
    modeName = 'Lofi Hip-Hop Rhythms';
    effects = {
      lowPassFreq: 3400,
      delayTime: 250,
      delayFeedback: 0.35,
      delayMix: 0.28,
      reverbWet: 40,
      masterVolume: 0.85,
    };
  }

  // 2. Build Track patterns with variations
  // Drums: Kick, Snare, Hi-Hat
  let kickIndices = [0, 6, 10];
  let snareIndices = [4, 12];
  let hihatIndices = [0, 2, 4, 6, 8, 10, 12, 14];
  let synthIndices = [0, 3, 6, 8, 11, 14];

  if (genre === '8-Bit Chiptune') {
    kickIndices = v % 2 === 1 ? [0, 6, 8, 14] : [0, 4, 8, 12];
    snareIndices = [4, 12];
    hihatIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // rapid 16th hats
    synthIndices = [0, 2, 4, 6, 8, 10, 12, 14];
  } else if (genre === '80s Synthwave') {
    kickIndices = [0, 4, 8, 12]; // 4-on-the-floor
    snareIndices = [4, 12];
    hihatIndices = [2, 6, 10, 14]; // offbeat
    synthIndices = v % 2 === 1 ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 3, 6, 8, 11, 14];
  } else if (genre === 'Cyberpunk Ambient') {
    kickIndices = v % 2 === 1 ? [0, 7, 10] : [0, 8, 11];
    snareIndices = [4, 12];
    hihatIndices = [0, 3, 6, 9, 12, 15]; // triplet syncopation
    synthIndices = [0, 4, 8, 12];
  } else if (genre === 'Chill Trap') {
    kickIndices = v % 2 === 1 ? [0, 6, 10, 13] : [0, 7, 11];
    snareIndices = [4, 12];
    hihatIndices = [0, 1, 2, 4, 6, 7, 8, 10, 11, 12, 14, 15]; // roll
    synthIndices = [0, 3, 8, 11];
  } else {
    // Lo-Fi Hip Hop
    if (v === 1) {
      kickIndices = [0, 6, 10];
      snareIndices = [4, 12];
      hihatIndices = [0, 2, 4, 6, 8, 10, 12, 14];
      synthIndices = [0, 3, 6, 8, 11, 14];
    } else if (v === 2) {
      kickIndices = [0, 7, 10];
      snareIndices = [4, 12, 15]; // ghost snare
      hihatIndices = [0, 2, 3, 6, 8, 10, 11, 14];
      synthIndices = [0, 2, 6, 8, 10, 14];
    } else {
      kickIndices = [0, 5, 10, 14];
      snareIndices = [4, 12];
      hihatIndices = [0, 2, 4, 6, 7, 8, 10, 12, 14];
      synthIndices = [0, 4, 7, 10, 12];
    }
  }

  const kickSteps = stepsFromIndices(kickIndices);
  const snareSteps = stepsFromIndices(snareIndices);
  const hihatSteps = stepsFromIndices(hihatIndices);
  const synthSteps = stepsFromIndices(synthIndices);

  const synthNotes = generateNotePattern(
    synthSteps,
    scale,
    genre === '8-Bit Chiptune' ? 'arpeggio' : 'chord-walk',
    v
  );

  const tracks: Track[] = [
    {
      id: 'track-kick',
      name: 'Kick Drum',
      type: 'kick',
      muted: false,
      volume: 0.9,
      steps: kickSteps,
    },
    {
      id: 'track-snare',
      name: 'Snare',
      type: 'snare',
      muted: false,
      volume: 0.85,
      steps: snareSteps,
    },
    {
      id: 'track-hihat',
      name: 'Hi-Hat',
      type: 'hihat',
      muted: false,
      volume: 0.75,
      steps: hihatSteps,
    },
    {
      id: 'track-synth',
      name: genre === '8-Bit Chiptune' ? 'Chiptune Synth' : 'Lofi Synth',
      type: genre === '8-Bit Chiptune' ? 'synthLead' : 'synth',
      muted: false,
      volume: 0.8,
      steps: synthSteps,
      notes: synthNotes,
    },
  ];

  // If prompt suggests bass, piano, or ambient pads, add corresponding tracks automatically
  if (query.includes('bass') || query.includes('trap') || query.includes('synthwave')) {
    const bassSteps = stepsFromIndices(genre === 'Chill Trap' ? [0, 6, 10] : [0, 4, 8, 12]);
    const bassNotes = generateNotePattern(bassSteps, scale, 'bassline', v);
    tracks.push({
      id: 'track-bass',
      name: 'Deep Bass',
      type: 'bass',
      muted: false,
      volume: 0.85,
      steps: bassSteps,
      notes: bassNotes,
    });
  }

  if (query.includes('piano') || query.includes('study')) {
    const pianoSteps = stepsFromIndices([0, 4, 8, 12]);
    const pianoNotes = generateNotePattern(pianoSteps, scale, 'chord-walk', v);
    tracks.push({
      id: 'track-piano',
      name: 'Warm Piano',
      type: 'piano',
      muted: false,
      volume: 0.75,
      steps: pianoSteps,
      notes: pianoNotes,
    });
  }

  // 3. Producer AI Insights
  const insights: ProducerInsight = {
    title,
    mode: modeName,
    tempoText: `${bpm} BPM`,
    synthesizer: 'Active 16-Step Web Audio Engine',
    description: 'Click Play Beat above or type ANY prompt in the box to generate custom sound patterns instantly!',
    keySignature: scale === SCALES.cMinorPentatonic ? 'C Minor' : scale === SCALES.ebMajorJazz ? 'Eb Major Jazz' : scale === SCALES.dMinorSynthwave ? 'D Minor' : 'Acoustic Pentatonic',
    tips: [
      `Tuned Low-Pass filter at ${effects.lowPassFreq} Hz for organic warmth.`,
      `Synthesizer configured with ${tracks.length} active layers.`,
      `Pattern syncopation: ${genre} signature timing.`,
    ],
  };

  return {
    title,
    genre,
    mood,
    bpm,
    tracks,
    effects,
    insights,
  };
}

export const INITIAL_DEFAULT_BEAT: Beat = {
  id: 'beat-initial-default',
  title: 'Chill Lofi Matcha Sunset',
  genre: 'Lofi Hip-Hop',
  mood: 'Chill & Nostalgic',
  bpm: 84,
  stepsCount: 16,
  prompt: 'Chill lo-fi hip hop beat',
  tracks: [
    {
      id: 'track-kick',
      name: 'Kick Drum',
      type: 'kick',
      muted: false,
      volume: 0.9,
      steps: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
    },
    {
      id: 'track-snare',
      name: 'Snare',
      type: 'snare',
      muted: false,
      volume: 0.85,
      steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
    {
      id: 'track-hihat',
      name: 'Hi-Hat',
      type: 'hihat',
      muted: false,
      volume: 0.75,
      steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    },
    {
      id: 'track-synth',
      name: 'Lofi Synth',
      type: 'synth',
      muted: false,
      volume: 0.8,
      steps: [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
      notes: [63, 60, 60, 65, 60, 60, 67, 60, 70, 60, 60, 72, 60, 60, 67, 60],
    },
  ],
  effects: {
    lowPassFreq: 3500,
    delayTime: 250,
    delayFeedback: 0.35,
    delayMix: 0.25,
    reverbWet: 40,
    masterVolume: 0.85,
  },
  insights: {
    title: 'Chill Lo-Fi Beat Demo',
    mode: 'Lofi Hip-Hop Rhythms',
    tempoText: '84 BPM',
    synthesizer: 'Active 16-Step Web Audio Engine',
    description: 'Click Play Beat above or type ANY prompt in the box to generate custom sound patterns instantly!',
    keySignature: 'Eb Major Jazz',
    tips: [
      'Low-Pass filter set to 3500 Hz for mellow vintage tape saturation.',
      '16-step rhythmic swing engine with relaxed backbeat snare.',
      'Full analog synthesis running locally on the Web Audio API.',
    ],
  },
  createdAt: new Date().toISOString(),
  version: 1,
};
