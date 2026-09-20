import { describe, expect, it } from 'vitest';
import { GRID_COLS, GRID_ROWS, type SessionSnapshot, type SpinOutcome } from '@mahjong/shared';
import { GAME_CONFIG } from '../../src/game/config/gameConfig';
import { EMPTY_SESSION } from '../../src/game/FreeSpinEngine';
import { GameEngine } from '../../src/game/GameEngine';
import { SeededRandomSource } from '../../src/game/RandomSource';
import { onlySymbols } from '../helpers/boards';

const engineWith = (seed: number, config = GAME_CONFIG) =>
  new GameEngine(new SeededRandomSource(seed), config);

const FREE_ROUND: SessionSnapshot = {
  dragonMeter: 0,
  freeSpinsRemaining: 6,
  freeSpinsTotal: 8,
  freeSpinBet: 50,
  freeSpinsWin: 0,
};

function assertOutcomeInvariants(outcome: SpinOutcome) {
  const dims = (board: SpinOutcome['finalBoard']) => {
    expect(board).toHaveLength(GRID_COLS);
    board.forEach((column) => expect(column).toHaveLength(GRID_ROWS));
  };
  dims(outcome.initialBoard);
  dims(outcome.finalBoard);

  let running = 0;
  let expectedBoard = outcome.initialBoard;
  outcome.cascades.forEach((step, i) => {
    expect(step.index).toBe(i + 1);
    expect(step.board).toEqual(expectedBoard);
    expect(step.win).toBeGreaterThan(0);
    running += step.win;
    expect(step.runningWin).toBe(running);
    expect(step.moves.length + step.winningPositions.length).toBeGreaterThanOrEqual(0);
    expect(step.spawns).toHaveLength(step.winningPositions.length);
    dims(step.boardAfter);
    expectedBoard = step.dragonFortune?.boardAfter ?? step.boardAfter;
  });
  expect(outcome.finalBoard).toEqual(expectedBoard);
  expect(outcome.totalWin).toBe(running);
  expect(outcome.totalWin).toBeLessThanOrEqual(outcome.bet * GAME_CONFIG.maxWinMultiplier);
  expect(outcome.dragonMeterAfter).toBeGreaterThanOrEqual(0);
  expect(outcome.dragonMeterAfter).toBeLessThan(100);
  expect(outcome.session.freeSpinsRemaining).toBeGreaterThanOrEqual(0);
  expect(outcome.scatterCount).toBe(outcome.scatterPositions.length);
}

describe('GameEngine', () => {
  it('is deterministic for a given seed', () => {
    const a = engineWith(5).playSpin(EMPTY_SESSION, 20);
    const b = engineWith(5).playSpin(EMPTY_SESSION, 20);
    expect(a).toEqual(b);
  });

  it('keeps every invariant over thousands of spins', () => {
    const engine = engineWith(2024);
    let session: SessionSnapshot = { ...EMPTY_SESSION };
    let wins = 0;
    let dragons = 0;
    let freeSpinRounds = 0;
    for (let i = 0; i < 4000; i++) {
      const outcome = engine.playSpin(session, 20);
      assertOutcomeInvariants(outcome);
      if (outcome.isFreeSpin) expect(outcome.bet).toBe(session.freeSpinBet);
      session = outcome.session;
      if (outcome.totalWin > 0) wins++;
      dragons += outcome.dragonFortuneTriggers;
      if (!outcome.isFreeSpin && outcome.freeSpinsAwarded > 0) freeSpinRounds++;
    }
    expect(wins).toBeGreaterThan(500);
    expect(dragons).toBeGreaterThan(0);
    expect(freeSpinRounds).toBeGreaterThan(0);
  });

  it('applies the base multiplier ladder to consecutive cascades', () => {
    const engine = engineWith(31);
    const multipliers = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const outcome = engine.playSpin(EMPTY_SESSION, 20);
      outcome.cascades.forEach((step) => {
        const expected = [1, 2, 3, 5, 8][Math.min(step.index, 5) - 1];
        expect(step.multiplier).toBe(expected);
        expect(step.win).toBe(step.baseWin * step.multiplier);
        multipliers.add(`${step.index}:${step.multiplier}`);
      });
    }
    expect(multipliers.has('1:1')).toBe(true);
    expect(multipliers.has('2:2')).toBe(true);
  });

  it('uses the Free Spin multiplier ladder and the locked bet during Free Spins', () => {
    const engine = engineWith(77);
    let found = 0;
    for (let i = 0; i < 400; i++) {
      const outcome = engine.playSpin(FREE_ROUND, 10);
      expect(outcome.isFreeSpin).toBe(true);
      expect(outcome.bet).toBe(50);
      expect(outcome.freeSpinIndex).toBe(3);
      outcome.cascades.forEach((step) => {
        expect(step.multiplier).toBe([2, 4, 6, 10][Math.min(step.index, 4) - 1]);
        found++;
      });
    }
    expect(found).toBeGreaterThan(0);
  });

  it('triggers Dragon Fortune, transforms tiles into Wilds and resets the meter', () => {
    const config = {
      ...GAME_CONFIG,
      dragonFortune: { ...GAME_CONFIG.dragonFortune, gainByCascade: [100] },
    };
    let checked = 0;
    for (let seed = 1; seed <= 300 && checked < 20; seed++) {
      const outcome = engineWith(seed, config).playSpin(EMPTY_SESSION, 20);
      const first = outcome.cascades[0];
      if (!first) continue;
      checked++;

      expect(first.meterAfter).toBe(100);
      const event = first.dragonFortune;
      expect(event).not.toBeNull();
      expect(event!.positions.length).toBeGreaterThanOrEqual(3);
      expect(event!.positions.length).toBeLessThanOrEqual(6);
      for (const { col, row } of event!.positions) {
        expect(event!.boardAfter[col]![row]).toBe('wild-dragon');
        expect(first.boardAfter[col]![row]).not.toBe('wild-dragon');
      }
      expect(outcome.dragonFortuneTriggers).toBeGreaterThanOrEqual(1);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('carries the Dragon meter between spins', () => {
    const engine = engineWith(8);
    let session: SessionSnapshot = { ...EMPTY_SESSION };
    for (let i = 0; i < 200; i++) {
      const outcome = engine.playSpin(session, 20);
      expect(outcome.dragonMeterBefore).toBe(session.dragonMeter);
      expect(outcome.session.dragonMeter).toBe(outcome.dragonMeterAfter);
      session = outcome.session;
    }
  });

  it('awards Free Spins when enough Lotus Scatters land', () => {
    const outcome = engineWith(1, onlySymbols(['lotus-scatter'])).playSpin(EMPTY_SESSION, 100);
    expect(outcome.scatterCount).toBe(24);
    expect(outcome.freeSpinsAwarded).toBe(15);
    expect(outcome.session).toMatchObject({
      freeSpinsRemaining: 15,
      freeSpinsTotal: 15,
      freeSpinBet: 100,
    });
    expect(outcome.totalWin).toBe(0);
  });

  it('does not award Free Spins for fewer than 3 Lotus', () => {
    let checked = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const outcome = engineWith(seed).playSpin(EMPTY_SESSION, 20);
      if (outcome.scatterCount < 3) {
        expect(outcome.freeSpinsAwarded).toBe(0);
        expect(outcome.session.freeSpinsRemaining).toBe(0);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('uses Wilds as substitutes end-to-end (only circles and wilds on the board)', () => {
    const config = onlySymbols(['circle', 'wild-dragon']);
    const outcome = engineWith(3, config).playSpin(EMPTY_SESSION, 100);
    // reels 0 and 5 never contain Wilds, but circles + Wilds cover every reel -> 6-reel win
    expect(outcome.cascades[0]?.wins[0]).toMatchObject({ symbol: 'circle', reels: 6 });
  });

  it('completes a Free Spin round after the last spin', () => {
    const last: SessionSnapshot = { ...FREE_ROUND, freeSpinsRemaining: 1, freeSpinsWin: 40 };
    const outcome = engineWith(9, onlySymbols(['circle'])).playSpin(last, 20);
    expect(outcome.freeSpinsCompleted).toBe(true);
    expect(outcome.freeSpinsWinTotal).toBe(40 + outcome.totalWin);
    expect(outcome.session.freeSpinsRemaining).toBe(0);
  });

  it('caps the total win at the configured maximum', () => {
    const config = {
      ...onlySymbols(['circle']),
      maxWinMultiplier: 3,
    };
    const outcome = engineWith(4, config).playSpin(EMPTY_SESSION, 100);
    expect(outcome.totalWin).toBe(300);
    expect(outcome.cappedAtMaxWin).toBe(true);
  });

  it('classifies big wins by win / bet ratio', () => {
    const engine = engineWith(1);
    expect(engine.bigWinTier(100, 100)).toBe('none');
    expect(engine.bigWinTier(1500, 100)).toBe('big');
    expect(engine.bigWinTier(4000, 100)).toBe('mega');
    expect(engine.bigWinTier(10000, 100)).toBe('epic');
  });
});
