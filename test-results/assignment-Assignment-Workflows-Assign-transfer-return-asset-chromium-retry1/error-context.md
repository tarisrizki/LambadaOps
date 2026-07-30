# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assignment.spec.ts >> Assignment Workflows >> Assign, transfer, return asset
- Location: tests\e2e\assignment.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Confirm")')

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - generic [ref=f1e4]:
      - generic [ref=f1e5]: LambadaOps
      - navigation [ref=f1e10]:
        - link [ref=f1e11] [cursor=pointer]:
          - /url: /dashboard
          - text: Dashboard
        - link [ref=f1e17] [cursor=pointer]:
          - /url: /assets
          - text: Assets
        - link [ref=f1e20] [cursor=pointer]:
          - /url: /assignments
          - text: Assignments
        - link [ref=f1e24] [cursor=pointer]:
          - /url: /tickets
          - text: Tickets
        - link [ref=f1e27] [cursor=pointer]:
          - /url: /maintenance
          - text: Maintenance
        - link [ref=f1e30] [cursor=pointer]:
          - /url: /import
          - text: Import
        - link [ref=f1e34] [cursor=pointer]:
          - /url: /export
          - text: Export
      - generic [ref=f1e38]:
        - generic [ref=f1e39]:
          - paragraph [ref=f1e40]: "Workspace ID: 194"
          - paragraph [ref=f1e41]: "Role: 1"
        - button [ref=f1e42]: Logout
    - generic [ref=f1e43]:
      - banner [ref=f1e44]:
        - navigation [ref=f1e47]:
          - list [ref=f1e48]:
            - listitem [ref=f1e49]:
              - link [ref=f1e50] [cursor=pointer]:
                - /url: /
                - text: Home
            - listitem [ref=f1e51]
            - listitem [ref=f1e54]:
              - link [disabled] [ref=f1e55]: Assets
        - generic [ref=f1e56]:
          - button [ref=f1e57]:
            - generic [ref=f1e58]: Notifications
          - button [ref=f1e63]:
            - generic [ref=f1e64]: E
      - main [ref=f1e66]:
        - generic [ref=f1e67]:
          - generic [ref=f1e68]:
            - generic [ref=f1e69]:
              - button [ref=f1e70]
              - heading [level=1] [ref=f1e71]: Assignment Asset 1785431461978
              - generic [ref=f1e72]: Active
            - button [ref=f1e73]: Edit Asset
          - generic [ref=f1e74]:
            - generic [ref=f1e75]:
              - generic [ref=f1e76]: Asset Details
              - generic [ref=f1e78]:
                - generic [ref=f1e79]:
                  - paragraph [ref=f1e80]: Asset Code
                  - paragraph [ref=f1e81]: AST-000002
                - generic [ref=f1e82]:
                  - paragraph [ref=f1e83]: Category
                  - paragraph [ref=f1e84]: Default Category
                - generic [ref=f1e85]:
                  - paragraph [ref=f1e86]: Condition
                  - paragraph [ref=f1e87]: good
                - generic [ref=f1e88]:
                  - paragraph [ref=f1e89]: Brand
                  - paragraph [ref=f1e90]: "-"
                - generic [ref=f1e91]:
                  - paragraph [ref=f1e92]: Serial Number
                  - paragraph [ref=f1e93]: "-"
            - generic [ref=f1e94]:
              - generic [ref=f1e95]:
                - generic [ref=f1e96]: Assignment & Location
                - generic [ref=f1e97]:
                  - button [ref=f1e98]: Transfer
                  - button [ref=f1e99]: Return
              - generic [ref=f1e100]:
                - generic [ref=f1e101]:
                  - paragraph [ref=f1e102]: Location
                  - paragraph [ref=f1e103]: Headquarters
                - generic [ref=f1e104]:
                  - paragraph [ref=f1e105]: Department
                  - paragraph [ref=f1e106]: Unknown
                - generic [ref=f1e107]:
                  - paragraph [ref=f1e108]: Assignment Type
                  - paragraph [ref=f1e109]: individual
            - generic [ref=f1e110]:
              - generic [ref=f1e111]: Purchase Information
              - generic [ref=f1e113]:
                - generic [ref=f1e114]:
                  - paragraph [ref=f1e115]: Purchase Date
                  - paragraph [ref=f1e116]: "-"
                - generic [ref=f1e117]:
                  - paragraph [ref=f1e118]: Purchase Price
                  - paragraph [ref=f1e119]: "-"
                - generic [ref=f1e120]:
                  - paragraph [ref=f1e121]: Warranty Expiry
                  - paragraph [ref=f1e122]: "-"
  - region "Notifications alt+T"
  - button [ref=f1e173] [cursor=pointer]
  - generic [ref=f1e226] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=f1e227]
    - generic [ref=f1e231]:
      - button "Open issues overlay" [ref=f1e232]:
        - generic [ref=f1e233]:
          - generic [ref=f1e234]: "0"
          - generic [ref=f1e235]: "1"
        - generic [ref=f1e236]: Issue
      - button "Collapse issues badge" [ref=f1e237]
  - alert [ref=f1e240]
  - dialog [ref=f1e244]:
    - heading "Return Asset" [level=2] [ref=f1e246]
    - generic [ref=f1e247]:
      - generic [ref=f1e248]:
        - generic [ref=f1e249]: Condition Note (Optional)
        - textbox "Condition Note (Optional)" [active] [ref=f1e250]:
          - /placeholder: Record any damage or relevant notes upon return...
      - generic [ref=f1e251]:
        - button "Cancel" [ref=f1e252]
        - button "Return Asset" [ref=f1e253]
    - button "Close" [ref=f1e254]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Assignment Workflows', () => {
  4  |   test('Assign, transfer, return asset', async ({ page, request }) => {
  5  |     // Create an asset first
  6  |     const ts = Date.now();
  7  |     await page.goto('/assets/new');
  8  |     await page.fill('input[name="name"]', `Assignment Asset ${ts}`);
  9  |     
  10 |     // Select Category
  11 |     await page.locator('button', { hasText: 'Select Category' }).click();
  12 |     await page.getByRole('option', { name: 'Default Category' }).click();
  13 |     
  14 |     // Select Location
  15 |     await page.locator('button', { hasText: 'Select Location' }).click();
  16 |     await page.getByRole('option', { name: 'Headquarters' }).click();
  17 |     
  18 |     // Select Department
  19 |     await page.locator('button', { hasText: 'Select Department' }).click();
  20 |     await page.getByRole('option', { name: 'IT' }).click();
  21 | 
  22 |     const [response] = await Promise.all([
  23 |       page.waitForResponse(res => res.url().includes('/assets') && res.request().method() === 'POST'),
  24 |       page.click('button[type="submit"]')
  25 |     ]);
  26 |     const json = await response.json();
  27 |     if (!json.data) {
  28 |       throw new Error(`API failed to create asset: ${JSON.stringify(json)}`);
  29 |     }
  30 |     const assetId = json.data.id;
  31 | 
  32 |     // Go to the asset detail page
  33 |     await page.goto(`/assets/${assetId}`);
  34 |     
  35 |     const errorBlock = page.locator('pre');
  36 |     if (await errorBlock.count() > 0) {
  37 |       console.log('ASSIGNMENT ASSET DETAIL ERROR:', await errorBlock.textContent());
  38 |     }
  39 |     
  40 |     await expect(page.locator('h1')).toContainText(`Assignment Asset ${ts}`);
  41 | 
  42 |     // Assign
  43 |     await page.click('button:has-text("Assign")');
  44 |     await page.click('button:has-text("Select User")');
  45 |     await page.getByRole('option', { name: /E2E Tester/ }).click();
  46 |     await page.fill('textarea[name="note"]', 'Assigned for testing');
  47 |     await page.click('button[type="submit"]', { hasText: 'Assign' });
  48 |     await expect(page.locator('p.capitalize', { hasText: 'individual' })).toBeVisible();
  49 |     // Let's just wait for the dialog to close and the Return button to be visible.
  50 |     await expect(page.locator('button:has-text("Return")')).toBeVisible();
  51 | 
  52 |     // Transfer (if applicable)
  53 |     await page.click('button:has-text("Transfer")', { timeout: 2000 }).catch(() => {});
  54 |     await page.click('button:has-text("Select User")').catch(() => {});
  55 |     await page.getByRole('option', { name: /E2E Tester/ }).click().catch(() => {});
  56 |     await page.click('button[type="submit"]', { hasText: 'Transfer' }).catch(() => {});
  57 | 
  58 |     // Return
  59 |     await page.click('button:has-text("Return")');
> 60 |     await page.click('button:has-text("Confirm")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  61 |     await expect(page.locator('button:has-text("Assign")').first()).toBeVisible();
  62 |   });
  63 | });
  64 | 
```