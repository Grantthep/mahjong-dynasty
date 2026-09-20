import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/setup/global.ts'],
    setupFiles: ['tests/setup/env.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
