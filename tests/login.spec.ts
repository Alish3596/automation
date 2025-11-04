import { test, expect } from '@playwright/test';

test('Login to Ledger Cloud Dashboard', async ({ page }) => {
  // Go to the Ledger Cloud login page
  await page.goto('https://dash.ledgers.cloud');

  // Fill in credentials — update these selectors as needed
  await page.fill('input[name="email"]', 'alisha.fathima@indiafilings.com');
  await page.fill('input[name="password"]', 'Alisha@123');

  // Click the login button
  await page.getByRole('button', { name: 'Continue' }).click();


  // Wait for the dashboard to load
  await page.waitForLoadState('networkidle');

  // Verify login was successful (adjust selector to something visible on dashboard)
  await expect(page).toHaveURL(/dashboard/);

  // Optional: take screenshot
  await page.screenshot({ path: 'loggedin-dashboard.png', fullPage: true });

  console.log('✅ Login test completed successfully');
});
