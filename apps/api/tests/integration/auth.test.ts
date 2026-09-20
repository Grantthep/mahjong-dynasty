import { afterAll, describe, expect, inject, it } from 'vitest';
import request from 'supertest';
import { createTestContext, registerUser, uniqueSuffix } from '../helpers/testApp';

describe.skipIf(!inject('dbAvailable'))('authentication API', () => {
  const ctx = createTestContext();
  afterAll(() => ctx.prisma.$disconnect());

  it('GET /api/health works without authentication', async () => {
    const res = await request(ctx.app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', demoMode: true });
  });

  it('registers a user with 10,000 DEMO CREDITS and sets an HttpOnly cookie', async () => {
    const suffix = uniqueSuffix();
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        email: `A_${suffix}@Example.com`,
        username: `user_${suffix}`,
        password: 'Password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: `a_${suffix}@example.com`,
      username: `user_${suffix}`,
      demoBalance: 10_000,
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');

    const cookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookie).toContain('mjd_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('never stores the plain-text password', async () => {
    const user = await registerUser(ctx);
    const row = await ctx.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.passwordHash).not.toContain(user.password);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('creates a game session together with the account', async () => {
    const user = await registerUser(ctx);
    const session = await ctx.prisma.gameSession.findUnique({ where: { userId: user.id } });
    expect(session).toMatchObject({ dragonMeter: 0, freeSpinsRemaining: 0 });
  });

  it('rejects duplicate emails and usernames', async () => {
    const user = await registerUser(ctx);
    const dupEmail = await request(ctx.app)
      .post('/api/auth/register')
      .send({ email: user.email, username: `other_${uniqueSuffix()}`, password: 'Password123' });
    expect(dupEmail.status).toBe(409);
    expect(dupEmail.body.error.code).toBe('EMAIL_TAKEN');

    const dupName = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        email: `x_${uniqueSuffix()}@example.com`,
        username: user.username,
        password: 'Password123',
      });
    expect(dupName.status).toBe(409);
    expect(dupName.body.error.code).toBe('USERNAME_TAKEN');
  });

  it.each([
    ['short password', { email: 'a@example.com', username: 'valid_name', password: 'short' }],
    ['bad email', { email: 'nope', username: 'valid_name', password: 'Password123' }],
    ['bad username', { email: 'a@example.com', username: 'no spaces!', password: 'Password123' }],
    ['missing fields', {}],
  ])('rejects invalid registration (%s)', async (_label, body) => {
    const res = await request(ctx.app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials', async () => {
    const user = await registerUser(ctx);
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(user.username);
    expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toContain('mjd_token=');
  });

  it('rejects a wrong password and an unknown email with the same message', async () => {
    const user = await registerUser(ctx);
    const wrong = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1' });
    const unknown = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: `nobody_${uniqueSuffix()}@example.com`, password: 'WrongPassword1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('GET /api/auth/me requires authentication', async () => {
    const res = await request(ctx.app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/auth/me returns the current user', async () => {
    const user = await registerUser(ctx);
    const res = await user.agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      username: user.username,
      demoBalance: 10_000,
    });
  });

  it('rejects a tampered token', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set('Cookie', 'mjd_token=not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('logout clears the cookie', async () => {
    const user = await registerUser(ctx);
    const out = await user.agent.post('/api/auth/logout');
    expect(out.status).toBe(204);
    expect((out.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/mjd_token=;/);
    const me = await user.agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });

  it('protects the game routes', async () => {
    for (const path of ['/api/game/state', '/api/game/history', '/api/profile']) {
      expect((await request(ctx.app).get(path)).status).toBe(401);
    }
    const spin = await request(ctx.app)
      .post('/api/game/spin')
      .send({ bet: 10, requestId: crypto.randomUUID() });
    expect(spin.status).toBe(401);
  });

  it('blocks state-changing requests from an untrusted origin', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'a@example.com', password: 'x' });
    expect(res.status).toBe(403);
  });

  it('rejects oversized bodies', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({ email: 'a@example.com', username: 'abc', password: 'x'.repeat(50_000) });
    expect(res.status).toBe(413);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(ctx.app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
