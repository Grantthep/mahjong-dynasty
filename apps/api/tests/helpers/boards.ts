import { REGULAR_SYMBOLS, SYMBOL_IDS, type Board, type SymbolId } from '@mahjong/shared';
import { GAME_CONFIG, type GameConfig, type ReelWeights } from '../../src/game/config/gameConfig';

const CODES: Record<string, SymbolId> = {
  C: 'circle',
  B: 'bamboo',
  H: 'character',
  F: 'five-character',
  E: 'eight-character',
  W: 'east-wind',
  D: 'white-dragon',
  G: 'green-dragon',
  R: 'red-dragon',
  X: 'wild-dragon',
  L: 'lotus-scatter',
};

/**
 * Builds a board[col][row] from 4 text rows of 6 letters each (top row first), e.g.
 *   parseBoard(['CCCBHF', 'BGRWDE', ...])
 * C circle, B bamboo, H character, F five, E eight, W east wind, D white, G green,
 * R red, X wild, L lotus scatter.
 */
export function parseBoard(rows: string[]): Board {
  const cols = rows[0]?.length ?? 0;
  return Array.from({ length: cols }, (_, col) =>
    rows.map((row) => {
      const symbol = CODES[row[col] as string];
      if (!symbol) throw new Error(`Unknown board code "${row[col]}"`);
      return symbol;
    }),
  );
}

/** A simple, easy-to-reason-about paytable: same for every symbol. */
export const SIMPLE_CONFIG: GameConfig = {
  ...GAME_CONFIG,
  paytable: Object.fromEntries(
    REGULAR_SYMBOLS.map((symbol) => [symbol, { 3: 1, 4: 2, 5: 5, 6: 10 }]),
  ) as unknown as GameConfig['paytable'],
};

/** Config whose generator can only produce the given symbols on every reel. */
export function onlySymbols(symbols: SymbolId[], base: GameConfig = GAME_CONFIG): GameConfig {
  const weights = Object.fromEntries(
    SYMBOL_IDS.map((id) => [id, symbols.includes(id) ? [1, 1, 1, 1, 1, 1] : [0, 0, 0, 0, 0, 0]]),
  ) as unknown as ReelWeights;
  return { ...base, weights: { base: weights, freeSpins: weights } };
}
