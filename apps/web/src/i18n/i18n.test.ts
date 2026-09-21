import { describe, expect, it } from 'vitest';
import { REGULAR_SYMBOLS, SYMBOL_IDS } from '@mahjong/shared';
import { translate } from './index';
import { en, zh } from './translations';

describe('i18n', () => {
  it('provides every English key in Chinese, and nothing extra', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps the same {placeholders} in every language', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(zh[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('has no empty translations', () => {
    for (const value of [...Object.values(en), ...Object.values(zh)]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it('names every symbol', () => {
    for (const id of SYMBOL_IDS) expect(en[`symbol.${id}`]).toBeTruthy();
    expect(REGULAR_SYMBOLS.length).toBeGreaterThan(0);
  });

  it('fills placeholders and switches language', () => {
    expect(translate('en', 'hud.left', { count: 7 })).toBe('7 left');
    expect(translate('zh', 'hud.left', { count: 7 })).toBe('剩余 7 次');
    expect(translate('en', 'hud.left')).toBe('{count} left');
  });
});
