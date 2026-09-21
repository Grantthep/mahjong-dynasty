import type { PrismaClient } from '@prisma/client';
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from '@mahjong/shared';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Best single-spin DEMO wins. Only usernames are shown; balances and emails never leave the server. */
export class LeaderboardService {
  constructor(private readonly prisma: PrismaClient) {}

  async top(
    viewerId: string,
    period: LeaderboardPeriod,
    limit: number,
    now = new Date(),
  ): Promise<LeaderboardResponse> {
    const spins = await this.prisma.spin.findMany({
      where: {
        totalWin: { gt: 0 },
        ...(period === 'day' ? { createdAt: { gte: new Date(now.getTime() - DAY_MS) } } : {}),
      },
      // Ties go to whoever got there first.
      orderBy: [{ totalWin: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      select: {
        userId: true,
        totalWin: true,
        bet: true,
        isFreeSpin: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    });

    const entries: LeaderboardEntry[] = spins.map((spin, index) => ({
      rank: index + 1,
      username: spin.user.username,
      win: spin.totalWin,
      bet: spin.bet,
      multiple: spin.bet > 0 ? Math.round((spin.totalWin / spin.bet) * 10) / 10 : 0,
      isFreeSpin: spin.isFreeSpin,
      createdAt: spin.createdAt.toISOString(),
      isYou: spin.userId === viewerId,
    }));
    return { period, entries };
  }
}
