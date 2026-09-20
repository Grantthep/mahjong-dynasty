import { GRID_COLS, GRID_ROWS } from '@mahjong/shared';

/** Phaser "design" resolution. The canvas is scaled (FIT) to whatever space the page gives it. */
export const GAME_W = 860;
export const GAME_H = 740;

export const COLS = GRID_COLS;
export const ROWS = GRID_ROWS;

export const TILE_W = 116;
export const TILE_H = 128;
export const CELL_W = 124;
export const CELL_H = 134;
export const BOARD_W = COLS * CELL_W;
export const BOARD_H = ROWS * CELL_H;
export const BOARD_X = (GAME_W - BOARD_W) / 2;
export const BOARD_Y = 100;

export const METER_Y = 46;
export const MULTIPLIER_Y = 686;

export const FONT_DISPLAY = 'Cinzel, Georgia, "Times New Roman", serif';

export const COLOR = {
  gold: 0xd6a84b,
  goldLight: 0xf2d27c,
  jadeDark: 0x0a2922,
  jade: 0x146b57,
  jadeLight: 0x258a70,
  red: 0xa52a2a,
  white: 0xffffff,
} as const;

export const CSS_COLOR = {
  gold: '#D6A84B',
  goldLight: '#F2D27C',
  ivory: '#F4EBD7',
  muted: '#B7B1A4',
  dark: '#061512',
} as const;

/** Texture keys for non-symbol artwork (files live in public/assets). */
export const TEXTURE = {
  particle: 'fx-particle',
  glow: 'fx-glow',
  dragon: 'fx-dragon',
  dragonIcon: 'ui-dragon-icon',
} as const;

export const ASSET_PATHS = {
  particle: '/assets/effects/particle.svg',
  glow: '/assets/effects/glow.svg',
  dragon: '/assets/effects/dragon.svg',
  dragonIcon: '/assets/ui/dragon-icon.svg',
} as const;

export const tileX = (col: number): number => BOARD_X + col * CELL_W + CELL_W / 2;
export const tileY = (row: number): number => BOARD_Y + row * CELL_H + CELL_H / 2;

/** Animation timings in milliseconds. */
export const TIMING = {
  dropIn: 340,
  colStagger: 70,
  rowStagger: 45,
  pulse: 520,
  remove: 240,
  fall: 300,
  stepPause: 140,
  dragonTravel: 3400,
} as const;
