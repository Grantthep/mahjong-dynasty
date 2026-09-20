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

export const getUserId = (res: Response): string => {
  const userId = res.locals.userId as string | undefined;
  if (!userId) throw Errors.unauthorized();
  return userId;
};
