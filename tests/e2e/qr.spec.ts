import { test, expect } from '@playwright/test';

test.describe('QR Workflows', () => {
  test('Valid QR, invalid QR, create ticket from QR', async ({ page, request }) => {
    // 1. Invalid QR
    await page.goto('/qr/invalid-token-123');
    try {
      await expect(page.getByText('Invalid or Missing Asset')).toBeVisible({ timeout: 15000 });
    } catch (e) {
      console.log('DOM CONTENT:', await page.content());
      throw e;
    }

    // 2. Create an asset to get a valid QR token
    const ts = Date.now();
    await page.goto('/assets/new');
    await page.fill('input[name="name"]', `QR Asset ${ts}`);
    
    // Select Category
    await page.locator('button', { hasText: 'Select Category' }).click();
    await page.getByRole('option', { name: 'Default Category' }).click();
    
    // Select Location
    await page.locator('button', { hasText: 'Select Location' }).click();
    await page.getByRole('option', { name: 'Headquarters' }).click();
    
    // Select Department
    await page.locator('button', { hasText: 'Select Department' }).click();
    await page.getByRole('option', { name: 'IT' }).click();

    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/assets') && res.request().method() === 'POST'),
      page.click('button[type="submit"]')
    ]);
    const json = await response.json();
    if (!json.data) {
      throw new Error(`API failed to create asset: ${JSON.stringify(json)}`);
    }
    const qrToken = json.data.qrCodeToken;

    // 3. Valid QR
    await page.goto(`/qr/${qrToken}`);
    await expect(page.getByText('Asset Found')).toBeVisible();
    await expect(page.getByText(`QR Asset ${ts}`)).toBeVisible();

    // 4. Create Ticket from QR
    await page.click('text=Create Ticket');
    await expect(page).toHaveURL(/\/tickets\/new/);
    await expect(page.locator('button[type="submit"]', { hasText: 'Create Ticket' })).toBeVisible();
  });
});
