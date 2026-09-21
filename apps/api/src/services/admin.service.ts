import { Prisma, type PrismaClient } from '@prisma/client';
import type { AdminAnalyticsResponse, AnalyticsDay } from '@mahjong/shared';

const DAY_MS = 24 * 60 * 60 * 1000;
export const ANALYTICS_DAYS = 14;

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

interface DailyRow {
  day: Date;
  spins: bigint;
  bet: bigint | null;
  won: bigint | null;
}

/** Read-only analytics for the admin dashboard. Aggregates only: no emails, no balances. */
export class AdminService {
  constructor(private readonly prisma: PrismaClient) {}

  // "createdAt" is a timestamp WITHOUT time zone that Prisma stores as UTC, so truncating it
  // directly gives UTC days whatever time zone the database session uses.
  async analytics(now = new Date()): Promise<AdminAnalyticsResponse> {
    const since = new Date(now.getTime() - ANALYTICS_DAYS * DAY_MS);
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

    const [
      players,
      admins,
      newPlayers,
      all,
      paid,
      freeSpins,
      freeSpinTriggers,
      respinRows,
      dailyRows,
      grouped,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'PLAYER' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'PLAYER', createdAt: { gte: weekAgo } } }),
      this.prisma.spin.aggregate({
        _count: { _all: true },
        _sum: { totalWin: true, dragonFortuneTriggers: true },
        _max: { totalWin: true },
      }),
      this.prisma.spin.aggregate({
        where: { isFreeSpin: false },
        _count: { _all: true },
        _sum: { bet: true },
      }),
      this.prisma.spin.count({ where: { isFreeSpin: true } }),
      this.prisma.spin.count({ where: { isFreeSpin: false, freeSpinsAwarded: { gt: 0 } } }),
      this.prisma.$queryRaw<{ n: bigint }[]>(
        Prisma.sql`SELECT COUNT(*) AS n FROM "Spin" WHERE "resultJson"->'wildReelRespin' IS NOT NULL AND jsonb_typeof("resultJson"->'wildReelRespin') = 'object'`,
      ),
      this.prisma.$queryRaw<DailyRow[]>(
        Prisma.sql`
          SELECT date_trunc('day', "createdAt") AS day,
                 COUNT(*) AS spins,
                 COALESCE(SUM(CASE WHEN "isFreeSpin" THEN 0 ELSE "bet" END), 0) AS bet,
                 COALESCE(SUM("totalWin"), 0) AS won
          FROM "Spin"
          WHERE "createdAt" >= ${since}
          GROUP BY 1
          ORDER BY 1`,
      ),
      this.prisma.spin.groupBy({
        by: ['userId'],
        _count: { _all: true },
        _sum: { totalWin: true },
        orderBy: { _sum: { totalWin: 'desc' } },
        take: 5,
      }),
    ]);

    const totalBet = paid._sum.bet ?? 0;
    const totalWon = all._sum.totalWin ?? 0;

    // Bet on paid spins per player, only for the players shown in the ranking.
    const ids = grouped.map((row) => row.userId);
    const [users, bets] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, username: true },
      }),
      this.prisma.spin.groupBy({
        by: ['userId'],
        where: { userId: { in: ids }, isFreeSpin: false },
        _sum: { bet: true },
      }),
    ]);
    const nameOf = new Map(users.map((user) => [user.id, user.username]));
    const betOf = new Map(bets.map((row) => [row.userId, row._sum.bet ?? 0]));

    return {
      generatedAt: now.toISOString(),
      totals: {
        players,
        admins,
        newPlayersLast7Days: newPlayers,
        totalSpins: all._count._all,
        paidSpins: paid._count._all,
        freeSpins,
        totalBet,
        totalWon,
        observedReturn: totalBet > 0 ? totalWon / totalBet : 0,
        largestWin: all._max.totalWin ?? 0,
        freeSpinTriggers,
        dragonFortuneTriggers: all._sum.dragonFortuneTriggers ?? 0,
        wildReelRespins: Number(respinRows[0]?.n ?? 0),
      },
      daily: fillDays(dailyRows, now),
      topPlayers: grouped.map((row) => ({
        username: nameOf.get(row.userId) ?? 'unknown',
        spins: row._count._all,
        totalBet: betOf.get(row.userId) ?? 0,
        totalWon: row._sum.totalWin ?? 0,
      })),
    };
  }
}

/** One entry per UTC day for the last ANALYTICS_DAYS days, zero-filled, oldest first. */
export function fillDays(rows: DailyRow[], now: Date): AnalyticsDay[] {
  const byDay = new Map(rows.map((row) => [dayKey(row.day), row]));
  const days: AnalyticsDay[] = [];
  for (let offset = ANALYTICS_DAYS - 1; offset >= 0; offset--) {
    const date = dayKey(new Date(now.getTime() - offset * DAY_MS));
    const row = byDay.get(date);
    days.push({
      date,
      spins: Number(row?.spins ?? 0),
      bet: Number(row?.bet ?? 0),
      won: Number(row?.won ?? 0),
    });
  }
  return days;
}
