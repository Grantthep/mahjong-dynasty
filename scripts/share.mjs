/**
 * Gives you a public link to the game that works on any phone, anywhere:
 *
 *   npm run share
 *
 * It builds the game, starts the API and the built web app on their own ports (so it can run next
 * to `npm run dev`), and opens a free Cloudflare Tunnel that prints an https://....trycloudflare.com
 * link. Send that link to your friend.
 *
 * - The link only works while this computer is on and this command keeps running. Stop it with
 *   Ctrl+C. A new link is made every time you start it.
 * - Needs PostgreSQL running (`npm run db:embedded`) and the JWT_SECRET in .env (>= 32 characters).
 * - Demo credits only. Anyone with the link can play as a guest; there are no accounts or passwords.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer, connect } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureCloudflared } from './get-cloudflared.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Preferred ports; if one is busy (for example another `npm run share` is running) the next free one is used.
const PREFERRED_WEB_PORT = Number(process.env.SHARE_WEB_PORT ?? 4173);
const PREFERRED_API_PORT = Number(process.env.SHARE_API_PORT ?? 4100);
let WEB_PORT = PREFERRED_WEB_PORT;
let API_PORT = PREFERRED_API_PORT;
let LOCAL = `http://localhost:${WEB_PORT}`;

const children = [];
let stopping = false;

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try {
      if (process.platform === 'win32' && child.pid) {
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // already gone
    }
  }
  process.exit(code);
}
process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

function start(name, command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, ...options });
  children.push(child);
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`\n[${name}] stopped unexpectedly (exit code ${code}). Stopping everything.`);
      stopAll(1);
    }
  });
  return child;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** True when something already listens on the port (on any address). */
function portBusy(port) {
  return new Promise((resolveBusy) => {
    const probe = createServer();
    probe.once('error', () => resolveBusy(true));
    probe.once('listening', () => probe.close(() => resolveBusy(false)));
    probe.listen(port);
  });
}

async function freePort(preferred, avoid = []) {
  for (let port = preferred; port < preferred + 50; port++) {
    if (!avoid.includes(port) && !(await portBusy(port))) return port;
  }
  throw new Error(`No free port found near ${preferred}.`);
}

/** Can we reach PostgreSQL? The game cannot start without it. */
function databaseUp() {
  return new Promise((resolveUp) => {
    const socket = connect({ host: '127.0.0.1', port: 5432 });
    socket.setTimeout(2000);
    socket.once('connect', () => (socket.destroy(), resolveUp(true)));
    socket.once('error', () => resolveUp(false));
    socket.once('timeout', () => (socket.destroy(), resolveUp(false)));
  });
}

async function waitFor(url, label, seconds = 90) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await sleep(1500);
  }
  throw new Error(`${label} did not start within ${seconds} seconds.`);
}

async function main() {
  if (!(await databaseUp())) {
    throw new Error(
      [
        'The database is not running. Start it first, in another terminal:',
        '',
        '    npm run db:embedded',
        '',
        'then run "npm run share" again.',
      ].join('\n'),
    );
  }
  WEB_PORT = await freePort(PREFERRED_WEB_PORT);
  API_PORT = await freePort(PREFERRED_API_PORT, [WEB_PORT]);
  LOCAL = `http://localhost:${WEB_PORT}`;
  if (WEB_PORT !== PREFERRED_WEB_PORT) {
    console.info(`(Port ${PREFERRED_WEB_PORT} is busy, using ${WEB_PORT} instead.)`);
  }

  console.info('1/4  Building the game (about 20 seconds)...');
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true });
  if (build.status !== 0) throw new Error('The build failed. Fix the errors above and try again.');

  console.info('\n2/4  Getting the tunnel program...');
  const cloudflared = await ensureCloudflared();

  console.info('\n3/4  Starting the game server...');
  // The API runs in production mode (strong JWT_SECRET required, Secure cookies, rate limits on).
  const apiEnv = {
    ...process.env,
    NODE_ENV: 'production',
    API_PORT: String(API_PORT),
    WEB_ORIGIN: LOCAL,
  };
  start('api', process.execPath, ['apps/api/dist/server.js'], { env: apiEnv, stdio: 'inherit' });
  // The built web app, with /api forwarded to the API on the same origin (so the guest cookie works).
  start(
    'web',
    process.execPath,
    [
      resolve(root, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--host',
      '--port',
      String(WEB_PORT),
      '--strictPort',
    ],
    {
      cwd: resolve(root, 'apps/web'),
      env: { ...process.env, VITE_PROXY_TARGET: `http://localhost:${API_PORT}`, WEB_ORIGIN: LOCAL },
      stdio: 'inherit',
    },
  );
  await waitFor(`${LOCAL}/api/health`, 'The game');

  console.info('\n4/4  Opening the public link...');
  const tunnel = start('tunnel', cloudflared, ['tunnel', '--url', LOCAL, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const link = await new Promise((resolveLink, reject) => {
    const timer = setTimeout(() => reject(new Error('No link after 60 seconds.')), 60_000);
    const onData = (chunk) => {
      const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(chunk.toString());
      if (match) {
        clearTimeout(timer);
        resolveLink(match[0]);
      }
    };
    tunnel.stdout.on('data', onData);
    tunnel.stderr.on('data', onData);
  });

  // The new address needs a few seconds before phones can find it.
  await waitFor(`${link}/api/health`, 'The public link', 120);

  console.info('\n==============================================================');
  console.info('  YOUR LINK (works on any phone, anywhere):');
  console.info(`\n      ${link}\n`);
  console.info('  Send it to your friend. It works while this window stays open');
  console.info('  and this computer stays on. Press Ctrl+C to stop sharing.');
  console.info('  Demo credits only. Anyone with the link can play.');
  console.info('==============================================================\n');
}

main().catch((error) => {
  console.error(`\n${error.message ?? error}`);
  stopAll(1);
});
