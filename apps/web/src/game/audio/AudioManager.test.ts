import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from './AudioManager';

afterEach(() => vi.unstubAllGlobals());

/** An Audio element whose file does not exist: fires "error" as soon as a src is set. */
class MissingAudio extends EventTarget {
  preload = '';
  loop = false;
  volume = 1;
  muted = false;
  set src(_value: string) {
    setTimeout(() => this.dispatchEvent(new Event('error')), 0);
  }
  load() {}
  pause() {}
  cloneNode() {
    return this;
  }
  play() {
    return Promise.reject(new Error('no source'));
  }
}

describe('AudioManager', () => {
  it('never throws when every audio file is missing', async () => {
    vi.stubGlobal('Audio', MissingAudio);
    const audio = new AudioManager('/assets/audio');
    await expect(audio.play('spin')).resolves.toBeUndefined();
    await expect(audio.play('big-win')).resolves.toBeUndefined();
    await expect(audio.playBgm('bgm-main')).resolves.toBeUndefined();
    await expect(audio.playBgm(null)).resolves.toBeUndefined();
    audio.setMuted(true);
    audio.setVolume(0.3);
    audio.setMix({ music: 0.2, sfx: 0.9 });
    audio.destroy();
  });

  it('scales music and effects by their own level times the master volume', async () => {
    const shots: number[] = [];
    vi.stubGlobal(
      'Audio',
      class extends EventTarget {
        preload = '';
        loop = false;
        volume = 1;
        muted = false;
        set src(_value: string) {
          setTimeout(() => this.dispatchEvent(new Event('canplaythrough')), 0);
        }
        load() {}
        pause() {}
        cloneNode() {
          const clone = { volume: 1, play: () => Promise.resolve() };
          shots.push(0);
          const index = shots.length - 1;
          return new Proxy(clone, {
            set(target, key, value) {
              if (key === 'volume') shots[index] = value as number;
              return Reflect.set(target, key, value);
            },
          });
        }
        play() {
          return Promise.resolve();
        }
      },
    );
    const audio = new AudioManager();
    audio.setVolume(0.5);
    audio.setMix({ sfx: 0.4 });
    await audio.play('win'); // no base level: 0.5 * 0.4
    expect(shots[0]).toBeCloseTo(0.2);
    audio.setMix({ sfx: 0 });
    await audio.play('scatter');
    expect(shots[1]).toBe(0);
  });

  it('starts the music on the first interaction after the browser blocked it', async () => {
    let attempts = 0;
    vi.stubGlobal(
      'Audio',
      class extends EventTarget {
        preload = '';
        loop = false;
        volume = 1;
        muted = false;
        paused = true;
        set src(_value: string) {
          setTimeout(() => this.dispatchEvent(new Event('canplaythrough')), 0);
        }
        load() {}
        pause() {}
        cloneNode() {
          return this;
        }
        play() {
          attempts++;
          if (attempts === 1) return Promise.reject(new Error('NotAllowedError'));
          this.paused = false;
          return Promise.resolve();
        }
      },
    );
    const audio = new AudioManager();
    await audio.playBgm('bgm-main');
    expect(attempts).toBe(1); // blocked, as browsers do before any click

    audio.unlock();
    await Promise.resolve();
    expect(attempts).toBe(2);

    audio.unlock(); // already playing: nothing more to do
    await Promise.resolve();
    expect(attempts).toBe(2);
  });

  it('does not try to unlock while muted', async () => {
    const created = vi.fn();
    vi.stubGlobal(
      'Audio',
      class extends MissingAudio {
        constructor() {
          super();
          created();
        }
      },
    );
    const audio = new AudioManager();
    audio.setMuted(true);
    audio.unlock();
    await Promise.resolve();
    expect(created).not.toHaveBeenCalled();
  });

  it('is a no-op when the Audio API is unavailable', async () => {
    vi.stubGlobal('Audio', undefined);
    const audio = new AudioManager();
    await expect(audio.play('win')).resolves.toBeUndefined();
    await expect(audio.playBgm('bgm-free-spins')).resolves.toBeUndefined();
  });

  it('does not try to play while muted', async () => {
    const created = vi.fn();
    vi.stubGlobal(
      'Audio',
      class extends MissingAudio {
        constructor() {
          super();
          created();
        }
      },
    );
    const audio = new AudioManager();
    audio.setMuted(true);
    await audio.play('wild');
    expect(created).not.toHaveBeenCalled();
  });
});
