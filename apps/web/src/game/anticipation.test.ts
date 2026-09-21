import { describe, expect, it } from 'vitest';
import type { Board } from '@mahjong/shared';
import { huntSucceeded, huntingReel, isHunting, scatterPositions } from './anticipation';

/** Builds board[col][row] from 4 rows of 6 letters (L = Lotus scatter, . = a plain tile). */
const board = (rows: string[]): Board =>
  Array.from({ length: 6 }, (_, col) =>
    rows.map((row) => (row[col] === 'L' ? 'lotus-scatter' : 'circle')),
  );

describe('scatterPositions', () => {
  it('finds every Lotus', () => {
    expect(scatterPositions(board(['L.....', '.L....', '......', '.....L']))).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 1 },
      { col: 5, row: 3 },
    ]);
    expect(scatterPositions(board(['......', '......', '......', '......']))).toEqual([]);
  });
});

describe('huntingReel (reels drop left to right)', () => {
  it('is the reel where the second Lotus lands, while reels are still to come', () => {
    expect(huntingReel(board(['L.....', '.L....', '......', '......']))).toBe(1);
    expect(huntingReel(board(['L.....', '......', '..L...', '.....L']))).toBe(2);
    // two on the same reel
    expect(huntingReel(board(['L.....', 'L.....', '......', '......']))).toBe(0);
  });

  it('keeps hunting even if the last Lotus never comes (the result is the server’s)', () => {
    expect(huntingReel(board(['L.....', '.L....', '......', '......']))).toBe(1);
  });

  it('does not hunt when there is nothing to hunt for', () => {
    expect(huntingReel(board(['......', '......', '......', '......']))).toBeNull(); // none
    expect(huntingReel(board(['L.....', '......', '......', '......']))).toBeNull(); // one
    expect(huntingReel(board(['L.....', '.....L', '......', '......']))).toBeNull(); // 2nd on last reel
    expect(huntingReel(board(['L.....', 'L.....', 'L.....', '......']))).toBeNull(); // 3 already on reel 0
    expect(huntingReel(board(['L.....', '.L....', '..L...', '......']))).toBe(1); // 3rd is still to come
  });
});

describe('isHunting / huntSucceeded', () => {
  it('hunts when exactly two Lotus are showing', () => {
    expect(isHunting(board(['L.....', '.L....', '......', '......']))).toBe(true);
    expect(isHunting(board(['L.....', '......', '......', '......']))).toBe(false);
    expect(isHunting(board(['L.....', '.L....', '..L...', '......']))).toBe(false);
  });

  it('succeeds when a third Lotus lands', () => {
    expect(huntSucceeded(board(['L.....', '.L....', '..L...', '......']))).toBe(true);
    expect(huntSucceeded(board(['L.....', '.L....', '......', '......']))).toBe(false);
  });
});
