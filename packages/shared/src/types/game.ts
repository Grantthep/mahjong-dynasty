import type { SymbolId } from '../constants/symbols';

/** board[col][row]; row 0 is the top row. */
export type Board = SymbolId[][];

export interface Position {
  col: number;
  row: number;
}

export type SpinMode = 'base' | 'free';
export type BigWinTier = 'none' | 'big' | 'mega' | 'epic';

/** One paying symbol combination ("ways to win": left-to-right on adjacent reels). */
export interface WinLine {
  symbol: SymbolId;
  /** Number of consecutive reels (columns) that contain the symbol or a Wild. */
  reels: number;
  ways: number;
  /** Credits before the cascade multiplier (unrounded; the cascade total is rounded once). */
  payout: number;
  positions: Position[];
}

/** A surviving tile that falls after a cascade. */
export interface CascadeMove {
  col: number;
  fromRow: number;
  toRow: number;
}

/** A brand-new tile dropping in from above. */
export interface CascadeSpawn {
  col: number;
  row: number;
  symbol: SymbolId;
}

export interface DragonFortuneEvent {
  /** Tiles the Golden Dragon transforms into Wilds. */
  positions: Position[];
  boardAfter: Board;
}

export interface CascadeStep {
  /** 1-based index of this winning cascade. */
  index: number;
  /** Board evaluated in this step. */
  board: Board;
  wins: WinLine[];
  winningPositions: Position[];
  baseWin: number;
  multiplier: number;
  /** baseWin x multiplier (possibly clamped by the max-win cap). */
  win: number;
  runningWin: number;
  meterBefore: number;
  /** Meter value after this cascade (100 when Dragon Fortune triggers). */
  meterAfter: number;
  moves: CascadeMove[];
  spawns: CascadeSpawn[];
  /** Board after gravity and refill (before any Dragon Fortune transformation). */
  boardAfter: Board;
  dragonFortune: DragonFortuneEvent | null;
}

/** Free Spin / Dragon Fortune state persisted server-side. */
export interface SessionSnapshot {
  dragonMeter: number;
  freeSpinsRemaining: number;
  freeSpinsTotal: number;
  freeSpinBet: number;
  freeSpinsWin: number;
}

/** Everything the engine decides about one spin (independent of user/balance). */
export interface SpinOutcome {
  bet: number;
  isFreeSpin: boolean;
  /** 1-based position within the current free-spin round (0 for a paid spin). */
  freeSpinIndex: number;
  initialBoard: Board;
  cascades: CascadeStep[];
  finalBoard: Board;
  totalWin: number;
  cappedAtMaxWin: boolean;
  bigWinTier: BigWinTier;
  scatterCount: number;
  scatterPositions: Position[];
  freeSpinsAwarded: number;
  freeSpinsRetriggered: boolean;
  freeSpinsCompleted: boolean;
  /** Total won during the completed free-spin round (only when completed). */
  freeSpinsWinTotal: number;
  dragonMeterBefore: number;
  dragonMeterAfter: number;
  dragonFortuneTriggers: number;
  session: SessionSnapshot;
}

/** What POST /api/game/spin returns. */
export interface SpinResponse extends SpinOutcome {
  spinId: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface GameStateResponse {
  username: string;
  balance: number;
  bets: number[];
  session: SessionSnapshot;
  /** Final board of the last spin, or the cosmetic welcome board. */
  board: Board;
}

export interface PaytableConfig {
  [symbol: string]: Record<number, number>;
}

/** Public, read-only game configuration for the client. */
export interface PublicGameConfig {
  demoMode: true;
  grid: { cols: number; rows: number };
  bets: number[];
  defaultBet: number;
  startingBalance: number;
  multipliers: { base: number[]; freeSpins: number[] };
  freeSpinAwards: { min: number; spins: number }[];
  dragonFortune: { threshold: number };
  bigWin: { big: number; mega: number; epic: number };
  paytable: PaytableConfig;
}

export interface SpinHistoryItem {
  id: string;
  bet: number;
  totalWin: number;
  balanceBefore: number;
  balanceAfter: number;
  isFreeSpin: boolean;
  freeSpinsAwarded: number;
  dragonFortuneTriggers: number;
  cascadeCount: number;
  createdAt: string;
}

export interface SpinHistoryResponse {
  spins: SpinHistoryItem[];
}
