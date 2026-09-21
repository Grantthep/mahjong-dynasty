import {
  BET_OPTIONS,
  DRAGON_METER_MAX,
  GRID_COLS,
  GRID_ROWS,
  type RegularSymbolId,
  type SymbolId,
} from '@mahjong/shared';

/** Relative weight of every symbol on each of the 6 reels (0 = never appears on that reel). */
export type ReelWeights = Record<SymbolId, readonly number[]>;

export interface FreeSpinAward {
  /** Minimum number of Lotus Scatters. */
  min: number;
  spins: number;
}

export interface GameConfig {
  cols: number;
  rows: number;
  bets: readonly number[];
  /** Minimum consecutive reels (from the left) for a win. */
  minWinReels: number;
  /** Total win per spin is capped at bet x this value. */
  maxWinMultiplier: number;
  /** Safety valve against runaway cascades. */
  maxCascades: number;
  /**
   * Credits paid PER WAY as a multiple of the bet, keyed by number of reels (3..6).
   * Tuned together with wildReelRespin.chance so the simulated return stays near 95.5%.
   */
  paytable: Record<RegularSymbolId, Record<number, number>>;
  weights: { base: ReelWeights; freeSpins: ReelWeights };
  /** Multiplier by winning-cascade number; the last value repeats for later cascades. */
  multipliers: { base: readonly number[]; freeSpins: readonly number[] };
  scatter: {
    awards: readonly FreeSpinAward[];
    retriggerAwards: readonly FreeSpinAward[];
  };
  dragonFortune: {
    threshold: number;
    /** Meter gained per winning cascade (last value repeats). */
    gainByCascade: readonly number[];
    minWilds: number;
    maxWilds: number;
  };
  /** Win / bet ratios that trigger the BIG WIN presentation. */
  bigWin: { big: number; mega: number; epic: number };
  /** Wild Reel Respin: chance (0..1) that a Wild on the first board locks its reel and respins the rest. */
  wildReelRespin: { chance: number };
}

const reels = (value: number) => [value, value, value, value, value, value] as const;
/** Wilds only land on the four middle reels. */
const wildReels = (value: number) => [0, value, value, value, value, 0] as const;

// Nearly flat weights keep the number of "ways" (and therefore the volatility) under control;
// payout differences between symbols come from the paytable instead.
const BASE_WEIGHTS: ReelWeights = {
  circle: reels(10),
  bamboo: reels(10),
  character: reels(10),
  'five-character': reels(10),
  'eight-character': reels(10),
  'east-wind': reels(9),
  'white-dragon': reels(9),
  'green-dragon': reels(8),
  'red-dragon': reels(8),
  'wild-dragon': wildReels(1),
  'lotus-scatter': reels(1.5),
};

const FREE_SPIN_WEIGHTS: ReelWeights = {
  ...BASE_WEIGHTS,
  'wild-dragon': wildReels(2),
};

/**
 * All demo game math lives here. Tune it with `npm run simulate`.
 * FOR DEVELOPMENT / DEMONSTRATION ONLY - NOT CERTIFIED GAME MATH.
 */
export const GAME_CONFIG: GameConfig = {
  cols: GRID_COLS,
  rows: GRID_ROWS,
  bets: BET_OPTIONS,
  minWinReels: 3,
  maxWinMultiplier: 5000,
  maxCascades: 25,
  paytable: {
    circle: { 3: 0.0065, 4: 0.0149, 5: 0.0372, 6: 0.0911 },
    bamboo: { 3: 0.0065, 4: 0.0149, 5: 0.0372, 6: 0.0911 },
    character: { 3: 0.0074, 4: 0.0186, 5: 0.0446, 6: 0.107 },
    'five-character': { 3: 0.0121, 4: 0.0298, 5: 0.0744, 6: 0.1814 },
    'eight-character': { 3: 0.0149, 4: 0.0372, 5: 0.0911, 6: 0.2232 },
    'east-wind': { 3: 0.0186, 4: 0.0446, 5: 0.1172, 6: 0.2976 },
    'white-dragon': { 3: 0.0298, 4: 0.0744, 5: 0.1814, 6: 0.4464 },
    'green-dragon': { 3: 0.0372, 4: 0.0911, 5: 0.2232, 6: 0.5952 },
    'red-dragon': { 3: 0.0446, 4: 0.1163, 5: 0.2976, 6: 0.744 },
  },
  weights: { base: BASE_WEIGHTS, freeSpins: FREE_SPIN_WEIGHTS },
  multipliers: { base: [1, 2, 3, 5, 8], freeSpins: [2, 4, 6, 10] },
  scatter: {
    awards: [
      { min: 3, spins: 8 },
      { min: 4, spins: 12 },
      { min: 5, spins: 15 },
    ],
    retriggerAwards: [
      { min: 3, spins: 4 },
      { min: 4, spins: 6 },
      { min: 5, spins: 8 },
    ],
  },
  dragonFortune: {
    threshold: DRAGON_METER_MAX,
    gainByCascade: [8, 10, 12, 15],
    minWilds: 3,
    maxWilds: 6,
  },
  bigWin: { big: 15, mega: 40, epic: 100 },
  wildReelRespin: { chance: 0.25 },
};
