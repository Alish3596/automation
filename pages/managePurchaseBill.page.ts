import { Page } from 'playwright';
import { expect } from '@playwright/test';

export class ManagePurchaseBillPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async reconcilePurchaseBill() {
    await this.page.click('text=Reconcile'); // adjust selector
    console.log('✅ Purchase Bill reconciled');
  }

  async verifyStatus(expectedStatus: string) {
    await this.page.waitForSelector(`text=${expectedStatus}`, { timeout: 15000 });
    const visible = await this.page.isVisible(`text=${expectedStatus}`);
    expect(visible).toBeTruthy();
    console.log(`✅ Purchase Bill status: ${expectedStatus}`);
  }
  async verifyReconciliation(): Promise<boolean> {
  const statusSelector = 'text=Paid'; // check the PB status in UI
  await this.page.waitForSelector(statusSelector, { timeout: 20000 });
  return await this.page.isVisible(statusSelector);
}

}
