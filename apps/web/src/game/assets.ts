import { SYMBOL_META, type SymbolId } from '@mahjong/shared';

/**
 * To re-skin a symbol with your own artwork you can either overwrite the SVG in
 * public/assets/symbols/ (same file name), or use PNG/WebP and register it here:
 *
 *   export const SYMBOL_ASSET_OVERRIDES = { circle: '/assets/symbols/circle.png' };
 *
 * See public/assets/README.md for recommended sizes.
 */
export const SYMBOL_ASSET_OVERRIDES: Partial<Record<SymbolId, string>> = {};

export const symbolAssetUrl = (id: SymbolId): string =>
  SYMBOL_ASSET_OVERRIDES[id] ?? SYMBOL_META[id].asset;

export const isVectorAsset = (url: string): boolean => url.toLowerCase().endsWith('.svg');
