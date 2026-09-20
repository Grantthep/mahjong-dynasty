import { describe, expect, it } from 'vitest';
import { clamp, formatCredits, formatMultiplier, uuid } from './format';

describe('format utils', () => {
  it('formats demo credits with separators and no currency symbol', () => {
    expect(formatCredits(0)).toBe('0');
    expect(formatCredits(10000)).toBe('10,000');
    expect(formatCredits(1234567)).toBe('1,234,567');
    expect(formatCredits(12.6)).toBe('13');
  });

  it('formats multipliers', () => {
    expect(formatMultiplier(8)).toBe('×8');
  });

  it('clamps values', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it('creates UUID v4 strings', () => {
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuid()).not.toBe(uuid());
  });
});
