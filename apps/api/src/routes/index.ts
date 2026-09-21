import { Router, type RequestHandler } from 'express';
import {
  loginSchema,
  registerSchema,
  spinRequestSchema,
  historyQuerySchema,
  leaderboardQuerySchema,
} from '@mahjong/shared';
import type { HealthResponse } from '@mahjong/shared';
import type { createAuthController } from '../controllers/auth.controller';
import type { createGameController } from '../controllers/game.controller';
import type { createProfileController } from '../controllers/profile.controller';
import type { createStatsController } from '../controllers/stats.controller';
import { validateBody, validateQuery } from '../middleware/validate';
import type { RateLimiters } from '../middleware/security';

export interface RouterDeps {
  authController: ReturnType<typeof createAuthController>;
  gameController: ReturnType<typeof createGameController>;
  profileController: ReturnType<typeof createProfileController>;
  statsController: ReturnType<typeof createStatsController>;
  requireAuth: RequestHandler;
  requireAdmin: RequestHandler;
  limiters: RateLimiters;
}

export function createApiRouter(deps: RouterDeps): Router {
  const {
    authController,
    gameController,
    profileController,
    statsController,
    requireAuth,
    requireAdmin,
    limiters,
  } = deps;
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      demoMode: true,
      time: new Date().toISOString(),
    } satisfies HealthResponse);
  });

  // --- auth ---
  router.post(
    '/auth/register',
    limiters.auth,
    validateBody(registerSchema),
    authController.register,
  );
  router.post('/auth/login', limiters.auth, validateBody(loginSchema), authController.login);
  router.post('/auth/logout', authController.logout);
  router.get('/auth/me', requireAuth, authController.me);

  // --- game ---
  router.get('/game/config', gameController.config);
  router.get('/game/state', requireAuth, gameController.state);
  router.post(
    '/game/spin',
    requireAuth,
    limiters.spin,
    validateBody(spinRequestSchema),
    gameController.spin,
  );
  router.get(
    '/game/history',
    requireAuth,
    validateQuery(historyQuerySchema),
    gameController.history,
  );

  // --- profile ---
  router.get('/profile', requireAuth, profileController.get);

  // --- leaderboard (signed-in players) ---
  router.get(
    '/leaderboard',
    requireAuth,
    validateQuery(leaderboardQuerySchema),
    statsController.getLeaderboard,
  );

  // --- admin ---
  router.get('/admin/analytics', requireAuth, requireAdmin, statsController.getAnalytics);

  return router;
}
