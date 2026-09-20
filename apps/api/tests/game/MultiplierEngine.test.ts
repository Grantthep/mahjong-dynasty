import { describe, expect, it } from 'vitest';
import { MultiplierEngine } from '../../src/game/MultiplierEngine';

const engine = new MultiplierEngine();

describe('MultiplierEngine', () => {
  it('follows the base ladder x1, x2, x3, x5, x8', () => {
    expect([1, 2, 3, 4, 5].map((n) => engine.getMultiplier(n, 'base'))).toEqual([1, 2, 3, 5, 8]);
  });

  it('keeps x8 from the fifth cascade onwards', () => {
    expect([5, 6, 12, 40].map((n) => engine.getMultiplier(n, 'base'))).toEqual([8, 8, 8, 8]);
  });

  it('follows the Free Spins ladder x2, x4, x6, x10', () => {
    expect([1, 2, 3, 4, 9].map((n) => engine.getMultiplier(n, 'free'))).toEqual([2, 4, 6, 10, 10]);
  });

  it('treats invalid cascade numbers as the first step', () => {
    expect(engine.getMultiplier(0, 'base')).toBe(1);
    expect(engine.getMultiplier(-3, 'free')).toBe(2);
  });

  it('applies the multiplier to a win', () => {
    expect(engine.apply(25, 5)).toBe(125);
    expect(engine.apply(1, 8)).toBe(8);
  });
});
