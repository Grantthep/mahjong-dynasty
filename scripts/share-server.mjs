/**
 * The small web server behind `npm run share`: serves the built game and forwards /api to the API.
 *
 * Why not `vite preview`? It marks every file "no-cache", so the free Cloudflare tunnel could never
 * keep a copy and EVERY visitor downloaded the whole game (about 3 MB) from this computer's home
 * internet. This server sends proper cache headers and compresses text, so Cloudflare serves most
 * of the bytes and many more people can open the game at once.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.map', '.wav']);

/** Vite gives build output a content hash (GamePage-B8gWXy8e.js): safe to cache for a year. */
const HASHED = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|css|woff2?)$/;

export function cacheControlFor(urlPath) {
  if (urlPath === '/' || urlPath === '/index.html') return 'no-cache';
  if (HASHED.test(urlPath)) return 'public, max-age=31536000, immutable';
  // Sounds and artwork keep their names, so they are re-checked within the hour.
  return 'public, max-age=3600';
}

/**
 * @param {{ distDir: string, port: number, apiPort: number, origin: string }} options
 *   origin: the web origin the API trusts (requests reach it via this server, so it is presented as that).
 */
export function startShareServer({ distDir, port, apiPort, origin }) {
  const root = resolve(distDir);
  const indexHtml = join(root, 'index.html');
  if (!existsSync(indexHtml))
    throw new Error(`No built game in ${root}. Run "npm run build" first.`);

  /** path -> { body, gzip, etag, type } for files small enough to keep in memory. */
  const memory = new Map();
  function load(file) {
    let entry = memory.get(file);
    if (!entry) {
      const stats = statSync(file);
      const ext = extname(file).toLowerCase();
      const body = readFileSync(file);
      entry = {
        body,
        gzip: COMPRESSIBLE.has(ext) && body.length > 1024 ? gzipSync(body, { level: 9 }) : null,
        etag: `"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`,
        type: TYPES[ext] ?? 'application/octet-stream',
      };
      memory.set(file, entry);
    }
    return entry;
  }

  function serveFile(req, res, file, urlPath, status = 200) {
    const entry = load(file);
    const headers = {
      'Content-Type': entry.type,
      'Cache-Control': status === 200 ? cacheControlFor(urlPath) : 'no-cache',
      ETag: entry.etag,
      Vary: 'Accept-Encoding',
      'X-Content-Type-Options': 'nosniff',
    };
    if (status === 200 && req.headers['if-none-match'] === entry.etag) {
      res.writeHead(304, headers).end();
      return;
    }
    const useGzip = entry.gzip && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
    const body = useGzip ? entry.gzip : entry.body;
    if (useGzip) headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = body.length;
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  function proxyToApi(req, res) {
    const headers = { ...req.headers, host: `localhost:${apiPort}` };
    // The API only trusts its own web origin; this server IS that web app.
    if (headers.origin) headers.origin = origin;
    const upstream = httpRequest(
      { host: '127.0.0.1', port: apiPort, method: req.method, path: req.url, headers },
      (apiResponse) => {
        res.writeHead(apiResponse.statusCode ?? 502, apiResponse.headers);
        apiResponse.pipe(res);
      },
    );
    upstream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(
        JSON.stringify({
          error: { code: 'BAD_GATEWAY', message: 'The game server is not answering.' },
        }),
      );
    });
    req.pipe(upstream);
  }

  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      let urlPath;
      try {
        urlPath = decodeURIComponent(url.pathname);
      } catch {
        res.writeHead(400).end();
        return;
      }

      if (urlPath === '/api' || urlPath.startsWith('/api/')) {
        proxyToApi(req, res);
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
      }

      // Stay inside the built folder (no "../" tricks).
      const file = normalize(join(root, urlPath));
      const inside = file === root || file.startsWith(root + sep);
      if (!inside) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
        return;
      }
      if (existsSync(file) && statSync(file).isFile()) {
        serveFile(req, res, file, urlPath);
        return;
      }
      // A missing file with an extension is a real 404; anything else is a page of the app.
      if (extname(urlPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
        return;
      }
      serveFile(req, res, indexHtml, '/', 200);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(port, () => resolveServer(server));
  });
}
