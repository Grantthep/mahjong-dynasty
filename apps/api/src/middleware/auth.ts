import type { PrismaClient } from '@prisma/client';
import type { Response, RequestHandler } from 'express';
import type { TokenService } from '../services/token.service';
import { Errors } from '../utils/AppError';

export const AUTH_COOKIE = 'mjd_token';

/** Requires a valid JWT in the HttpOnly auth cookie. Exposes the user id via res.locals. */
export const requireAuth =
  (tokens: TokenService): RequestHandler =>
  (req, res, next) => {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[AUTH_COOKIE];
    if (!token) {
      next(Errors.unauthorized());
      return;
    }
    const userId = tokens.verify(token);
    if (!userId) {
      next(Errors.unauthorized('Session expired. Please log in again.'));
      return;
    }
    res.locals.userId = userId;
    next();
  };

/**
 * Requires the signed-in user to be an ADMIN. The role is read from the database on every
 * request (never from the token), so demoting an admin takes effect immediately.
 * Must run after requireAuth.
 */
export const requireAdmin =
  (prisma: PrismaClient): RequestHandler =>
  async (_req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: getUserId(res) },
        select: { role: true },
      });
      if (user?.role !== 'ADMIN') {
        next(Errors.forbidden('Administrator access required'));
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export const getUserId = (res: Response): string => {
  const userId = res.locals.userId as string | undefined;
  if (!userId) throw Errors.unauthorized();
  return userId;
};
