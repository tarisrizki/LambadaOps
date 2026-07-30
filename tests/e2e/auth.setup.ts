import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, request }) => {
  const ts = Date.now();
  const email = `e2e${ts}@example.com`;
  await page.goto('/register');
  await page.fill('input[name="companyName"]', `Test Company ${ts}`);
  await page.fill('input[name="domain"]', `test-company-${ts}`);
  await page.fill('input[name="adminName"]', 'E2E Tester');
  await page.fill('input[name="adminEmail"]', email);
  await page.fill('input[name="adminPassword"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait a moment for validation or request
  await page.waitForTimeout(2000);
  const errors = await page.locator('.text-destructive').allTextContents();
  console.log("Form Errors:", errors);
  
  // Should redirect to login
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

  // Login
  await page.fill('input[name="companySlug"]', `test-company-${ts}`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  
  // Save auth state
  await page.context().storageState({ path: authFile });
});
