/**
 * Generates ALL original placeholder artwork as SVG (no external assets, no paid fonts):
 *
 *   npm run assets:generate
 *
 * Output goes to apps/web/public/assets/{symbols,backgrounds,ui,effects}.
 * Replace any generated file with your own artwork (same file name) to re-skin the game -
 * see apps/web/public/assets/README.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'apps/web/public/assets');

const C = {
  bgDeep: '#061512',
  jadeDark: '#0A2922',
  jade: '#146B57',
  jadeLight: '#258A70',
  ivory: '#F4EBD7',
  ivoryDark: '#D8C9AA',
  gold: '#D6A84B',
  goldLight: '#F2D27C',
  red: '#A52A2A',
  redLight: '#D04A3A',
  ink: '#1A1A1A',
};

const CJK =
  "'Noto Serif CJK SC','Noto Serif SC','Source Han Serif SC','Songti SC','STSong','SimSun','Microsoft YaHei','PingFang SC','Noto Sans CJK SC',serif";
const LATIN = "'Cinzel','Trajan Pro',Georgia,'Times New Roman',serif";

const n = (v) => Math.round(v * 10) / 10;

function write(relativePath, content) {
  const target = resolve(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content.trim() + '\n', 'utf8');
  console.info('  wrote', relativePath);
}

// Deterministic pseudo random so regenerated files are stable (avoids noisy git diffs).
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* =========================================================================================
 * TILES  (viewBox 120 x 132, transparent background, identical construction for all tiles)
 * ======================================================================================= */

const TILE_DEFS = `
  <linearGradient id="face" x1="0.1" y1="0" x2="0.7" y2="1">
    <stop offset="0" stop-color="#FFFAEC"/><stop offset="0.55" stop-color="${C.ivory}"/><stop offset="1" stop-color="#DCCBA6"/>
  </linearGradient>
  <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.jadeLight}"/><stop offset="0.5" stop-color="${C.jade}"/><stop offset="1" stop-color="#0A3128"/>
  </linearGradient>
  <linearGradient id="jadeGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2FAA8A"/><stop offset="1" stop-color="#0E5A47"/>
  </linearGradient>
  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.redLight}"/><stop offset="1" stop-color="#7A1818"/>
  </linearGradient>
  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.goldLight}"/><stop offset="0.5" stop-color="${C.gold}"/><stop offset="1" stop-color="#9A7420"/>
  </linearGradient>
  <radialGradient id="sheen" cx="0.28" cy="0.18" r="0.7">
    <stop offset="0" stop-color="#fff" stop-opacity="0.65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <filter id="drop" x="-20%" y="-15%" width="140%" height="150%">
    <feDropShadow dx="0" dy="3.5" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
  </filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>
`;

/** The shared ivory ceramic tile: jade underside, bevelled face, sheen. Only `inner` changes. */
function ivoryTile(inner, extraDefs = '') {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 132" width="120" height="132">
  <defs>${TILE_DEFS}${extraDefs}</defs>
  <g filter="url(#drop)">
    <rect x="6" y="12" width="108" height="114" rx="17" fill="url(#edge)"/>
    <rect x="6" y="6" width="108" height="112" rx="17" fill="url(#face)" stroke="#BFAE86" stroke-width="1.2"/>
  </g>
  <rect x="10.5" y="10.5" width="99" height="103" rx="13" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.2"/>
  <rect x="12" y="12" width="96" height="100" rx="11" fill="none" stroke="#C9B88F" stroke-opacity="0.45" stroke-width="0.8"/>
  <rect x="6" y="6" width="108" height="112" rx="17" fill="url(#sheen)"/>
  ${inner}
</svg>`;
}

const glyph = (char, { size, y, fill, x = 60, stroke = '', weight = 900 }) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" font-family="${CJK}" font-weight="${weight}" fill="${fill}" ${stroke}>${char}</text>`;

const corner = (x, y, rot, color) =>
  `<path d="M0 0 H9 M0 0 V9" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none" transform="translate(${x} ${y}) rotate(${rot})"/>`;

function symbolCircle() {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return `<circle cx="${n(60 + Math.cos(a) * 38)}" cy="${n(62 + Math.sin(a) * 38)}" r="3" fill="${C.jade}"/>`;
  }).join('');
  return ivoryTile(`
  <g>
    ${petals}
    <circle cx="60" cy="62" r="30" fill="none" stroke="url(#jadeGrad)" stroke-width="6"/>
    <circle cx="60" cy="62" r="24" fill="none" stroke="${C.gold}" stroke-opacity="0.8" stroke-width="1.2"/>
    <circle cx="60" cy="62" r="20" fill="url(#redGrad)"/>
    <circle cx="60" cy="62" r="12.5" fill="${C.jadeDark}"/>
    <circle cx="60" cy="62" r="12.5" fill="none" stroke="${C.gold}" stroke-width="1.6"/>
    <circle cx="60" cy="62" r="5" fill="url(#goldGrad)"/>
    <circle cx="54" cy="56" r="14" fill="#fff" opacity="0.08"/>
  </g>`);
}

function bamboo() {
  const stalk = (x, top, bottom, width, segments) => {
    const h = (bottom - top) / segments;
    let out = '';
    for (let i = 0; i < segments; i++) {
      const y = top + i * h;
      out += `<rect x="${x - width / 2}" y="${n(y + 1)}" width="${width}" height="${n(h - 2)}" rx="${width / 2.6}" fill="url(#jadeGrad)" stroke="#0B4A3B" stroke-width="0.8"/>`;
      out += `<rect x="${x - width / 2 + 2}" y="${n(y + 3)}" width="2.2" height="${n(h - 6)}" rx="1" fill="#fff" opacity="0.28"/>`;
    }
    return out;
  };
  return ivoryTile(`
  <g>
    ${stalk(35, 34, 92, 11, 2)}
    ${stalk(85, 34, 92, 11, 2)}
    ${stalk(60, 20, 106, 15, 3)}
    <path d="M67 46 q16 -3 25 -16 q-19 0 -25 16z" fill="#1B8A6C" stroke="#0B4A3B" stroke-width="0.8"/>
    <path d="M53 74 q-16 -3 -25 -16 q19 0 25 16z" fill="#1B8A6C" stroke="#0B4A3B" stroke-width="0.8"/>
    <path d="M60 55 l6.5 7 -6.5 7 -6.5 -7z" fill="url(#redGrad)" stroke="${C.gold}" stroke-width="1"/>
    <circle cx="35" cy="92" r="2" fill="${C.red}"/><circle cx="85" cy="92" r="2" fill="${C.red}"/>
  </g>`);
}

function character() {
  return ivoryTile(`
  <circle cx="60" cy="62" r="40" fill="none" stroke="${C.jade}" stroke-opacity="0.35" stroke-width="1.6" stroke-dasharray="3 5"/>
  ${glyph('萬', { size: 66, y: 84, fill: '#8B1A1A' })}
  ${corner(18, 18, 0, C.gold)}${corner(102, 18, 90, C.gold)}${corner(18, 106, 270, C.gold)}${corner(102, 106, 180, C.gold)}`);
}

function fiveCharacter() {
  return ivoryTile(`
  ${glyph('五', { size: 56, y: 62, fill: '#8B1A1A' })}
  ${glyph('萬', { size: 34, y: 100, fill: C.jade, weight: 700 })}
  <path d="M30 70 H90" stroke="${C.gold}" stroke-opacity="0.7" stroke-width="1.4"/>
  <circle cx="24" cy="24" r="2.6" fill="${C.jade}"/><circle cx="96" cy="24" r="2.6" fill="${C.jade}"/>`);
}

function eightCharacter() {
  return ivoryTile(`
  ${glyph('八', { size: 56, y: 62, fill: '#8B1A1A' })}
  ${glyph('萬', { size: 34, y: 100, fill: '#9A7420', weight: 700 })}
  <path d="M28 70 H92" stroke="${C.gold}" stroke-width="1.6"/>
  <path d="M60 18 l3.5 4 -3.5 4 -3.5 -4z" fill="${C.gold}"/>
  <circle cx="24" cy="24" r="2.6" fill="${C.red}"/><circle cx="96" cy="24" r="2.6" fill="${C.red}"/>`);
}

function eastWind() {
  return ivoryTile(`
  ${glyph('東', { size: 70, y: 86, fill: C.ink })}
  ${corner(17, 17, 0, C.jade)}${corner(103, 17, 90, C.jade)}${corner(17, 107, 270, C.jade)}${corner(103, 107, 180, C.jade)}
  <circle cx="60" cy="20" r="2.4" fill="${C.jade}" opacity="0.8"/>`);
}

function whiteDragon() {
  const blue = '#5F94BF';
  const pale = '#A9C9E4';
  return ivoryTile(
    `
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <rect x="27" y="23" width="66" height="78" rx="9" stroke="${blue}" stroke-width="5"/>
    <rect x="37" y="33" width="46" height="58" rx="5" stroke="${pale}" stroke-width="2.6"/>
    <path d="M27 40 q-11 0 -11 -11 M93 40 q11 0 11 -11 M27 84 q-11 0 -11 11 M93 84 q11 0 11 11" stroke="${blue}" stroke-width="2.4"/>
    <path d="M46 62 q7 -12 14 0 t14 0" stroke="${pale}" stroke-width="2.4"/>
    <path d="M46 72 q7 -12 14 0 t14 0" stroke="${pale}" stroke-width="1.6" opacity="0.7"/>
  </g>
  <rect x="8" y="8" width="104" height="108" rx="15" fill="none" stroke="${blue}" stroke-opacity="0.25" stroke-width="1"/>`,
  );
}

function greenDragon() {
  return ivoryTile(`
  ${glyph('發', { size: 66, y: 84, fill: '#0F7A5C', stroke: `stroke="${C.gold}" stroke-width="0.9" paint-order="stroke"` })}
  <circle cx="22" cy="22" r="2.6" fill="${C.gold}"/><circle cx="98" cy="22" r="2.6" fill="${C.gold}"/>
  <path d="M34 104 H86" stroke="${C.gold}" stroke-width="1.6"/>`);
}

function redDragon() {
  return ivoryTile(`
  <circle cx="60" cy="62" r="42" fill="none" stroke="${C.gold}" stroke-opacity="0.55" stroke-width="1.2"/>
  ${glyph('中', { size: 72, y: 87, fill: '#B01E1E', stroke: `stroke="${C.gold}" stroke-width="1" paint-order="stroke"` })}
  ${corner(16, 16, 0, C.gold)}${corner(104, 16, 90, C.gold)}${corner(16, 108, 270, C.gold)}${corner(104, 108, 180, C.gold)}`);
}

/** Golden Dragon Wild: dark jade tile + a golden dragon coiled around it. Clearly "stronger". */
function wildDragon() {
  const scales = (d, w = 7.5) => `
    <path d="${d}" fill="none" stroke="url(#goldGrad)" stroke-width="${w}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#7A5A16" stroke-width="${w - 1}" stroke-dasharray="1.4 4.2" opacity="0.7"/>
    <path d="${d}" fill="none" stroke="${C.jadeLight}" stroke-width="1.4" stroke-linecap="round" opacity="0.8" transform="translate(-1.6 -1.6)"/>`;
  const spark = (x, y, r, o = 0.9) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.goldLight}" opacity="${o}"/>`;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 132" width="120" height="132">
  <defs>${TILE_DEFS}
    <linearGradient id="darkJade" x1="0.1" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#1F8A72"/><stop offset="0.5" stop-color="#0F4A3C"/><stop offset="1" stop-color="#05201A"/>
    </linearGradient>
    <radialGradient id="aura" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0" stop-color="${C.goldLight}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g filter="url(#drop)">
    <rect x="6" y="12" width="108" height="114" rx="17" fill="#04150F"/>
    <rect x="6" y="6" width="108" height="112" rx="17" fill="url(#darkJade)" stroke="url(#goldGrad)" stroke-width="2.4"/>
  </g>
  <rect x="11" y="11" width="98" height="102" rx="12" fill="none" stroke="${C.goldLight}" stroke-opacity="0.55" stroke-width="1"/>
  <rect x="6" y="6" width="108" height="112" rx="17" fill="url(#sheen)" opacity="0.35"/>
  <ellipse cx="60" cy="58" rx="46" ry="44" fill="url(#aura)"/>

  <!-- coiling body around the tile -->
  ${scales('M24 106 C 3 92, 3 40, 30 20', 8)}
  ${scales('M96 106 C 117 92, 117 44, 92 22', 8)}
  ${scales('M26 20 C 40 8, 80 8, 94 20', 6)}
  <path d="M22 108 l-5 8 9 -3z" fill="url(#goldGrad)"/>
  <path d="M98 108 l5 8 -9 -3z" fill="url(#goldGrad)"/>

  <!-- emblem: golden dragon head -->
  <g filter="url(#glow)">
    <circle cx="60" cy="58" r="27" fill="#062A22" stroke="url(#goldGrad)" stroke-width="2.4"/>
    <circle cx="60" cy="58" r="22.5" fill="none" stroke="${C.gold}" stroke-opacity="0.5" stroke-width="0.8"/>
    <g transform="translate(60 60) scale(0.8)">
      <path d="M-30 -18 C-24 -38 -8 -46 6 -40 C0 -34 -6 -30 -8 -22 Z" fill="url(#goldGrad)"/>
      <path d="M-4 -26 C-2 -46 12 -56 26 -52 C18 -46 14 -38 14 -26 Z" fill="url(#goldGrad)"/>
      <path d="M-32 -6 C-30 -26 -8 -30 14 -24 L44 -18 C54 -16 54 -2 44 2 L20 8 C4 22 -24 20 -32 -6 Z" fill="url(#goldGrad)" stroke="#7A5A16" stroke-width="1.2"/>
      <path d="M8 6 C24 18 40 12 46 2 L44 12 C36 26 14 28 4 16 Z" fill="#B98A2E"/>
      <path d="M-30 4 C-44 14 -46 30 -38 40 C-38 26 -26 18 -14 14 Z" fill="${C.jadeLight}" stroke="${C.goldLight}" stroke-width="0.8"/>
      <circle cx="12" cy="-10" r="5.6" fill="#FFF3B5"/><circle cx="13" cy="-10" r="2.4" fill="#5A1010"/>
      <circle cx="46" cy="-8" r="2" fill="#5A3A08"/>
      <path d="M46 -2 C64 8 70 26 62 40" stroke="${C.goldLight}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M44 -14 C58 -26 64 -22 68 -32" stroke="${C.goldLight}" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
  </g>

  <!-- WILD plate -->
  <rect x="33" y="100" width="54" height="14" rx="7" fill="#04201A" stroke="url(#goldGrad)" stroke-width="1.6"/>
  <text x="60" y="110.4" font-size="9.5" text-anchor="middle" font-family="${LATIN}" font-weight="700" letter-spacing="2" fill="${C.goldLight}">WILD</text>

  ${spark(20, 34, 1.6)}${spark(100, 40, 1.4)}${spark(16, 76, 1.2, 0.7)}${spark(104, 84, 1.7)}${spark(60, 16, 1.3)}${spark(84, 96, 1.1, 0.7)}
</svg>`;
}

function lotusScatter() {
  const petal = (angle, fill, rx, ry, dist) =>
    `<ellipse cx="60" cy="${66 - dist}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#5A1010" stroke-width="0.7" stroke-opacity="0.6" transform="rotate(${angle} 60 66)"/>`;
  const outer = [-76, -38, 0, 38, 76]
    .map((a) => petal(a, 'url(#petalOuter)', 9.5, 24, 20))
    .join('');
  const inner = [-57, -19, 19, 57].map((a) => petal(a, 'url(#petalInner)', 8, 19, 16)).join('');
  const dots = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return `<circle cx="${n(60 + Math.cos(a) * 12)}" cy="${n(60 + Math.sin(a) * 9)}" r="1.1" fill="${C.goldLight}"/>`;
  }).join('');
  const defs = `
    <linearGradient id="petalOuter" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8A1C1C"/><stop offset="1" stop-color="#E0604C"/></linearGradient>
    <linearGradient id="petalInner" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B02A2A"/><stop offset="1" stop-color="#FF9C82"/></linearGradient>
    <radialGradient id="lotusGlow" cx="0.5" cy="0.55" r="0.55"><stop offset="0" stop-color="#FF8A70" stop-opacity="0.7"/><stop offset="1" stop-color="#FF8A70" stop-opacity="0"/></radialGradient>
    <radialGradient id="centerGold" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFF3B5"/><stop offset="1" stop-color="${C.gold}"/></radialGradient>`;
  return ivoryTile(
    `
  <rect x="15" y="15" width="90" height="90" rx="13" fill="${C.jadeDark}" stroke="url(#goldGrad)" stroke-width="1.6"/>
  <rect x="15" y="15" width="90" height="90" rx="13" fill="url(#jadeGrad)" opacity="0.28"/>
  <ellipse cx="60" cy="58" rx="42" ry="38" fill="url(#lotusGlow)"/>
  <ellipse cx="38" cy="86" rx="20" ry="6" fill="#1B8A6C" opacity="0.9" transform="rotate(-8 38 86)"/>
  <ellipse cx="82" cy="86" rx="20" ry="6" fill="#1B8A6C" opacity="0.9" transform="rotate(8 82 86)"/>
  ${outer}${inner}
  <circle cx="60" cy="60" r="10" fill="url(#centerGold)" stroke="#9A7420" stroke-width="1"/>
  ${dots}
  <circle cx="60" cy="60" r="4" fill="#FFF8D2" opacity="0.9"/>
  <circle cx="22" cy="30" r="1.4" fill="${C.goldLight}"/><circle cx="98" cy="28" r="1.2" fill="${C.goldLight}"/><circle cx="96" cy="70" r="1.5" fill="${C.goldLight}"/><circle cx="24" cy="66" r="1.1" fill="${C.goldLight}"/>
  <text x="60" y="101" font-size="8.6" text-anchor="middle" font-family="${LATIN}" font-weight="700" letter-spacing="2" fill="${C.goldLight}">SCATTER</text>`,
    defs,
  );
}

/* =========================================================================================
 * BACKGROUNDS  (1920 x 1080, identical architecture; `free` transforms the atmosphere)
 * ======================================================================================= */

function palace(free) {
  const r = rng(free ? 4242 : 1717);
  const skyTop = free ? '#1B0806' : '#030D0B';
  const skyMid = free ? '#3B140B' : '#082621';
  const skyLow = free ? '#6A2A10' : '#0E3D33';
  const glowStrength = free ? 0.95 : 0.55;
  const lanternGlowR = free ? 210 : 140;

  const stars = Array.from({ length: free ? 26 : 70 }, () => {
    const x = n(r() * 1920);
    const y = n(r() * 420);
    return `<circle cx="${x}" cy="${y}" r="${n(0.6 + r() * 1.2)}" fill="${free ? C.goldLight : '#DDEFE6'}" opacity="${n(0.25 + r() * 0.5)}"/>`;
  }).join('');

  const lantern = (x, len, scale, id) => {
    const y = len;
    const s = scale;
    return `
    <g>
      <circle cx="${x}" cy="${y + 60 * s}" r="${lanternGlowR * s}" fill="url(#lanternGlow)" opacity="${glowStrength}"/>
      <line x1="${x}" y1="0" x2="${x}" y2="${y}" stroke="#2A1A10" stroke-width="3"/>
      <g transform="translate(${x} ${y}) scale(${s})">
        <rect x="-16" y="-4" width="32" height="12" rx="3" fill="url(#goldGradBg)"/>
        <ellipse cx="0" cy="62" rx="40" ry="54" fill="url(#lanternBody${id})" stroke="#5A1414" stroke-width="2"/>
        <path d="M0 8 V116 M-20 12 Q-30 62 -20 112 M20 12 Q30 62 20 112" stroke="#F2A88A" stroke-opacity="0.35" stroke-width="2" fill="none"/>
        <ellipse cx="-12" cy="40" rx="10" ry="22" fill="#fff" opacity="${free ? 0.22 : 0.12}"/>
        <rect x="-18" y="112" width="36" height="10" rx="3" fill="url(#goldGradBg)"/>
        <path d="M0 122 V150" stroke="${C.gold}" stroke-width="3"/>
        <path d="M-6 150 H6 L4 178 M0 150 V180 M-6 150 L-4 176" stroke="${C.red}" stroke-width="2.4" fill="none"/>
      </g>
    </g>`;
  };
  const lanternBodyDefs = [1, 2, 3, 4, 5, 6]
    .map(
      (i) => `<radialGradient id="lanternBody${i}" cx="0.4" cy="0.35" r="0.8">
        <stop offset="0" stop-color="${free ? '#FF9C6E' : '#E8664F'}"/><stop offset="0.6" stop-color="${C.redLight}"/><stop offset="1" stop-color="#6E1414"/></radialGradient>`,
    )
    .join('');

  // Mountains (ridge lines from a few control points).
  const ridge = (baseY, amp, seed, fill, opacity) => {
    const rr = rng(seed);
    let d = `M0 1080 L0 ${baseY}`;
    for (let x = 0; x <= 1920; x += 120) d += ` L${x} ${n(baseY - rr() * amp)}`;
    d += ' L1920 1080 Z';
    return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
  };

  // Dragon silhouette (Free Spins only): the same dragon, flat and very faint, in the distant sky.
  const dragonSilhouetteMarkup = free ? dragonSilhouette() : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyTop}"/><stop offset="0.55" stop-color="${skyMid}"/><stop offset="1" stop-color="${skyLow}"/>
    </linearGradient>
    <radialGradient id="moonHalo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${free ? '#FFD98A' : '#DDEFE6'}" stop-opacity="${free ? 0.45 : 0.3}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lanternGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${free ? '#FFB347' : '#FF9A4D'}" stop-opacity="0.85"/><stop offset="0.5" stop-color="${C.redLight}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1B0C07"/><stop offset="0.45" stop-color="#3D1F12"/><stop offset="1" stop-color="#1B0C07"/>
    </linearGradient>
    <linearGradient id="goldGradBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.goldLight}"/><stop offset="1" stop-color="#9A7420"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0B302A"/><stop offset="1" stop-color="#03110E"/>
    </linearGradient>
    <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${free ? '#F5C784' : '#B6E3D0'}" stop-opacity="0"/><stop offset="1" stop-color="${free ? '#F5C784' : '#B6E3D0'}" stop-opacity="${free ? 0.16 : 0.1}"/>
    </linearGradient>
    <radialGradient id="centerDark" cx="0.5" cy="0.52" r="0.55">
      <stop offset="0" stop-color="#010605" stop-opacity="0.72"/><stop offset="0.65" stop-color="#010605" stop-opacity="0.35"/><stop offset="1" stop-color="#010605" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/>
    </radialGradient>
    <pattern id="lattice" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M22 0 L44 22 L22 44 L0 22 Z M22 8 L36 22 L22 36 L8 22 Z" fill="none" stroke="${C.gold}" stroke-opacity="${free ? 0.42 : 0.22}" stroke-width="1.4"/>
      <circle cx="22" cy="22" r="2" fill="${C.gold}" fill-opacity="${free ? 0.4 : 0.2}"/>
    </pattern>
    <pattern id="roofTiles" width="60" height="34" patternUnits="userSpaceOnUse">
      <path d="M0 0 H60 V22 Q45 34 30 22 Q15 34 0 22 Z" fill="#0A2922" stroke="${C.gold}" stroke-opacity="0.45" stroke-width="1.6"/>
    </pattern>
    ${lanternBodyDefs}
  </defs>

  <!-- sky, stars, moon -->
  <rect width="1920" height="1080" fill="url(#sky)"/>
  ${stars}
  <circle cx="1400" cy="190" r="240" fill="url(#moonHalo)"/>
  <circle cx="1400" cy="190" r="52" fill="${free ? '#FBE2A6' : '#F1EBD0'}" opacity="0.95"/>
  <circle cx="1386" cy="178" r="52" fill="${free ? '#3B140B' : '#082621'}" opacity="0.08"/>
  ${dragonSilhouetteMarkup}

  <!-- distant misty mountains -->
  ${ridge(720, 150, 11, free ? '#3A1A10' : '#0D3A31', 0.7)}
  ${ridge(800, 140, 23, free ? '#2E140C' : '#0A2C26', 0.85)}
  <rect x="0" y="600" width="1920" height="300" fill="url(#mist)"/>
  ${ridge(880, 110, 37, free ? '#22100A' : '#071F1B', 1)}

  <!-- floor -->
  <rect x="0" y="930" width="1920" height="150" fill="url(#floor)"/>
  <g stroke="${C.gold}" stroke-opacity="${free ? 0.16 : 0.09}" stroke-width="1.4">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${960 + (i - 6) * 40}" y1="930" x2="${960 + (i - 6) * 220}" y2="1080"/>`).join('')}
    <line x1="0" y1="985" x2="1920" y2="985"/><line x1="0" y1="1040" x2="1920" y2="1040"/>
  </g>
  <rect x="0" y="925" width="1920" height="10" fill="${C.gold}" opacity="${free ? 0.32 : 0.16}"/>

  <!-- centre stays dark and uncluttered for the Mahjong grid -->
  <rect width="1920" height="1080" fill="url(#centerDark)"/>

  <!-- left & right palace architecture -->
  ${[0, 1]
    .map((side) => {
      const flip = side === 1 ? 'translate(1920 0) scale(-1 1)' : '';
      return `
  <g transform="${flip}">
    <rect x="0" y="0" width="360" height="1080" fill="#061A16" opacity="0.92"/>
    <rect x="70" y="120" width="270" height="820" fill="url(#lattice)" opacity="0.95"/>
    <rect x="70" y="120" width="270" height="820" fill="none" stroke="${C.gold}" stroke-opacity="0.35" stroke-width="2"/>
    <rect x="0" y="0" width="120" height="1080" fill="url(#wood)"/>
    <rect x="0" y="0" width="120" height="1080" fill="none" stroke="#0B0503" stroke-width="3"/>
    <g fill="url(#goldGradBg)" opacity="0.85">
      <rect x="-4" y="170" width="128" height="16" rx="3"/><rect x="-4" y="860" width="128" height="16" rx="3"/>
      <rect x="10" y="186" width="100" height="6" opacity="0.6"/>
    </g>
    <g stroke="${C.gold}" stroke-opacity="0.28" stroke-width="2" fill="none">
      <path d="M30 240 Q60 280 30 330 Q0 380 30 430 Q60 480 30 530 Q0 580 30 630 Q60 680 30 730"/>
      <path d="M90 240 Q60 280 90 330 Q120 380 90 430 Q60 480 90 530 Q120 580 90 630 Q60 680 90 730"/>
    </g>
    <rect x="0" y="0" width="360" height="1080" fill="url(#vignette)" opacity="0.25"/>
  </g>`;
    })
    .join('')}

  <!-- roof eaves -->
  <rect x="0" y="0" width="1920" height="86" fill="#04140F"/>
  <rect x="0" y="0" width="1920" height="34" fill="url(#roofTiles)"/>
  <rect x="0" y="34" width="1920" height="52" fill="url(#wood)" opacity="0.95"/>
  <rect x="0" y="80" width="1920" height="6" fill="url(#goldGradBg)" opacity="0.8"/>
  <rect x="0" y="36" width="1920" height="3" fill="${C.gold}" opacity="0.5"/>

  <!-- lanterns (edges only) -->
  ${lantern(250, 92, 1.0, 1)}${lantern(150, 92, 0.72, 2)}${lantern(420, 92, 0.8, 3)}
  ${lantern(1670, 92, 1.0, 4)}${lantern(1770, 92, 0.72, 5)}${lantern(1500, 92, 0.8, 6)}

  <rect width="1920" height="1080" fill="url(#vignette)"/>
</svg>`;
}

/* =========================================================================================
 * UI + EFFECTS
 * ======================================================================================= */

function dragonHeadIcon() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.goldLight}"/><stop offset="1" stop-color="#9A7420"/></linearGradient>
  </defs>
  <g transform="translate(30 34)">
    <path d="M-26 -12 C-20 -28 -6 -32 6 -27 C0 -22 -5 -20 -6 -14 Z" fill="url(#g)"/>
    <path d="M-2 -18 C0 -32 10 -38 20 -34 C14 -30 10 -24 10 -16 Z" fill="url(#g)"/>
    <path d="M-28 -2 C-26 -18 -8 -22 10 -16 L30 -12 C38 -10 38 2 30 5 L14 9 C2 20 -20 18 -28 -2 Z" fill="url(#g)" stroke="#7A5A16" stroke-width="1"/>
    <path d="M6 7 C18 15 28 11 32 4 L30 12 C24 22 8 24 2 14 Z" fill="#B98A2E"/>
    <path d="M-26 6 C-36 12 -38 24 -32 32 C-32 22 -22 16 -12 12 Z" fill="${C.jadeLight}"/>
    <circle cx="9" cy="-6" r="4" fill="#FFF3B5"/><circle cx="10" cy="-6" r="1.8" fill="#5A1010"/>
  </g>
</svg>`;
}

function spinOrnament() {
  const scale = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return `<circle cx="${n(100 + Math.cos(a) * 84)}" cy="${n(100 + Math.sin(a) * 84)}" r="${i % 3 === 0 ? 3.2 : 1.8}" fill="${C.gold}" opacity="${i % 3 === 0 ? 0.95 : 0.55}"/>`;
  }).join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.goldLight}"/><stop offset="1" stop-color="#9A7420"/></linearGradient></defs>
  <circle cx="100" cy="100" r="92" fill="none" stroke="url(#g)" stroke-width="2" stroke-dasharray="6 6" opacity="0.7"/>
  ${scale}
  <path d="M100 8 C 150 8, 192 50, 192 100 C 192 150, 150 192, 100 192" fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round"/>
  <path d="M100 8 l16 -6 -6 16z" fill="url(#g)"/>
</svg>`;
}

function logoSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 170" width="640" height="170">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE7A6"/><stop offset="0.5" stop-color="${C.gold}"/><stop offset="1" stop-color="#8F6A1C"/></linearGradient>
    <filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="6" result="b"/><feFlood flood-color="${C.jadeLight}" flood-opacity="0.55"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <text x="320" y="82" font-size="64" text-anchor="middle" font-family="${LATIN}" font-weight="700" letter-spacing="6" fill="url(#g)" filter="url(#glow)">MAHJONG DYNASTY</text>
  <g stroke="${C.gold}" stroke-opacity="0.8" stroke-width="1.6" fill="none"><path d="M40 118 H250"/><path d="M390 118 H600"/></g>
  <path d="M320 104 l9 14 -9 14 -9 -14z" fill="url(#g)"/>
  <text x="320" y="146" font-size="24" text-anchor="middle" font-family="${LATIN}" font-weight="600" letter-spacing="11" fill="${C.ivory}" opacity="0.92">DRAGON FORTUNE</text>
</svg>`;
}

/** Geometry of the long serpentine golden dragon (horizontal, head on the right). */
const DRAGON_W = 1400;
const DRAGON_H = 360;

function dragonParts() {
  const H = DRAGON_H;
  const samples = 90;
  const centre = (t) => ({
    x: 30 + t * 1040,
    y: H / 2 + Math.sin(t * Math.PI * 3.1 + 0.4) * (46 + t * 44) - t * 6,
  });
  const width = (t) =>
    6 + Math.sin(Math.min(1, t * 1.05) * Math.PI * 0.5) * 44 - (t > 0.92 ? (t - 0.92) * 220 : 0);

  const pts = Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const p = centre(t);
    const q = centre(Math.min(1, t + 0.005));
    const o = centre(Math.max(0, t - 0.005));
    const tx = q.x - o.x;
    const ty = q.y - o.y;
    const len = Math.hypot(tx, ty) || 1;
    return {
      ...p,
      nx: -ty / len,
      ny: tx / len,
      tx: tx / len,
      ty: ty / len,
      w: Math.max(4, width(t)),
    };
  });

  const left = pts.map((p) => `${n(p.x + (p.nx * p.w) / 2)} ${n(p.y + (p.ny * p.w) / 2)}`);
  const right = pts
    .slice()
    .reverse()
    .map((p) => `${n(p.x - (p.nx * p.w) / 2)} ${n(p.y - (p.ny * p.w) / 2)}`);
  const body = `M${left.join(' L')} L${right.join(' L')} Z`;
  const centreLine = `M${pts.map((p) => `${n(p.x)} ${n(p.y)}`).join(' L')}`;
  const highlight = `M${pts
    .filter((p) => p.w > 12)
    .map((p) => `${n(p.x - p.nx * p.w * 0.22)} ${n(p.y - p.ny * p.w * 0.22)}`)
    .join(' L')}`;

  const spikes = pts
    .filter((_, i) => i % 5 === 2 && i > 8)
    .map((p) => {
      const bx = p.x + (p.nx * p.w) / 2;
      const by = p.y + (p.ny * p.w) / 2;
      const h = 5 + p.w * 0.28;
      return `<path d="M${n(bx - p.tx * 7)} ${n(by - p.ty * 7)} L${n(bx + p.nx * h)} ${n(by + p.ny * h)} L${n(bx + p.tx * 7)} ${n(by + p.ty * 7)} Z" fill="${C.jadeLight}"/>`;
    })
    .join('');

  const head = pts[pts.length - 1];
  const angle = (Math.atan2(head.ty, head.tx) * 180) / Math.PI;

  const headGroup = `
    <g transform="translate(${n(head.x)} ${n(head.y)}) rotate(${n(angle)})">
      <path d="M-4 -30 C-30 -54 -70 -46 -110 -70 C-80 -26 -50 -14 -4 8 Z" fill="${C.jade}" stroke="${C.goldLight}" stroke-width="2"/>
      <path d="M8 -26 C-6 -64 -34 -92 -66 -100 C-38 -78 -22 -52 -4 -22 Z" fill="url(#gold)" stroke="#7A5A16" stroke-width="1.4"/>
      <path d="M24 -30 C20 -70 4 -92 -14 -104 C4 -82 8 -58 12 -28 Z" fill="url(#gold)" stroke="#7A5A16" stroke-width="1.4"/>
      <path d="M-6 -26 C20 -46 64 -46 96 -30 L146 -22 C160 -18 160 4 146 8 L100 14 C74 40 24 38 -6 22 Z" fill="url(#goldH)" stroke="#7A5A16" stroke-width="2"/>
      <path d="M64 20 C92 40 128 34 144 12 L140 26 C120 48 82 50 58 32 Z" fill="#B98A2E" stroke="#7A5A16" stroke-width="1.4"/>
      <path d="M100 14 l5 11 5 -11 M118 12 l4 9 4 -9" fill="#FFF7E0" stroke="none"/>
      <circle cx="70" cy="-14" r="9" fill="#FFF3B5"/><circle cx="72" cy="-14" r="4" fill="#B01818"/>
      <circle cx="140" cy="-10" r="3" fill="#5A3A08"/>
      <path d="M144 -2 C190 30 230 4 270 46" stroke="${C.goldLight}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M140 -18 C182 -52 226 -26 262 -72" stroke="${C.goldLight}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    </g>`;

  return { body, centreLine, highlight, spikes, headGroup };
}

function dragonSvg() {
  const { body, centreLine, highlight, spikes, headGroup } = dragonParts();
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DRAGON_W} ${DRAGON_H}" width="${DRAGON_W}" height="${DRAGON_H}">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE7A6"/><stop offset="0.5" stop-color="${C.gold}"/><stop offset="1" stop-color="#8A6318"/></linearGradient>
    <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8A6318"/><stop offset="0.6" stop-color="${C.gold}"/><stop offset="1" stop-color="#FBE7A6"/></linearGradient>
    <filter id="glow" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="clipBody"><path d="${body}"/></clipPath>
  </defs>
  <g filter="url(#glow)">
    ${spikes}
    <path d="${body}" fill="url(#gold)" stroke="#7A5A16" stroke-width="2"/>
    <g clip-path="url(#clipBody)">
      <path d="${centreLine}" fill="none" stroke="#6E4E12" stroke-width="80" stroke-dasharray="2.5 13" opacity="0.5"/>
      <path d="${highlight}" fill="none" stroke="${C.jadeLight}" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    </g>
    ${headGroup}
  </g>
</svg>`;
}

/** Faint flat-gold dragon used as the distant sky silhouette during Free Spins. */
function dragonSilhouette() {
  const { body, headGroup } = dragonParts();
  const flat = headGroup
    .replaceAll('url(#gold)', C.goldLight)
    .replaceAll('url(#goldH)', C.goldLight);
  return `<g opacity="0.13" transform="translate(440 150) scale(0.7)"><path d="${body}" fill="${C.goldLight}"/>${flat}</g>`;
}

function particleSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs><radialGradient id="p" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6CF"/><stop offset="0.35" stop-color="${C.goldLight}"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient></defs>
  <circle cx="16" cy="16" r="16" fill="url(#p)"/>
</svg>`;
}

function glowSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF1B8" stop-opacity="0.95"/><stop offset="0.45" stop-color="${C.gold}" stop-opacity="0.45"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient></defs>
  <circle cx="128" cy="128" r="128" fill="url(#g)"/>
</svg>`;
}

/* ========================================================================================= */

console.info('Generating Mahjong Dynasty placeholder assets ...');
write('symbols/circle.svg', symbolCircle());
write('symbols/bamboo.svg', bamboo());
write('symbols/character.svg', character());
write('symbols/five-character.svg', fiveCharacter());
write('symbols/eight-character.svg', eightCharacter());
write('symbols/east-wind.svg', eastWind());
write('symbols/white-dragon.svg', whiteDragon());
write('symbols/green-dragon.svg', greenDragon());
write('symbols/red-dragon.svg', redDragon());
write('symbols/wild-dragon.svg', wildDragon());
write('symbols/lotus-scatter.svg', lotusScatter());
write('backgrounds/palace-normal.svg', palace(false));
write('backgrounds/palace-free.svg', palace(true));
write('ui/logo.svg', logoSvg());
write('ui/dragon-icon.svg', dragonHeadIcon());
write('ui/spin-ornament.svg', spinOrnament());
write('effects/dragon.svg', dragonSvg());
write('effects/particle.svg', particleSvg());
write('effects/glow.svg', glowSvg());
console.info('Done.');
