import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';
import { parseEnv } from '../../src/config/env';
import { SeededRandomSource, type RandomSource } from '../../src/game/RandomSource';

export function createTestContext(rng: RandomSource = new SeededRandomSource(2024)) {
  const env = parseEnv(process.env);
  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  const app = createApp({ prisma, env, rng, rateLimit: false });
  return { app, prisma, env };
}

export type TestContext = ReturnType<typeof createTestContext>;

export const uniqueSuffix = () => randomUUID().replace(/-/g, '').slice(0, 10);

export interface TestUser {
  agent: ReturnType<typeof request.agent>;
  id: string;
  username: string;
  /** The "mjd_token=..." cookie, to act as a second browser of the same guest. */
  cookie: string;
}

/** Creates a brand-new guest player; the returned agent carries the auth cookie. */
export async function createGuest(ctx: TestContext): Promise<TestUser> {
  const agent = request.agent(ctx.app);
  const res = await agent.post('/api/auth/guest');
  if (res.status !== 201)
    throw new Error(`guest failed: ${res.status} ${JSON.stringify(res.body)}`);
  const cookie = (res.headers['set-cookie'] as unknown as string[])
    .map((line) => line.split(';')[0]!)
    .find((pair) => pair.startsWith('mjd_token='));
  if (!cookie) throw new Error('no auth cookie was set');
  return {
    agent,
    id: res.body.user.id as string,
    username: res.body.user.username as string,
    cookie,
  };
}

export const spinBody = (bet = 20, requestId: string = randomUUID()) => ({ bet, requestId });
