import type { GameSession, Prisma, PrismaClient, Spin } from '@prisma/client';
import {
  DEFAULT_BET,
  STARTING_BALANCE,
  WELCOME_BOARD,
  type Board,
  type GameStateResponse,
  type PublicGameConfig,
  type SessionSnapshot,
  type SpinHistoryItem,
  type SpinOutcome,
  type SpinRequest,
  type SpinResponse,
} from '@mahjong/shared';
import { GameEngine } from '../game/GameEngine';
import { GAME_CONFIG, type GameConfig } from '../game/config/gameConfig';
import type { RandomSource } from '../game/RandomSource';
import { Errors } from '../utils/AppError';
import { SpinLock } from '../utils/SpinLock';

const toSnapshot = (session: GameSession): SessionSnapshot => ({
  dragonMeter: session.dragonMeter,
  freeSpinsRemaining: session.freeSpinsRemaining,
  freeSpinsTotal: session.freeSpinsTotal,
  freeSpinBet: session.freeSpinBet,
  freeSpinsWin: session.freeSpinsWin,
});

const toSpinResponse = (spin: Spin): SpinResponse => ({
  ...(spin.resultJson as unknown as SpinOutcome),
  spinId: spin.id,
  balanceBefore: spin.balanceBefore,
  balanceAfter: spin.balanceAfter,
  createdAt: spin.createdAt.toISOString(),
});

export const toHistoryItem = (spin: Spin | HistorySelect): SpinHistoryItem => ({
  id: spin.id,
  bet: spin.bet,
  totalWin: spin.totalWin,
  balanceBefore: spin.balanceBefore,
  balanceAfter: spin.balanceAfter,
  isFreeSpin: spin.isFreeSpin,
  freeSpinsAwarded: spin.freeSpinsAwarded,
  dragonFortuneTriggers: spin.dragonFortuneTriggers,
  cascadeCount: spin.cascadeCount,
  createdAt: spin.createdAt.toISOString(),
});

export type HistorySelect = Pick<
  Spin,
  | 'id'
  | 'bet'
  | 'totalWin'
  | 'balanceBefore'
  | 'balanceAfter'
  | 'isFreeSpin'
  | 'freeSpinsAwarded'
  | 'dragonFortuneTriggers'
  | 'cascadeCount'
  | 'createdAt'
>;

export const HISTORY_SELECT = {
  id: true,
  bet: true,
  totalWin: true,
  balanceBefore: true,
  balanceAfter: true,
  isFreeSpin: true,
  freeSpinsAwarded: true,
  dragonFortuneTriggers: true,
  cascadeCount: true,
  createdAt: true,
} satisfies Prisma.SpinSelect;

export class GameService {
  private readonly engine: GameEngine;
  private readonly lock = new SpinLock();

  constructor(
    private readonly prisma: PrismaClient,
    rng: RandomSource,
    private readonly config: GameConfig = GAME_CONFIG,
  ) {
    this.engine = new GameEngine(rng, config);
  }

  publicConfig(): PublicGameConfig {
    const { config } = this;
    return {
      demoMode: true,
      grid: { cols: config.cols, rows: config.rows },
      bets: [...config.bets],
      defaultBet: DEFAULT_BET,
      startingBalance: STARTING_BALANCE,
      multipliers: {
        base: [...config.multipliers.base],
        freeSpins: [...config.multipliers.freeSpins],
      },
      freeSpinAwards: config.scatter.awards.map((award) => ({ ...award })),
      dragonFortune: { threshold: config.dragonFortune.threshold },
      bigWin: { ...config.bigWin },
      paytable: config.paytable,
    };
  }

  async getState(userId: string): Promise<GameStateResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.unauthorized('Account no longer exists');

    const session =
      (await this.prisma.gameSession.findUnique({ where: { userId } })) ??
      (await this.prisma.gameSession.create({ data: { userId } }));

    const lastSpin = await this.prisma.spin.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { resultJson: true },
    });
    const lastOutcome = lastSpin?.resultJson as unknown as SpinOutcome | undefined;
    const board: Board = lastOutcome?.finalBoard ?? WELCOME_BOARD;

    return {
      username: user.username,
      balance: user.demoBalance,
      bets: [...this.config.bets],
      session: toSnapshot(session),
      board,
    };
  }

  async getHistory(userId: string, limit: number): Promise<SpinHistoryItem[]> {
    const spins = await this.prisma.spin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: HISTORY_SELECT,
    });
    return spins.map(toHistoryItem);
  }

  /**
   * The authoritative spin. The client only sends a bet and an idempotency key; the balance,
   * board, wins, multiplier, Dragon meter and Free Spins are all decided here.
   */
  async spin(userId: string, request: SpinRequest): Promise<SpinResponse> {
    if (!this.lock.tryAcquire(userId)) throw Errors.spinInProgress();

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Serialise all spins of this user across processes.
          await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

          const replay = await tx.spin.findUnique({
            where: { userId_requestId: { userId, requestId: request.requestId } },
          });
          if (replay) return toSpinResponse(replay);

          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) throw Errors.unauthorized('Account no longer exists');

          const session =
            (await tx.gameSession.findUnique({ where: { userId } })) ??
            (await tx.gameSession.create({ data: { userId } }));

          const before = toSnapshot(session);
          const isFreeSpin = before.freeSpinsRemaining > 0;
          if (!isFreeSpin && user.demoBalance < request.bet) throw Errors.insufficientBalance();

          const outcome = this.engine.playSpin(before, request.bet);

          const balanceBefore = user.demoBalance;
          const balanceAfter = balanceBefore - (isFreeSpin ? 0 : outcome.bet) + outcome.totalWin;

          await tx.user.update({ where: { id: userId }, data: { demoBalance: balanceAfter } });
          await tx.gameSession.update({ where: { id: session.id }, data: { ...outcome.session } });

          const saved = await tx.spin.create({
            data: {
              userId,
              sessionId: session.id,
              requestId: request.requestId,
              bet: outcome.bet,
              isFreeSpin,
              totalWin: outcome.totalWin,
              balanceBefore,
              balanceAfter,
              freeSpinsAwarded: outcome.isFreeSpin ? 0 : outcome.freeSpinsAwarded,
              dragonFortuneTriggers: outcome.dragonFortuneTriggers,
              cascadeCount: outcome.cascades.length,
              resultJson: outcome as unknown as Prisma.InputJsonValue,
            },
          });

          return toSpinResponse(saved);
        },
        { timeout: 15_000 },
      );
    } finally {
      this.lock.release(userId);
    }
  }
}
