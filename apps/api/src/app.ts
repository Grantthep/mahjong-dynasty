import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { PrismaClient } from '@prisma/client';
import type { Env } from './config/env';
import { createAuthController } from './controllers/auth.controller';
import { createGameController } from './controllers/game.controller';
import { createProfileController } from './controllers/profile.controller';
import { createStatsController } from './controllers/stats.controller';
import { CryptoRandomSource, type RandomSource } from './game/RandomSource';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createRateLimiters, requireTrustedOrigin } from './middleware/security';
import { createApiRouter } from './routes';
import { AuthService } from './services/auth.service';
import { GameService } from './services/game.service';
import { LeaderboardService } from './services/leaderboard.service';
import { ProfileService } from './services/profile.service';
import { TokenService } from './services/token.service';

export interface AppDeps {
  prisma: PrismaClient;
  env: Env;
  /** Defaults to the cryptographically secure source. Tests may inject a seeded one. */
  rng?: RandomSource;
  /** Defaults to on outside of tests. */
  rateLimit?: boolean;
}

export function createApp({ prisma, env, rng, rateLimit }: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  // Behind nginx / a load balancer the client address comes from X-Forwarded-For (rate limiting).
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  const tokens = new TokenService(env.JWT_SECRET);
  const authService = new AuthService(prisma);
  const gameService = new GameService(prisma, rng ?? new CryptoRandomSource());
  const profileService = new ProfileService(prisma);
  const statsController = createStatsController(new LeaderboardService(prisma));
  const limiters = createRateLimiters(rateLimit ?? env.NODE_ENV !== 'test');

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(limiters.global);
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(requireTrustedOrigin(env));

  app.use(
    '/api',
    createApiRouter({
      authController: createAuthController(authService, tokens, env),
      gameController: createGameController(gameService),
      profileController: createProfileController(profileService),
      statsController,
      requireAuth: requireAuth(tokens),
      limiters,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
