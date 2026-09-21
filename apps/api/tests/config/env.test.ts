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

  it('requires a strong random secret in production', () => {
    expect(() =>
      parseEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: 'short-secret-1234' }),
    ).toThrow(/JWT_SECRET/);
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).not.toThrow();
  });
});
