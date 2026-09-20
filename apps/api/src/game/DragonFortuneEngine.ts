import { WILD_SYMBOL, isRegularSymbol, type Board, type Position } from '@mahjong/shared';
import { cloneBoard, findPositions } from './boardUtils';
import { GAME_CONFIG, type GameConfig } from './config/gameConfig';
import { randomIntBetween, randomInt, type RandomSource } from './RandomSource';

export interface MeterFill {
  gain: number;
  /** Meter value after gaining, clamped to the threshold. */
  meter: number;
  triggered: boolean;
}

/**
 * Dragon Fortune: every winning cascade fills the meter. At 100% the Golden Dragon
 * transforms 3-6 randomly chosen (server-side) regular tiles into Wilds.
 */
export class DragonFortuneEngine {
  constructor(
    private readonly rng: RandomSource,
    private readonly config: GameConfig = GAME_CONFIG,
  ) {}

  gainFor(cascadeIndex: number): number {
    const gains = this.config.dragonFortune.gainByCascade;
    if (gains.length === 0) return 0;
    return gains[Math.min(Math.max(cascadeIndex, 1), gains.length) - 1] as number;
  }

  fill(meter: number, cascadeIndex: number): MeterFill {
    const { threshold } = this.config.dragonFortune;
    const gain = this.gainFor(cascadeIndex);
    const filled = Math.min(threshold, meter + gain);
    return { gain, meter: filled, triggered: filled >= threshold };
  }

  /** Picks the tiles to transform; Wilds and Scatters are never chosen. */
  selectTargets(board: Board): Position[] {
    const { minWilds, maxWilds } = this.config.dragonFortune;
    const eligible = findPositions(board, isRegularSymbol);
    const wanted = Math.min(randomIntBetween(this.rng, minWilds, maxWilds), eligible.length);

    // Partial Fisher-Yates shuffle.
    for (let i = 0; i < wanted; i++) {
      const j = i + randomInt(this.rng, eligible.length - i);
      [eligible[i], eligible[j]] = [eligible[j] as Position, eligible[i] as Position];
    }
    return eligible.slice(0, wanted);
  }

  transform(board: Board, positions: readonly Position[]): Board {
    const next = cloneBoard(board);
    for (const { col, row } of positions) {
      const column = next[col];
      if (column) column[row] = WILD_SYMBOL;
    }
    return next;
  }
}
