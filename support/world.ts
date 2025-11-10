import { setWorldConstructor, After } from '@cucumber/cucumber';
import { Browser, chromium, Page } from 'playwright';

export class CustomWorld {
  browser!: Browser;
  page!: Page;

  async launchBrowser() {
    this.browser = await chromium.launch({ headless: false });
    const context = await this.browser.newContext();
    this.page = await context.newPage();
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

setWorldConstructor(CustomWorld);

After(async function () {
  await this.closeBrowser();
});
