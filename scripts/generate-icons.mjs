/**
 * Renders the existing dragon-icon.svg into real PNG app icons and a social-share image, using the
 * Chromium that Playwright already installs for the end-to-end tests (no new dependency needed):
 *
 *   npm run icons:generate
 *
 * Writes to apps/web/public/:
 *   favicon-32.png, favicon-16.png            browser tab icon
 *   assets/ui/apple-touch-icon.png (180x180)  "Add to Home Screen" on iOS
 *   assets/ui/icon-192.png, icon-512.png      PWA manifest icons
 *   assets/ui/icon-512-maskable.png           Android adaptive icon (padded safe zone)
 *   og-image.png (1200x630)                   link-preview image for chat apps / social media
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'apps/web/public');
const uiDir = resolve(publicDir, 'assets/ui');
mkdirSync(uiDir, { recursive: true });

const dragonSvg = readFileSync(resolve(uiDir, 'dragon-icon.svg'), 'utf8');

const JADE = '#0a2922';
const GOLD = '#d6a84b';
const IVORY = '#f4ebd7';

/** One self-contained HTML page per icon; a #target element is screenshotted. */
function iconPage({ size, background, dragonScale }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${size}px; height: ${size}px; background: transparent; }
    #target {
      width: ${size}px; height: ${size}px;
      display: flex; align-items: center; justify-content: center;
      background: ${background};
      ${background === 'transparent' ? '' : `border-radius: ${Math.round(size * 0.18)}px;`}
    }
    #target svg { width: ${Math.round(size * dragonScale)}px; height: ${Math.round(size * dragonScale)}px; }
  </style></head><body><div id="target">${dragonSvg}</div></body></html>`;
}

function ogPage() {
  const W = 1200;
  const H = 630;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${W}px; height: ${H}px; }
    #target {
      width: ${W}px; height: ${H}px;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px;
      background: radial-gradient(circle at 50% 30%, #146b57, ${JADE} 70%);
      font-family: Georgia, 'Times New Roman', serif;
    }
    #target svg { width: 180px; height: 180px; }
    h1 {
      color: ${IVORY}; font-size: 64px; letter-spacing: 6px; font-weight: 700;
      text-shadow: 0 0 24px rgba(214, 168, 75, 0.6); margin: 0;
    }
    p {
      color: ${GOLD}; font-size: 28px; letter-spacing: 10px; text-transform: uppercase; margin: 0;
    }
  </style></head><body>
    <div id="target">
      ${dragonSvg}
      <h1>MAHJONG DYNASTY</h1>
      <p>Dragon Fortune</p>
    </div>
  </body></html>`;
}

async function shoot(page, html, path, { omitBackground }) {
  await page.setContent(html);
  await page.locator('#target').screenshot({ path, omitBackground });
  console.info(`  ${path.replace(root + '\\', '').replace(root + '/', '')}`);
}

async function main() {
  // Reuses the system Edge/Chrome (same as `npm run test:e2e`), so this needs no extra browser
  // download. Override with PW_CHANNEL=chrome, or unset it if Playwright's own Chromium is installed.
  const channel = process.env.PW_CHANNEL ?? 'msedge';
  const browser = await chromium.launch({ channel });
  const page = await browser.newPage({ deviceScaleFactor: 2 }); // crisp output
  try {
    console.info('Rendering icons from assets/ui/dragon-icon.svg:');

    // Favicons: transparent, dragon fills most of the square.
    await page.setViewportSize({ width: 32, height: 32 });
    await shoot(
      page,
      iconPage({ size: 32, background: 'transparent', dragonScale: 0.92 }),
      resolve(publicDir, 'favicon-32.png'),
      { omitBackground: true },
    );
    await page.setViewportSize({ width: 16, height: 16 });
    await shoot(
      page,
      iconPage({ size: 16, background: 'transparent', dragonScale: 0.92 }),
      resolve(publicDir, 'favicon-16.png'),
      { omitBackground: true },
    );

    // Apple touch icon: iOS fills transparency with black, so give it an opaque jade card.
    await page.setViewportSize({ width: 180, height: 180 });
    await shoot(
      page,
      iconPage({ size: 180, background: JADE, dragonScale: 0.66 }),
      resolve(uiDir, 'apple-touch-icon.png'),
      { omitBackground: false },
    );

    // PWA manifest icons: transparent "any" + padded "maskable" for Android's adaptive safe zone.
    for (const size of [192, 512]) {
      await page.setViewportSize({ width: size, height: size });
      await shoot(
        page,
        iconPage({ size, background: 'transparent', dragonScale: 0.82 }),
        resolve(uiDir, `icon-${size}.png`),
        { omitBackground: true },
      );
    }
    await page.setViewportSize({ width: 512, height: 512 });
    await shoot(
      page,
      iconPage({ size: 512, background: JADE, dragonScale: 0.52 }),
      resolve(uiDir, 'icon-512-maskable.png'),
      { omitBackground: false },
    );

    // Social / link-preview image.
    await page.setViewportSize({ width: 1200, height: 630 });
    await shoot(page, ogPage(), resolve(publicDir, 'og-image.png'), { omitBackground: false });

    console.info('Done. Re-run after changing dragon-icon.svg to refresh every size.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
