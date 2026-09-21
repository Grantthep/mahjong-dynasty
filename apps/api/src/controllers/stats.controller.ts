import type { RequestHandler } from 'express';
import { leaderboardQuerySchema } from '@mahjong/shared';
import { getUserId } from '../middleware/auth';
import { getQuery } from '../middleware/validate';
import type { LeaderboardService } from '../services/leaderboard.service';

export function createStatsController(leaderboard: LeaderboardService) {
  const getLeaderboard: RequestHandler = async (_req, res) => {
    const { period, limit } = getQuery(res, leaderboardQuerySchema);
    res.json(await leaderboard.top(getUserId(res), period, limit));
  };

  return { getLeaderboard };
}
