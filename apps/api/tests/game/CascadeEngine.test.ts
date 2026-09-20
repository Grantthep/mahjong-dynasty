import { describe, expect, it } from 'vitest';
import type { SymbolId } from '@mahjong/shared';
import { CascadeEngine } from '../../src/game/CascadeEngine';
import { parseBoard } from '../helpers/boards';

const engine = new CascadeEngine();

const sequence = (...symbols: SymbolId[]) => {
  let index = 0;
  return () => symbols[index++ % symbols.length] as SymbolId;
};

describe('CascadeEngine', () => {
  const board = parseBoard(['CBBBBB', 'BBBBBB', 'HBBBBB', 'FBBBBB']);

  it('drops survivors and fills the top with new tiles', () => {
    const result = engine.collapse(
      board,
      [
        { col: 0, row: 1 },
        { col: 0, row: 2 },
      ],
      sequence('green-dragon', 'red-dragon'),
    );

    // column 0 was [C, B, H, F]; removing rows 1 and 2 leaves [C, F] which fall to the bottom
    expect(result.board[0]).toEqual(['green-dragon', 'red-dragon', 'circle', 'five-character']);
    expect(result.moves).toEqual([{ col: 0, fromRow: 0, toRow: 2 }]);
    expect(result.spawns).toEqual([
      { col: 0, row: 0, symbol: 'green-dragon' },
      { col: 0, row: 1, symbol: 'red-dragon' },
    ]);
  });

  it('leaves columns without removals untouched and does not mutate the input', () => {
    const before = JSON.stringify(board);
    const result = engine.collapse(board, [{ col: 0, row: 3 }], sequence('circle'));
    expect(result.board.slice(1)).toEqual(board.slice(1));
    expect(JSON.stringify(board)).toBe(before);
  });

  it('shifts every surviving tile above a gap down by one', () => {
    const result = engine.collapse(board, [{ col: 0, row: 3 }], sequence('east-wind'));
    expect(result.board[0]).toEqual(['east-wind', 'circle', 'bamboo', 'character']);
    expect(result.moves).toEqual([
      { col: 0, fromRow: 0, toRow: 1 },
      { col: 0, fromRow: 1, toRow: 2 },
      { col: 0, fromRow: 2, toRow: 3 },
    ]);
  });

  it('refills an entire cleared column', () => {
    const removed = [0, 1, 2, 3].map((row) => ({ col: 2, row }));
    const result = engine.collapse(
      board,
      removed,
      sequence('circle', 'bamboo', 'character', 'east-wind'),
    );
    expect(result.board[2]).toEqual(['circle', 'bamboo', 'character', 'east-wind']);
    expect(result.moves).toEqual([]);
    expect(result.spawns).toHaveLength(4);
  });

  it('keeps the board size after collapsing', () => {
    const removed = [
      { col: 0, row: 0 },
      { col: 3, row: 2 },
      { col: 5, row: 1 },
    ];
    const result = engine.collapse(board, removed, sequence('circle'));
    expect(result.board).toHaveLength(6);
    result.board.forEach((column) => expect(column).toHaveLength(4));
    expect(result.spawns).toHaveLength(removed.length);
  });

  it('returns an identical board when nothing is removed', () => {
    const result = engine.collapse(board, [], sequence('circle'));
    expect(result.board).toEqual(board);
    expect(result.moves).toEqual([]);
    expect(result.spawns).toEqual([]);
  });
});
