import { Page } from 'playwright';
import { expect } from '@playwright/test';

export class ManagePurchaseOrderPage {
  readonly page: Page;
  readonly createMenu = 'text=Create';
  readonly purchasesSection = 'text=Purchases';
  readonly managePOMenu = 'text=Manage Purchase Orders, text=Manage Purchase Order';

  constructor(page: Page) {
    this.page = page;
  }

  async convertToPurchaseBill() {
    // Try direct convert button if already on PO detail/manage view
    const convertSelector = this.page.locator('text=Convert to Purchase Bill').first();
    try {
      await convertSelector.waitFor({ state: 'visible', timeout: 5000 });
      await convertSelector.click();
      console.log('✅ Purchase Order converted to Purchase Bill');
      return;
    } catch {
      // fall-through to navigate to Manage PO
    }

    // Navigate via Create → Purchases → Manage Purchase Orders (hover with click fallback)
    const create = this.page.locator(this.createMenu).first();
    await create.waitFor({ state: 'visible', timeout: 30000 });
    await create.hover();
    await this.page.waitForTimeout(200);

    const purchases = this.page.locator(this.purchasesSection).first();
    try {
      await purchases.waitFor({ state: 'visible', timeout: 1500 });
      await purchases.hover();
    } catch {
      await create.click();
      await purchases.waitFor({ state: 'visible', timeout: 10000 });
      await purchases.hover();
    }

    // Try both singular and plural menu labels
    const manageMenu = this.page.locator(this.managePOMenu).first();
    await manageMenu.waitFor({ state: 'visible', timeout: 30000 });
    await manageMenu.click();

    // Now click Convert to Purchase Bill from list/detail
    await this.page.locator('text=Convert to Purchase Bill').first().waitFor({ state: 'visible', timeout: 30000 });
    await this.page.click('text=Convert to Purchase Bill');
    console.log('✅ Purchase Order converted to Purchase Bill');
  }

  async verifyStatus(expectedStatus: string) {
    await this.page.waitForSelector(`text=${expectedStatus}`, { timeout: 15000 });
    const visible = await this.page.isVisible(`text=${expectedStatus}`);
    expect(visible).toBeTruthy();
    console.log(`✅ Purchase Order status: ${expectedStatus}`);
  }
}
