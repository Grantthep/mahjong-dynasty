import type { SpinMode } from '@mahjong/shared';
import { GAME_CONFIG, type GameConfig } from './config/gameConfig';

/**
 * Cascade multiplier ladder.
 * Base game:  x1, x2, x3, x5, x8 (x8 for cascade 5 and beyond).
 * Free Spins: x2, x4, x6, x10 (x10 for cascade 4 and beyond).
 * Both ladders are configurable in config/gameConfig.ts.
 */
export class MultiplierEngine {
  constructor(private readonly config: GameConfig = GAME_CONFIG) {}

  /** @param cascadeIndex 1-based number of the winning cascade within the spin. */
  getMultiplier(cascadeIndex: number, mode: SpinMode): number {
    const ladder =
      mode === 'free' ? this.config.multipliers.freeSpins : this.config.multipliers.base;
    if (ladder.length === 0) return 1;
    const index = Math.min(Math.max(cascadeIndex, 1), ladder.length) - 1;
    return ladder[index] as number;
  }

  apply(baseWin: number, multiplier: number): number {
    return Math.round(baseWin * multiplier);
  }
}
