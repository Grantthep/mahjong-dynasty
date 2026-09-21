import jwt from 'jsonwebtoken';

/** A guest keeps their balance for a year of not visiting (the cookie is renewed on every visit). */
export const TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

export class TokenService {
  constructor(private readonly secret: string) {}

  sign(userId: string): string {
    return jwt.sign({}, this.secret, {
      subject: userId,
      expiresIn: TOKEN_TTL_SECONDS,
      algorithm: 'HS256',
    });
  }

  /** Returns the user id, or null when the token is missing/invalid/expired. */
  verify(token: string): string | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
