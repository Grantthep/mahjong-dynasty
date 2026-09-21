import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(40),
};

describe('parseEnv', () => {
  it('does not trust a proxy unless asked to', () => {
    expect(parseEnv({ ...base }).TRUST_PROXY).toBe(0);
  });

  it('reads the number of trusted proxies', () => {
    expect(parseEnv({ ...base, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
  });

  it('rejects a nonsense proxy count', () => {
    expect(() => parseEnv({ ...base, TRUST_PROXY: '-1' })).toThrow(/TRUST_PROXY/);
    expect(() => parseEnv({ ...base, TRUST_PROXY: 'lots' })).toThrow(/TRUST_PROXY/);
  });

  it('has sensible default rate limits and lets them be raised', () => {
    const defaults = parseEnv({ ...base });
    expect(defaults.RATE_LIMIT_SPINS_PER_MIN).toBe(120);
    expect(defaults.RATE_LIMIT_NEW_GUESTS_PER_15_MIN).toBe(30);
    expect(defaults.RATE_LIMIT_REQUESTS_PER_MIN).toBe(300);

    const raised = parseEnv({ ...base, RATE_LIMIT_SPINS_PER_MIN: '600' });
    expect(raised.RATE_LIMIT_SPINS_PER_MIN).toBe(600);
    expect(() => parseEnv({ ...base, RATE_LIMIT_SPINS_PER_MIN: '0' })).toThrow(/RATE_LIMIT/);
  });

  it('requires a strong random secret in production', () => {
    expect(() =>
      parseEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: 'short-secret-1234' }),
    ).toThrow(/JWT_SECRET/);
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).not.toThrow();
  });
});
