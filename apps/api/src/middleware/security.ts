import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Env } from '../config/env';
import { Errors } from '../utils/AppError';

const limiter = (windowMs: number, limit: number, code: string, message: string): RequestHandler =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code, message } });
    },
  });

export interface RateLimiters {
  global: RequestHandler;
  auth: RequestHandler;
  spin: RequestHandler;
}

export function createRateLimiters(enabled: boolean): RateLimiters {
  const passthrough: RequestHandler = (_req, _res, next) => next();
  if (!enabled) return { global: passthrough, auth: passthrough, spin: passthrough };
  return {
    global: limiter(60_000, 300, 'RATE_LIMITED', 'Too many requests. Please slow down.'),
    auth: limiter(
      15 * 60_000,
      30,
      'AUTH_RATE_LIMITED',
      'Too many login attempts. Try again later.',
    ),
    spin: limiter(60_000, 120, 'SPIN_RATE_LIMITED', 'Too many spins. Please slow down.'),
  };
}

/**
 * Light CSRF defence-in-depth: browsers always send Origin on cross-site state-changing requests,
 * so reject mutations coming from any origin other than the configured web app.
 */
export const requireTrustedOrigin =
  (env: Env): RequestHandler =>
  (req, _res, next) => {
    const safe = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
    const origin = req.headers.origin;
    if (!safe && origin && origin !== env.WEB_ORIGIN) {
      next(Errors.forbidden('Untrusted origin'));
      return;
    }
    next();
  };
