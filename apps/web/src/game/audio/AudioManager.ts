export const SOUND_NAMES = [
  'bgm-main',
  'bgm-free-spins',
  'button',
  'spin',
  'tile-drop',
  'cascade',
  'win',
  'big-win',
  'wild',
  'scatter',
  'dragon-fortune',
  'free-spins',
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

const EXTENSIONS = ['mp3', 'ogg', 'wav'] as const;
const LOAD_TIMEOUT_MS = 4000;
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const BASE_VOLUME: Partial<Record<SoundName, number>> = {
  'bgm-main': 0.35,
  'bgm-free-spins': 0.4,
  'tile-drop': 0.5,
};

/**
 * Plays optional audio files from /assets/audio/<name>.(mp3|ogg|wav).
 * Missing or unplayable files are silently ignored: the game never depends on audio.
 */
export class AudioManager {
  private readonly loaders = new Map<SoundName, Promise<HTMLAudioElement | null>>();
  private readonly lastPlayed = new Map<SoundName, number>();
  private muted = false;
  private volume = 0.7;
  private musicVolume = 1;
  private sfxVolume = 1;
  private currentBgm: { name: SoundName; element: HTMLAudioElement } | null = null;
  private wantedBgm: SoundName | null = null;
  private destroyed = false;

  constructor(private readonly baseUrl = '/assets/audio') {}

  /**
   * Browsers refuse to play sound until the player has interacted with the page. Call this from a
   * click / key handler: it (re)starts the background music if the first attempt was blocked.
   */
  unlock(): void {
    if (this.muted || this.destroyed) return;
    const bgm = this.currentBgm;
    if (!bgm) {
      void this.playBgm(this.wantedBgm);
    } else if (bgm.element.paused) {
      void Promise.resolve(bgm.element.play()).catch(() => undefined);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.currentBgm) this.currentBgm.element.muted = muted;
    if (!muted) void this.playBgm(this.wantedBgm);
  }

  setVolume(volume: number): void {
    this.volume = clamp01(volume);
    this.applyBgmLevel();
  }

  /** Separate levels for the background music and the sound effects (each scaled by the master volume). */
  setMix(mix: { music?: number; sfx?: number }): void {
    if (mix.music !== undefined) this.musicVolume = clamp01(mix.music);
    if (mix.sfx !== undefined) this.sfxVolume = clamp01(mix.sfx);
    this.applyBgmLevel();
  }

  private applyBgmLevel(): void {
    if (this.currentBgm) this.currentBgm.element.volume = this.level(this.currentBgm.name);
  }

  private level(name: SoundName): number {
    const mix = name.startsWith('bgm') ? this.musicVolume : this.sfxVolume;
    return clamp01(this.volume * mix * (BASE_VOLUME[name] ?? 1));
  }

  private load(name: SoundName): Promise<HTMLAudioElement | null> {
    let loader = this.loaders.get(name);
    if (!loader) {
      loader = this.probe(name);
      this.loaders.set(name, loader);
    }
    return loader;
  }

  private async probe(name: SoundName): Promise<HTMLAudioElement | null> {
    if (typeof Audio === 'undefined') return null;
    for (const extension of EXTENSIONS) {
      const element = await this.tryLoad(`${this.baseUrl}/${name}.${extension}`);
      if (element) return element;
    }
    return null;
  }

  private tryLoad(url: string): Promise<HTMLAudioElement | null> {
    return new Promise((resolve) => {
      try {
        const element = new Audio();
        element.preload = 'auto';
        const finish = (result: HTMLAudioElement | null) => {
          window.clearTimeout(timer);
          element.removeEventListener('canplaythrough', onReady);
          element.removeEventListener('loadeddata', onReady);
          element.removeEventListener('error', onError);
          resolve(result);
        };
        const onReady = () => finish(element);
        const onError = () => finish(null);
        const timer = window.setTimeout(() => finish(null), LOAD_TIMEOUT_MS);
        element.addEventListener('canplaythrough', onReady);
        element.addEventListener('loadeddata', onReady);
        element.addEventListener('error', onError);
        element.src = url;
        element.load?.();
      } catch {
        resolve(null);
      }
    });
  }

  /** Plays a one-shot effect. Never throws. */
  async play(name: SoundName): Promise<void> {
    if (this.muted || this.destroyed) return;
    const now = Date.now();
    if (now - (this.lastPlayed.get(name) ?? 0) < 60) return;
    this.lastPlayed.set(name, now);
    try {
      const element = await this.load(name);
      if (!element || this.destroyed) return;
      const shot = element.cloneNode(true) as HTMLAudioElement;
      shot.volume = this.level(name);
      await shot.play();
    } catch {
      // Autoplay blocked or decode error - ignore.
    }
  }

  /** Switches the looping background music (`null` stops it). Never throws. */
  async playBgm(name: SoundName | null): Promise<void> {
    this.wantedBgm = name;
    if (this.destroyed) return;
    if (this.currentBgm && this.currentBgm.name !== name) {
      this.currentBgm.element.pause();
      this.currentBgm = null;
    }
    if (!name || this.muted || this.currentBgm?.name === name) return;
    try {
      const element = await this.load(name);
      if (!element || this.wantedBgm !== name || this.destroyed) return;
      element.loop = true;
      element.volume = this.level(name);
      element.muted = this.muted;
      this.currentBgm = { name, element };
      await element.play();
    } catch {
      // Needs a user gesture first; the next call after a click will succeed.
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.currentBgm?.element.pause();
    this.currentBgm = null;
  }
}
