import { test, expect } from '@playwright/test';

// Auth tests should not use the authenticated state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Auth Workflows', () => {
  test('User can register successfully', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/register');
    
    await page.fill('input[name="companyName"]', `Tenant ${ts}`);
    await page.fill('input[name="domain"]', `tenant-${ts}`);
    await page.fill('input[name="adminName"]', 'Admin');
    await page.fill('input[name="adminEmail"]', `new${ts}@example.com`);
    await page.fill('input[name="adminPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or login
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('User can login and logout', async ({ page, request }) => {
    // Create user via API first
    const ts = Date.now();
    const email = `login${ts}@example.com`;
    const slug = `test-${ts}`;
    
    await page.goto('/register');
    await page.fill('input[name="companyName"]', `Test ${ts}`);
    await page.fill('input[name="domain"]', slug);
    await page.fill('input[name="adminName"]', 'Tester');
    await page.fill('input[name="adminEmail"]', email);
    await page.fill('input[name="adminPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    await page.fill('input[name="companySlug"]', slug);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    
    // Test logout
    try {
      await page.locator('header .rounded-full').first().click({ timeout: 5000 });
    } catch (e) {
      throw new Error(`Avatar not found. URL: ${page.url()}`);
    }
    await page.click('text=Log out');

    await expect(page).toHaveURL(/\/login/);
  });
});
