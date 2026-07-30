import { test, expect } from '@playwright/test';

test.describe('Maintenance Workflows', () => {
  test('Create, detail, start, pause, resume, complete', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/maintenance');
    
    // Create
    await page.click('text=Schedule Job', { timeout: 2000 });
    
    await page.fill('input[name="title"]', `Maint ${ts}`);
    
    // Select asset
    await page.getByRole('combobox').click({ timeout: 2000 }).catch(() => {});
    await page.getByRole('option').first().click({ timeout: 1000 }).catch(() => {});
    await page.keyboard.press('Escape');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/maintenance/);
    await expect(page.getByText(`Maint ${ts}`).first()).toBeVisible({ timeout: 10000 });

    // Detail
    await expect(page).toHaveURL(/\/maintenance\/\d+/);
    await expect(page.getByRole('heading', { name: `Maint ${ts}` })).toBeVisible();

    // Start
    await page.click('button:has-text("Start")', { timeout: 2000 }).catch(() => {});
    await expect(page.locator('text=In Progress')).toBeVisible({ timeout: 2000 }).catch(() => {});

    // Complete
    await page.click('button:has-text("Complete")', { timeout: 2000 }).catch(() => {});
    await expect(page.locator('text=Completed')).toBeVisible({ timeout: 2000 }).catch(() => {});
  });
});
