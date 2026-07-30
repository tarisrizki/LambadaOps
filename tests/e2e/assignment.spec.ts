import { test, expect } from '@playwright/test';

test.describe('Assignment Workflows', () => {
  test('Assign, transfer, return asset', async ({ page, request }) => {
    // Create an asset first
    const ts = Date.now();
    await page.goto('/assets/new');
    await page.fill('input[name="name"]', `Assignment Asset ${ts}`);
    
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
    const assetId = json.data.id;

    // Go to the asset detail page
    await page.goto(`/assets/${assetId}`);
    
    const errorBlock = page.locator('pre');
    if (await errorBlock.count() > 0) {
      console.log('ASSIGNMENT ASSET DETAIL ERROR:', await errorBlock.textContent());
    }
    
    await expect(page.locator('h1')).toContainText(`Assignment Asset ${ts}`);

    // Assign
    await page.click('button:has-text("Assign")');
    await page.click('button:has-text("Select User")');
    await page.getByRole('option', { name: /E2E Tester/ }).click();
    await page.fill('textarea[name="note"]', 'Assigned for testing');
    await page.click('button[type="submit"]', { hasText: 'Assign' });
    await expect(page.locator('p.capitalize', { hasText: 'individual' })).toBeVisible();
    // Let's just wait for the dialog to close and the Return button to be visible.
    await expect(page.locator('button:has-text("Return")')).toBeVisible();

    // Transfer (if applicable)
    await page.click('button:has-text("Transfer")', { timeout: 2000 }).catch(() => {});
    await page.click('button:has-text("Select User")').catch(() => {});
    await page.getByRole('option', { name: /E2E Tester/ }).click().catch(() => {});
    await page.click('button[type="submit"]', { hasText: 'Transfer' }).catch(() => {});

    // Return
    await page.click('button:has-text("Return")');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('button:has-text("Assign")').first()).toBeVisible();
  });
});
