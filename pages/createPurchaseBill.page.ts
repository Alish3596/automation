import { Page } from 'playwright';

export class CreatePurchaseBillPage {
  readonly page: Page;
  readonly createPBButton = 'button:has-text("Create Purchase Bill")';
  readonly invoiceNumberInput = '#pinv_num';

  constructor(page: Page) {
    this.page = page;
  }

  async createPurchaseBill(invoiceNumber: string) {
    await this.page.fill(this.invoiceNumberInput, invoiceNumber);
    await this.page.click(this.createPBButton);
    console.log('✅ Purchase Bill created');
  }
}
