import { test, expect } from '@playwright/test';

test.describe('Dashboard Workflows', () => {
  test('Dashboard loads successfully', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('FAILED URL:', response.url(), response.status());
      }
    });
    
    await page.goto('/dashboard');
    
    // Verify Dashboard heading or title
    try {
      await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 10000 });
    } catch (e) {
      throw new Error(`Dashboard heading not found. URL: ${page.url()}`);
    }
    
    // Verify navigation works
    await page.click('a[href="/assets"]');
    await expect(page).toHaveURL(/\/assets/);
  });
});
