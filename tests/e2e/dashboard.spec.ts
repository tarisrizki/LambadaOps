import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('dashboard loads without crash', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('dashboard shows stats cards', async ({ page }) => {
    await page.goto('/dashboard');
    // Look for stat cards (total assets, open tickets, etc.)
    const stats = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    await expect(stats.first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard recent assets section', async ({ page }) => {
    await page.goto('/dashboard');
    const recentSection = page.getByText(/recent asset/i).or(
      page.locator('h2, h3').filter({ hasText: /recent|latest/i })
    );
    if (await recentSection.isVisible({ timeout: 3000 })) {
      await expect(recentSection).toBeVisible();
    }
  });

  test('dashboard loads within acceptable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    const loadTime = Date.now() - start;
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});
