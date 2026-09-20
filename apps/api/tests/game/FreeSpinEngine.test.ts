import { describe, expect, it } from 'vitest';
import type { SessionSnapshot } from '@mahjong/shared';
import { EMPTY_SESSION, FreeSpinEngine } from '../../src/game/FreeSpinEngine';
import { GAME_CONFIG } from '../../src/game/config/gameConfig';

const engine = new FreeSpinEngine();

describe('Scatter awards', () => {
  it('awards nothing below 3 Lotus', () => {
    expect([0, 1, 2].map((n) => engine.awardFor(n))).toEqual([0, 0, 0]);
  });

  it('awards 8 / 12 / 15 Free Spins for 3 / 4 / 5+ Lotus', () => {
    expect([3, 4, 5, 6, 9].map((n) => engine.awardFor(n))).toEqual([8, 12, 15, 15, 15]);
  });

  it('is driven by configuration', () => {
    const custom = new FreeSpinEngine({
      ...GAME_CONFIG,
      scatter: { ...GAME_CONFIG.scatter, awards: [{ min: 2, spins: 3 }] },
    });
    expect(custom.awardFor(2)).toBe(3);
    expect(custom.awardFor(1)).toBe(0);
  });

  it('awards retriggers during Free Spins', () => {
    expect([2, 3, 4, 5].map((n) => engine.retriggerFor(n))).toEqual([0, 4, 6, 8]);
  });
});

describe('Free Spin round state', () => {
  it('starts a round on a paid spin with 3+ Lotus and locks the bet', () => {
    const result = engine.advance(
      { ...EMPTY_SESSION, dragonMeter: 20 },
      { isFreeSpin: false, bet: 50, totalWin: 30, scatterCount: 4, dragonMeter: 44 },
    );
    expect(result.awarded).toBe(12);
    expect(result.session).toEqual({
      dragonMeter: 44,
      freeSpinsRemaining: 12,
      freeSpinsTotal: 12,
      freeSpinBet: 50,
      freeSpinsWin: 0,
    });
  });

  it('does not start a round without enough Lotus and keeps the Dragon meter', () => {
    const result = engine.advance(EMPTY_SESSION, {
      isFreeSpin: false,
      bet: 20,
      totalWin: 0,
      scatterCount: 2,
      dragonMeter: 33,
    });
    expect(result.awarded).toBe(0);
    expect(result.session).toEqual({ ...EMPTY_SESSION, dragonMeter: 33 });
  });

  const midRound: SessionSnapshot = {
    dragonMeter: 10,
    freeSpinsRemaining: 5,
    freeSpinsTotal: 8,
    freeSpinBet: 50,
    freeSpinsWin: 120,
  };

  it('consumes one Free Spin and accumulates the round win', () => {
    const result = engine.advance(midRound, {
      isFreeSpin: true,
      bet: 50,
      totalWin: 80,
      scatterCount: 0,
      dragonMeter: 25,
    });
    expect(result.session).toEqual({
      dragonMeter: 25,
      freeSpinsRemaining: 4,
      freeSpinsTotal: 8,
      freeSpinBet: 50,
      freeSpinsWin: 200,
    });
    expect(result.completed).toBe(false);
  });

  it('retriggers when Lotus land during Free Spins', () => {
    const result = engine.advance(midRound, {
      isFreeSpin: true,
      bet: 50,
      totalWin: 0,
      scatterCount: 3,
      dragonMeter: 10,
    });
    expect(result.retriggered).toBe(true);
    expect(result.awarded).toBe(4);
    expect(result.session.freeSpinsRemaining).toBe(5 - 1 + 4);
    expect(result.session.freeSpinsTotal).toBe(12);
  });

  it('completes the round after the last Free Spin and reports the total win', () => {
    const result = engine.advance(
      { ...midRound, freeSpinsRemaining: 1 },
      { isFreeSpin: true, bet: 50, totalWin: 30, scatterCount: 0, dragonMeter: 40 },
    );
    expect(result.completed).toBe(true);
    expect(result.roundWinTotal).toBe(150);
    expect(result.session).toEqual({ ...EMPTY_SESSION, dragonMeter: 40 });
  });
});
