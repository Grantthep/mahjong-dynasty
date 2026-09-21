# Mahjong Dynasty – Asset Replacement Guide

The game ships with **original placeholder artwork generated as SVG** and needs **no external or
paid assets**. Every file below can be replaced with final artwork without touching game code.

```
public/assets/
├── symbols/       11 tile SVGs (one per SymbolId)
├── backgrounds/   palace-normal.svg, palace-free.svg
├── ui/            logo.svg, dragon-icon.svg, spin-ornament.svg
├── effects/       dragon.svg, glow.svg, particle.svg
└── audio/         13 generated placeholder sounds (.wav) - replace with your own
```

> Regenerate the placeholders at any time with `npm run assets:generate` (from the repo root).
> **Warning:** this overwrites the files listed above, including any you replaced by hand.

---

## 1. Symbols (`symbols/`)

| Symbol id (file name) | Tier    | Notes                                   |
| --------------------- | ------- | --------------------------------------- |
| `circle.svg`          | low     |                                         |
| `bamboo.svg`          | low     |                                         |
| `character.svg`       | low     |                                         |
| `five-character.svg`  | medium  |                                         |
| `eight-character.svg` | medium  |                                         |
| `east-wind.svg`       | medium  |                                         |
| `white-dragon.svg`    | high    |                                         |
| `green-dragon.svg`    | high    |                                         |
| `red-dragon.svg`      | high    |                                         |
| `wild-dragon.svg`     | special | Golden Dragon **Wild**                  |
| `lotus-scatter.svg`   | special | Lotus **Scatter** (triggers Free Spins) |

**Rules for every symbol** (so the board always looks consistent):

- Transparent background, identical canvas size and the same tile silhouette.
- Recommended canvas: **240 × 264 px** (aspect ratio 120 : 132). SVG `viewBox="0 0 120 132"` is
  what the placeholders use. For PNG/WebP export at **2× = 480 × 528 px** (or 240 × 264 minimum).
- Keep ~6 px of transparent margin around the tile for the drop shadow.
- The game draws tiles at 116 × 128 px inside 124 × 134 px cells (design resolution 860 × 740),
  then scales the whole canvas to fit the screen.

### Replace a symbol with another SVG

Overwrite the file, keeping the same name (e.g. `symbols/circle.svg`). Done – reload the page.

### Replace a symbol with PNG / WebP

1. Put the file in `symbols/` (e.g. `symbols/circle.png`, transparent, 480 × 528).
2. Register it in [`apps/web/src/game/assets.ts`](../../src/game/assets.ts):

   ```ts
   export const SYMBOL_ASSET_OVERRIDES = {
     circle: '/assets/symbols/circle.png',
   };
   ```

   Non-`.svg` files are loaded as images automatically.

If a file is missing or fails to load, the game logs a warning and draws a simple fallback tile –
it never crashes.

---

## 2. Backgrounds (`backgrounds/`)

| File                | Used for                                     |
| ------------------- | -------------------------------------------- |
| `palace-normal.svg` | Landing page, login pages and the base game  |
| `palace-free.svg`   | Free Spins (cross-fades over the normal one) |

- Recommended size **1920 × 1080** (16 : 9); use `2560 × 1440` for crisp 1440p/4K screens.
  Backgrounds are scaled with `object-fit: cover`, so keep important detail away from the very edges.
- **Keep the centre dark and uncluttered** – the Mahjong grid sits there. Put decoration at the edges.
- Both files must share the same architecture so the Free Spins transformation looks like the
  _same palace_ with different lighting.
- To use PNG/WebP/JPG instead, drop the files in this folder and change the two `src` attributes
  in [`apps/web/src/components/PalaceBackground.tsx`](../../src/components/PalaceBackground.tsx).

---

## 3. The Golden Dragon (`effects/dragon.svg`)

The long dragon that sweeps across the board during **Dragon Fortune**.

- Recommended size **1400 × 360 px**, transparent, **horizontal, head on the right**, facing right.
- The body is expected to run left → right; the head end is used as the lightning origin
  (`DragonEffect.ts`, `head` offset ≈ 255 px right of the image centre at 0.62 scale).
- To swap the artwork keep the file name, or change `ASSET_PATHS.dragon` in
  [`apps/web/src/game/config.ts`](../../src/game/config.ts) and the size in
  `PreloadScene.ts`.
- Other effect files: `glow.svg` (256 × 256 soft radial glow used additively) and `particle.svg`
  (64 × 64 golden spark).
- Small dragon icon shown next to the Dragon meter: `ui/dragon-icon.svg` (128 × 128).

---

## 4. UI (`ui/`)

| File                | Where it is used                                        |
| ------------------- | ------------------------------------------------------- |
| `logo.svg`          | Standalone logo file (the site uses an HTML/CSS logo)   |
| `dragon-icon.svg`   | Favicon, Dragon meter, logo ornament                    |
| `spin-ornament.svg` | Ring that rotates around the SPIN button while spinning |

The on-page logo is built from HTML/CSS in `components/Logo.tsx` using the free, bundled
**Cinzel** font (SIL Open Font License) – no paid fonts are required.

---

## 5. Audio (`audio/`)

The game ships with **original placeholder sounds** (simple synthesised tones, chimes and a short
pentatonic melody) generated by `npm run audio:generate`. They are only placeholders: replace any
file with your own (same name) for a finished sound. Audio is **optional**: if a file is missing the
game stays fully playable and silent.

> Running `npm run audio:generate` again overwrites every file below, including ones you replaced.

Put files in this folder using **exactly these names**. The game tries `.mp3`, then `.ogg`, then `.wav`:

| Name             | When it plays                     | Type                             |
| ---------------- | --------------------------------- | -------------------------------- |
| `bgm-main`       | Base game background music        | loop, calm                       |
| `bgm-free-spins` | Free Spins background music       | loop, more energetic             |
| `button`         | Buttons / bet changes             | short click                      |
| `spin`           | A spin starts                     | whoosh                           |
| `tile-drop`      | Tiles land (throttled)            | soft clack                       |
| `cascade`        | Second and later winning cascades | rising chime                     |
| `win`            | A win                             | chime                            |
| `big-win`        | BIG / MEGA / EPIC WIN             | fanfare                          |
| `wild`           | Dragon strikes a tile → Wild      | zap / gong                       |
| `scatter`        | Lotus scatters trigger            | shimmer                          |
| `dragon-fortune` | Dragon Fortune starts             | dramatic hit                     |
| `free-spins`     | FREE SPINS banner                 | fanfare                          |
| `anticipation`   | Two Lotus showing: "one more…"    | heartbeat + rising tension, ~2 s |

Example: `apps/web/public/assets/audio/win.mp3`.

Tips: keep effects under ~2 s, normalise loudness, loop points must be seamless for the two
`bgm-*` files. Browsers only start audio after a click or key press; the game starts the music on the first one.
Royalty-free sources: your own recordings, or CC0 libraries such as
[freesound.org](https://freesound.org) (check each licence) and [opengameart.org](https://opengameart.org).

---

## Licensing note

Everything in this folder was created for this project. Do not add artwork or audio you do not
have the rights to use.
