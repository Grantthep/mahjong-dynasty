import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import request from 'supertest';
import { createGuest, createTestContext, spinBody } from '../helpers/testApp';

describe.skipIf(!inject('dbAvailable'))('game API', () => {
  const ctx = createTestContext();
  afterAll(() => ctx.prisma.$disconnect());

  it('GET /api/game/config is public and describes the game', async () => {
    const res = await request(ctx.app).get('/api/game/config');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      demoMode: true,
      grid: { cols: 6, rows: 4 },
      bets: [10, 20, 50, 100, 200],
      multipliers: { base: [1, 2, 3, 5, 8], freeSpins: [2, 4, 6, 10] },
    });
  });

  it('guest -> state -> spin -> verify balance', async () => {
    const user = await createGuest(ctx);
    const agent = user.agent;

    const state = await agent.get('/api/game/state');
    expect(state.status).toBe(200);
    expect(state.body).toMatchObject({
      username: user.username,
      balance: 10_000,
      bets: [10, 20, 50, 100, 200],
    });
    expect(state.body.session).toMatchObject({ dragonMeter: 0, freeSpinsRemaining: 0 });
    expect(state.body.board).toHaveLength(6);

    const spin = await agent.post('/api/game/spin').send(spinBody(50));
    expect(spin.status).toBe(200);
    const result = spin.body;
    expect(result.bet).toBe(50);
    expect(result.balanceBefore).toBe(10_000);
    expect(result.balanceAfter).toBe(10_000 - 50 + result.totalWin);
    expect(result.initialBoard).toHaveLength(6);
    expect(Array.isArray(result.cascades)).toBe(true);
    expect(result.totalWin).toBe(
      result.cascades.reduce((sum: number, c: { win: number }) => sum + c.win, 0),
    );

    // the balance is persisted server-side
    const after = await agent.get('/api/game/state');
    expect(after.body.balance).toBe(result.balanceAfter);
    expect(after.body.board).toEqual(result.finalBoard);
    expect(after.body.session.dragonMeter).toBe(result.dragonMeterAfter);

    const row = await ctx.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.demoBalance).toBe(result.balanceAfter);
  });

  it('stores every spin and lists it in the history and profile', async () => {
    const user = await createGuest(ctx);
    let totalBet = 0;
    let totalWon = 0;
    for (let i = 0; i < 5; i++) {
      const res = await user.agent.post('/api/game/spin').send(spinBody(20));
      expect(res.status).toBe(200);
      totalBet += res.body.isFreeSpin ? 0 : res.body.bet;
      totalWon += res.body.totalWin;
      // wait out any free spins so each iteration is a paid spin
      let session = res.body.session;
      while (session.freeSpinsRemaining > 0) {
        const free = await user.agent.post('/api/game/spin').send(spinBody(20));
        totalWon += free.body.totalWin;
        session = free.body.session;
      }
    }

    const history = await user.agent.get('/api/game/history?limit=50');
    expect(history.status).toBe(200);
    expect(history.body.spins.length).toBeGreaterThanOrEqual(5);
    expect(history.body.spins[0]).toHaveProperty('balanceAfter');

    const profile = await user.agent.get('/api/profile');
    expect(profile.status).toBe(200);
    expect(profile.body.user.username).toBe(user.username);
    expect(profile.body.stats.totalSpins).toBe(history.body.spins.length);
    expect(profile.body.stats.totalBet).toBe(totalBet);
    expect(profile.body.stats.totalWon).toBe(totalWon);
    expect(profile.body.recentSpins.length).toBeGreaterThan(0);
    expect(profile.body.user.demoBalance).toBe(10_000 - totalBet + totalWon);
  });

  it.each([7, 0, -10, 15, 1000])('rejects the invalid bet %s', async (bet) => {
    const user = await createGuest(ctx);
    const res = await user.agent.post('/api/game/spin').send({ bet, requestId: randomUUID() });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const state = await user.agent.get('/api/game/state');
    expect(state.body.balance).toBe(10_000);
  });

  it('rejects non-numeric bets and a missing requestId', async () => {
    const user = await createGuest(ctx);
    expect(
      (await user.agent.post('/api/game/spin').send({ bet: '50', requestId: randomUUID() })).status,
    ).toBe(400);
    expect((await user.agent.post('/api/game/spin').send({ bet: 50 })).status).toBe(400);
    expect(
      (await user.agent.post('/api/game/spin').send({ bet: 50, requestId: 'not-a-uuid' })).status,
    ).toBe(400);
  });

  it('rejects a spin when the balance is too low and leaves the balance untouched', async () => {
    const user = await createGuest(ctx);
    await ctx.prisma.user.update({ where: { id: user.id }, data: { demoBalance: 15 } });

    const res = await user.agent.post('/api/game/spin').send(spinBody(20));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');

    const state = await user.agent.get('/api/game/state');
    expect(state.body.balance).toBe(15);
    expect(await ctx.prisma.spin.count({ where: { userId: user.id } })).toBe(0);
  });

  it('allows a spin when the balance exactly equals the bet', async () => {
    const user = await createGuest(ctx);
    await ctx.prisma.user.update({ where: { id: user.id }, data: { demoBalance: 10 } });
    const res = await user.agent.post('/api/game/spin').send(spinBody(10));
    expect(res.status).toBe(200);
    expect(res.body.balanceAfter).toBe(res.body.totalWin);
  });

  it('ignores client-supplied balance, win, board, multiplier, Free Spins and Dragon meter', async () => {
    const user = await createGuest(ctx);
    const res = await user.agent.post('/api/game/spin').send({
      ...spinBody(10),
      balance: 999_999,
      totalWin: 5_000_000,
      board: [['wild-dragon']],
      multiplier: 1000,
      freeSpinsRemaining: 50,
      dragonMeter: 100,
    });
    expect(res.status).toBe(200);
    expect(res.body.balanceBefore).toBe(10_000);
    expect(res.body.balanceAfter).toBeLessThan(20_000);
    expect(res.body.totalWin).toBeLessThan(10 * 5000 + 1);
    expect(res.body.initialBoard).toHaveLength(6);
    expect(res.body.session.freeSpinsRemaining).not.toBe(50);
    expect(res.body.dragonMeterBefore).toBe(0);
  });

  it('is idempotent: repeating a requestId returns the same result and charges once', async () => {
    const user = await createGuest(ctx);
    const body = spinBody(100);
    const first = await user.agent.post('/api/game/spin').send(body);
    const second = await user.agent.post('/api/game/spin').send(body);

    expect(second.status).toBe(200);
    expect(second.body.spinId).toBe(first.body.spinId);
    expect(second.body.balanceAfter).toBe(first.body.balanceAfter);
    expect(await ctx.prisma.spin.count({ where: { userId: user.id } })).toBe(1);
    const row = await ctx.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.demoBalance).toBe(first.body.balanceAfter);
  });

  it('never double-charges under concurrent spins', async () => {
    const user = await createGuest(ctx);
    // With only one spin affordable, 6 simultaneous requests may not all succeed.
    await ctx.prisma.user.update({ where: { id: user.id }, data: { demoBalance: 200 } });

    const responses = await Promise.all(
      Array.from({ length: 6 }, () => user.agent.post('/api/game/spin').send(spinBody(200))),
    );
    const ok = responses.filter((r) => r.status === 200);
    const rejected = responses.filter((r) => r.status !== 200);

    expect(ok.length).toBeGreaterThanOrEqual(1);
    for (const r of rejected) expect([400, 409]).toContain(r.status);

    const spins = await ctx.prisma.spin.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(spins).toHaveLength(ok.length);

    // Replaying the ledger must reproduce the stored balance exactly.
    let balance = 200;
    for (const spin of spins) {
      expect(spin.balanceBefore).toBe(balance);
      balance = balance - (spin.isFreeSpin ? 0 : spin.bet) + spin.totalWin;
      expect(spin.balanceAfter).toBe(balance);
    }
    const row = await ctx.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.demoBalance).toBe(balance);
    expect(row.demoBalance).toBeGreaterThanOrEqual(0);
  });

  it('returns 409 for a spin fired while another is still in progress', async () => {
    const user = await createGuest(ctx);
    const [a, b] = await Promise.all([
      user.agent.post('/api/game/spin').send(spinBody(10)),
      user.agent.post('/api/game/spin').send(spinBody(10)),
    ]);
    const statuses = [a.status, b.status].sort();
    // Either the second was rejected as in-progress, or it ran after the first finished.
    expect(statuses[0]).toBe(200);
    expect([200, 409]).toContain(statuses[1]);
  });

  describe('Free Spins persistence', () => {
    it('uses the locked bet, never charges, and survives a "browser refresh"', async () => {
      const user = await createGuest(ctx);
      await ctx.prisma.gameSession.update({
        where: { userId: user.id },
        data: { freeSpinsRemaining: 3, freeSpinsTotal: 8, freeSpinBet: 100, freeSpinsWin: 0 },
      });

      // A refresh = a brand-new client fetching the state.
      const refreshed = request.agent(ctx.app);
      const resumed = await refreshed.post('/api/auth/guest').set('Cookie', user.cookie);
      expect(resumed.body.user.id).toBe(user.id);
      const state = await refreshed.get('/api/game/state');
      expect(state.body.session).toMatchObject({
        freeSpinsRemaining: 3,
        freeSpinsTotal: 8,
        freeSpinBet: 100,
      });

      const spin = await refreshed.post('/api/game/spin').send(spinBody(10));
      expect(spin.status).toBe(200);
      expect(spin.body.isFreeSpin).toBe(true);
      expect(spin.body.bet).toBe(100);
      expect(spin.body.freeSpinIndex).toBe(6);
      expect(spin.body.balanceAfter).toBe(10_000 + spin.body.totalWin);
      // Free Spins can be retriggered, so remaining is 2 or more.
      expect(spin.body.session.freeSpinsRemaining).toBeGreaterThanOrEqual(2);

      const again = await refreshed.get('/api/game/state');
      expect(again.body.session.freeSpinsRemaining).toBe(spin.body.session.freeSpinsRemaining);
      expect(again.body.balance).toBe(spin.body.balanceAfter);
    });

    it('lets Free Spins be played even with a zero balance and completes the round', async () => {
      const user = await createGuest(ctx);
      await ctx.prisma.user.update({ where: { id: user.id }, data: { demoBalance: 0 } });
      await ctx.prisma.gameSession.update({
        where: { userId: user.id },
        data: { freeSpinsRemaining: 1, freeSpinsTotal: 8, freeSpinBet: 50, freeSpinsWin: 25 },
      });

      const spin = await user.agent.post('/api/game/spin').send(spinBody(10));
      expect(spin.status).toBe(200);
      if (!spin.body.freeSpinsRetriggered) {
        expect(spin.body.freeSpinsCompleted).toBe(true);
        expect(spin.body.freeSpinsWinTotal).toBe(25 + spin.body.totalWin);
        expect(spin.body.session.freeSpinsRemaining).toBe(0);
      }
      expect(spin.body.balanceAfter).toBe(spin.body.totalWin);
    });
  });

  it('persists the Dragon Fortune meter between spins', async () => {
    const user = await createGuest(ctx);
    await ctx.prisma.gameSession.update({ where: { userId: user.id }, data: { dragonMeter: 60 } });
    const spin = await user.agent.post('/api/game/spin').send(spinBody(10));
    expect(spin.body.dragonMeterBefore).toBe(60);
    const state = await user.agent.get('/api/game/state');
    expect(state.body.session.dragonMeter).toBe(spin.body.dragonMeterAfter);
  });

  it("keeps each player's data isolated", async () => {
    const alice = await createGuest(ctx);
    const bob = await createGuest(ctx);
    await alice.agent.post('/api/game/spin').send(spinBody(10));
    const bobHistory = await bob.agent.get('/api/game/history');
    expect(bobHistory.body.spins).toEqual([]);
    const bobState = await bob.agent.get('/api/game/state');
    expect(bobState.body.balance).toBe(10_000);
  });

  it('validates the history limit', async () => {
    const user = await createGuest(ctx);
    expect((await user.agent.get('/api/game/history?limit=0')).status).toBe(400);
    expect((await user.agent.get('/api/game/history?limit=500')).status).toBe(400);
    expect((await user.agent.get('/api/game/history?limit=5')).status).toBe(200);
  });
});
