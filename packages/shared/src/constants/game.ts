import type { SymbolId } from './symbols';

export const GRID_COLS = 6;
export const GRID_ROWS = 4;

/** Allowed demo bets (virtual DEMO CREDITS, no currency). */
export const BET_OPTIONS = [10, 20, 50, 100, 200] as const;
export const DEFAULT_BET = 20;

/** Virtual DEMO CREDITS granted to every new account. */
export const STARTING_BALANCE = 10_000;

export const DRAGON_METER_MAX = 100;

export const DEMO_DISCLAIMER =
  'This game uses virtual DEMO CREDITS only. There are no deposits, withdrawals, payments or real-money wagering.';

/**
 * Decorative board shown before a player's first spin. It is purely cosmetic
 * (never used for any outcome) and indexed as board[col][row].
 */
export const WELCOME_BOARD: SymbolId[][] = [
  ['circle', 'red-dragon', 'bamboo', 'east-wind'],
  ['character', 'green-dragon', 'five-character', 'circle'],
  ['bamboo', 'lotus-scatter', 'white-dragon', 'eight-character'],
  ['east-wind', 'wild-dragon', 'character', 'bamboo'],
  ['eight-character', 'circle', 'green-dragon', 'five-character'],
  ['red-dragon', 'bamboo', 'circle', 'character'],
];
