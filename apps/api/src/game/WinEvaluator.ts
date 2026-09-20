import {
  REGULAR_SYMBOLS,
  isWild,
  type Board,
  type Position,
  type SymbolId,
  type WinLine,
} from '@mahjong/shared';
import { uniquePositions } from './boardUtils';
import { GAME_CONFIG, type GameConfig } from './config/gameConfig';

export interface Evaluation {
  wins: WinLine[];
  /**
   * Whole credits won by this cascade before the multiplier. Line payouts are kept unrounded
   * and the total is rounded ONCE, so the return does not depend on the bet size.
   */
  baseWin: number;
  /** Every distinct tile that took part in a win (these are removed by the cascade). */
  positions: Position[];
}

/**
 * "Ways to win" evaluation: a symbol pays when it (or a Golden Dragon Wild) appears on
 * at least `minWinReels` consecutive reels starting from the leftmost reel. The number of
 * ways is the product of matching tiles per reel. Lotus Scatters never substitute or pay here.
 */
export class WinEvaluator {
  constructor(private readonly config: GameConfig = GAME_CONFIG) {}

  evaluate(board: Board, bet: number): Evaluation {
    const wins: WinLine[] = [];

    for (const symbol of REGULAR_SYMBOLS) {
      const line = this.evaluateSymbol(board, symbol, bet);
      if (line) wins.push(line);
    }

    const exactTotal = wins.reduce((sum, line) => sum + line.payout, 0);
    return {
      wins,
      baseWin: wins.length === 0 ? 0 : Math.max(1, Math.round(exactTotal)),
      positions: uniquePositions(wins.flatMap((line) => line.positions)),
    };
  }

  private evaluateSymbol(board: Board, symbol: SymbolId, bet: number): WinLine | null {
    const matchedByReel: Position[][] = [];

    for (let col = 0; col < this.config.cols; col++) {
      const column = board[col] ?? [];
      const matches: Position[] = [];
      column.forEach((tile, row) => {
        if (tile === symbol || isWild(tile)) matches.push({ col, row });
      });
      if (matches.length === 0) break;
      matchedByReel.push(matches);
    }

    const reels = matchedByReel.length;
    if (reels < this.config.minWinReels) return null;

    const perWay = this.config.paytable[symbol as keyof GameConfig['paytable']]?.[reels];
    if (!perWay) return null;

    const ways = matchedByReel.reduce((product, matches) => product * matches.length, 1);
    return {
      symbol,
      reels,
      ways,
      payout: Math.round(bet * perWay * ways * 100) / 100,
      positions: matchedByReel.flat(),
    };
  }
}
