/**
 * Generates ORIGINAL placeholder sound effects and background music (no samples, no licences):
 *
 *   npm run audio:generate
 *
 * Every sound is synthesised from sine waves and filtered noise and written as a small 16-bit mono
 * WAV to apps/web/public/assets/audio/<name>.wav. The 13 names are the ones the game looks for:
 * bgm-main, bgm-free-spins, button, spin, tile-drop, cascade, win, big-win, wild, scatter,
 * dragon-fortune, free-spins, anticipation.
 *
 * Replace any file with your own (.mp3 / .ogg / .wav, same name) - see
 * apps/web/public/assets/README.md. Running this script again overwrites them.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'apps/web/public/assets/audio');
const RATE = 22050;
const TAU = Math.PI * 2;

/* ---------------------------------------------------------------- helpers */

/** Small deterministic random generator so the output is identical on every run. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const midi = (note) => 440 * 2 ** ((note - 69) / 12);
const buffer = (seconds) => new Float32Array(Math.round(seconds * RATE));

/**
 * Adds a note. `wrap` lets the tail spill over to the start (used for seamless music loops).
 * partials = relative amplitudes of harmonics; decay = seconds for the note to fall by ~60 dB.
 */
function addNote(
  buf,
  {
    start,
    freq,
    length,
    gain = 0.3,
    partials = [1, 0.4, 0.15],
    decay = 0.4,
    attack = 0.005,
    wrap = false,
    vibrato = 0,
    glideTo = null,
  },
) {
  const first = Math.round(start * RATE);
  const count = Math.round(length * RATE);
  let phase = 0;
  for (let i = 0; i < count; i++) {
    let idx = first + i;
    if (idx >= buf.length) {
      if (!wrap) break;
      idx %= buf.length;
    }
    const t = i / RATE;
    const env = Math.min(1, t / attack) * Math.exp((-6.9 * t) / decay);
    const f = glideTo === null ? freq : freq + (glideTo - freq) * Math.min(1, t / length);
    phase += (TAU * (f * (1 + vibrato * Math.sin(TAU * 5.5 * t)))) / RATE;
    let v = 0;
    partials.forEach((amp, h) => {
      v += amp * Math.sin(phase * (h + 1));
    });
    buf[idx] += v * env * gain;
  }
}

/** Filtered noise burst; `cutoffFrom` -> `cutoffTo` sweeps a one-pole low-pass. */
function addNoise(
  buf,
  {
    start,
    length,
    gain = 0.2,
    cutoffFrom = 2000,
    cutoffTo = 2000,
    attack = 0.01,
    decay = 0.3,
    seed = 1,
  },
) {
  const rand = rng(seed);
  const first = Math.round(start * RATE);
  const count = Math.round(length * RATE);
  let y = 0;
  for (let i = 0; i < count && first + i < buf.length; i++) {
    const t = i / RATE;
    const cutoff = cutoffFrom + (cutoffTo - cutoffFrom) * (i / count);
    const a = 1 - Math.exp((-TAU * cutoff) / RATE);
    y += a * (rand() * 2 - 1 - y);
    const env = Math.min(1, t / attack) * Math.exp((-6.9 * t) / decay);
    buf[first + i] += y * env * gain;
  }
}

/** Scales to a target peak, fades the ends (no clicks) and writes a 16-bit mono WAV. */
function save(name, buf, { peak = 0.6, fadeIn = 0.004, fadeOut = 0.03, loop = false } = {}) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  const scale = max > 0 ? peak / max : 1;
  const fi = Math.round(fadeIn * RATE);
  const fo = Math.round(fadeOut * RATE);
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    let v = buf[i] * scale;
    if (!loop) {
      if (i < fi) v *= i / fi;
      if (i > buf.length - fo) v *= (buf.length - i) / fo;
    }
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(resolve(OUT, `${name}.wav`), Buffer.concat([header, data]));
  console.info(
    `  ${name}.wav  ${(buf.length / RATE).toFixed(1)}s  ${(data.length / 1024).toFixed(0)} KB`,
  );
}

/* ---------------------------------------------------------------- notes */

// D major pentatonic (D E F# A B): the "Chinese instrument" colour used by the music and chimes.
const D = 62;
const PENTA = [0, 2, 4, 7, 9];
const scale = (degree) => D + 12 * Math.floor(degree / 5) + PENTA[((degree % 5) + 5) % 5];

// Plucked-string / bell timbres.
const PLUCK = [1, 0.5, 0.28, 0.12, 0.05];
const BELL = [1, 0.0, 0.5, 0.0, 0.25, 0.0, 0.12];

/* ---------------------------------------------------------------- effects */

function button() {
  const b = buffer(0.12);
  addNote(b, {
    start: 0,
    freq: 1100,
    glideTo: 700,
    length: 0.1,
    gain: 0.5,
    partials: [1, 0.2],
    decay: 0.06,
  });
  save('button', b, { peak: 0.45 });
}

function spin() {
  const b = buffer(0.7);
  addNoise(b, {
    start: 0,
    length: 0.7,
    gain: 0.5,
    cutoffFrom: 300,
    cutoffTo: 4200,
    attack: 0.15,
    decay: 0.7,
    seed: 11,
  });
  addNote(b, {
    start: 0,
    freq: 180,
    glideTo: 520,
    length: 0.6,
    gain: 0.25,
    partials: [1, 0.3],
    decay: 0.5,
    attack: 0.1,
  });
  save('spin', b, { peak: 0.5 });
}

function tileDrop() {
  const b = buffer(0.25);
  addNote(b, {
    start: 0,
    freq: 170,
    glideTo: 55,
    length: 0.22,
    gain: 0.7,
    partials: [1, 0.25],
    decay: 0.12,
  });
  addNoise(b, {
    start: 0,
    length: 0.05,
    gain: 0.35,
    cutoffFrom: 3000,
    cutoffTo: 800,
    decay: 0.03,
    seed: 5,
  });
  save('tile-drop', b, { peak: 0.55 });
}

function cascade() {
  const b = buffer(0.6);
  [scale(7), scale(9)].forEach((n, i) =>
    addNote(b, {
      start: i * 0.11,
      freq: midi(n + 12),
      length: 0.45,
      gain: 0.35,
      partials: BELL,
      decay: 0.35,
    }),
  );
  save('cascade', b, { peak: 0.5 });
}

function win() {
  const b = buffer(0.9);
  [0, 2, 4, 7].forEach((d, i) =>
    addNote(b, {
      start: i * 0.09,
      freq: midi(scale(d + 5)),
      length: 0.6,
      gain: 0.3,
      partials: PLUCK,
      decay: 0.45,
    }),
  );
  save('win', b, { peak: 0.55 });
}

function bigWin() {
  const b = buffer(2.4);
  [0, 2, 4, 7, 9, 12, 14].forEach((d, i) =>
    addNote(b, {
      start: i * 0.12,
      freq: midi(scale(d + 5)),
      length: 1.0,
      gain: 0.28,
      partials: PLUCK,
      decay: 0.7,
    }),
  );
  [0, 4, 7].forEach((d) =>
    addNote(b, {
      start: 0.85,
      freq: midi(scale(d + 5)),
      length: 1.5,
      gain: 0.22,
      partials: BELL,
      decay: 1.2,
      attack: 0.02,
    }),
  );
  addNoise(b, {
    start: 0.8,
    length: 0.6,
    gain: 0.1,
    cutoffFrom: 6000,
    cutoffTo: 9000,
    decay: 0.4,
    seed: 21,
  });
  save('big-win', b, { peak: 0.6, fadeOut: 0.15 });
}

function wild() {
  const b = buffer(0.9);
  addNote(b, {
    start: 0,
    freq: 380,
    glideTo: 1700,
    length: 0.55,
    gain: 0.35,
    partials: [1, 0.3, 0.1],
    decay: 0.5,
    vibrato: 0.012,
    attack: 0.03,
  });
  const rand = rng(31);
  for (let i = 0; i < 9; i++) {
    addNote(b, {
      start: 0.15 + i * 0.06,
      freq: 1400 + rand() * 2200,
      length: 0.18,
      gain: 0.14,
      partials: [1, 0.2],
      decay: 0.12,
    });
  }
  save('wild', b, { peak: 0.5 });
}

function scatter() {
  const b = buffer(1.6);
  [0, 2, 4].forEach((d, i) =>
    addNote(b, {
      start: i * 0.06,
      freq: midi(scale(d + 5)),
      length: 1.4,
      gain: 0.3,
      partials: BELL,
      decay: 1.1,
      attack: 0.01,
    }),
  );
  addNote(b, {
    start: 0,
    freq: midi(scale(0)),
    length: 1.2,
    gain: 0.2,
    partials: [1, 0.3],
    decay: 0.9,
  });
  save('scatter', b, { peak: 0.55, fadeOut: 0.12 });
}

function dragonFortune() {
  const b = buffer(3.2);
  // Deep gong: a low fundamental with inharmonic partials that ring out.
  [1, 1.48, 2.02, 2.76, 3.9].forEach((ratio, i) =>
    addNote(b, {
      start: 0.5,
      freq: 98 * ratio,
      length: 2.6,
      gain: 0.32 / (i + 1),
      partials: [1],
      decay: 2.2 - i * 0.25,
      attack: 0.008,
    }),
  );
  addNoise(b, {
    start: 0,
    length: 0.55,
    gain: 0.35,
    cutoffFrom: 120,
    cutoffTo: 1500,
    attack: 0.4,
    decay: 0.6,
    seed: 41,
  });
  addNote(b, {
    start: 0,
    freq: 55,
    glideTo: 110,
    length: 0.55,
    gain: 0.35,
    partials: [1, 0.5],
    decay: 0.5,
    attack: 0.3,
  });
  save('dragon-fortune', b, { peak: 0.65, fadeOut: 0.2 });
}

function freeSpins() {
  const b = buffer(2.0);
  [0, 2, 4, 7, 9, 12].forEach((d, i) =>
    addNote(b, {
      start: i * 0.1,
      freq: midi(scale(d + 5)),
      length: 0.9,
      gain: 0.28,
      partials: BELL,
      decay: 0.6,
    }),
  );
  [0, 4, 7].forEach((d) =>
    addNote(b, {
      start: 0.7,
      freq: midi(scale(d + 10)),
      length: 1.2,
      gain: 0.2,
      partials: PLUCK,
      decay: 1.0,
    }),
  );
  save('free-spins', b, { peak: 0.6, fadeOut: 0.12 });
}

/** Two Lotus are showing: a heartbeat that quickens while a tense tone rises. */
function anticipation() {
  const b = buffer(1.9);
  // "lub-dub" beats, each a little stronger than the one before.
  [0.05, 0.6, 1.1].forEach((t, i) => {
    const gain = 0.9 + i * 0.12;
    addNote(b, {
      start: t,
      freq: 66,
      glideTo: 44,
      length: 0.22,
      gain,
      partials: [1, 0.35],
      decay: 0.16,
    });
    addNote(b, {
      start: t + 0.17,
      freq: 78,
      glideTo: 50,
      length: 0.2,
      gain: gain * 0.7,
      partials: [1, 0.3],
      decay: 0.13,
    });
  });
  // The rising tone and a hiss that brightens: something is about to happen.
  addNote(b, {
    start: 0,
    freq: 220,
    glideTo: 700,
    length: 1.85,
    gain: 0.16,
    partials: [1, 0.4, 0.15],
    decay: 3,
    attack: 0.9,
    vibrato: 0.02,
  });
  addNoise(b, {
    start: 0,
    length: 1.85,
    gain: 0.09,
    cutoffFrom: 700,
    cutoffTo: 5500,
    attack: 1.2,
    decay: 4,
    seed: 51,
  });
  save('anticipation', b, { peak: 0.6, fadeOut: 0.06 });
}

/* ---------------------------------------------------------------- music */

/**
 * A seamless loop: a slow drone plus a pentatonic melody on a plucked-string timbre. Notes near the
 * end ring past the loop point and wrap around to the start, so there is no gap or click.
 */
function music({ name, seconds, bpm, seed, melodyGain, droneRoot, rootShift = 0, peak }) {
  const b = buffer(seconds);
  const beat = 60 / bpm;
  const rand = rng(seed);

  // Drone: root + fifth, slowly swelling; whole cycles per loop so the seam is smooth.
  for (const [ratio, gain] of [
    [1, 0.16],
    [1.5, 0.09],
  ]) {
    const f = midi(droneRoot) * ratio;
    const cycles = Math.round(f * seconds);
    const exact = cycles / seconds;
    for (let i = 0; i < b.length; i++) {
      const t = i / RATE;
      const swell = 0.75 + 0.25 * Math.sin((TAU * t) / seconds);
      b[i] += Math.sin(TAU * exact * t) * gain * swell;
    }
  }

  // Melody: a wandering line that favours stepwise motion, with the odd leap.
  let degree = 5 + rootShift;
  const notes = Math.floor(seconds / beat);
  for (let n = 0; n < notes; n++) {
    if (rand() < 0.18) continue; // a rest
    const move = rand();
    degree += move < 0.35 ? -1 : move < 0.7 ? 1 : move < 0.82 ? 2 : move < 0.94 ? -2 : 3;
    degree = Math.max(2 + rootShift, Math.min(11 + rootShift, degree));
    addNote(b, {
      start: n * beat,
      freq: midi(scale(degree)),
      length: beat * 4,
      gain: melodyGain,
      partials: PLUCK,
      decay: beat * 2.6,
      wrap: true,
    });
    // Every fourth beat a low pentatonic note anchors the harmony.
    if (n % 4 === 0) {
      addNote(b, {
        start: n * beat,
        freq: midi(scale(degree % 5) - 12),
        length: beat * 4,
        gain: melodyGain * 0.6,
        partials: [1, 0.3],
        decay: beat * 3,
        wrap: true,
      });
    }
  }
  save(name, b, { peak, loop: true });
}

/* ---------------------------------------------------------------- run */

mkdirSync(OUT, { recursive: true });
console.info(`Writing original placeholder audio to ${OUT}`);
// Optional names on the command line: `node scripts/generate-audio.mjs anticipation` writes only that file
// (handy so the sounds you replaced by hand are left alone).
const only = process.argv.slice(2);
const wanted = (name) => only.length === 0 || only.includes(name);
const effects = {
  button,
  spin,
  'tile-drop': tileDrop,
  cascade,
  win,
  'big-win': bigWin,
  wild,
  scatter,
  'dragon-fortune': dragonFortune,
  'free-spins': freeSpins,
  anticipation,
};
for (const [name, make] of Object.entries(effects)) if (wanted(name)) make();
if (wanted('bgm-main'))
  music({
    name: 'bgm-main',
    seconds: 24,
    bpm: 80,
    seed: 7,
    melodyGain: 0.3,
    droneRoot: 38,
    peak: 0.5,
  });
if (wanted('bgm-free-spins'))
  music({
    name: 'bgm-free-spins',
    seconds: 20,
    bpm: 112,
    seed: 19,
    melodyGain: 0.32,
    droneRoot: 43,
    rootShift: 1,
    peak: 0.5,
  });
console.info('Done. Replace any file with your own (same name) to change it.');
