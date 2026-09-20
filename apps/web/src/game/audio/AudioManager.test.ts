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
    audio.destroy();
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
