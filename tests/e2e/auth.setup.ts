import { test as setup, expect } from '@playwright/test';

/**
 * Global authentication setup.
 * Runs once before all authenticated tests.
 * Uses storageState to persist login session across test files.
 */
setup('create authenticated session', async ({ page, baseURL }) => {
  const base = baseURL ?? 'http://localhost:3000';

  await page.goto(`${base}/login`);

  // Fill login form
  const companySlug = process.env.E2E_COMPANY_SLUG ?? 'lambada-demo';
  const email = process.env.E2E_EMAIL ?? 'admin@lambadademo.onmicrosoft.com';
  const password = process.env.E2E_PASSWORD ?? 'TestPassword123!';

  await page.getByLabel('Company Slug').fill(companySlug);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  // Verify the auth session is active
  await expect(page.getByText(/dashboard/i)).toBeVisible({ timeout: 10000 });
});
