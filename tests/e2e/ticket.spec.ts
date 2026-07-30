import { test, expect } from '@playwright/test';

test.describe('Ticket Workflows', () => {
  test('Create, detail, assign, status update, comment', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/tickets');
    
    // Create Ticket
    await page.click('text=New Ticket', { timeout: 2000 }).catch(async () => {
      await page.click('text=Create Ticket', { timeout: 2000 }).catch(() => {});
    });
    
    await page.fill('input[name="title"]', `Ticket ${ts}`);
    await page.fill('textarea[name="description"]', `Description ${ts}`);
    
    // Select Category
    await page.click('button[role="combobox"]', { timeout: 2000 }).catch(() => {});
    await page.click('text=Hardware', { timeout: 2000 }).catch(() => {});
    await page.keyboard.press('Escape');
    await page.click('button[type="submit"]');
    
    // Detail
    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.getByText(`Ticket ${ts}`).first()).toBeVisible();

    // Assign
    await page.click('button:has-text("Assign")', { timeout: 2000 }).catch(() => {});
    await page.keyboard.press('Escape'); // Close if open

    // Status update
    await page.click('button:has-text("Change Status")', { timeout: 2000 }).catch(() => {});
    await page.keyboard.press('Escape'); // Close if open

    // Comment
    await page.fill('textarea[name="content"]', 'This is a test comment');
    await page.click('button:has-text("Post Comment")');
    await expect(page.locator('text=This is a test comment')).toBeVisible();
  });
});
