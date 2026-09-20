import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { TestProject } from 'vitest/node';
import { getTestDatabaseUrl } from './testDb';

declare module 'vitest' {
  export interface ProvidedContext {
    dbAvailable: boolean;
  }
}

/** Checks whether PostgreSQL is reachable and applies the migrations to the test schema. */
export default async function setup(project: TestProject): Promise<void> {
  const url = getTestDatabaseUrl();
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  let available = false;
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    available = true;
  } catch {
    available = false;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  if (available) {
    execSync('npx prisma migrate deploy', {
      cwd: resolve(__dirname, '../..'),
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'pipe',
    });
  } else {
    console.warn(
      '\n[tests] PostgreSQL is not reachable - integration tests will be SKIPPED.\n' +
        '        Start it with `docker compose up -d` (or `npm run db:embedded`) and re-run.\n',
    );
  }

  project.provide('dbAvailable', available);
}
