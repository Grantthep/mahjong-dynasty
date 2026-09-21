import { expect, type Page } from '@playwright/test';

export const ADMIN = { email: 'admin@mahjong.local', password: 'Admin1234!' };

let counter = 0;

/** A unique player so tests never depend on each other or on earlier runs. */
export function newPlayer() {
  const id = `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    email: `e2e_${id}@example.com`,
    username: `e2e_${id}`.slice(0, 20),
    password: 'CorrectHorse42',
  };
}

/** Registers through the API; the browser context keeps the auth cookie. */
export async function registerByApi(page: Page) {
  const player = newPlayer();
  const res = await page.request.post('/api/auth/register', { data: player });
  expect(res.status(), await res.text()).toBe(201);
  return player;
}

export async function loginByApi(page: Page, email: string, password: string) {
  const res = await page.request.post('/api/auth/login', { data: { email, password } });
  expect(res.status(), await res.text()).toBe(200);
}

/** Opens the game and waits until the canvas and the controls are ready. */
export async function openGame(page: Page) {
  // Big-win banners block the next spin until dismissed; click through them automatically.
  await page.addLocatorHandler(page.getByText('Click to continue'), async (banner) => {
    await banner.click();
  });
  await page.goto('/game');
  await expect(page.getByTestId('game-canvas-host').locator('canvas')).toBeVisible({
    timeout: 30_000,
  });
  await expect(spinButton(page)).toBeEnabled({ timeout: 30_000 });
}

export const spinButton = (page: Page) => page.getByRole('button', { name: 'Spin', exact: true });

export const hudStatus = (page: Page) =>
  page.getByRole('region', { name: 'Game controls' }).getByRole('status');

/** Reads the balance shown in the HUD as a number. */
export async function shownBalance(page: Page): Promise<number> {
  const text = (await page.getByTestId('balance-value').textContent()) ?? '';
  return Number(text.replace(/,/g, ''));
}

/** Waits until the current spin (animation, banners, Free Spins) has completely finished. */
export async function waitForSpinToFinish(page: Page) {
  await expect(spinButton(page)).toBeEnabled({ timeout: 60_000 });
}
