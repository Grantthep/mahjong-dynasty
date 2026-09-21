import { expect, test } from '@playwright/test';
import { ADMIN, loginByApi, registerByApi } from './helpers';

test.describe('admin dashboard', () => {
  test('a normal player is turned away', async ({ page }) => {
    await registerByApi(page);
    await page.goto('/admin');
    await expect(page.getByRole('alert')).toContainText('Administrator access required.');

    // The API refuses too, so hiding the page is not the only protection.
    const res = await page.request.get('/api/admin/analytics');
    expect(res.status()).toBe(403);
  });

  test('the administrator sees the analytics, the chart and the table view', async ({ page }) => {
    await loginByApi(page, ADMIN.email, ADMIN.password);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
    await expect(page.getByTestId('observed-return')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Spins per day' })).toBeVisible();
    // 14 days in the table view (+ header row) and no private data anywhere.
    await expect(page.getByRole('table').first().getByRole('row')).toHaveCount(15);
    await expect(page.getByRole('main')).not.toContainText('@');
  });
});
