import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page } from 'playwright';
import { LoginPage } from '../pages/login.page';

setDefaultTimeout(60000); // 60 seconds

let browser: Browser;
let page: Page;
let loginPage: LoginPage;

Given('the user is on the Ledger Cloud login page', async function () {
  browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  page = await context.newPage();
  loginPage = new LoginPage(page);
  await loginPage.navigate();
});

When('the user enters email {string} and password {string}', async function (email: string, password: string) {
  await loginPage.enterCredentials(email, password);
});

When('clicks the Continue button', async function () {
  await loginPage.clickContinue();
});

Then('the login should be {string}', async function (result: string) {
  await loginPage.verifyLogin(result as 'success' | 'failure');
  await browser.close();
});
