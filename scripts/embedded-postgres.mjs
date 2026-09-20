/**
 * Docker-free local PostgreSQL (free, no install, no admin rights).
 *
 *   npm run db:embedded
 *
 * Starts a real PostgreSQL 17 server on localhost:5432 with the same credentials as
 * docker-compose.yml (user/password: mahjong, database: mahjong_dynasty). Data is kept in
 * ./.pgdata so it survives restarts. Press Ctrl+C to stop it.
 *
 * Use it when Docker Desktop is not installed. If you use Docker, run `docker compose up -d`
 * instead (do not run both: they share port 5432).
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const dataDir = resolve(process.cwd(), '.pgdata', 'data');
const port = Number(process.env.POSTGRES_PORT ?? 5432);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'mahjong',
  password: 'mahjong',
  port,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error('[postgres]', String(message).trim()),
});

if (!existsSync(resolve(dataDir, 'PG_VERSION'))) {
  console.info('[db] Initialising a new local PostgreSQL cluster in .pgdata ...');
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase('mahjong_dynasty');
  console.info('[db] Created database "mahjong_dynasty".');
} catch {
  // Already exists.
}

console.info(
  `[db] PostgreSQL is ready on postgresql://mahjong:mahjong@localhost:${port}/mahjong_dynasty`,
);
console.info('[db] Leave this window open. Press Ctrl+C to stop.');

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  console.info('\n[db] Stopping PostgreSQL ...');
  await pg.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// Keep the process alive.
setInterval(() => {}, 1 << 30);
