import { Page } from 'playwright';
import { expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly allAccountsLink = 'a:has-text("All Accounts")';

  constructor(page: Page) {
    this.page = page;
  }

  async openAllAccounts() {
    await this.page.waitForSelector(this.allAccountsLink, { timeout: 15000 });
    await this.page.click(this.allAccountsLink);
    console.log('✅ Clicked All Accounts link');
  }

  async selectBusinessAndOpenLedgers(businessName: string) {
    // Wait until the business list/table is visible
    await this.page.waitForSelector('table, [role="row"]', { timeout: 15000 });

    // Locate the row containing the business name
    const businessRow = this.page.locator(`tr:has-text("${businessName}")`);

    // Verify the business row is visible
    await expect(businessRow).toBeVisible({ timeout: 10000 });

    // Locate and click the LEDGERS button/icon inside that row
    const ledgerButton = businessRow.locator('a:has-text("LEDGERS"), button:has-text("LEDGERS")');
    await ledgerButton.first().click();

    console.log(`✅ Clicked Ledgers icon for business: ${businessName}`);
  }

  async verifyLedgersPage() {
    const ledgersText = this.page.locator('text=Ledgers');
    await expect(ledgersText).toBeVisible({ timeout: 20000 });
    console.log('✅ Ledgers page is displayed');
  }
}
