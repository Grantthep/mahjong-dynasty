import { describe, expect, it } from 'vitest';
import { GRID_COLS, GRID_ROWS, SYMBOL_IDS } from '@mahjong/shared';
import { BoardGenerator } from '../../src/game/BoardGenerator';
import { SeededRandomSource } from '../../src/game/RandomSource';
import { onlySymbols } from '../helpers/boards';

describe('BoardGenerator', () => {
  it('creates a 6 x 4 board of valid symbols', () => {
    const board = new BoardGenerator(new SeededRandomSource(1)).generateBoard();
    expect(board).toHaveLength(GRID_COLS);
    for (const column of board) {
      expect(column).toHaveLength(GRID_ROWS);
      for (const symbol of column) expect(SYMBOL_IDS).toContain(symbol);
    }
  });

  it('is deterministic with a seeded source', () => {
    const a = new BoardGenerator(new SeededRandomSource(99)).generateBoard();
    const b = new BoardGenerator(new SeededRandomSource(99)).generateBoard();
    expect(a).toEqual(b);
  });

  it('only places Wilds on the middle reels', () => {
    const generator = new BoardGenerator(new SeededRandomSource(5));
    for (let i = 0; i < 500; i++) {
      const board = generator.generateBoard('free');
      expect(board[0]).not.toContain('wild-dragon');
      expect(board[5]).not.toContain('wild-dragon');
    }
  });

  it('respects the configured weights', () => {
    const generator = new BoardGenerator(
      new SeededRandomSource(2),
      onlySymbols(['circle', 'bamboo']),
    );
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++)
      generator
        .generateBoard()
        .flat()
        .forEach((s) => seen.add(s));
    expect([...seen].sort()).toEqual(['bamboo', 'circle']);
  });

  it('produces every symbol over many boards (Wild and Scatter included)', () => {
    const generator = new BoardGenerator(new SeededRandomSource(7));
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++)
      generator
        .generateBoard()
        .flat()
        .forEach((s) => seen.add(s));
    expect(seen.size).toBe(SYMBOL_IDS.length);
  });

  it('generates Wilds more often in Free Spins than in the base game', () => {
    const count = (mode: 'base' | 'free') => {
      const generator = new BoardGenerator(new SeededRandomSource(11));
      let wilds = 0;
      for (let i = 0; i < 3000; i++)
        wilds += generator
          .generateBoard(mode)
          .flat()
          .filter((s) => s === 'wild-dragon').length;
      return wilds;
    };
    expect(count('free')).toBeGreaterThan(count('base'));
  });

  it('rejects an invalid reel index', () => {
    expect(() => new BoardGenerator(new SeededRandomSource(1)).generateSymbol(9)).toThrow(
      RangeError,
    );
  });
});
