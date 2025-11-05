import { Page } from 'playwright';

export class CreatePurchaseOrderPage {
  readonly page: Page;
  readonly supplierInput = '#supplier_list';
  readonly itemInput = 'input[placeholder="Item name"]';
  readonly createPOButton = 'button:has-text("Create Purchase Order")';

  constructor(page: Page) {
    this.page = page;
  }

  async createPurchaseOrder(supplier: string, item: string) {
    await this.page.fill(this.supplierInput, supplier);
    await this.page.click(`text=${supplier}`);
    await this.page.fill(this.itemInput, item);
    await this.page.click(`text=${item}`);
    await this.page.click(this.createPOButton);
    console.log('✅ Purchase Order created');
  }
}
