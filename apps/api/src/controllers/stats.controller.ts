import type { RequestHandler } from 'express';
import { leaderboardQuerySchema } from '@mahjong/shared';
import { getUserId } from '../middleware/auth';
import { getQuery } from '../middleware/validate';
import type { AdminService } from '../services/admin.service';
import type { LeaderboardService } from '../services/leaderboard.service';

export function createStatsController(leaderboard: LeaderboardService, admin: AdminService) {
  const getLeaderboard: RequestHandler = async (_req, res) => {
    const { period, limit } = getQuery(res, leaderboardQuerySchema);
    res.json(await leaderboard.top(getUserId(res), period, limit));
  };

  const getAnalytics: RequestHandler = async (_req, res) => {
    res.json(await admin.analytics());
  };

  return { getLeaderboard, getAnalytics };
}
