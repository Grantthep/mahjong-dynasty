import type { PrismaClient } from '@prisma/client';
import type { ProfileResponse } from '@mahjong/shared';
import { toUserDTO } from './auth.service';
import { HISTORY_SELECT, toHistoryItem } from './game.service';
import { Errors } from '../utils/AppError';

export class ProfileService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.unauthorized('Account no longer exists');

    const [all, paid, freeSpinsTriggered, recent] = await Promise.all([
      this.prisma.spin.aggregate({
        where: { userId },
        _count: { _all: true },
        _sum: { totalWin: true, dragonFortuneTriggers: true },
        _max: { totalWin: true },
      }),
      this.prisma.spin.aggregate({ where: { userId, isFreeSpin: false }, _sum: { bet: true } }),
      this.prisma.spin.count({ where: { userId, isFreeSpin: false, freeSpinsAwarded: { gt: 0 } } }),
      this.prisma.spin.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: HISTORY_SELECT,
      }),
    ]);

    return {
      user: toUserDTO(user),
      stats: {
        totalSpins: all._count._all,
        // Free Spins are not charged, so only paid spins count as credits bet.
        totalBet: paid._sum.bet ?? 0,
        totalWon: all._sum.totalWin ?? 0,
        largestWin: all._max.totalWin ?? 0,
        freeSpinsTriggered,
        dragonFortuneTriggers: all._sum.dragonFortuneTriggers ?? 0,
      },
      recentSpins: recent.map(toHistoryItem),
    };
  }
}
