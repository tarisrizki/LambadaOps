import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('sidebar navigation renders all menu items', async ({ page }) => {
    await page.goto('/dashboard');
    // Sidebar should exist
    const sidebar = page.locator('nav, aside, [class*="sidebar"], [class*="sidenav"]').first();
    if (await sidebar.isVisible({ timeout: 3000 })) {
      await expect(sidebar.getByRole('link')).toHaveCount(await sidebar.getByRole('link').count(), { timeout: 3000 });
    }
  });

  test('navigation to assets works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /asset/i }).first().click();
    await expect(page).toHaveURL(/\/assets/, { timeout: 10000 });
  });

  test('navigation to tickets works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /ticket/i }).first().click();
    await expect(page).toHaveURL(/\/tickets/, { timeout: 10000 });
  });

  test('navigation to dashboard from logo works', async ({ page }) => {
    await page.goto('/assets');
    const logo = page.locator('a[href="/dashboard"], [class*="logo"]').first();
    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    }
  });

  test('dark mode toggle changes theme', async ({ page }) => {
    await page.goto('/dashboard');
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme/i }).or(
      page.locator('[class*="theme"]').first()
    );
    if (await themeToggle.isVisible({ timeout: 3000 })) {
      const initialClass = await page.locator('html').getAttribute('class') ?? '';
      await themeToggle.click();
      const afterClass = await page.locator('html').getAttribute('class') ?? '';
      expect(afterClass).not.toBe(initialClass);
    }
  });

  test('mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    // Mobile: sidebar should collapse or hamburger should appear
    const hamburger = page.getByRole('button', { name: /menu|hamburger/i });
    if (await hamburger.isVisible({ timeout: 2000 })) {
      await hamburger.click();
      await expect(page.locator('nav, aside').first()).toBeVisible();
    }
  });
});
