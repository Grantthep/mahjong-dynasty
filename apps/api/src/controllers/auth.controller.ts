import type { CookieOptions, RequestHandler, Response } from 'express';
import type { AuthResponse } from '@mahjong/shared';
import type { Env } from '../config/env';
import { AUTH_COOKIE, getUserId } from '../middleware/auth';
import { toUserDTO, type AuthService } from '../services/auth.service';
import { TOKEN_TTL_SECONDS, type TokenService } from '../services/token.service';

export function createAuthController(auth: AuthService, tokens: TokenService, env: Env) {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  };

  const setSession = (res: Response, userId: string) => {
    res.cookie(AUTH_COOKIE, tokens.sign(userId), {
      ...cookieOptions,
      maxAge: TOKEN_TTL_SECONDS * 1000,
    });
  };

  /**
   * Step 1 of POST /api/auth/guest: a browser that already has a valid guest cookie simply gets
   * its player back (and a renewed cookie). This is not rate limited, so reloading the page is free.
   */
  const resumeGuest: RequestHandler = async (req, res, next) => {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[AUTH_COOKIE];
    const userId = token ? tokens.verify(token) : null;
    const user = userId ? await auth.findUser(userId) : null;
    if (!user) {
      next();
      return;
    }
    setSession(res, user.id);
    res.json({ user: toUserDTO(user) } satisfies AuthResponse);
  };

  /** Step 2: a browser without a (valid) cookie gets a brand-new guest. Rate limited per address. */
  const createGuest: RequestHandler = async (_req, res) => {
    const user = await auth.createGuest();
    setSession(res, user.id);
    res.status(201).json({ user: toUserDTO(user) } satisfies AuthResponse);
  };

  const me: RequestHandler = async (_req, res) => {
    const user = await auth.getUser(getUserId(res));
    res.json({ user: toUserDTO(user) } satisfies AuthResponse);
  };

  return { resumeGuest, createGuest, me };
}
