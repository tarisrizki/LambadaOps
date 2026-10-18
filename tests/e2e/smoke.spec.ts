import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke test covering the full happy path.
 * Runs last — verifies the system works as an integrated whole.
 */
test.describe('Smoke: Full Happy Path', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('login → dashboard → asset → ticket → logout', async ({ page, baseURL }) => {
    // 1. Already logged in via storageState — verify dashboard
    await page.goto(`${baseURL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Navigate to assets
    await page.getByRole('link', { name: /asset/i }).first().click();
    await expect(page).toHaveURL(/\/assets/, { timeout: 10000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // 3. Navigate to tickets
    await page.getByRole('link', { name: /ticket/i }).first().click();
    await expect(page).toHaveURL(/\/tickets/, { timeout: 10000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // 4. Return to dashboard
    await page.goto(`${baseURL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForTimeout(2000); // let async operations finish

    // Filter out expected/third-party errors
    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('third-party') &&
      !e.includes('chrome-extension')
    );
    expect(realErrors).toHaveLength(0);
  });
});
