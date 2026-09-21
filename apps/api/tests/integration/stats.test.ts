import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import request from 'supertest';
import { createTestContext, registerUser, spinBody, type TestUser } from '../helpers/testApp';

describe.skipIf(!inject('dbAvailable'))('leaderboard and admin API', () => {
  const ctx = createTestContext();
  afterAll(() => ctx.prisma.$disconnect());

  async function playSpins(user: TestUser, count: number) {
    for (let i = 0; i < count; i++) {
      const res = await user.agent.post('/api/game/spin').send(spinBody(20));
      expect(res.status).toBe(200);
    }
  }

  describe('GET /api/leaderboard', () => {
    it('requires a signed-in player', async () => {
      const res = await request(ctx.app).get('/api/leaderboard');
      expect(res.status).toBe(401);
    });

    it('rejects an unknown period or an out-of-range limit', async () => {
      const user = await registerUser(ctx);
      expect((await user.agent.get('/api/leaderboard?period=week')).status).toBe(400);
      expect((await user.agent.get('/api/leaderboard?limit=0')).status).toBe(400);
      expect((await user.agent.get('/api/leaderboard?limit=51')).status).toBe(400);
    });

    it('lists the best single-spin wins first, with usernames only', async () => {
      const user = await registerUser(ctx);
      await playSpins(user, 25);

      const res = await user.agent.get('/api/leaderboard?period=all&limit=50');
      expect(res.status).toBe(200);
      expect(res.body.period).toBe('all');
      const entries = res.body.entries as {
        rank: number;
        username: string;
        win: number;
        bet: number;
        multiple: number;
        isYou: boolean;
      }[];
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
        expect(entry.win).toBeGreaterThan(0);
        if (index > 0) expect(entry.win).toBeLessThanOrEqual(entries[index - 1]!.win);
        // the multiple is rounded to one decimal, so it may differ from the exact ratio by 0.05
        expect(Math.abs(entry.multiple - entry.win / entry.bet)).toBeLessThanOrEqual(0.0501);
      });

      // Nothing private is exposed.
      const text = JSON.stringify(res.body);
      expect(text).not.toContain(user.email);
      expect(text).not.toContain('passwordHash');
      expect(text).not.toContain('balance');

      // Rows are flagged "isYou" only for the caller's own username.
      for (const entry of entries) expect(entry.isYou).toBe(entry.username === user.username);
    });

    it('honours the limit', async () => {
      const user = await registerUser(ctx);
      await playSpins(user, 10);
      const res = await user.agent.get('/api/leaderboard?limit=3');
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBeLessThanOrEqual(3);
    });

    it('the day period leaves out wins older than 24 hours', async () => {
      const user = await registerUser(ctx);
      const session = await ctx.prisma.gameSession.findUniqueOrThrow({
        where: { userId: user.id },
      });
      const old = await ctx.prisma.spin.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          requestId: randomUUID(),
          bet: 10,
          totalWin: 90_000_000,
          balanceBefore: 10_000,
          balanceAfter: 10_000,
          resultJson: {},
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      });
      try {
        const all = await user.agent.get('/api/leaderboard?period=all&limit=1');
        expect(all.body.entries[0]).toMatchObject({
          username: user.username,
          win: 90_000_000,
          isYou: true,
        });

        const day = await user.agent.get('/api/leaderboard?period=day&limit=50');
        expect(day.status).toBe(200);
        expect(day.body.period).toBe('day');
        const wins = (day.body.entries as { win: number }[]).map((entry) => entry.win);
        expect(wins).not.toContain(90_000_000);
      } finally {
        await ctx.prisma.spin.delete({ where: { id: old.id } });
      }
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('requires a signed-in user', async () => {
      const res = await request(ctx.app).get('/api/admin/analytics');
      expect(res.status).toBe(401);
    });

    it('is forbidden for ordinary players', async () => {
      const user = await registerUser(ctx);
      const res = await user.agent.get('/api/admin/analytics');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('never lets a new account register as an admin', async () => {
      const user = await registerUser(ctx);
      const me = await user.agent.get('/api/auth/me');
      expect(me.body.user.role).toBe('PLAYER');
      const attempt = await request(ctx.app)
        .post('/api/auth/register')
        .send({
          email: `sneaky_${randomUUID().slice(0, 8)}@example.com`,
          username: `sneaky_${randomUUID().replace(/-/g, '').slice(0, 8)}`,
          password: 'CorrectHorse42',
          role: 'ADMIN',
        });
      expect(attempt.status).toBe(201);
      expect(attempt.body.user.role).toBe('PLAYER');
    });

    it('returns aggregate analytics to an administrator, and reads the role live', async () => {
      const user = await registerUser(ctx);
      await playSpins(user, 12);
      await ctx.prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });

      const res = await user.agent.get('/api/admin/analytics');
      expect(res.status).toBe(200);
      const { totals, daily, topPlayers } = res.body;

      expect(totals.admins).toBeGreaterThanOrEqual(1);
      expect(totals.players).toBeGreaterThanOrEqual(1);
      expect(totals.totalSpins).toBeGreaterThanOrEqual(12);
      expect(totals.paidSpins + totals.freeSpins).toBe(totals.totalSpins);
      expect(totals.totalBet).toBeGreaterThanOrEqual(12 * 20 - 20 * totals.freeSpins);
      expect(totals.observedReturn).toBeCloseTo(totals.totalWon / totals.totalBet, 6);
      expect(totals.largestWin).toBeGreaterThanOrEqual(0);
      expect(totals.wildReelRespins).toBeGreaterThanOrEqual(0);

      // Exactly the last 14 UTC days, oldest first, ending today.
      expect(daily).toHaveLength(14);
      expect(daily[13].date).toBe(new Date().toISOString().slice(0, 10));
      const dates = daily.map((day: { date: string }) => day.date);
      expect([...dates].sort()).toEqual(dates);
      // Older spins and spins from other test files may exist, so compare loosely.
      const inWindow = daily.reduce((sum: number, day: { spins: number }) => sum + day.spins, 0);
      expect(inWindow).toBeGreaterThanOrEqual(12);
      expect(daily[13].spins).toBeGreaterThanOrEqual(12);

      expect(topPlayers.length).toBeLessThanOrEqual(5);
      for (const player of topPlayers) {
        expect(Object.keys(player).sort()).toEqual(['spins', 'totalBet', 'totalWon', 'username']);
      }
      expect(JSON.stringify(res.body)).not.toContain(user.email);

      // Demoting the admin locks them out straight away (the role is not stored in the token).
      await ctx.prisma.user.update({ where: { id: user.id }, data: { role: 'PLAYER' } });
      const after = await user.agent.get('/api/admin/analytics');
      expect(after.status).toBe(403);
    });
  });
});
