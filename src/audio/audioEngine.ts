import { AudioEffects, InstrumentType, Track } from '../types';

// Convert MIDI note number to frequency in Hz
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentStep = 0;
  private bpm = 84;
  private tracks: Track[] = [];
  private effects: AudioEffects = {
    lowPassFreq: 3500,
    delayTime: 250,
    delayFeedback: 0.35,
    delayMix: 0.25,
    reverbWet: 40,
    masterVolume: 0.85,
  };

  // FX Nodes
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Scheduling
  private nextStepTime = 0;
  private scheduleIntervalId: number | null = null;
  private onStepChangeCallback: ((step: number) => void) | null = null;

  // Noise buffers for percussion
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Lazily initialized on first user interaction
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupFXChain();
      this.generateNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  private createReverbImpulse(seconds = 2.0, decay = 2.5): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * seconds);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  private setupFXChain() {
    if (!this.ctx) return;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.effects.masterVolume, this.ctx.currentTime);

    // Low-pass Filter
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(this.effects.lowPassFreq, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Delay
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(this.effects.delayTime / 1000, this.ctx.currentTime);
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(this.effects.delayFeedback, this.ctx.currentTime);
    this.delayWetGain = this.ctx.createGain();
    this.delayWetGain.gain.setValueAtTime(this.effects.delayMix, this.ctx.currentTime);

    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayWetGain);

    // Reverb
    this.convolverNode = this.ctx.createConvolver();
    const impulse = this.createReverbImpulse(1.8, 2.2);
    if (impulse) this.convolverNode.buffer = impulse;

    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(this.effects.reverbWet / 100, this.ctx.currentTime);
    this.convolverNode.connect(this.reverbWetGain);

    // Dry Gain
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Analyser Node for Visualizer
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 128;
    this.analyserNode.smoothingTimeConstant = 0.82;

    // Connect graph:
    // Source -> Filter
    // Filter -> dryGain -> masterGain
    // Filter -> delayNode -> delayWetGain -> masterGain
    // Filter -> convolverNode -> reverbWetGain -> masterGain
    // masterGain -> analyserNode -> destination

    this.filterNode.connect(this.dryGain);
    this.filterNode.connect(this.delayNode);
    this.filterNode.connect(this.convolverNode);

    this.dryGain.connect(this.masterGain);
    this.delayWetGain.connect(this.masterGain);
    this.reverbWetGain.connect(this.masterGain);

    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.analyserNode) {
      this.getContext();
    }
    return this.analyserNode;
  }

  public updateEffects(effects: Partial<AudioEffects>) {
    this.effects = { ...this.effects, ...effects };
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (effects.lowPassFreq !== undefined && this.filterNode) {
      this.filterNode.frequency.setTargetAtTime(Math.max(100, Math.min(20000, effects.lowPassFreq)), now, 0.05);
    }
    if (effects.delayTime !== undefined && this.delayNode) {
      this.delayNode.delayTime.setTargetAtTime(Math.max(0.01, effects.delayTime / 1000), now, 0.05);
    }
    if (effects.delayFeedback !== undefined && this.delayFeedbackGain) {
      this.delayFeedbackGain.gain.setTargetAtTime(Math.min(0.85, effects.delayFeedback), now, 0.05);
    }
    if (effects.delayMix !== undefined && this.delayWetGain) {
      this.delayWetGain.gain.setTargetAtTime(effects.delayMix, now, 0.05);
    }
    if (effects.reverbWet !== undefined && this.reverbWetGain) {
      this.reverbWetGain.gain.setTargetAtTime(effects.reverbWet / 100, now, 0.05);
    }
    if (effects.masterVolume !== undefined && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(effects.masterVolume, now, 0.05);
    }
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(220, bpm));
  }

  public setTracks(tracks: Track[]) {
    this.tracks = tracks;
  }

  public setOnStepChange(cb: (step: number) => void) {
    this.onStepChangeCallback = cb;
  }

  // Instrument synthesizers connected to this.filterNode
  private playKick(time: number, volume = 1.0) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch drop
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.1);

    // Click attack
    gain.gain.setValueAtTime(1.1 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.35);

    // Punch click
    if (this.noiseBuffer) {
      const clickSrc = this.ctx.createBufferSource();
      const clickFilter = this.ctx.createBiquadFilter();
      const clickGain = this.ctx.createGain();

      clickSrc.buffer = this.noiseBuffer;
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(1200, time);
      clickFilter.Q.setValueAtTime(3.0, time);

      clickGain.gain.setValueAtTime(0.4 * volume, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

      clickSrc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.filterNode);

      clickSrc.start(time);
      clickSrc.stop(time + 0.03);
    }
  }

  private playSnare(time: number, volume = 1.0) {
    if (!this.ctx || !this.filterNode || !this.noiseBuffer) return;

    // Noise component
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1100, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7 * volume, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.filterNode);

    noise.start(time);
    noise.stop(time + 0.23);

    // Body tone
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5 * volume, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  private playHiHat(time: number, volume = 1.0, open = false) {
    if (!this.ctx || !this.filterNode || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const decay = open ? 0.22 : 0.055;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    noise.start(time);
    noise.stop(time + decay + 0.01);
  }

  private playClap(time: number, volume = 1.0) {
    if (!this.ctx || !this.filterNode || !this.noiseBuffer) return;

    // Triple burst
    const bursts = [0, 0.012, 0.024];
    bursts.forEach((offset, idx) => {
      if (!this.ctx || !this.filterNode || !this.noiseBuffer) return;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, time + offset);
      filter.Q.setValueAtTime(1.8, time + offset);

      const gain = this.ctx.createGain();
      const isLast = idx === bursts.length - 1;
      const decay = isLast ? 0.18 : 0.015;
      gain.gain.setValueAtTime((isLast ? 0.75 : 0.4) * volume, time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + decay);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode);

      noise.start(time + offset);
      noise.stop(time + offset + decay + 0.01);
    });
  }

  private playTom(time: number, volume = 1.0) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(75, time + 0.22);

    gain.gain.setValueAtTime(0.8 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  private playPercussion(time: number, volume = 1.0) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, time);
    osc.frequency.exponentialRampToValueAtTime(380, time + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  private playSynthNote(time: number, midiNote: number, volume = 1.0, type: InstrumentType = 'synth') {
    if (!this.ctx || !this.filterNode) return;

    const freq = midiToFreq(midiNote);
    const duration = 0.35;

    if (type === 'bass') {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq / 2, time);

      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85 * volume, time);
      gain.gain.setTargetAtTime(0.001, time + 0.2, 0.12);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      subOsc.start(time);
      osc.stop(time + 0.45);
      subOsc.stop(time + 0.45);
      return;
    }

    if (type === 'piano') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 2, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7 * volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.filterNode);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.52);
      osc2.stop(time + 0.52);
      return;
    }

    if (type === 'pad') {
      // Warm detuned dual oscillators
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq - 1.2, time);
      osc2.frequency.setValueAtTime(freq + 1.2, time);

      const padFilter = this.ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(1600, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.45 * volume, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

      osc1.connect(padFilter);
      osc2.connect(padFilter);
      padFilter.connect(gain);
      gain.connect(this.filterNode);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.75);
      osc2.stop(time + 0.75);
      return;
    }

    if (type === 'guitar') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, time);
      filter.frequency.exponentialRampToValueAtTime(400, time + 0.25);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6 * volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      osc.stop(time + 0.38);
      return;
    }

    if (type === 'synthLead') {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5 * volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      osc.stop(time + 0.32);
      return;
    }

    // Default 'synth' (Lofi Synth)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    // Subtle lofi detune
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq + 0.8, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.55 * volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.filterNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.02);
    osc2.stop(time + duration + 0.02);
  }

  public playInstrument(type: InstrumentType, time: number, volume: number, note = 60) {
    switch (type) {
      case 'kick':
        this.playKick(time, volume);
        break;
      case 'snare':
        this.playSnare(time, volume);
        break;
      case 'hihat':
        this.playHiHat(time, volume);
        break;
      case 'clap':
        this.playClap(time, volume);
        break;
      case 'tom':
        this.playTom(time, volume);
        break;
      case 'percussion':
        this.playPercussion(time, volume);
        break;
      default:
        this.playSynthNote(time, note, volume, type);
        break;
    }
  }

  // Preview an instrument standalone (e.g. when user clicks instrument name or adds track)
  public previewSound(type: InstrumentType, note = 60) {
    const ctx = this.getContext();
    const now = ctx.currentTime + 0.01;
    this.playInstrument(type, now, 0.8, note);
  }

  // 16-step lookahead scheduler
  private schedule() {
    if (!this.isPlaying || !this.ctx) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = secondsPerBeat / 4.0; // 16th note
    const lookahead = 0.1; // Schedule 100ms in advance

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      const stepToPlay = this.currentStep;
      const playTime = this.nextStepTime;

      // Play active steps in all tracks
      this.tracks.forEach((track) => {
        if (!track.muted && track.steps[stepToPlay]) {
          const note = track.notes ? track.notes[stepToPlay] : 60;
          this.playInstrument(track.type, playTime, track.volume, note);
        }
      });

      // Notify UI of current step at the actual play time
      const timeDiffMs = Math.max(0, (playTime - this.ctx.currentTime) * 1000);
      window.setTimeout(() => {
        if (this.isPlaying && this.onStepChangeCallback) {
          this.onStepChangeCallback(stepToPlay);
        }
      }, timeDiffMs);

      // Advance
      this.nextStepTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  public start(tracks: Track[], bpm: number) {
    this.tracks = tracks;
    this.bpm = bpm;
    const ctx = this.getContext();

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;

    if (this.onStepChangeCallback) {
      this.onStepChangeCallback(0);
    }

    this.scheduleIntervalId = window.setInterval(() => {
      this.schedule();
    }, 25);
  }

  public stop() {
    this.isPlaying = false;
    if (this.scheduleIntervalId !== null) {
      window.clearInterval(this.scheduleIntervalId);
      this.scheduleIntervalId = null;
    }
    this.currentStep = 0;
    if (this.onStepChangeCallback) {
      this.onStepChangeCallback(0);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
