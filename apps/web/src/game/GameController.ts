import Phaser from 'phaser';
import type { Board, PublicGameConfig, SpinResponse } from '@mahjong/shared';
import { AudioManager } from './audio/AudioManager';
import { GAME_H, GAME_W } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene, READY_EVENT, type SpinHooks } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';

export type { SpinHooks } from './scenes/GameScene';
export type GameMode = 'base' | 'free';

export interface GameControllerInit {
  board: Board;
  meter: number;
  mode: GameMode;
  config: PublicGameConfig;
  muted: boolean;
  volume: number;
}

const READY_TIMEOUT_MS = 30_000;
const TURBO_SPEED = 2.4;

/** The only bridge between React and Phaser. React never touches Phaser objects directly. */
export class GameController {
  readonly audio: AudioManager;
  private mode: GameMode;
  private resizeObserver: ResizeObserver | null = null;

  private constructor(
    private readonly game: Phaser.Game,
    private readonly scene: GameScene,
    private readonly config: PublicGameConfig,
    audio: AudioManager,
    mode: GameMode,
  ) {
    this.audio = audio;
    this.mode = mode;
  }

  static async create(container: HTMLElement, init: GameControllerInit): Promise<GameController> {
    // Canvas text needs the (self-hosted, free) display font ready before the first frame.
    await Promise.all([
      document.fonts?.load('700 32px Cinzel'),
      document.fonts?.load('600 16px Cinzel'),
    ]).catch(() => undefined);

    const audio = new AudioManager();
    audio.setMuted(init.muted);
    audio.setVolume(init.volume);

    const idle = GameController.idleMultiplierFor(init.mode, init.config);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      transparent: true,
      width: GAME_W,
      height: GAME_H,
      banner: false,
      audio: { noAudio: true },
      render: { antialias: true },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, PreloadScene, GameScene],
      callbacks: {
        preBoot: (g) => {
          g.registry.set('init', { board: init.board, meter: init.meter, idleMultiplier: idle });
          g.registry.set('audio', audio);
        },
      },
    });

    const scene = await new Promise<GameScene>((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error('The game took too long to start')),
        READY_TIMEOUT_MS,
      );
      game.events.once(READY_EVENT, (ready: GameScene) => {
        window.clearTimeout(timer);
        resolve(ready);
      });
    }).catch((error: unknown) => {
      game.destroy(true);
      audio.destroy();
      throw error;
    });

    const controller = new GameController(game, scene, init.config, audio, init.mode);
    controller.observeResize(container);
    void audio.playBgm(init.mode === 'free' ? 'bgm-free-spins' : 'bgm-main');
    return controller;
  }

  private static idleMultiplierFor(mode: GameMode, config: PublicGameConfig): number {
    return (mode === 'free' ? config.multipliers.freeSpins[0] : config.multipliers.base[0]) ?? 1;
  }

  private observeResize(container: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.game.scale.refresh());
    this.resizeObserver.observe(container);
  }

  get isPlaying(): boolean {
    return this.scene.isPlaying;
  }

  playSpin(result: SpinResponse, hooks: SpinHooks): Promise<void> {
    return this.scene.playSpin(
      result,
      hooks,
      GameController.idleMultiplierFor(this.mode, this.config),
    );
  }

  showBoard(board: Board): void {
    this.scene.showBoard(board);
  }

  /** Turbo plays every animation faster. */
  setTurbo(turbo: boolean): void {
    this.scene.setSpeed(turbo ? TURBO_SPEED : 1);
  }

  /** Fast-forwards the spin currently being presented. */
  skip(): void {
    this.scene.skip();
  }

  setMeter(value: number): void {
    this.scene.setMeter(value);
  }

  /** Free Spins use the higher multiplier ladder and their own music. */
  setMode(mode: GameMode): void {
    this.mode = mode;
    this.scene.setIdleMultiplier(GameController.idleMultiplierFor(mode, this.config));
    void this.audio.playBgm(mode === 'free' ? 'bgm-free-spins' : 'bgm-main');
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.audio.destroy();
    this.game.destroy(true);
  }
}
