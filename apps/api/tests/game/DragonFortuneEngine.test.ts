import { describe, expect, it } from 'vitest';
import { isRegularSymbol } from '@mahjong/shared';
import { DragonFortuneEngine } from '../../src/game/DragonFortuneEngine';
import { SeededRandomSource } from '../../src/game/RandomSource';
import { parseBoard } from '../helpers/boards';

const board = parseBoard(['CBHFEW', 'DGRCBH', 'XLXLCB', 'CBHFEW']);
const makeEngine = (seed = 1) => new DragonFortuneEngine(new SeededRandomSource(seed));

describe('Dragon Fortune meter', () => {
  it('fills with each winning cascade using the configured gains', () => {
    const engine = makeEngine();
    expect(engine.fill(0, 1)).toEqual({ gain: 8, meter: 8, triggered: false });
    expect(engine.fill(8, 2)).toEqual({ gain: 10, meter: 18, triggered: false });
    expect(engine.fill(18, 3).meter).toBe(30);
  });

  it('triggers at 100% and clamps the meter', () => {
    const engine = makeEngine();
    expect(engine.fill(90, 4)).toEqual({ gain: 15, meter: 100, triggered: true });
    expect(engine.fill(99, 1).triggered).toBe(true);
  });

  it('does not trigger below the threshold', () => {
    expect(makeEngine().fill(80, 1).triggered).toBe(false);
  });

  it('keeps using the last gain for later cascades', () => {
    expect(makeEngine().gainFor(9)).toBe(15);
  });
});

describe('Dragon Fortune target selection', () => {
  it('selects between 3 and 6 unique tiles', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const targets = makeEngine(seed).selectTargets(board);
      expect(targets.length).toBeGreaterThanOrEqual(3);
      expect(targets.length).toBeLessThanOrEqual(6);
      expect(new Set(targets.map((t) => `${t.col}:${t.row}`)).size).toBe(targets.length);
    }
  });

  it('never targets Wilds or Scatters', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const { col, row } of makeEngine(seed).selectTargets(board)) {
        expect(isRegularSymbol(board[col]![row]!)).toBe(true);
      }
    }
  });

  it('can reach every count from 3 to 6', () => {
    const counts = new Set<number>();
    for (let seed = 1; seed <= 300; seed++)
      counts.add(makeEngine(seed).selectTargets(board).length);
    expect([...counts].sort()).toEqual([3, 4, 5, 6]);
  });

  it('selects fewer tiles when the board has too few eligible ones', () => {
    const sparse = parseBoard(['XLXLXL', 'XLXLXL', 'XLXLXL', 'XLXLXC']);
    expect(makeEngine().selectTargets(sparse)).toEqual([{ col: 5, row: 3 }]);
  });
});

describe('Dragon Fortune transformation', () => {
  it('turns the chosen tiles into Golden Dragon Wilds without mutating the input', () => {
    const engine = makeEngine(4);
    const snapshot = JSON.stringify(board);
    const targets = engine.selectTargets(board);
    const next = engine.transform(board, targets);

    expect(JSON.stringify(board)).toBe(snapshot);
    for (const { col, row } of targets) expect(next[col]![row]).toBe('wild-dragon');

    const changed = next.flat().filter((symbol, i) => symbol !== board.flat()[i]).length;
    expect(changed).toBe(targets.length);
  });
});
