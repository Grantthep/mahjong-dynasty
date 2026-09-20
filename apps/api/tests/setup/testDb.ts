import { loadDotenv } from '../../src/config/env';

/**
 * Integration tests run in their own PostgreSQL schema ("mahjong_test") inside the normal
 * development database, so they never touch real demo accounts.
 * Override with TEST_DATABASE_URL if you prefer a separate database.
 */
export function getTestDatabaseUrl(): string {
  loadDotenv();
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base =
    process.env.DATABASE_URL ??
    'postgresql://mahjong:mahjong@localhost:5432/mahjong_dynasty?schema=public';
  const url = new URL(base);
  url.searchParams.set('schema', 'mahjong_test');
  return url.toString();
}
