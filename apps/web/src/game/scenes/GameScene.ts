import Phaser from 'phaser';
import type { Board, SpinResponse } from '@mahjong/shared';
import { delay } from '../animations/tweens';
import type { AudioManager } from '../audio/AudioManager';
import { GAME_H, GAME_W, METER_Y, MULTIPLIER_Y, TIMING } from '../config';
import { DragonEffect } from '../effects/DragonEffect';
import { ScatterEffect } from '../effects/ScatterEffect';
import { WinEffect } from '../effects/WinEffect';
import { DragonMeter } from '../objects/DragonMeter';
import { FloatingWinText } from '../objects/FloatingWinText';
import { GameBoard } from '../objects/GameBoard';
import { MultiplierDisplay } from '../objects/MultiplierDisplay';

export const READY_EVENT = 'mjd-ready';

export interface GameInit {
  board: Board;
  meter: number;
  idleMultiplier: number;
}

/** Callbacks from the scene back into React (HUD, palace background, dimming). */
export interface SpinHooks {
  onWin(runningTotal: number): void;
  onDim(on: boolean): void;
  onEnterFreeSpins(): void;
}

/**
 * Plays back a spin result that the SERVER already decided. The scene never calculates wins,
 * multipliers, Wilds, the Dragon meter or Free Spins: it only animates what it is told.
 */
export class GameScene extends Phaser.Scene {
  private board!: GameBoard;
  private meter!: DragonMeter;
  private multiplier!: MultiplierDisplay;
  private winEffect!: WinEffect;
  private dragonEffect!: DragonEffect;
  private scatterEffect!: ScatterEffect;
  private audio!: AudioManager;
  private playing = false;

  constructor() {
    super('Game');
  }

  create(): void {
    const init = this.registry.get('init') as GameInit;
    this.audio = this.registry.get('audio') as AudioManager;

    this.board = new GameBoard(this, this.audio);
    this.board.build(init.board);
    this.meter = new DragonMeter(this, GAME_W / 2, METER_Y);
    void this.meter.setValue(init.meter, false);
    this.multiplier = new MultiplierDisplay(this, GAME_W / 2, MULTIPLIER_Y);
    this.multiplier.setIdle(init.idleMultiplier);

    this.winEffect = new WinEffect(this);
    this.dragonEffect = new DragonEffect(this, this.board, this.meter, this.audio, this.winEffect);
    this.scatterEffect = new ScatterEffect(this, this.board, this.audio);

    this.game.events.emit(READY_EVENT, this);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  showBoard(board: Board): void {
    this.board.build(board);
  }

  setMeter(value: number): void {
    void this.meter.setValue(value, false);
  }

  setIdleMultiplier(value: number): void {
    if (!this.playing) this.multiplier.setIdle(value);
  }

  async playSpin(result: SpinResponse, hooks: SpinHooks, idleMultiplier: number): Promise<void> {
    if (this.playing) return;
    this.playing = true;
    try {
      void this.audio.play('spin');
      hooks.onWin(0);
      this.multiplier.setIdle(idleMultiplier);

      // Old board falls away, the server's board drops in.
      await this.board.dropOut();
      await this.board.dropIn(result.initialBoard);
      await delay(this, 180);

      for (const step of result.cascades) {
        // Multiplier for this cascade (×1 ↓ ×2 ↓ ×3 ...).
        void this.multiplier.show(step.multiplier);

        // Winning tiles: gold outline, pulse, floating win amount, golden particles.
        const winning = this.board.getTiles(step.winningPositions);
        void this.audio.play(step.index > 1 ? 'cascade' : 'win');
        const centre = this.board.centerOf(step.winningPositions);
        FloatingWinText.spawn(this, centre.x, centre.y, step.win);
        hooks.onWin(step.runningWin);
        await this.winEffect.highlight(winning);

        // Tiles disappear, survivors fall, replacements from the server drop in.
        await this.board.removeTiles(step.winningPositions);
        await this.board.applyCollapse(step.moves, step.spawns);

        // Dragon Fortune meter fills; at 100% the signature sequence plays.
        await this.meter.setValue(step.meterAfter);
        if (step.dragonFortune) {
          await this.dragonEffect.play(step.dragonFortune, hooks);
          await this.meter.setValue(0);
        }
        await delay(this, TIMING.stepPause);
      }

      // Whatever happened, end on exactly the server's final board.
      this.board.syncTo(result.finalBoard);
      if (result.cascades.length === 0) this.multiplier.setIdle(idleMultiplier);

      if (result.freeSpinsAwarded > 0) {
        await this.scatterEffect.play(
          result.scatterPositions,
          result.freeSpinsAwarded,
          result.freeSpinsRetriggered,
          hooks,
        );
      }
      void this.meter.setValue(result.dragonMeterAfter, true);
    } finally {
      this.playing = false;
    }
  }

  /** Game area size, exposed for tests/tools. */
  static readonly size = { width: GAME_W, height: GAME_H };
}
