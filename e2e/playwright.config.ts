import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests drive the real web app and API in a real browser.
 *
 *   npm run test:e2e                      starts (or reuses) `npm run dev` on :5173 / :4000
 *   E2E_BASE_URL=http://localhost:8080 npm run test:e2e   test an already running deployment
 *   PW_CHANNEL=msedge npm run test:e2e    use an installed Edge/Chrome instead of downloading one
 *
 * They need PostgreSQL with migrations applied and the demo administrator seeded
 * (`npm run db:seed -- --admin-only`).
 */
const external = process.env.E2E_BASE_URL;
const baseURL = external ?? 'http://localhost:5173';
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // One worker: every test registers its own account, and the API rate-limits logins per IP.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // The game speaks English unless the browser says otherwise; keep tests deterministic.
    locale: 'en-US',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel } }],
  webServer: external
    ? undefined
    : {
        command: 'npm run dev',
        cwd: '..',
        // Going through the Vite proxy proves both the web app and the API are up.
        url: 'http://localhost:5173/api/health',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
