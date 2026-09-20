/**
 * Every symbol that can appear on the board. The id doubles as the SVG file
 * name in apps/web/public/assets/symbols/<id>.svg
 */
export const SYMBOL_IDS = [
  'circle',
  'bamboo',
  'character',
  'five-character',
  'eight-character',
  'east-wind',
  'white-dragon',
  'green-dragon',
  'red-dragon',
  'wild-dragon',
  'lotus-scatter',
] as const;

export type SymbolId = (typeof SYMBOL_IDS)[number];

export const WILD_SYMBOL = 'wild-dragon' satisfies SymbolId;
export const SCATTER_SYMBOL = 'lotus-scatter' satisfies SymbolId;

/** Symbols that pay on their own (everything except Wild and Scatter). */
export const REGULAR_SYMBOLS = [
  'circle',
  'bamboo',
  'character',
  'five-character',
  'eight-character',
  'east-wind',
  'white-dragon',
  'green-dragon',
  'red-dragon',
] as const satisfies readonly SymbolId[];

export type RegularSymbolId = (typeof REGULAR_SYMBOLS)[number];

export type SymbolTier = 'low' | 'medium' | 'high' | 'special';

export interface SymbolMeta {
  id: SymbolId;
  name: string;
  tier: SymbolTier;
  /** Public URL of the artwork. Replace the file (same name) to re-skin the game. */
  asset: string;
}

const meta = (id: SymbolId, name: string, tier: SymbolTier): SymbolMeta => ({
  id,
  name,
  tier,
  asset: `/assets/symbols/${id}.svg`,
});

export const SYMBOL_META: Readonly<Record<SymbolId, SymbolMeta>> = {
  circle: meta('circle', 'Circle', 'low'),
  bamboo: meta('bamboo', 'Bamboo', 'low'),
  character: meta('character', 'Character', 'low'),
  'five-character': meta('five-character', 'Five Character', 'medium'),
  'eight-character': meta('eight-character', 'Eight Character', 'medium'),
  'east-wind': meta('east-wind', 'East Wind', 'medium'),
  'white-dragon': meta('white-dragon', 'White Dragon', 'high'),
  'green-dragon': meta('green-dragon', 'Green Dragon', 'high'),
  'red-dragon': meta('red-dragon', 'Red Dragon', 'high'),
  'wild-dragon': meta('wild-dragon', 'Golden Dragon Wild', 'special'),
  'lotus-scatter': meta('lotus-scatter', 'Lotus Scatter', 'special'),
};

export const isWild = (id: SymbolId): boolean => id === WILD_SYMBOL;
export const isScatter = (id: SymbolId): boolean => id === SCATTER_SYMBOL;
export const isRegularSymbol = (id: SymbolId): id is RegularSymbolId =>
  id !== WILD_SYMBOL && id !== SCATTER_SYMBOL;
