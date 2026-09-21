import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SOUND_NAMES } from './AudioManager';

// Vitest runs from apps/web, next to public/.
const dir = resolve(process.cwd(), 'public/assets/audio') + '/';
const EXTENSIONS = ['mp3', 'ogg', 'wav'] as const;

const fileFor = (name: string) =>
  EXTENSIONS.map((ext) => `${dir}${name}.${ext}`).find((path) => existsSync(path));

describe('shipped audio', () => {
  it.each(SOUND_NAMES)('has a sound file for "%s"', (name) => {
    const path = fileFor(name);
    expect(path, `no ${name}.(mp3|ogg|wav) in public/assets/audio`).toBeDefined();
    expect(statSync(path!).size).toBeGreaterThan(1000);
  });

  it('ships valid WAV files with audible content and no clipping', () => {
    for (const name of SOUND_NAMES) {
      const path = fileFor(name)!;
      if (!path.endsWith('.wav')) continue; // a replacement in another format is fine
      const bytes = readFileSync(path);
      expect(bytes.toString('ascii', 0, 4), name).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12), name).toBe('WAVE');
      expect(bytes.readUInt16LE(34), `${name} bit depth`).toBe(16);

      let peak = 0;
      for (let i = 44; i + 1 < bytes.length; i += 2)
        peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)));
      expect(peak, `${name} is silent`).toBeGreaterThan(3000);
      expect(peak, `${name} clips`).toBeLessThan(32700);
    }
  });

  it('keeps the two music tracks long enough to loop', () => {
    for (const name of ['bgm-main', 'bgm-free-spins'] as const) {
      const path = fileFor(name)!;
      if (!path.endsWith('.wav')) continue;
      const bytes = readFileSync(path);
      const seconds = (bytes.length - 44) / 2 / bytes.readUInt32LE(24);
      expect(seconds, name).toBeGreaterThan(10);
    }
  });
});
