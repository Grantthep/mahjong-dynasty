import { expect, type Page } from '@playwright/test';

/** Opens the site (which IS the game) and waits until the canvas and the controls are ready. */
export async function openGame(page: Page) {
  // Big-win banners block the next spin until dismissed; click through them automatically.
  await page.addLocatorHandler(page.getByText('Click to continue'), async (banner) => {
    await banner.click();
  });
  await page.goto('/');
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

/** The guest player this browser was given (the server creates it on the first visit). */
export async function currentPlayer(page: Page): Promise<{ id: string; username: string }> {
  const res = await page.request.get('/api/auth/me');
  expect(res.status()).toBe(200);
  return (await res.json()).user;
}
