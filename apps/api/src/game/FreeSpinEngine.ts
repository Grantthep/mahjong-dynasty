import type { SessionSnapshot } from '@mahjong/shared';
import { GAME_CONFIG, type FreeSpinAward, type GameConfig } from './config/gameConfig';

export interface FreeSpinTransition {
  session: SessionSnapshot;
  awarded: number;
  retriggered: boolean;
  completed: boolean;
  /** Total demo credits won in the round that just completed (0 otherwise). */
  roundWinTotal: number;
}

export const EMPTY_SESSION: SessionSnapshot = {
  dragonMeter: 0,
  freeSpinsRemaining: 0,
  freeSpinsTotal: 0,
  freeSpinBet: 0,
  freeSpinsWin: 0,
};

/** Awards Free Spins for Lotus Scatters and advances the persisted Free Spin round. */
export class FreeSpinEngine {
  constructor(private readonly config: GameConfig = GAME_CONFIG) {}

  private static lookup(table: readonly FreeSpinAward[], scatterCount: number): number {
    let spins = 0;
    for (const entry of [...table].sort((a, b) => a.min - b.min)) {
      if (scatterCount >= entry.min) spins = entry.spins;
    }
    return spins;
  }

  /** Free Spins awarded by a paid spin (3 Lotus = 8, 4 = 12, 5+ = 15 by default). */
  awardFor(scatterCount: number): number {
    return FreeSpinEngine.lookup(this.config.scatter.awards, scatterCount);
  }

  /** Extra Free Spins awarded when Lotus land during Free Spins. */
  retriggerFor(scatterCount: number): number {
    return FreeSpinEngine.lookup(this.config.scatter.retriggerAwards, scatterCount);
  }

  /**
   * @param session State BEFORE the spin (free spin not yet consumed).
   * @param dragonMeter Meter value after the spin.
   */
  advance(
    session: SessionSnapshot,
    args: {
      isFreeSpin: boolean;
      bet: number;
      totalWin: number;
      scatterCount: number;
      dragonMeter: number;
    },
  ): FreeSpinTransition {
    const { isFreeSpin, bet, totalWin, scatterCount, dragonMeter } = args;

    if (!isFreeSpin) {
      const awarded = this.awardFor(scatterCount);
      return {
        session:
          awarded > 0
            ? {
                dragonMeter,
                freeSpinsRemaining: awarded,
                freeSpinsTotal: awarded,
                freeSpinBet: bet,
                freeSpinsWin: 0,
              }
            : { ...EMPTY_SESSION, dragonMeter },
        awarded,
        retriggered: false,
        completed: false,
        roundWinTotal: 0,
      };
    }

    const extra = this.retriggerFor(scatterCount);
    const remaining = session.freeSpinsRemaining - 1 + extra;
    const roundWin = session.freeSpinsWin + totalWin;

    if (remaining <= 0) {
      return {
        session: { ...EMPTY_SESSION, dragonMeter },
        awarded: extra,
        retriggered: extra > 0,
        completed: true,
        roundWinTotal: roundWin,
      };
    }

    return {
      session: {
        dragonMeter,
        freeSpinsRemaining: remaining,
        freeSpinsTotal: session.freeSpinsTotal + extra,
        freeSpinBet: session.freeSpinBet,
        freeSpinsWin: roundWin,
      },
      awarded: extra,
      retriggered: extra > 0,
      completed: false,
      roundWinTotal: 0,
    };
  }
}
