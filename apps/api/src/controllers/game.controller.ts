import type { RequestHandler } from 'express';
import type { SpinHistoryResponse, SpinRequest } from '@mahjong/shared';
import { historyQuerySchema } from '@mahjong/shared';
import { getUserId } from '../middleware/auth';
import { getQuery } from '../middleware/validate';
import type { GameService } from '../services/game.service';

export function createGameController(game: GameService) {
  const config: RequestHandler = (_req, res) => {
    res.json(game.publicConfig());
  };

  const state: RequestHandler = async (_req, res) => {
    res.json(await game.getState(getUserId(res)));
  };

  const spin: RequestHandler = async (req, res) => {
    // Only the bet and an idempotency key are read from the client.
    res.json(await game.spin(getUserId(res), req.body as SpinRequest));
  };

  const history: RequestHandler = async (_req, res) => {
    const { limit } = getQuery(res, historyQuerySchema);
    res.json({ spins: await game.getHistory(getUserId(res), limit) } satisfies SpinHistoryResponse);
  };

  return { config, state, spin, history };
}
