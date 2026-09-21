import jwt from 'jsonwebtoken';
import { afterAll, describe, expect, inject, it } from 'vitest';
import request from 'supertest';
import { createGuest, createTestContext } from '../helpers/testApp';

const cookieOf = (res: { headers: Record<string, unknown> }) =>
  ((res.headers['set-cookie'] as string[] | undefined) ?? []).join(';');

describe.skipIf(!inject('dbAvailable'))('guest players API', () => {
  const ctx = createTestContext();
  afterAll(() => ctx.prisma.$disconnect());

  it('GET /api/health works without authentication', async () => {
    const res = await request(ctx.app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', demoMode: true });
  });

  it('gives a new visitor a guest player with 10,000 DEMO CREDITS and an HttpOnly cookie', async () => {
    const res = await request(ctx.app).post('/api/auth/guest');

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ demoBalance: 10_000 });
    expect(res.body.user.username).toMatch(/^Guest\d{4,6}$/);
    // Nothing that identifies a person or could be a credential.
    expect(Object.keys(res.body.user).sort()).toEqual([
      'createdAt',
      'demoBalance',
      'id',
      'username',
    ]);

    const cookie = cookieOf(res);
    expect(cookie).toContain('mjd_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('creates the game session together with the guest', async () => {
    const guest = await createGuest(ctx);
    const session = await ctx.prisma.gameSession.findUnique({ where: { userId: guest.id } });
    expect(session).toMatchObject({ dragonMeter: 0, freeSpinsRemaining: 0 });
  });

  it('gives every visitor a different player and a unique name', async () => {
    const guests = await Promise.all(Array.from({ length: 12 }, () => createGuest(ctx)));
    expect(new Set(guests.map((g) => g.id)).size).toBe(12);
    expect(new Set(guests.map((g) => g.username)).size).toBe(12);
  });

  it('returns the SAME player to a browser that already has the cookie', async () => {
    const guest = await createGuest(ctx);
    const again = await guest.agent.post('/api/auth/guest');
    expect(again.status).toBe(200);
    expect(again.body.user.id).toBe(guest.id);
    expect(cookieOf(again)).toContain('mjd_token='); // renewed

    // A second device presenting the same cookie is the same player too.
    const other = await request(ctx.app).post('/api/auth/guest').set('Cookie', guest.cookie);
    expect(other.status).toBe(200);
    expect(other.body.user.id).toBe(guest.id);
  });

  it('starts a fresh guest when the cookie is garbage, forged or belongs to a deleted player', async () => {
    const garbage = await request(ctx.app)
      .post('/api/auth/guest')
      .set('Cookie', 'mjd_token=not.a.jwt');
    expect(garbage.status).toBe(201);

    const forged = jwt.sign({}, 'some-other-secret-some-other-secret-1234', { subject: 'abc' });
    const forgedRes = await request(ctx.app)
      .post('/api/auth/guest')
      .set('Cookie', `mjd_token=${forged}`);
    expect(forgedRes.status).toBe(201);

    const gone = await createGuest(ctx);
    await ctx.prisma.user.delete({ where: { id: gone.id } });
    const afterDelete = await request(ctx.app).post('/api/auth/guest').set('Cookie', gone.cookie);
    expect(afterDelete.status).toBe(201);
    expect(afterDelete.body.user.id).not.toBe(gone.id);
  });

  it('GET /api/auth/me requires a session', async () => {
    const res = await request(ctx.app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/auth/me returns the current guest', async () => {
    const guest = await createGuest(ctx);
    const res = await guest.agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: guest.id,
      username: guest.username,
      demoBalance: 10_000,
    });
  });

  it('rejects a tampered token', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set('Cookie', 'mjd_token=not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('no longer has register, login, logout or admin endpoints', async () => {
    for (const [method, path] of [
      ['post', '/api/auth/register'],
      ['post', '/api/auth/login'],
      ['post', '/api/auth/logout'],
      ['get', '/api/admin/analytics'],
    ] as const) {
      const res = await request(ctx.app)[method](path);
      expect(res.status, path).toBe(404);
    }
  });

  it('protects the game routes', async () => {
    for (const path of [
      '/api/game/state',
      '/api/game/history',
      '/api/profile',
      '/api/leaderboard',
    ]) {
      expect((await request(ctx.app).get(path)).status, path).toBe(401);
    }
    const spin = await request(ctx.app)
      .post('/api/game/spin')
      .send({ bet: 10, requestId: crypto.randomUUID() });
    expect(spin.status).toBe(401);
  });

  it('blocks state-changing requests from an untrusted origin', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/guest')
      .set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(ctx.app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe.skipIf(!inject('dbAvailable'))('the guest limit can be changed', () => {
  it('uses RATE_LIMIT_NEW_GUESTS_PER_15_MIN', async () => {
    const ctx = createTestContext();
    try {
      const { createApp } = await import('../../src/app');
      const strict = createApp({
        prisma: ctx.prisma,
        env: { ...ctx.env, RATE_LIMIT_NEW_GUESTS_PER_15_MIN: 3 },
        rateLimit: true,
      });
      const codes: number[] = [];
      for (let i = 0; i < 5; i++)
        codes.push((await request(strict).post('/api/auth/guest')).status);
      expect(codes).toEqual([201, 201, 201, 429, 429]);
    } finally {
      await ctx.prisma.$disconnect();
    }
  });
});

describe.skipIf(!inject('dbAvailable'))('guest creation is rate limited, resuming is not', () => {
  it('limits NEW guests per address but lets a returning browser through', async () => {
    const ctx = createTestContext();
    try {
      // Rate limiting is off in the shared test app; build one with it switched on.
      const { createApp } = await import('../../src/app');
      const limited = createApp({ prisma: ctx.prisma, env: ctx.env, rateLimit: true });

      const first = await request(limited).post('/api/auth/guest');
      expect(first.status).toBe(201);
      const cookie = (first.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!;

      // Reloading with the cookie never counts against the limit.
      for (let i = 0; i < 40; i++) {
        const res = await request(limited).post('/api/auth/guest').set('Cookie', cookie);
        expect(res.status).toBe(200);
      }

      // Creating brand-new guests does: the 30th new one from one address is refused.
      let refused = 0;
      for (let i = 0; i < 35; i++) {
        const res = await request(limited).post('/api/auth/guest');
        if (res.status === 429) {
          refused++;
          expect(res.body.error.code).toBe('AUTH_RATE_LIMITED');
        }
      }
      expect(refused).toBeGreaterThan(0);
    } finally {
      await ctx.prisma.$disconnect();
    }
  });
});
