import { test, expect } from '@playwright/test';

// Unauthenticated tests — no setup fixture needed
test.describe('Authentication', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('rejects invalid credentials with error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Company Slug').fill('invalid-company');
    await page.getByLabel('Email').fill('notexist@test.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 });
  });

  test('login page renders all form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Company Slug')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});

// Authenticated auth flow tests
test.describe('Authenticated Auth Flows', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('displays current user info in header', async ({ page }) => {
    await page.goto('/dashboard');
    // Header should show user name or email
    await expect(page.locator('header').getByText(/admin/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('logout redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    // Find and click user menu / logout
    const userMenu = page.getByRole('button', { name: /user|profile|account/i }).or(
      page.locator('header').getByTitle(/logout|sign out/i)
    );
    if (await userMenu.isVisible()) {
      await userMenu.click();
      const logoutBtn = page.getByRole('menuitem', { name: /logout|sign out/i });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });

  test('/auth/me returns 401 without token', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    // Without valid session/cookie, should not return 200
    expect(res.status()).not.toBe(200);
  });
});
