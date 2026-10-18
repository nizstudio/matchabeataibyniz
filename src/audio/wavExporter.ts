import { AudioEffects, InstrumentType, Track } from '../types';
import { midiToFreq } from './audioEngine';

function bufferToWave(abuffer: AudioBuffer, totalLength: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = totalLength * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = abuffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  out.setUint8(pos++, "R".charCodeAt(0));
  out.setUint8(pos++, "I".charCodeAt(0));
  out.setUint8(pos++, "F".charCodeAt(0));
  out.setUint8(pos++, "F".charCodeAt(0));

  // file length minus RIFF identifier & file length (8 bytes)
  setUint32(length - 8);

  // RIFF type 'WAVE'
  out.setUint8(pos++, "W".charCodeAt(0));
  out.setUint8(pos++, "A".charCodeAt(0));
  out.setUint8(pos++, "V".charCodeAt(0));
  out.setUint8(pos++, "E".charCodeAt(0));

  // format chunk identifier 'fmt '
  out.setUint8(pos++, "f".charCodeAt(0));
  out.setUint8(pos++, "m".charCodeAt(0));
  out.setUint8(pos++, "t".charCodeAt(0));
  out.setUint8(pos++, " ".charCodeAt(0));

  setUint32(16); // format chunk length
  setUint16(1); // sample format (raw PCM)
  setUint16(numOfChan); // channel count
  setUint32(sampleRate); // byte rate (sample rate * block align)
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2); // block align (channel count * bytes per sample)
  setUint16(16); // bits per sample

  // data chunk identifier 'data'
  out.setUint8(pos++, "d".charCodeAt(0));
  out.setUint8(pos++, "a".charCodeAt(0));
  out.setUint8(pos++, "t".charCodeAt(0));
  out.setUint8(pos++, "a".charCodeAt(0));
  setUint32(length - pos - 4); // data chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
      // scale to 16-bit signed integer
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: "audio/wav" });
}

export async function exportBeatToWav(
  tracks: Track[],
  bpm: number,
  effects: AudioEffects,
  title: string,
  loopCount = 2
): Promise<void> {
  const sampleRate = 44100;
  const secondsPerBeat = 60.0 / bpm;
  const stepDuration = secondsPerBeat / 4.0;
  const loopDuration = stepDuration * 16;
  const ringOutDuration = 1.8;
  const totalDuration = loopDuration * loopCount + ringOutDuration;
  const totalFrames = Math.ceil(totalDuration * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

  // Generate white noise buffer for offline rendering
  const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 2, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBuffer.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  // Create FX Chain
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(effects.masterVolume, 0);

  const filterNode = offlineCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(effects.lowPassFreq, 0);
  filterNode.Q.setValueAtTime(1.2, 0);

  const delayNode = offlineCtx.createDelay(2.0);
  delayNode.delayTime.setValueAtTime(effects.delayTime / 1000, 0);
  const delayFeedbackGain = offlineCtx.createGain();
  delayFeedbackGain.gain.setValueAtTime(effects.delayFeedback, 0);
  const delayWetGain = offlineCtx.createGain();
  delayWetGain.gain.setValueAtTime(effects.delayMix, 0);

  delayNode.connect(delayFeedbackGain);
  delayFeedbackGain.connect(delayNode);
  delayNode.connect(delayWetGain);

  // Offline Reverb impulse
  const convolverNode = offlineCtx.createConvolver();
  const impulseLength = Math.floor(sampleRate * 1.5);
  const impulse = offlineCtx.createBuffer(2, impulseLength, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);
  for (let i = 0; i < impulseLength; i++) {
    const factor = Math.exp((-i / impulseLength) * 2.2);
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  convolverNode.buffer = impulse;

  const reverbWetGain = offlineCtx.createGain();
  reverbWetGain.gain.setValueAtTime(effects.reverbWet / 100, 0);
  convolverNode.connect(reverbWetGain);

  const dryGain = offlineCtx.createGain();
  dryGain.gain.setValueAtTime(1.0, 0);

  filterNode.connect(dryGain);
  filterNode.connect(delayNode);
  filterNode.connect(convolverNode);

  dryGain.connect(masterGain);
  delayWetGain.connect(masterGain);
  reverbWetGain.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  // Play routine helpers
  const playKick = (time: number, vol: number) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.1);
    gain.gain.setValueAtTime(1.1 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
    osc.connect(gain);
    gain.connect(filterNode);
    osc.start(time);
    osc.stop(time + 0.35);

    const clickSrc = offlineCtx.createBufferSource();
    const clickFilter = offlineCtx.createBiquadFilter();
    const clickGain = offlineCtx.createGain();
    clickSrc.buffer = noiseBuffer;
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(1200, time);
    clickGain.gain.setValueAtTime(0.4 * vol, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    clickSrc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(filterNode);
    clickSrc.start(time);
    clickSrc.stop(time + 0.03);
  };

  const playSnare = (time: number, vol: number) => {
    const noise = offlineCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = offlineCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1100, time);
    const noiseGain = offlineCtx.createGain();
    noiseGain.gain.setValueAtTime(0.7 * vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filterNode);
    noise.start(time);
    noise.stop(time + 0.23);

    const osc = offlineCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    const oscGain = offlineCtx.createGain();
    oscGain.gain.setValueAtTime(0.5 * vol, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(filterNode);
    osc.start(time);
    osc.stop(time + 0.13);
  };

  const playHiHat = (time: number, vol: number) => {
    const noise = offlineCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);
    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.55 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(filterNode);
    noise.start(time);
    noise.stop(time + 0.065);
  };

  const playClap = (time: number, vol: number) => {
    [0, 0.012, 0.024].forEach((offset, idx) => {
      const noise = offlineCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, time + offset);
      const gain = offlineCtx.createGain();
      const isLast = idx === 2;
      const decay = isLast ? 0.18 : 0.015;
      gain.gain.setValueAtTime((isLast ? 0.75 : 0.4) * vol, time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + decay);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(filterNode);
      noise.start(time + offset);
      noise.stop(time + offset + decay + 0.01);
    });
  };

  const playTom = (time: number, vol: number) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(75, time + 0.22);
    gain.gain.setValueAtTime(0.8 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(gain);
    gain.connect(filterNode);
    osc.start(time);
    osc.stop(time + 0.36);
  };

  const playPercussion = (time: number, vol: number) => {
    const osc = offlineCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, time);
    osc.frequency.exponentialRampToValueAtTime(380, time + 0.04);
    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.6 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.connect(gain);
    gain.connect(filterNode);
    osc.start(time);
    osc.stop(time + 0.07);
  };

  const playMelodic = (type: InstrumentType, time: number, vol: number, note: number) => {
    const freq = midiToFreq(note);
    if (type === 'bass') {
      const osc = offlineCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq / 2, time);
      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.85 * vol, time);
      gain.gain.setTargetAtTime(0.001, time + 0.2, 0.12);
      osc.connect(gain);
      gain.connect(filterNode);
      osc.start(time);
      osc.stop(time + 0.45);
    } else {
      const osc1 = offlineCtx.createOscillator();
      const osc2 = offlineCtx.createOscillator();
      osc1.type = type === 'synthLead' ? 'square' : 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq + 0.8, time);
      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.55 * vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(filterNode);
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.45);
      osc2.stop(time + 0.45);
    }
  };

  // Schedule pattern for each loop
  for (let loop = 0; loop < loopCount; loop++) {
    const loopStartTime = loop * loopDuration;
    for (let step = 0; step < 16; step++) {
      const stepTime = loopStartTime + step * stepDuration;
      tracks.forEach((track) => {
        if (!track.muted && track.steps[step]) {
          const note = track.notes ? track.notes[step] : 60;
          switch (track.type) {
            case 'kick':
              playKick(stepTime, track.volume);
              break;
            case 'snare':
              playSnare(stepTime, track.volume);
              break;
            case 'hihat':
              playHiHat(stepTime, track.volume);
              break;
            case 'clap':
              playClap(stepTime, track.volume);
              break;
            case 'tom':
              playTom(stepTime, track.volume);
              break;
            case 'percussion':
              playPercussion(stepTime, track.volume);
              break;
            default:
              playMelodic(track.type, stepTime, track.volume, note);
              break;
          }
        }
      });
    }
  }

  // Render audio
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = bufferToWave(renderedBuffer, totalFrames);

  // Trigger download
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'Beat';
  const filename = `MatchaBeats_${cleanTitle}.wav`;
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 2000);
}
