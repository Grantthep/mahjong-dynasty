import { describe, expect, it } from 'vitest';
import {
  CryptoRandomSource,
  SeededRandomSource,
  randomInt,
  randomIntBetween,
} from '../../src/game/RandomSource';

describe('CryptoRandomSource', () => {
  it('returns numbers in [0, 1)', () => {
    const rng = new CryptoRandomSource();
    for (let i = 0; i < 2000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('is not repeating itself', () => {
    const rng = new CryptoRandomSource();
    const values = new Set(Array.from({ length: 200 }, () => rng.next()));
    expect(values.size).toBe(200);
  });

  it('never calls Math.random', () => {
    const original = Math.random;
    Math.random = () => {
      throw new Error('Math.random must not be used for game outcomes');
    };
    try {
      expect(() => new CryptoRandomSource().next()).not.toThrow();
    } finally {
      Math.random = original;
    }
  });
});

describe('SeededRandomSource', () => {
  it('is deterministic for the same seed', () => {
    const a = new SeededRandomSource(42);
    const b = new SeededRandomSource(42);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(
      Array.from({ length: 20 }, () => b.next()),
    );
  });

  it('differs for different seeds and accepts string seeds', () => {
    expect(new SeededRandomSource('a').next()).not.toBe(new SeededRandomSource('b').next());
  });

  it('is roughly uniform', () => {
    const rng = new SeededRandomSource(1);
    const buckets = new Array<number>(10).fill(0);
    for (let i = 0; i < 100_000; i++) buckets[Math.floor(rng.next() * 10)]!++;
    for (const count of buckets) expect(Math.abs(count - 10_000)).toBeLessThan(600);
  });
});

describe('integer helpers', () => {
  it('randomInt stays in range', () => {
    const rng = new SeededRandomSource(3);
    for (let i = 0; i < 1000; i++) expect(randomInt(rng, 7)).toBeLessThan(7);
  });

  it('randomIntBetween is inclusive', () => {
    const rng = new SeededRandomSource(3);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(randomIntBetween(rng, 3, 6));
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });
});
