import { Page } from 'playwright';
import { expect } from '@playwright/test';

export class ManagePurchaseOrderPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async convertToPurchaseBill() {
    await this.page.click('text=Convert to Purchase Bill'); // adjust selector
    console.log('✅ Purchase Order converted to Purchase Bill');
  }

  async verifyStatus(expectedStatus: string) {
    await this.page.waitForSelector(`text=${expectedStatus}`, { timeout: 15000 });
    const visible = await this.page.isVisible(`text=${expectedStatus}`);
    expect(visible).toBeTruthy();
    console.log(`✅ Purchase Order status: ${expectedStatus}`);
  }
}
