import type { CookieOptions, RequestHandler, Response } from 'express';
import type { AuthResponse, LoginInput, RegisterInput } from '@mahjong/shared';
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

  const register: RequestHandler = async (req, res) => {
    const user = await auth.register(req.body as RegisterInput);
    setSession(res, user.id);
    res.status(201).json({ user: toUserDTO(user) } satisfies AuthResponse);
  };

  const login: RequestHandler = async (req, res) => {
    const user = await auth.login(req.body as LoginInput);
    setSession(res, user.id);
    res.json({ user: toUserDTO(user) } satisfies AuthResponse);
  };

  const logout: RequestHandler = (_req, res) => {
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.status(204).end();
  };

  const me: RequestHandler = async (_req, res) => {
    const user = await auth.getUser(getUserId(res));
    res.json({ user: toUserDTO(user) } satisfies AuthResponse);
  };

  return { register, login, logout, me };
}
