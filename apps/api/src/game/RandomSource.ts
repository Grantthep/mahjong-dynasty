import { randomBytes } from 'node:crypto';

/** Source of uniform random numbers in [0, 1). All game randomness goes through this. */
export interface RandomSource {
  next(): number;
}

/**
 * Default source for real outcomes: Node's cryptographically secure RNG
 * (48 random bits -> a double in [0, 1)). Never uses Math.random().
 */
export class CryptoRandomSource implements RandomSource {
  next(): number {
    return randomBytes(6).readUIntBE(0, 6) / 2 ** 48;
  }
}

/**
 * Deterministic generator (mulberry32) for TESTING, SIMULATION and DEBUGGING only.
 * Must never be used for player-facing outcomes.
 */
export class SeededRandomSource implements RandomSource {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'number' ? seed >>> 0 : SeededRandomSource.hash(seed);
  }

  private static hash(text: string): number {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** Uniform integer in [0, maxExclusive). */
export function randomInt(rng: RandomSource, maxExclusive: number): number {
  return Math.floor(rng.next() * maxExclusive);
}

/** Uniform integer in [min, max] (inclusive). */
export function randomIntBetween(rng: RandomSource, min: number, max: number): number {
  return min + randomInt(rng, max - min + 1);
}
