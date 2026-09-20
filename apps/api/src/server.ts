import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { loadDotenv, parseEnv } from './config/env';

loadDotenv();
const env = parseEnv();

const prisma = new PrismaClient();
const app = createApp({ prisma, env });

const server = app.listen(env.API_PORT, () => {
  console.info(
    `[api] Mahjong Dynasty API (DEMO MODE) listening on http://localhost:${env.API_PORT}`,
  );
  console.info(`[api] Allowing web origin ${env.WEB_ORIGIN}`);
});

async function shutdown(signal: string) {
  console.info(`[api] ${signal} received, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
