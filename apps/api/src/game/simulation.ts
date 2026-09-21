import { GAME_CONFIG, type GameConfig } from './config/gameConfig';
import { EMPTY_SESSION } from './FreeSpinEngine';
import { GameEngine } from './GameEngine';
import type { RandomSource } from './RandomSource';

export interface SimulationReport {
  paidSpins: number;
  freeSpins: number;
  totalBet: number;
  totalReturned: number;
  baseGameReturned: number;
  freeSpinReturned: number;
  returnRatio: number;
  /** Fraction of ALL spins (paid + free) that paid something. */
  hitFrequency: number;
  averageCascades: number;
  freeSpinTriggers: number;
  /** Free Spin rounds per paid spin. */
  freeSpinFrequency: number;
  dragonFortuneTriggers: number;
  /** Dragon Fortune triggers per spin played (paid + free). */
  dragonFortuneFrequency: number;
  wildReelRespins: number;
  /** Wild Reel Respins per spin played (paid + free). */
  wildReelRespinFrequency: number;
  largestWin: number;
  largestWinMultiple: number;
}

/**
 * Plays `paidSpins` paid spins (each followed by any Free Spins it triggers) using the real
 * GameEngine, without a database. For development / demonstration only.
 */
export function runSimulation(
  paidSpins: number,
  rng: RandomSource,
  bet = 20,
  config: GameConfig = GAME_CONFIG,
): SimulationReport {
  const engine = new GameEngine(rng, config);
  let session = { ...EMPTY_SESSION };

  let freeSpins = 0;
  let totalBet = 0;
  let baseGameReturned = 0;
  let freeSpinReturned = 0;
  let hits = 0;
  let cascadeCount = 0;
  let freeSpinTriggers = 0;
  let dragonFortuneTriggers = 0;
  let wildReelRespins = 0;
  let largestWin = 0;
  let largestWinMultiple = 0;
  let totalSpins = 0;

  const play = () => {
    const outcome = engine.playSpin(session, bet);
    session = outcome.session;
    totalSpins++;
    if (outcome.totalWin > 0) hits++;
    cascadeCount += outcome.cascades.length;
    dragonFortuneTriggers += outcome.dragonFortuneTriggers;
    if (outcome.wildReelRespin) wildReelRespins++;
    if (outcome.totalWin > largestWin) largestWin = outcome.totalWin;
    largestWinMultiple = Math.max(largestWinMultiple, outcome.totalWin / outcome.bet);
    return outcome;
  };

  for (let i = 0; i < paidSpins; i++) {
    totalBet += bet;
    const paid = play();
    baseGameReturned += paid.totalWin;
    if (paid.freeSpinsAwarded > 0) freeSpinTriggers++;

    while (session.freeSpinsRemaining > 0) {
      const free = play();
      freeSpins++;
      freeSpinReturned += free.totalWin;
    }
  }

  const totalReturned = baseGameReturned + freeSpinReturned;
  return {
    paidSpins,
    freeSpins,
    totalBet,
    totalReturned,
    baseGameReturned,
    freeSpinReturned,
    returnRatio: totalBet === 0 ? 0 : totalReturned / totalBet,
    hitFrequency: totalSpins === 0 ? 0 : hits / totalSpins,
    averageCascades: totalSpins === 0 ? 0 : cascadeCount / totalSpins,
    freeSpinTriggers,
    freeSpinFrequency: paidSpins === 0 ? 0 : freeSpinTriggers / paidSpins,
    dragonFortuneTriggers,
    dragonFortuneFrequency: totalSpins === 0 ? 0 : dragonFortuneTriggers / totalSpins,
    wildReelRespins,
    wildReelRespinFrequency: totalSpins === 0 ? 0 : wildReelRespins / totalSpins,
    largestWin,
    largestWinMultiple,
  };
}
