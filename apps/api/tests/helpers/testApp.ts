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
  email: string;
  username: string;
  password: string;
}

/** Registers a brand-new user; the returned agent carries the auth cookie. */
export async function registerUser(ctx: TestContext): Promise<TestUser> {
  const suffix = uniqueSuffix();
  const email = `player_${suffix}@example.com`;
  const username = `player_${suffix}`;
  const password = 'CorrectHorse42';
  const agent = request.agent(ctx.app);
  const res = await agent.post('/api/auth/register').send({ email, username, password });
  if (res.status !== 201)
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, id: res.body.user.id as string, email, username, password };
}

export const spinBody = (bet = 20, requestId: string = randomUUID()) => ({ bet, requestId });
