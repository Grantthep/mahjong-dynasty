import { expect, test, type Page } from '@playwright/test';
import {
  currentPlayer,
  hudStatus,
  openGame,
  shownBalance,
  spinButton,
  waitForSpinToFinish,
} from './helpers';

test.describe('a visitor becomes a guest player and plays', () => {
  test('the site opens straight into the game, with no login or sign-up', async ({ page }) => {
    await openGame(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('balance-value')).toHaveText('10,000');
    await expect(page.getByText('DEMO MODE · DEMO CREDITS ONLY')).toBeVisible();

    // Nothing to sign in to: no such buttons or links anywhere on the page or in the menu.
    const forbidden = /log ?in|log ?out|sign ?(in|up)|register|enter game/i;
    await expect(page.getByRole('link', { name: forbidden })).toHaveCount(0);
    await expect(page.getByRole('button', { name: forbidden })).toHaveCount(0);
    await page.getByRole('button', { name: 'Settings' }).click();
    const settings = page.getByRole('dialog', { name: 'Settings' });
    await expect(settings.getByText(/^Playing as Guest\d{4,6}$/)).toBeVisible();
    await expect(settings.getByRole('button', { name: forbidden })).toHaveCount(0);
    await expect(settings.getByRole('link', { name: forbidden })).toHaveCount(0);
  });

  test('the login, register, admin and old /game addresses are gone', async ({ page }) => {
    for (const path of ['/login', '/register', '/admin']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Lost in the palace' }), path).toBeVisible();
    }
    for (const path of ['/api/auth/login', '/api/auth/register', '/api/admin/analytics']) {
      expect((await page.request.get(path)).status(), path).toBe(404);
    }
    // The old game address still works and lands on the game.
    await page.goto('/game');
    await expect(page).toHaveURL(/\/$/);
  });

  test('a guest keeps the same player after reloading; a new browser is a new guest', async ({
    page,
    browser,
  }) => {
    await openGame(page);
    const before = await currentPlayer(page);

    await page.reload();
    await expect(page.getByTestId('balance-value')).toBeVisible();
    expect(await currentPlayer(page)).toEqual(before);

    // A different browser (no cookie) gets a different guest.
    const other = await browser.newContext();
    const res = await other.request.post('/api/auth/guest');
    expect(res.status()).toBe(201);
    expect((await res.json()).user.id).not.toBe(before.id);
    await other.close();
  });

  test('spins, and the balance on screen matches the server', async ({ page }) => {
    await openGame(page);
    await page.getByRole('button', { name: 'TURBO' }).click();
    await spinButton(page).click();
    await waitForSpinToFinish(page);

    // What the screen shows is what the server holds (the browser never decides a result).
    const state = await (await page.request.get('/api/game/state')).json();
    expect(await shownBalance(page)).toBe(state.balance);

    const history = await (await page.request.get('/api/game/history?limit=5')).json();
    expect(history.spins.length).toBeGreaterThanOrEqual(1);
    expect(history.spins[0].bet).toBe(20);
  });

  test('the bet can be changed and there is no skip button', async ({ page }) => {
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
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: 'About Mahjong Dynasty' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Language' }).selectOption('zh');
    await expect(page.getByRole('heading', { name: '关于麻将王朝' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await page.reload();
    await expect(page.getByRole('heading', { name: '关于麻将王朝' })).toBeVisible();

    await page.getByRole('combobox', { name: '语言' }).selectOption('en');
    await expect(page.getByRole('heading', { name: 'About Mahjong Dynasty' })).toBeVisible();
  });

  test('the leaderboard and profile work for a guest and show usernames only', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.getByRole('heading', { name: 'Top demo wins' })).toBeVisible();
    await page.getByRole('button', { name: 'Last 24 hours' }).click();
    await expect(page.getByRole('button', { name: 'Last 24 hours' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('main')).not.toContainText('@');

    const player = await currentPlayer(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: player.username })).toBeVisible();
    await expect(page.getByRole('main')).not.toContainText('@');
  });
});

test.describe('sound', () => {
  const SOUNDS = [
    'bgm-main',
    'bgm-free-spins',
    'button',
    'spin',
    'tile-drop',
    'cascade',
    'win',
    'big-win',
    'wild',
    'scatter',
    'dragon-fortune',
    'free-spins',
    'anticipation',
  ];

  test('the browser can decode every sound file', async ({ page }) => {
    await page.goto('/about');
    const durations = await page.evaluate(async (names) => {
      const load = (name: string) =>
        new Promise<number>((resolve) => {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.oncanplaythrough = () => resolve(audio.duration);
          audio.onerror = () => resolve(-1);
          audio.src = `/assets/audio/${name}.wav`;
          audio.load();
        });
      const result: Record<string, number> = {};
      for (const name of names) result[name] = await load(name);
      return result;
    }, SOUNDS);

    for (const name of SOUNDS) {
      expect(durations[name], `${name} could not be decoded`).toBeGreaterThan(0.05);
    }
    expect(durations['bgm-main']).toBeGreaterThan(10);
  });

  test('entering the game fetches the background music', async ({ page }) => {
    // The game looks for .mp3, then .ogg, then .wav, so a 404 for the first two is normal; what
    // matters is that one of the formats is found.
    const music = page.waitForResponse(
      (res) => /\/assets\/audio\/bgm-main\.(wav|mp3|ogg)$/.test(res.url()) && res.ok(),
    );
    await openGame(page);
    expect((await music).ok()).toBe(true);

    // A spin plays effects; the shipped .wav files must all be found.
    const failures: string[] = [];
    page.on('response', (res) => {
      if (/\/assets\/audio\/[\w-]+\.wav$/.test(res.url()) && !res.ok()) failures.push(res.url());
    });
    await spinButton(page).click();
    await waitForSpinToFinish(page);
    expect(failures).toEqual([]);
  });
});

test.describe('suspense when two Lotus are showing', () => {
  /** Turns the next spin into one with exactly two Lotus and no win, whatever the server rolled. */
  async function forceTwoLotus(page: Page) {
    await page.route('**/api/game/spin', async (route) => {
      const response = await route.fetch();
      const real = await response.json();
      const plain = [
        'circle',
        'bamboo',
        'character',
        'east-wind',
        'five-character',
        'eight-character',
      ];
      const board = Array.from({ length: 6 }, (_, col) =>
        Array.from({ length: 4 }, (_, row) => plain[(col + row) % plain.length]),
      );
      board[0]![1] = 'lotus-scatter';
      board[1]![2] = 'lotus-scatter';
      await route.fulfill({
        response,
        json: {
          ...real,
          initialBoard: board,
          finalBoard: board,
          cascades: [],
          wildReelRespin: null,
          totalWin: 0,
          bigWinTier: 'none',
          scatterCount: 2,
          scatterPositions: [
            { col: 0, row: 1 },
            { col: 1, row: 2 },
          ],
          freeSpinsAwarded: 0,
          freeSpinsRetriggered: false,
          freeSpinsCompleted: false,
          freeSpinsWinTotal: 0,
          dragonFortuneTriggers: 0,
          dragonMeterAfter: real.dragonMeterBefore,
          balanceAfter: real.balanceBefore - real.bet,
          session: {
            dragonMeter: real.dragonMeterBefore,
            freeSpinsRemaining: 0,
            freeSpinsTotal: 0,
            freeSpinBet: 0,
            freeSpinsWin: 0,
          },
        },
      });
    });
  }

  test('hunts for the last Lotus, announces it, then goes back to normal', async ({
    page,
  }, testInfo) => {
    await forceTwoLotus(page);
    await openGame(page);
    const game = page.locator('[data-hunting]');
    await expect(game).toHaveAttribute('data-hunting', 'false');

    await spinButton(page).click();
    await expect(game).toHaveAttribute('data-hunting', 'true', { timeout: 20_000 });
    await expect(page.getByRole('status').filter({ hasText: 'ONE MORE LOTUS…' })).toHaveCount(1);

    // Keep a picture of the moment (attached to the test report; handy to look at).
    await page.waitForTimeout(600);
    const picture = testInfo.outputPath('hunting.png');
    await page.screenshot({ path: picture });
    await testInfo.attach('hunting', { path: picture, contentType: 'image/png' });

    // The hunt ends by itself and the game is playable again.
    await expect(game).toHaveAttribute('data-hunting', 'false', { timeout: 20_000 });
    await waitForSpinToFinish(page);
    await expect(page.getByRole('status').filter({ hasText: 'ONE MORE LOTUS…' })).toHaveCount(0);
  });

  test('says it in Chinese too', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mjd.lang', 'zh'));
    await forceTwoLotus(page);
    await page.goto('/');
    await expect(page.getByTestId('game-canvas-host').locator('canvas')).toBeVisible({
      timeout: 30_000,
    });
    const spin = page.getByRole('button', { name: '旋转', exact: true });
    await expect(spin).toBeEnabled({ timeout: 30_000 });
    await spin.click();
    await expect(page.getByRole('status').filter({ hasText: '再来一朵莲花…' })).toHaveCount(1, {
      timeout: 20_000,
    });
  });
});
