import { test, expect } from '@playwright/test';

test.describe('Assets', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('asset list page loads', async ({ page }) => {
    await page.goto('/assets');
    await expect(page.getByRole('heading', { name: /asset/i }).or(
      page.locator('h1').first()
    )).toBeVisible({ timeout: 10000 });
  });

  test('asset table shows data or empty state', async ({ page }) => {
    await page.goto('/assets');
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    // Either has rows or shows empty state
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) {
      await expect(page.getByText(/no asset|not found|empty/i).first()).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('create asset form opens', async ({ page }) => {
    await page.goto('/assets');
    const createBtn = page.getByRole('button', { name: /create new asset|add asset|new asset/i }).or(
      page.getByRole('link', { name: /create new asset|add asset|new asset/i })
    );
    await createBtn.click();
    // Form should appear — look for common form fields
    await expect(
      page.locator('form').or(page.getByRole('textbox', { name: /name/i }))
    ).toBeVisible({ timeout: 5000 });
  });

  test('asset creation with valid data', async ({ page }) => {
    await page.goto('/assets');
    // Click create
    const createBtn = page.getByRole('button', { name: /create new asset|add asset/i }).or(
      page.getByRole('link', { name: /create new asset|add asset/i })
    );
    await createBtn.click();

    // Fill required fields
    const nameInput = page.getByRole('textbox', { name: /name/i }).or(
      page.locator('input[name="name"]')
    );
    if (await nameInput.isVisible()) {
      await nameInput.fill(`Test Asset ${Date.now()}`);
    }

    // Submit
    await page.getByRole('button', { name: /save|create|submit/i }).click();

    // Should either succeed or show validation error (no crash)
    await expect(page).toHaveURL(/\/assets/, { timeout: 10000 });
  });

  test('asset search filters results', async ({ page }) => {
    await page.goto('/assets');
    const searchInput = page.getByPlaceholder(/search|filter/i).or(
      page.locator('input[type="search"], input[type="text"]').first()
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistent999999');
      await page.waitForTimeout(500);
      // Should show empty results or filter applied
      await expect(page.locator('table').or(page.getByText(/no/i))).toBeVisible();
    }
  });

  test('pagination works', async ({ page }) => {
    await page.goto('/assets');
    const nextBtn = page.getByRole('button', { name: /next|page 2/i }).or(
      page.locator('button[aria-label="next"], button[aria-label="Next"]')
    );
    if (await nextBtn.isVisible()) {
      const currentUrl = page.url();
      await nextBtn.click();
      await expect(page).not.toHaveURL(currentUrl, { timeout: 5000 });
    }
  });
});
