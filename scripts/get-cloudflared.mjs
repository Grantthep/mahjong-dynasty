/**
 * Finds the free Cloudflare Tunnel program ("cloudflared"), or downloads the OFFICIAL release from
 * github.com/cloudflare/cloudflared into ./tools (which is git-ignored).
 *
 *   node scripts/get-cloudflared.mjs        (normally run for you by `npm run share`)
 */
import { chmodSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = resolve(root, 'tools');

/** [file on the GitHub release, file name kept in ./tools] for the platforms we can download for. */
const ASSETS = {
  'win32-x64': ['cloudflared-windows-amd64.exe', 'cloudflared.exe'],
  'linux-x64': ['cloudflared-linux-amd64', 'cloudflared'],
  'linux-arm64': ['cloudflared-linux-arm64', 'cloudflared'],
};

const runs = (command) => {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return !result.error && result.status === 0;
};

/** Path (or command name) of a working cloudflared, downloading it first if there is none. */
export async function ensureCloudflared() {
  if (runs('cloudflared')) return 'cloudflared';

  const key = `${process.platform}-${process.arch}`;
  const asset = ASSETS[key];
  if (!asset) {
    throw new Error(
      `No automatic download for ${key}. Install cloudflared yourself (macOS: "brew install cloudflared") ` +
        'and run again: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/',
    );
  }
  const [release, fileName] = asset;
  const target = resolve(toolsDir, fileName);
  if (existsSync(target) && runs(target)) return target;

  const url = `https://github.com/cloudflare/cloudflared/releases/latest/download/${release}`;
  console.info(`Downloading the free Cloudflare Tunnel program (official release):\n  ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());

  // Sanity checks: a real program, not an error page.
  const isWindowsProgram = bytes.subarray(0, 2).toString('latin1') === 'MZ';
  const isLinuxProgram = bytes.subarray(1, 4).toString('latin1') === 'ELF';
  if (bytes.length < 10_000_000 || !(isWindowsProgram || isLinuxProgram)) {
    throw new Error('The downloaded file does not look like the cloudflared program. Stopping.');
  }

  mkdirSync(toolsDir, { recursive: true });
  writeFileSync(target, bytes);
  if (process.platform !== 'win32') chmodSync(target, 0o755);
  if (!runs(target) || statSync(target).size !== bytes.length) {
    throw new Error('The downloaded cloudflared does not run on this computer.');
  }
  console.info(`Saved to ${target}\n`);
  return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureCloudflared().then(
    (path) => console.info(`cloudflared is ready: ${path}`),
    (error) => {
      console.error(String(error.message ?? error));
      process.exit(1);
    },
  );
}
