import { Track } from '../types';

// Helper to write Variable-Length Quantity (VLQ)
function writeVLQ(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

// Convert 32-bit int to 4 bytes big-endian
function int32ToBytes(n: number): number[] {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

// Convert 16-bit int to 2 bytes big-endian
function int16ToBytes(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}

export function exportBeatToMidi(
  tracks: Track[],
  bpm: number,
  title: string,
  loopCount = 2
): void {
  const ticksPerQuarter = 480;
  const ticksPer16th = ticksPerQuarter / 4; // 120 ticks
  const noteDuration = ticksPer16th * 0.85; // slightly detached

  // Microseconds per quarter note: (60,000,000 / BPM)
  const mpqn = Math.round(60000000 / bpm);

  // General MIDI mapping
  const drumMapping: Record<string, number> = {
    kick: 36,
    snare: 38,
    hihat: 42,
    clap: 39,
    tom: 45,
    percussion: 54,
  };

  // Collect all notes events across the timeline
  interface TimedEvent {
    tick: number;
    status: number;
    note: number;
    velocity: number;
  }

  const events: TimedEvent[] = [];
  let melodicChannel = 0;

  tracks.forEach((track) => {
    if (track.muted) return;

    const isDrum = ['kick', 'snare', 'hihat', 'clap', 'tom', 'percussion'].includes(track.type);
    const channel = isDrum ? 9 : Math.min(15, (melodicChannel++) % 15);
    const noteOnStatus = 0x90 | channel;
    const noteOffStatus = 0x80 | channel;
    const velocity = Math.round(track.volume * 100) + 20;

    for (let loop = 0; loop < loopCount; loop++) {
      const loopStartTick = loop * 16 * ticksPer16th;
      for (let step = 0; step < 16; step++) {
        if (track.steps[step]) {
          const stepTick = loopStartTick + step * ticksPer16th;
          let midiNote = 60;

          if (isDrum) {
            midiNote = drumMapping[track.type] || 38;
          } else {
            midiNote = track.notes ? track.notes[step] : 60;
          }

          events.push({
            tick: stepTick,
            status: noteOnStatus,
            note: midiNote,
            velocity,
          });

          events.push({
            tick: stepTick + noteDuration,
            status: noteOffStatus,
            note: midiNote,
            velocity: 0,
          });
        }
      }
    }
  });

  // Sort events chronologically. If ticks are equal, NoteOff comes before NoteOn
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return a.status - b.status;
  });

  // Build Track Data
  const trackBytes: number[] = [];

  // 1. Time Signature: Delta 0, FF 58 04 04 02 18 08 (4/4 time)
  trackBytes.push(...writeVLQ(0));
  trackBytes.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // 2. Tempo: Delta 0, FF 51 03 [mpqn 3 bytes]
  trackBytes.push(...writeVLQ(0));
  trackBytes.push(0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff);

  // 3. Track Name Meta Event
  const trackNameBytes = Array.from(new TextEncoder().encode(title || "MatchaBeats"));
  trackBytes.push(...writeVLQ(0));
  trackBytes.push(0xff, 0x03, ...writeVLQ(trackNameBytes.length), ...trackNameBytes);

  // 4. Note events with delta times
  let currentTick = 0;
  events.forEach((ev) => {
    const delta = Math.max(0, Math.round(ev.tick - currentTick));
    trackBytes.push(...writeVLQ(delta));
    trackBytes.push(ev.status, ev.note, ev.velocity);
    currentTick = ev.tick;
  });

  // 5. End of Track: Delta 0, FF 2F 00
  trackBytes.push(...writeVLQ(0));
  trackBytes.push(0xff, 0x2f, 0x00);

  // Build complete MIDI file: Header + Track Chunk
  const fileBytes: number[] = [];

  // MThd Header Chunk
  fileBytes.push(0x4d, 0x54, 0x68, 0x64); // 'MThd'
  fileBytes.push(...int32ToBytes(6)); // length 6
  fileBytes.push(...int16ToBytes(0)); // Format 0 (single track file)
  fileBytes.push(...int16ToBytes(1)); // 1 Track
  fileBytes.push(...int16ToBytes(ticksPerQuarter)); // Division

  // MTrk Track Chunk
  fileBytes.push(0x4d, 0x54, 0x72, 0x6b); // 'MTrk'
  fileBytes.push(...int32ToBytes(trackBytes.length));
  fileBytes.push(...trackBytes);

  const byteArray = new Uint8Array(fileBytes);
  const blob = new Blob([byteArray], { type: 'audio/midi' });

  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'Beat';
  const filename = `MatchaBeats_${cleanTitle}.mid`;
  const url = URL.createObjectURL(blob);
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
