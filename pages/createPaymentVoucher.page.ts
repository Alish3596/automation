import { Page } from 'playwright';

export class CreatePaymentVoucherPage {
  readonly page: Page;
  readonly createVoucherButton = 'button:has-text("Create Payment Voucher")';

  constructor(page: Page) {
    this.page = page;
  }

  async createPaymentVoucher() {
    await this.page.click('text=Payment Voucher'); // navigate to payment voucher
    await this.page.click(this.createVoucherButton);
    console.log('✅ Payment Voucher created');
  }
}
