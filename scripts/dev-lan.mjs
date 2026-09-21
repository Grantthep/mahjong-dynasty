/**
 * Runs the game so that a phone (or another computer) on the SAME Wi-Fi can open it:
 *
 *   npm run dev:phone
 *
 * It finds this computer's local network address, starts the API and the web app listening on the
 * network (not just on localhost), and tells the API to accept that address as the web origin
 * (otherwise the phone's requests are refused). Then open the printed URL on the phone.
 *
 *   LAN_IP=192.168.1.50 npm run dev:phone     pick the address yourself if several are listed
 *
 * FOR TRUSTED HOME NETWORKS ONLY: anyone on the same network can reach the game and play as a guest.
 */
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { pathToFileURL } from 'node:url';

const WEB_PORT = 5173;

/** Adapters that are not the real network: virtual machines, VPNs, containers, Bluetooth. */
const VIRTUAL_NAME =
  /virtual|vbox|vmware|vethernet|hyper-v|wsl|docker|loopback|bluetooth|tap|tun|vpn/i;
const WIFI_NAME = /wi-?fi|wlan|wireless/i;

/** Private IPv4 addresses of this computer, the one most likely to be the home Wi-Fi first. */
export function lanAddresses(interfaces = networkInterfaces()) {
  const found = [];
  for (const [name, list] of Object.entries(interfaces)) {
    for (const item of list ?? []) {
      if (item.family !== 'IPv4' || item.internal) continue;
      const [a, b] = item.address.split('.').map(Number);
      const range =
        a === 192 && b === 168 ? 0 : a === 10 ? 1 : a === 172 && b >= 16 && b <= 31 ? 2 : -1;
      if (range < 0) continue;
      // 192.168.56.x is VirtualBox's default host-only network: never reachable from a phone.
      const virtual = VIRTUAL_NAME.test(name) || item.address.startsWith('192.168.56.');
      const score = range + (virtual ? 10 : 0) - (WIFI_NAME.test(name) ? 1 : 0);
      found.push({ name, address: item.address, score });
    }
  }
  return found.sort((x, y) => x.score - y.score);
}

function main() {
  const addresses = lanAddresses();
  const chosen = process.env.LAN_IP ?? addresses[0]?.address;
  if (!chosen) {
    console.error(
      'No local network address found. Connect this computer to Wi-Fi (or set LAN_IP=<address>) and try again.',
    );
    process.exit(1);
  }

  const origin = `http://${chosen}:${WEB_PORT}`;
  console.info('');
  console.info('  On your phone (same Wi-Fi), open:');
  console.info(`      ${origin}`);
  if (addresses.length > 1) {
    console.info('  (other addresses of this computer, in case that one does not work:)');
    for (const a of addresses.filter((x) => x.address !== chosen)) {
      console.info(`      http://${a.address}:${WEB_PORT}   [${a.name}]`);
    }
  }
  console.info('');
  console.info(
    '  If it does not load: allow "Node.js" through Windows Firewall on PRIVATE networks',
  );
  console.info('  when Windows asks. Stop with Ctrl+C. Trusted home Wi-Fi only.');
  console.info('');

  const child = spawn(
    'npx',
    [
      'concurrently',
      '-k',
      '-n',
      'api,web',
      '-c',
      'yellow,cyan',
      '"npm run dev -w @mahjong/api"',
      '"npm run dev -w @mahjong/web -- --host"',
    ],
    { stdio: 'inherit', shell: true, env: { ...process.env, WEB_ORIGIN: origin } },
  );
  child.on('exit', (code) => process.exit(code ?? 0));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
}

// Only run when started directly (the tests import lanAddresses).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
