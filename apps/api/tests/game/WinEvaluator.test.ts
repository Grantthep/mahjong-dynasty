import { describe, expect, it } from 'vitest';
import { WinEvaluator } from '../../src/game/WinEvaluator';
import { GAME_CONFIG } from '../../src/game/config/gameConfig';
import { SIMPLE_CONFIG, parseBoard } from '../helpers/boards';

const evaluator = new WinEvaluator(SIMPLE_CONFIG);
const BET = 10;

// Reel 0 uses {C,B,H,F}, reel 1 uses {D,G,R,W}: no symbol can span both, so a board only wins
// when a test deliberately puts a symbol on the first reels.
describe('WinEvaluator - ways to win', () => {
  it('finds no win when nothing spans three reels', () => {
    const board = parseBoard(['CDCBHF', 'BGCBHF', 'HRCBHF', 'FWCBHF']);
    const result = evaluator.evaluate(board, BET);
    expect(result.wins).toEqual([]);
    expect(result.baseWin).toBe(0);
    expect(result.positions).toEqual([]);
  });

  it('pays a 3-reel, 1-way win', () => {
    // circle on reels 0,1,2 exactly once each
    const board = parseBoard(['CCCDDD', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    const { wins, baseWin } = evaluator.evaluate(board, BET);
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({ symbol: 'circle', reels: 3, ways: 1, payout: 10 });
    expect(baseWin).toBe(10);
  });

  it('multiplies matching tiles per reel to get the number of ways', () => {
    // circle: 2 on reel 0, 3 on reel 1, 1 on reel 2 -> 6 ways
    const board = parseBoard(['CCCWWW', 'CCGWWW', 'BCRWWW', 'HGDWWW']);
    const { wins } = evaluator.evaluate(board, BET);
    const circle = wins.find((w) => w.symbol === 'circle');
    expect(circle).toMatchObject({ reels: 3, ways: 2 * 3 * 1, payout: 60 });
    expect(circle?.positions).toHaveLength(6);
  });

  it('extends a win across more reels and pays the higher tier', () => {
    const board = parseBoard(['CCCCDD', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    const { wins } = evaluator.evaluate(board, BET);
    expect(wins[0]).toMatchObject({ symbol: 'circle', reels: 4, payout: 20 });
  });

  it('pays a 6-reel win', () => {
    const board = parseBoard(['CCCCCC', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    const { wins } = evaluator.evaluate(board, BET);
    expect(wins[0]).toMatchObject({ symbol: 'circle', reels: 6, ways: 1, payout: 100 });
  });

  it('requires the win to start on the leftmost reel', () => {
    // circle on reels 1,2,3 but not 0
    const board = parseBoard(['BCCCDD', 'GGGGDD', 'HHHHDD', 'FFFFDD']);
    expect(evaluator.evaluate(board, BET).wins.filter((w) => w.symbol === 'circle')).toEqual([]);
  });

  it('stops counting at the first reel without the symbol', () => {
    // circle on reels 0,1,2 and 4 (gap on reel 3) -> 3 reels only
    const board = parseBoard(['CCCBCB', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    expect(evaluator.evaluate(board, BET).wins[0]).toMatchObject({ symbol: 'circle', reels: 3 });
  });

  it('pays two different symbols on the same board', () => {
    const board = parseBoard(['CCCDDD', 'BBBGGG', 'HRDRRR', 'FWDWWW']);
    const symbols = evaluator.evaluate(board, BET).wins.map((w) => w.symbol);
    expect(symbols).toEqual(expect.arrayContaining(['circle', 'bamboo']));
  });

  it('scales the payout with the bet', () => {
    const board = parseBoard(['CCCDDD', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    expect(evaluator.evaluate(board, 200).baseWin).toBe(200);
  });

  it('rounds the cascade total once, with a minimum of 1 credit per winning cascade', () => {
    const board = parseBoard(['CCCDDD', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    const real = new WinEvaluator(GAME_CONFIG).evaluate(board, 10);
    expect(real.wins).toHaveLength(1);
    expect(real.wins[0]!.payout).toBeLessThan(1);
    expect(real.baseWin).toBe(1);
  });
});

describe('WinEvaluator - Wild substitution', () => {
  it('lets a Wild stand in for the symbol on a reel', () => {
    const board = parseBoard(['CXCDDD', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    const { wins, positions } = evaluator.evaluate(board, BET);
    expect(wins[0]).toMatchObject({ symbol: 'circle', reels: 3, ways: 1 });
    expect(positions).toContainEqual({ col: 1, row: 0 });
  });

  it('lets a Wild substitute for several different symbols at once', () => {
    // reel 1 contains only a Wild + tiles nobody else has; reels 0 and 2 hold circle AND bamboo
    const board = parseBoard(['CXCWWW', 'BGBWWW', 'HRDWWW', 'FWEWWW']);
    const symbols = evaluator.evaluate(board, BET).wins.map((w) => w.symbol);
    expect(symbols).toEqual(expect.arrayContaining(['circle', 'bamboo']));
  });

  it('counts a Wild on the first reel as the winning symbol', () => {
    const board = parseBoard(['XCCDDD', 'BGGDDD', 'HRRDDD', 'FWWDDD']);
    const { wins } = evaluator.evaluate(board, BET);
    expect(wins.map((w) => w.symbol)).toContain('circle');
  });

  it('multiplies ways when Wilds add extra matching tiles on a reel', () => {
    // reel 0 holds a circle AND a wild -> 2 tiles match there, so ways = 2 * 1 * 1
    const board = parseBoard(['CCCDDD', 'XGDGGG', 'HRDRRR', 'FWDWWW']);
    const circle = evaluator.evaluate(board, BET).wins.find((w) => w.symbol === 'circle');
    expect(circle).toMatchObject({ ways: 2, payout: 20 });
  });

  it('never lets a Lotus Scatter substitute for a symbol', () => {
    const board = parseBoard(['CLCDDD', 'BGDGGG', 'HRDRRR', 'FWDWWW']);
    expect(evaluator.evaluate(board, BET).wins).toEqual([]);
  });

  it('never pays for Wilds or Scatters on their own', () => {
    const board = parseBoard(['LLLLLL', 'LLLLLL', 'LLLLLL', 'LLLLLL']);
    expect(evaluator.evaluate(board, BET).wins).toEqual([]);
  });

  it('lists each winning tile once even when several wins share a Wild', () => {
    const board = parseBoard(['CXCWWW', 'BGBWWW', 'HRDWWW', 'FWEWWW']);
    const { positions } = evaluator.evaluate(board, BET);
    const keys = positions.map((p) => `${p.col}:${p.row}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
