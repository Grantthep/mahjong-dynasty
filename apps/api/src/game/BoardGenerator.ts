import { SYMBOL_IDS, type Board, type SpinMode, type SymbolId } from '@mahjong/shared';
import { GAME_CONFIG, type GameConfig, type ReelWeights } from './config/gameConfig';
import type { RandomSource } from './RandomSource';

interface WeightTable {
  symbols: SymbolId[];
  cumulative: number[];
  total: number;
}

function buildTables(weights: ReelWeights, cols: number): WeightTable[] {
  return Array.from({ length: cols }, (_, col) => {
    const symbols: SymbolId[] = [];
    const cumulative: number[] = [];
    let total = 0;
    for (const id of SYMBOL_IDS) {
      const weight = weights[id][col] ?? 0;
      if (weight > 0) {
        total += weight;
        symbols.push(id);
        cumulative.push(total);
      }
    }
    if (total === 0) throw new Error(`Reel ${col} has no symbols with a positive weight`);
    return { symbols, cumulative, total };
  });
}

/** Generates random symbols and boards from the configured per-reel weights. */
export class BoardGenerator {
  private readonly tables: Record<SpinMode, WeightTable[]>;

  constructor(
    private readonly rng: RandomSource,
    private readonly config: GameConfig = GAME_CONFIG,
  ) {
    this.tables = {
      base: buildTables(config.weights.base, config.cols),
      free: buildTables(config.weights.freeSpins, config.cols),
    };
  }

  generateSymbol(col: number, mode: SpinMode = 'base'): SymbolId {
    const table = this.tables[mode][col];
    if (!table) throw new RangeError(`Invalid reel index ${col}`);
    const roll = this.rng.next() * table.total;
    const index = table.cumulative.findIndex((limit) => roll < limit);
    return table.symbols[index === -1 ? table.symbols.length - 1 : index] as SymbolId;
  }

  generateBoard(mode: SpinMode = 'base'): Board {
    return Array.from({ length: this.config.cols }, (_, col) =>
      Array.from({ length: this.config.rows }, () => this.generateSymbol(col, mode)),
    );
  }
}
