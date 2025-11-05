import { Page } from 'playwright';

export class CreateDebitNotePage {
  readonly page: Page;
  readonly createDNButton = 'button:has-text("Create Debit Note")';

  constructor(page: Page) {
    this.page = page;
  }

  async createDebitNote() {
    await this.page.click('text=Convert to Debit Note'); // adjust selector
    await this.page.click(this.createDNButton);
    console.log('✅ Debit Note created');
  }
}
