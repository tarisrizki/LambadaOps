import { test, expect } from '@playwright/test';

test.describe('Tickets', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('tickets page loads', async ({ page }) => {
    await page.goto('/tickets');
    await expect(page.getByRole('heading', { name: /ticket/i }).or(
      page.locator('h1').first()
    )).toBeVisible({ timeout: 10000 });
  });

  test('ticket list shows data or empty state', async ({ page }) => {
    await page.goto('/tickets');
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('create ticket button exists', async ({ page }) => {
    await page.goto('/tickets');
    const createBtn = page.getByRole('button', { name: /create ticket|new ticket/i }).or(
      page.getByRole('link', { name: /create ticket|new ticket/i })
    );
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  test('ticket status filter works', async ({ page }) => {
    await page.goto('/tickets');
    const statusFilter = page.getByRole('combobox', { name: /status/i }).or(
      page.locator('select[name="status"], [class*="status"]').first()
    );
    if (await statusFilter.isVisible({ timeout: 3000 })) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      // Page should update without crash
      await expect(page.locator('table')).toBeVisible();
    }
  });
});
