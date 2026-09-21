import {
  WILD_SYMBOL,
  isWild,
  type Board,
  type SpinMode,
  type WildReelRespin,
} from '@mahjong/shared';
import type { BoardGenerator } from './BoardGenerator';
import { GAME_CONFIG, type GameConfig } from './config/gameConfig';
import type { RandomSource } from './RandomSource';

/**
 * Wild Reel Respin: when a Golden Wild lands on the first board of a spin, its WHOLE reel can
 * lock as Wilds while every other reel respins once. The chance is a configurable probability,
 * rolled server-side; nothing about it is decided in the browser.
 */
export class WildReelRespinEngine {
  constructor(
    private readonly rng: RandomSource,
    private readonly generator: BoardGenerator,
    private readonly config: GameConfig = GAME_CONFIG,
  ) {}

  /** Reels (columns) that contain at least one Wild, left to right. */
  wildReels(board: Board): number[] {
    const reels: number[] = [];
    board.forEach((column, col) => {
      if (column.some(isWild)) reels.push(col);
    });
    return reels;
  }

  /** Returns the respin, or `null` when no Wild landed or the chance roll failed. */
  tryRespin(board: Board, mode: SpinMode): WildReelRespin | null {
    const reels = this.wildReels(board);
    if (reels.length === 0) return null;
    if (this.rng.next() >= this.config.wildReelRespin.chance) return null;

    const respun: Board = board.map((column, col) =>
      reels.includes(col)
        ? column.map(() => WILD_SYMBOL)
        : column.map(() => this.generator.generateSymbol(col, mode)),
    );
    return { reels, board: respun };
  }
}
