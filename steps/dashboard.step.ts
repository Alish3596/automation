import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page } from 'playwright';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MenuPage } from '../pages/menu.page';

setDefaultTimeout(60 * 1000);

let browser: Browser;
let page: Page;
let loginPage: LoginPage;
let dashboardPage: DashboardPage;
let menuPage: MenuPage;

Given('the user has logged into Ledger Cloud', async function () {
  browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  page = await context.newPage();

  loginPage = new LoginPage(page);
  dashboardPage = new DashboardPage(page);
  menuPage = new MenuPage(page);

  await loginPage.navigate();
  await loginPage.enterCredentials('alisha.fathima@indiafilings.com', 'Alisha@123');
  await loginPage.clickContinue();
  await loginPage.verifyLogin('success');
});

When('the user selects the business {string}', async function (businessName: string) {
  await dashboardPage.openAllAccounts();
  await dashboardPage.selectBusinessAndOpenLedgers(businessName);
});

Then('the Ledgers page should be displayed', async function () {
  await menuPage.verifyCreateMenuVisible(); // ✅ now checks for "Create" menu visibility
  await browser.close();
});
