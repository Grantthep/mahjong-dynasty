import { expect, test } from '@playwright/test';
import {
  hudStatus,
  newPlayer,
  openGame,
  registerByApi,
  shownBalance,
  spinButton,
  waitForSpinToFinish,
} from './helpers';

test.describe('playing the game', () => {
  test('a new player registers, spins, and the balance matches the server', async ({ page }) => {
    const player = newPlayer();
    await page.goto('/register');
    await page.getByLabel('Email').fill(player.email);
    await page.getByLabel('Username').fill(player.username);
    await page.getByLabel('Password').fill(player.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/game$/);

    await openGame(page);
    await expect(page.getByTestId('balance-value')).toHaveText('10,000');
    await expect(page.getByText('DEMO MODE · DEMO CREDITS ONLY')).toBeVisible();

    await page.getByRole('button', { name: 'TURBO' }).click();
    await spinButton(page).click();
    await waitForSpinToFinish(page);

    // What the screen shows is what the server holds (the browser never decides a result).
    const state = await (await page.request.get('/api/game/state')).json();
    expect(await shownBalance(page)).toBe(state.balance);
    expect(state.balance).toBeLessThan(10_000 + 20 * 5000);

    const history = await (await page.request.get('/api/game/history?limit=5')).json();
    expect(history.spins.length).toBeGreaterThanOrEqual(1);
    expect(history.spins[0].bet).toBe(20);
  });

  test('the bet can be changed and there is no skip button', async ({ page }) => {
    await registerByApi(page);
    await openGame(page);

    await page.getByRole('button', { name: 'Increase bet' }).click();
    await expect(page.getByTestId('bet-value')).toHaveText('50');

    await spinButton(page).click();
    await expect(page.getByRole('button', { name: 'SKIP' })).toHaveCount(0);
    await waitForSpinToFinish(page);

    const history = await (await page.request.get('/api/game/history?limit=1')).json();
    expect(history.spins[0].bet).toBe(50);
  });

  test('one button starts auto spin and stops it again', async ({ page }) => {
    await registerByApi(page);
    await openGame(page);
    await page.getByRole('button', { name: 'TURBO' }).click();
    const spinCount = async () =>
      (await (await page.request.get('/api/game/history?limit=50')).json()).spins.length as number;

    // There is no separate pause / resume control any more.
    await expect(page.getByRole('button', { name: 'PAUSE' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'RESUME' })).toHaveCount(0);

    await page.getByRole('combobox', { name: 'Number of auto spins' }).selectOption('25');
    await page.getByRole('button', { name: 'AUTO SPIN' }).click();
    await expect(hudStatus(page)).toContainText('AUTO SPIN ON');
    await expect(hudStatus(page)).toContainText('left');

    // It keeps spinning by itself.
    await expect.poll(spinCount, { timeout: 45_000 }).toBeGreaterThanOrEqual(3);

    // The same button stops it: the current spin finishes and nothing else is played.
    await page.getByRole('button', { name: 'STOP AUTO' }).click();
    await expect(page.getByRole('button', { name: 'AUTO SPIN' })).toBeVisible();
    await waitForSpinToFinish(page);
    const whenStopped = await spinCount();
    await page.waitForTimeout(2500);
    expect(await spinCount()).toBe(whenStopped);
  });
});

test.describe('menus and pages', () => {
  test('the paytable shows the credits for the chosen bet', async ({ page }) => {
    await registerByApi(page);
    const config = await (await page.request.get('/api/game/config')).json();
    await openGame(page);

    await page.getByRole('button', { name: 'Paytable' }).click();
    const dialog = page.getByRole('dialog', { name: 'Paytable' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: '100', exact: true }).click();
    const expected = Number((config.paytable['red-dragon']['6'] * 100).toFixed(2));
    await expect(dialog.getByTestId('pay-red-dragon-6')).toHaveText(String(expected));

    await dialog.getByRole('button', { name: '10', exact: true }).click();
    const cheap = Number((config.paytable['red-dragon']['6'] * 10).toFixed(2));
    await expect(dialog.getByTestId('pay-red-dragon-6')).toHaveText(String(cheap));
  });

  test('the language can be switched to Chinese and is remembered', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('A mystical Mahjong adventure awaits.')).toBeVisible();

    await page.getByRole('combobox', { name: 'Language' }).selectOption('zh');
    await expect(page.getByText('一场神秘的麻将冒险正等着你。')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await page.reload();
    await expect(page.getByText('一场神秘的麻将冒险正等着你。')).toBeVisible();

    await page.getByRole('combobox', { name: '语言' }).selectOption('en');
    await expect(page.getByText('A mystical Mahjong adventure awaits.')).toBeVisible();
  });

  test('the leaderboard is for signed-in players and lists usernames only', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page).toHaveURL(/\/login$/);

    const player = await registerByApi(page);
    await page.goto('/leaderboard');
    await expect(page.getByRole('heading', { name: 'Top demo wins' })).toBeVisible();
    await page.getByRole('button', { name: 'Last 24 hours' }).click();
    await expect(page.getByRole('button', { name: 'Last 24 hours' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('main')).not.toContainText(player.email);
  });
});
