import { describe, expect, it } from 'vitest';
import { GRID_COLS, GRID_ROWS, SYMBOL_IDS, type SessionSnapshot } from '@mahjong/shared';
import { BoardGenerator } from '../../src/game/BoardGenerator';
import { GAME_CONFIG } from '../../src/game/config/gameConfig';
import { EMPTY_SESSION } from '../../src/game/FreeSpinEngine';
import { GameEngine } from '../../src/game/GameEngine';
import { SeededRandomSource, type RandomSource } from '../../src/game/RandomSource';
import { WildReelRespinEngine } from '../../src/game/WildReelRespinEngine';
import { parseBoard } from '../helpers/boards';

const withChance = (chance: number) => ({ ...GAME_CONFIG, wildReelRespin: { chance } });

const engineFor = (chance: number, rng: RandomSource = new SeededRandomSource(1)) => {
  const config = withChance(chance);
  return new WildReelRespinEngine(rng, new BoardGenerator(rng, config), config);
};

// A wild on reel 2 (0-based) and reel 4; nothing else special.
const WITH_WILDS = parseBoard(['CBXBXC', 'BCBCBH', 'HBCBCB', 'CHBCHC']);
const NO_WILDS = parseBoard(['CBHBFC', 'BCBCBH', 'HBCBCB', 'CHBCHC']);

describe('WildReelRespinEngine', () => {
  it('finds the reels that contain a Wild', () => {
    expect(engineFor(1).wildReels(WITH_WILDS)).toEqual([2, 4]);
    expect(engineFor(1).wildReels(NO_WILDS)).toEqual([]);
  });

  it('never respins without a Wild, even when the chance is 100%', () => {
    expect(engineFor(1).tryRespin(NO_WILDS, 'base')).toBeNull();
  });

  it('never respins when the chance is 0%', () => {
    expect(engineFor(0).tryRespin(WITH_WILDS, 'base')).toBeNull();
  });

  it('respins only when the roll is below the chance', () => {
    const roll = (value: number): RandomSource => ({ next: () => value });
    expect(engineFor(0.3, roll(0.29)).tryRespin(WITH_WILDS, 'base')).not.toBeNull();
    expect(engineFor(0.3, roll(0.3)).tryRespin(WITH_WILDS, 'base')).toBeNull();
  });

  it('locks the Wild reels completely and respins every other reel', () => {
    const before = JSON.stringify(WITH_WILDS);
    const respin = engineFor(1).tryRespin(WITH_WILDS, 'base');
    expect(JSON.stringify(WITH_WILDS)).toBe(before); // the input board is never modified
    expect(respin).not.toBeNull();
    expect(respin!.reels).toEqual([2, 4]);
    expect(respin!.board).toHaveLength(GRID_COLS);
    respin!.board.forEach((column, col) => {
      expect(column).toHaveLength(GRID_ROWS);
      for (const symbol of column) expect(SYMBOL_IDS).toContain(symbol);
      if (col === 2 || col === 4) expect(column.every((s) => s === 'wild-dragon')).toBe(true);
    });
  });

  it('never puts a Wild on the outer reels through the respin', () => {
    const engine = engineFor(1, new SeededRandomSource(9));
    for (let i = 0; i < 500; i++) {
      const respin = engine.tryRespin(WITH_WILDS, 'free');
      expect(respin!.board[0]).not.toContain('wild-dragon');
      expect(respin!.board[5]).not.toContain('wild-dragon');
    }
  });
});

describe('GameEngine with Wild Reel Respin', () => {
  it('starts the first cascade from the respun board', () => {
    let respins = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const outcome = new GameEngine(new SeededRandomSource(seed), withChance(1)).playSpin(
        EMPTY_SESSION,
        20,
      );
      const first = outcome.cascades[0];
      if (!outcome.wildReelRespin) {
        // no Wild landed: the initial board is what gets evaluated
        if (first) expect(first.board).toEqual(outcome.initialBoard);
        continue;
      }
      respins++;
      expect(outcome.wildReelRespin.reels.length).toBeGreaterThan(0);
      for (const col of outcome.wildReelRespin.reels) {
        expect(outcome.initialBoard[col]).toContain('wild-dragon');
        expect(outcome.wildReelRespin.board[col]!.every((s) => s === 'wild-dragon')).toBe(true);
      }
      if (first) expect(first.board).toEqual(outcome.wildReelRespin.board);
    }
    expect(respins).toBeGreaterThan(20);
  });

  it('never respins when the feature is switched off', () => {
    const engine = new GameEngine(new SeededRandomSource(4), withChance(0));
    let session: SessionSnapshot = { ...EMPTY_SESSION };
    for (let i = 0; i < 500; i++) {
      const outcome = engine.playSpin(session, 20);
      expect(outcome.wildReelRespin ?? null).toBeNull();
      session = outcome.session;
    }
  });

  it('respins in Free Spins as well', () => {
    const round: SessionSnapshot = {
      dragonMeter: 0,
      freeSpinsRemaining: 5,
      freeSpinsTotal: 8,
      freeSpinBet: 50,
      freeSpinsWin: 0,
    };
    let respins = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const outcome = new GameEngine(new SeededRandomSource(seed), withChance(1)).playSpin(
        round,
        10,
      );
      if (outcome.wildReelRespin) respins++;
    }
    expect(respins).toBeGreaterThan(0);
  });
});
