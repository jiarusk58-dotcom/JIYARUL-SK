/**
 * Web Audio API synthesizer for stock music loops, sound effects, and microphone voiceover recording.
 */

// Cache for generated audio blob URLs
const audioCache = new Map<string, string>();

export type SynthAudioType =
  | 'whoosh' 
  | 'pop' 
  | 'bell' 
  | 'camera' 
  | 'glitch' 
  | 'lofi-beat' 
  | 'cinematic-drone' 
  | 'cyber-synth' 
  | 'acoustic-warm' 
  | 'upbeat-vlog' 
  | 'ambient-piano'
  | 'edm-drop'
  | 'dramatic-sting'
  | 'hiphop-trap'
  | 'celebration-fanfare'
  | 'chillhop'
  | 'cinematic-epic'
  | 'corporate-uplifting'
  | 'retro-synthwave'
  | 'bengali-flute'
  | 'laser'
  | 'explosion'
  | 'applause'
  | 'keyboard'
  | 'heartbeat'
  | 'success-ding'
  | 'error-buzz'
  | 'game-coin'
  | 'riser'
  | 'rain-ambient';

// Generate realistic synthetic sound effects and music loops without external network dependencies
export function createSyntheticAudioBuffer(
  type: SynthAudioType,
  durationSec: number = 8
): string {
  const cacheKey = `${type}_${durationSec}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const channelData = new Float32Array(numSamples);

  if (type === 'whoosh') {
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const progress = t / durationSec;
      const noise = (Math.random() * 2 - 1);
      const envelope = Math.sin(progress * Math.PI);
      const freq = 200 + Math.sin(progress * Math.PI) * 1200;
      const wave = Math.sin(2 * Math.PI * freq * t);
      channelData[i] = (noise * 0.7 + wave * 0.3) * envelope * 0.8;
    }
  } else if (type === 'pop') {
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 25);
      const freq = 600 - t * 1200;
      channelData[i] = Math.sin(2 * Math.PI * Math.max(80, freq) * t) * decay * 0.9;
    }
  } else if (type === 'bell') {
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 3);
      const f1 = Math.sin(2 * Math.PI * 880 * t);
      const f2 = Math.sin(2 * Math.PI * 1760 * t) * 0.5;
      const f3 = Math.sin(2 * Math.PI * 2640 * t) * 0.25;
      channelData[i] = (f1 + f2 + f3) * decay * 0.6;
    }
  } else if (type === 'camera') {
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const click1 = (t < 0.05) ? (Math.random() * 2 - 1) * Math.exp(-t * 60) : 0;
      const click2 = (t > 0.08 && t < 0.16) ? (Math.random() * 2 - 1) * Math.exp(-(t - 0.08) * 50) : 0;
      channelData[i] = (click1 + click2) * 0.8;
    }
  } else if (type === 'glitch') {
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const step = Math.floor(t * 24);
      const freq = (step % 3 === 0 ? 350 : (step % 2 === 0 ? 800 : 200));
      const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
      const noise = (Math.random() * 2 - 1) * 0.3;
      channelData[i] = (square * 0.5 + noise) * 0.4;
    }
  } else if (type === 'lofi-beat') {
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.5; // 120 bpm
      const kick = (beat < 0.1) ? Math.sin(2 * Math.PI * 65 * beat) * Math.exp(-beat * 25) : 0;
      const snare = (t % 1.0 > 0.5 && (t % 1.0) - 0.5 < 0.15) 
        ? ((Math.random() * 2 - 1) * 0.4 + Math.sin(2 * Math.PI * 180 * (beat - 0.25)) * 0.2) * Math.exp(-(beat - 0.25) * 20) 
        : 0;
      const chordIndex = Math.floor(t / 2) % 4;
      const chordRoots = [261.63, 220.00, 174.61, 196.00]; // C - Am - F - G
      const root = chordRoots[chordIndex];
      const melody = (Math.sin(2 * Math.PI * root * t) + Math.sin(2 * Math.PI * root * 1.25 * t) * 0.5) * 0.15;
      channelData[i] = (kick * 0.7 + snare * 0.4 + melody) * 0.8;
    }
  } else if (type === 'cyber-synth') {
    // 130 BPM energetic synthwave bass & arpeggio
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.46;
      const kick = (beat < 0.08) ? Math.sin(2 * Math.PI * 75 * beat) * Math.exp(-beat * 30) : 0;
      const subBass = Math.sin(2 * Math.PI * 55 * t) * 0.4;
      const arpStep = Math.floor(t * 8) % 4;
      const freqs = [220, 261.6, 329.6, 440];
      const synthLead = Math.sin(2 * Math.PI * freqs[arpStep] * t) * 0.25;
      channelData[i] = (kick * 0.7 + subBass + synthLead) * 0.75;
    }
  } else if (type === 'acoustic-warm') {
    // Warm acoustic guitar fingerstyle progression
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const strumCycle = t % 1.0;
      const decay = Math.exp(-strumCycle * 4);
      const chord = Math.sin(2 * Math.PI * 196 * t) * 0.3 + 
                    Math.sin(2 * Math.PI * 246.9 * t) * 0.25 + 
                    Math.sin(2 * Math.PI * 392 * t) * 0.2;
      channelData[i] = chord * decay * 0.8;
    }
  } else if (type === 'upbeat-vlog') {
    // Bouncy uplifting vlog pop beat
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.48; // ~125 BPM
      const kick = (beat < 0.09) ? Math.sin(2 * Math.PI * 80 * beat) * Math.exp(-beat * 25) : 0;
      const clap = (t % 0.96 > 0.48 && (t % 0.96) - 0.48 < 0.12) ? (Math.random() * 2 - 1) * 0.4 : 0;
      const melodyFreq = 440 + Math.sin(Math.floor(t * 4) * 1.5) * 80;
      const pluck = Math.sin(2 * Math.PI * melodyFreq * t) * Math.exp(-(beat % 0.24) * 15) * 0.3;
      channelData[i] = (kick * 0.6 + clap + pluck) * 0.8;
    }
  } else if (type === 'ambient-piano') {
    // Soft emotional piano chords
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const cycle = t % 2.5;
      const decay = Math.exp(-cycle * 1.5);
      const root = 174.61 + (Math.floor(t / 2.5) % 3) * 40;
      const p1 = Math.sin(2 * Math.PI * root * t);
      const p2 = Math.sin(2 * Math.PI * (root * 1.5) * t) * 0.5;
      channelData[i] = (p1 + p2) * decay * 0.4;
    }
  } else if (type === 'edm-drop') {
    // High energy gaming EDM drop with sub kick & synth
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.43; // ~140 BPM
      const kick = (beat < 0.1) ? Math.sin(2 * Math.PI * 90 * (1 - beat * 5) * beat) * Math.exp(-beat * 20) : 0;
      const bassSaw = Math.sin(2 * Math.PI * 65 * t) + Math.sin(2 * Math.PI * 130 * t) * 0.4;
      const sidechain = Math.min(1, (beat / 0.43) * 1.8);
      const hihat = (beat > 0.21 && beat < 0.26) ? (Math.random() * 2 - 1) * 0.25 : 0;
      channelData[i] = (kick * 0.8 + bassSaw * sidechain * 0.35 + hihat) * 0.8;
    }
  } else if (type === 'dramatic-sting') {
    // Breaking News / Cinematic Trailer dramatic brass hit and suspense drone
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const hit = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 2.5) * 0.6;
      const brass1 = Math.sin(2 * Math.PI * 220 * t);
      const brass2 = Math.sin(2 * Math.PI * 277.18 * t) * 0.7;
      const drone = Math.sin(2 * Math.PI * 55 * t) * 0.4;
      const swell = Math.min(1, t / 1.5);
      channelData[i] = (hit + (brass1 + brass2) * swell * 0.3 + drone) * 0.75;
    }
  } else if (type === 'hiphop-trap') {
    // Punchy 808 trap beat with sizzle hi-hats
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.46; // ~130 BPM
      const kick808 = (beat < 0.25) ? Math.sin(2 * Math.PI * 50 * beat) * Math.exp(-beat * 6) : 0;
      const snare = (t % 0.92 > 0.46 && (t % 0.92) - 0.46 < 0.12) ? (Math.random() * 2 - 1) * 0.45 : 0;
      const hat = ((Math.floor(t * 16) % 2 === 0) && (t % 0.06 < 0.015)) ? (Math.random() * 2 - 1) * 0.2 : 0;
      channelData[i] = (kick808 * 0.85 + snare + hat) * 0.8;
    }
  } else if (type === 'celebration-fanfare') {
    // Upbeat celebratory fanfare chords with shimmer bells
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.5;
      const hornIndex = Math.floor(t * 2) % 4;
      const freqs = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5 major
      const f = freqs[hornIndex];
      const horn = Math.sin(2 * Math.PI * f * t) * 0.35;
      const clap = (beat > 0.25 && beat < 0.32) ? (Math.random() * 2 - 1) * 0.3 : 0;
      const chime = Math.sin(2 * Math.PI * 1318.51 * t) * 0.15 * Math.exp(-(beat % 0.25) * 10);
      channelData[i] = (horn + clap + chime) * 0.8;
    }
  } else if (type === 'chillhop') {
    // Smooth Lo-Fi Rhodes chords with subtle vinyl crackle
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const chordIndex = Math.floor(t / 2.0) % 4;
      const chords = [
        [220, 261.63, 329.63, 392.00],
        [174.61, 220.00, 261.63, 329.63],
        [196.00, 246.94, 293.66, 349.23],
        [164.81, 196.00, 246.94, 293.66]
      ];
      const c = chords[chordIndex];
      const rhodes = (Math.sin(2 * Math.PI * c[0] * t) +
                      Math.sin(2 * Math.PI * c[1] * t) * 0.8 +
                      Math.sin(2 * Math.PI * c[2] * t) * 0.6 +
                      Math.sin(2 * Math.PI * c[3] * t) * 0.4) * 0.2;
      const kick = (t % 0.6 < 0.08) ? Math.sin(2 * Math.PI * 60 * (t % 0.6)) * Math.exp(-(t % 0.6) * 30) * 0.5 : 0;
      const vinyl = (Math.random() > 0.99 ? (Math.random() * 2 - 1) * 0.1 : 0);
      channelData[i] = (rhodes + kick + vinyl) * 0.85;
    }
  } else if (type === 'cinematic-epic') {
    // Heavy cinematic orchestral percussion, sub impact and brass staccato
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const bar = t % 1.5;
      const taiko = (bar < 0.2) ? Math.sin(2 * Math.PI * 45 * bar) * Math.exp(-bar * 12) : 0;
      const roll = (bar > 1.1) ? (Math.random() * 2 - 1) * Math.sin((bar - 1.1) * Math.PI / 0.4) * 0.25 : 0;
      const sub = Math.sin(2 * Math.PI * 55 * t) * 0.35;
      const brass = Math.sin(2 * Math.PI * 110 * t) * 0.2 + Math.sin(2 * Math.PI * 164.81 * t) * 0.15;
      channelData[i] = (taiko * 0.8 + roll + sub + brass) * 0.85;
    }
  } else if (type === 'corporate-uplifting') {
    // Bright corporate acoustic guitar & marimba melody
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.4;
      const step = Math.floor(t * 5) % 8;
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33];
      const marimba = Math.sin(2 * Math.PI * notes[step] * t) * Math.exp(-(beat % 0.2) * 18) * 0.3;
      const kick = (beat < 0.08) ? Math.sin(2 * Math.PI * 80 * beat) * Math.exp(-beat * 25) * 0.4 : 0;
      const acoustic = Math.sin(2 * Math.PI * 261.63 * t) * 0.15;
      channelData[i] = (marimba + kick + acoustic) * 0.8;
    }
  } else if (type === 'retro-synthwave') {
    // 80s retro synth bass with fast synth sequence
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beat = t % 0.44;
      const bassFreq = (Math.floor(t / 1.76) % 2 === 0) ? 65.41 : 49.00;
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.4 + Math.sin(2 * Math.PI * bassFreq * 2 * t) * 0.2;
      const seqIndex = Math.floor(t * 8) % 4;
      const seqFreqs = [261.63, 329.63, 392.00, 523.25];
      const lead = Math.sin(2 * Math.PI * seqFreqs[seqIndex] * t) * 0.25;
      const kick = (beat < 0.09) ? Math.sin(2 * Math.PI * 90 * beat) * Math.exp(-beat * 25) * 0.6 : 0;
      const snare = (beat > 0.22 && beat < 0.32) ? (Math.random() * 2 - 1) * 0.25 : 0;
      channelData[i] = (bass + lead + kick + snare) * 0.8;
    }
  } else if (type === 'bengali-flute') {
    // Serene bamboo flute tone with gentle tanpura ambient drone
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const noteIdx = Math.floor(t / 1.5) % 5;
      const ragaFreqs = [293.66, 329.63, 369.99, 440.00, 554.37]; // D E F# A C#
      const baseFreq = ragaFreqs[noteIdx];
      const vibrato = Math.sin(2 * Math.PI * 5 * t) * 6;
      const flute = Math.sin(2 * Math.PI * (baseFreq + vibrato) * t) * 0.4 +
                    Math.sin(2 * Math.PI * (baseFreq * 2) * t) * 0.15;
      const tanpuraDrone = Math.sin(2 * Math.PI * 146.83 * t) * 0.15 + Math.sin(2 * Math.PI * 220 * t) * 0.1;
      const breathNoise = (Math.random() * 2 - 1) * 0.04;
      channelData[i] = (flute + tanpuraDrone + breathNoise) * 0.8;
    }
  } else if (type === 'laser') {
    // Fast sci-fi laser pew
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sweep = Math.exp(-t * 15);
      const freq = 1600 * sweep + 100;
      channelData[i] = Math.sin(2 * Math.PI * freq * t) * sweep * 0.8;
    }
  } else if (type === 'explosion') {
    // Deep cinematic bass explosion hit
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 3.5);
      const sub = Math.sin(2 * Math.PI * 55 * t) * decay * 0.6;
      const rumble = (Math.random() * 2 - 1) * decay * 0.4;
      channelData[i] = (sub + rumble) * 0.9;
    }
  } else if (type === 'applause') {
    // Cheering applause crowd
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const clapDense = (Math.random() > 0.85 ? (Math.random() * 2 - 1) * 0.6 : 0);
      const crowdHum = Math.sin(2 * Math.PI * 300 * t) * 0.08 + Math.sin(2 * Math.PI * 450 * t) * 0.06;
      const envelope = Math.min(1, t / 0.5) * Math.max(0, 1 - (t - (durationSec - 0.5)) / 0.5);
      channelData[i] = (clapDense + crowdHum) * envelope * 0.85;
    }
  } else if (type === 'keyboard') {
    // Mechanical keyboard typing clicks
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const clickCycle = t % 0.18;
      const click = (clickCycle < 0.02) ? (Math.random() * 2 - 1) * Math.exp(-clickCycle * 200) : 0;
      channelData[i] = click * 0.7;
    }
  } else if (type === 'heartbeat') {
    // Deep rhythmic heartbeat thumps
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const cycle = t % 1.0;
      const thump1 = (cycle < 0.12) ? Math.sin(2 * Math.PI * 55 * cycle) * Math.exp(-cycle * 30) * 0.8 : 0;
      const thump2 = (cycle > 0.25 && cycle < 0.37) ? Math.sin(2 * Math.PI * 50 * (cycle - 0.25)) * Math.exp(-(cycle - 0.25) * 35) * 0.6 : 0;
      channelData[i] = (thump1 + thump2) * 0.9;
    }
  } else if (type === 'success-ding') {
    // Clean bright success achievement chime
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const tone1 = (t < 0.2) ? Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 8) : 0;
      const tone2 = (t >= 0.15) ? Math.sin(2 * Math.PI * 783.99 * (t - 0.15)) * Math.exp(-(t - 0.15) * 4) : 0;
      const tone3 = (t >= 0.3) ? Math.sin(2 * Math.PI * 1046.50 * (t - 0.3)) * Math.exp(-(t - 0.3) * 3) : 0;
      channelData[i] = (tone1 * 0.4 + tone2 * 0.4 + tone3 * 0.5) * 0.8;
    }
  } else if (type === 'error-buzz') {
    // Two low pitched error buzzer pulses
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const p1 = (t < 0.18) ? Math.sign(Math.sin(2 * Math.PI * 130 * t)) * 0.5 : 0;
      const p2 = (t > 0.25 && t < 0.43) ? Math.sign(Math.sin(2 * Math.PI * 130 * t)) * 0.5 : 0;
      channelData[i] = (p1 + p2) * 0.6;
    }
  } else if (type === 'game-coin') {
    // Retro 8-bit coin jump sound
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const t1 = (t < 0.08) ? Math.sin(2 * Math.PI * 987.77 * t) : 0;
      const t2 = (t >= 0.08 && t < 0.4) ? Math.sin(2 * Math.PI * 1318.51 * (t - 0.08)) * Math.exp(-(t - 0.08) * 8) : 0;
      channelData[i] = (t1 + t2) * 0.7;
    }
  } else if (type === 'riser') {
    // Cinematic tension pitch-bending riser
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const progress = Math.min(1, t / durationSec);
      const freq = 100 + Math.pow(progress, 2.5) * 1200;
      const saw = (2 * ((freq * t) % 1) - 1) * 0.3;
      const noise = (Math.random() * 2 - 1) * progress * 0.2;
      channelData[i] = (saw + noise) * progress * 0.8;
    }
  } else if (type === 'rain-ambient') {
    // Gentle rain shower ambient atmosphere
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const rain = (Math.random() * 2 - 1) * 0.25;
      const rumble = Math.sin(2 * Math.PI * 40 * t) * 0.05;
      channelData[i] = (rain + rumble) * 0.65;
    }
  } else {
    // cinematic drone
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const d1 = Math.sin(2 * Math.PI * 110 * t);
      const d2 = Math.sin(2 * Math.PI * 110.5 * t);
      const d3 = Math.sin(2 * Math.PI * 55 * t) * 0.8;
      const d4 = Math.sin(2 * Math.PI * 220 * t + Math.sin(t * 0.5) * 2) * 0.2;
      channelData[i] = ((d1 + d2) * 0.3 + d3 + d4) * 0.5;
    }
  }

  // Convert raw Float32 samples to WAV data URI
  const url = pcmToWavBlobUrl(channelData, sampleRate);
  audioCache.set(cacheKey, url);
  return url;
}

function pcmToWavBlobUrl(channelData: Float32Array, sampleRate: number): string {
  const numChannels = 1;
  const format = 1; // PCM
  const bitDepth = 16;
  const dataSize = channelData.length * (bitDepth / 8);
  const bufferLength = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate simple mock waveform for timeline visualization
export function generateWaveformPoints(count: number = 40): number[] {
  const points: number[] = [];
  let prev = 0.5;
  for (let i = 0; i < count; i++) {
    const r = Math.sin(i * 0.4) * 0.3 + 0.5;
    const variation = (Math.random() - 0.5) * 0.4;
    const val = Math.max(0.15, Math.min(0.95, (prev * 0.4) + (r * 0.4) + variation));
    points.push(val);
    prev = val;
  }
  return points;
}

// Voiceover recorder class for mic recording
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.start(100);
      return true;
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      return false;
    }
  }

  stop(): Promise<{ audioUrl: string; duration: number; blob: Blob }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not started'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Calculate audio duration
        const tempAudio = new Audio(audioUrl);
        tempAudio.onloadedmetadata = () => {
          const duration = tempAudio.duration || 3;
          resolve({ audioUrl, duration, blob: audioBlob });
        };
        tempAudio.onerror = () => {
          resolve({ audioUrl, duration: 3, blob: audioBlob });
        };

        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }
      };

      this.mediaRecorder.stop();
    });
  }
}

/**
 * Accurately measures audio file duration, creates an object URL and waveform points
 */
export async function getAudioFileMetadata(file: File): Promise<{
  url: string;
  duration: number;
  waveform: number[];
  name: string;
}> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = url;
    audio.onloadedmetadata = () => {
      const duration = Math.max(0.5, Math.round(audio.duration * 10) / 10 || 5.0);
      resolve({
        url,
        duration,
        waveform: generateWaveformPoints(Math.min(60, Math.max(20, Math.round(duration * 4)))),
        name: file.name.replace(/\.[^/.]+$/, "")
      });
    };
    audio.onerror = () => {
      // Fallback
      resolve({
        url,
        duration: 5.0,
        waveform: generateWaveformPoints(30),
        name: file.name.replace(/\.[^/.]+$/, "")
      });
    };
  });
}

/**
 * Extracts the audio track from a user video file using Web Audio API
 */
export async function extractAudioFromVideo(file: File): Promise<{
  url: string;
  duration: number;
  waveform: number[];
  name: string;
}> {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtxClass();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    const duration = Math.max(0.5, Math.round(audioBuffer.duration * 10) / 10);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Downsample or create WAV
    const wavUrl = pcmToWavBlobUrl(channelData, sampleRate);
    ctx.close();

    return {
      url: wavUrl,
      duration,
      waveform: generateWaveformPoints(Math.min(60, Math.max(20, Math.round(duration * 4)))),
      name: `${file.name.replace(/\.[^/.]+$/, "")} (Extracted Audio)`
    };
  } catch (err) {
    console.warn('Could not decode audio track directly from video, falling back to media url:', err);
    const url = URL.createObjectURL(file);
    return {
      url,
      duration: 5.0,
      waveform: generateWaveformPoints(30),
      name: `${file.name.replace(/\.[^/.]+$/, "")} (Audio)`
    };
  }
}
