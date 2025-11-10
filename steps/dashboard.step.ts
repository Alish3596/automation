import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MenuPage } from '../pages/menu.page';

setDefaultTimeout(60 * 1000);

declare module '@cucumber/cucumber' {
  interface World extends CustomWorld {}
}

let loginPage: LoginPage;
let dashboardPage: DashboardPage;
let menuPage: MenuPage;

Given('the user has logged into Ledger Cloud', async function () {
  await this.launchBrowser();

  loginPage = new LoginPage(this.page);
  dashboardPage = new DashboardPage(this.page);
  menuPage = new MenuPage(this.page);

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
  await this.closeBrowser();
});
