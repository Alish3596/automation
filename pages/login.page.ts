import { Page } from 'playwright';
import { expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput = 'input[name="email"]';
  readonly passwordInput = 'input[name="password"]';
  readonly continueButton = 'button:has-text("Continue")';
  readonly dashboardText = 'text=Dashboard';
  readonly errorText = 'text=User does not exist'; // check exact UI text

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('https://dash.ledgers.cloud');
    console.log('✅ Navigated to login page');
  }

  async enterCredentials(email: string, password: string) {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
    console.log(`✅ Entered email: ${email} and password`);
  }

  async clickContinue() {
    await this.page.click(this.continueButton);
    console.log('✅ Clicked Continue');
  }

  async verifyLogin(result: 'success' | 'failure') {
    if (result === 'success') {
      await this.page.waitForSelector(this.dashboardText, { timeout: 20000 });
      expect(await this.page.isVisible(this.dashboardText)).toBeTruthy();
      console.log('✅ Login successful, dashboard visible');
    } else {
      await this.page.waitForSelector(this.errorText, { timeout: 30000 });
      expect(await this.page.isVisible(this.errorText)).toBeTruthy();
      console.log('❌ Login failed as expected: User does not exist');
    }
  }
}
