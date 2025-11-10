import { Page } from 'playwright';

export class CreateDebitNotePage {
  readonly page: Page;
  readonly createDNButton = 'button:has-text("Create Debit Note")';

  constructor(page: Page) {
    this.page = page;
  }

  async createDebitNote() {
    const convertTrigger = this.page.locator('text=Convert to Debit Note').first();
    await convertTrigger.waitFor({ state: 'visible', timeout: 30000 });
    await convertTrigger.click();

    const createButton = this.page.locator(this.createDNButton).first();
    await createButton.waitFor({ state: 'visible', timeout: 30000 });
    await createButton.click();
    console.log('✅ Debit Note created');
  }
}
