import { describe, expect, it } from 'vitest';
import { runSimulation } from '../../src/game/simulation';
import { SeededRandomSource } from '../../src/game/RandomSource';

describe('runSimulation', () => {
  const report = runSimulation(20_000, new SeededRandomSource(123), 20);

  it('reports consistent totals', () => {
    expect(report.paidSpins).toBe(20_000);
    expect(report.totalBet).toBe(20_000 * 20);
    expect(report.totalReturned).toBe(report.baseGameReturned + report.freeSpinReturned);
    expect(report.returnRatio).toBeCloseTo(report.totalReturned / report.totalBet, 10);
  });

  it('produces plausible demo statistics', () => {
    expect(report.hitFrequency).toBeGreaterThan(0.2);
    expect(report.hitFrequency).toBeLessThan(0.8);
    expect(report.returnRatio).toBeGreaterThan(0.5);
    expect(report.returnRatio).toBeLessThan(2);
    expect(report.freeSpinTriggers).toBeGreaterThan(0);
    expect(report.dragonFortuneTriggers).toBeGreaterThan(0);
    expect(report.largestWin).toBeGreaterThan(0);
  });

  it('is reproducible with the same seed', () => {
    expect(runSimulation(2000, new SeededRandomSource(5))).toEqual(
      runSimulation(2000, new SeededRandomSource(5)),
    );
  });
});
