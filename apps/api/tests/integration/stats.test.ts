import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import request from 'supertest';
import { createGuest, createTestContext, spinBody, type TestUser } from '../helpers/testApp';

describe.skipIf(!inject('dbAvailable'))('leaderboard API', () => {
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
      const user = await createGuest(ctx);
      expect((await user.agent.get('/api/leaderboard?period=week')).status).toBe(400);
      expect((await user.agent.get('/api/leaderboard?limit=0')).status).toBe(400);
      expect((await user.agent.get('/api/leaderboard?limit=51')).status).toBe(400);
    });

    it('lists the best single-spin wins first, with usernames only', async () => {
      const user = await createGuest(ctx);
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
      expect(text).not.toContain('passwordHash');
      expect(text).not.toContain('balance');

      // Rows are flagged "isYou" only for the caller's own username.
      for (const entry of entries) expect(entry.isYou).toBe(entry.username === user.username);
    });

    it('honours the limit', async () => {
      const user = await createGuest(ctx);
      await playSpins(user, 10);
      const res = await user.agent.get('/api/leaderboard?limit=3');
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBeLessThanOrEqual(3);
    });

    it('the day period leaves out wins older than 24 hours', async () => {
      const user = await createGuest(ctx);
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
});
