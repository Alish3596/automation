import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/login.page';
import { CreatePurchaseOrderPage } from '../pages/createPurchaseOrder.page';
import { ManagePurchaseOrderPage } from '../pages/managePurchaseOrder.page';
import { CreatePurchaseBillPage } from '../pages/createPurchaseBill.page';
import { ManagePurchaseBillPage } from '../pages/managePurchaseBill.page';
import { CreateDebitNotePage } from '../pages/createDebitNote.page';

declare module '@cucumber/cucumber' {
  interface World extends CustomWorld {}
}

let loginPage: LoginPage;
let createPOPage: CreatePurchaseOrderPage;
let managePOPage: ManagePurchaseOrderPage;
let createPBPage: CreatePurchaseBillPage;
let managePBPage: ManagePurchaseBillPage;
let createDNPage: CreateDebitNotePage;

function ensurePurchasePagesInitialized(world: any) {
  if (!createPOPage || !managePOPage || !createPBPage || !managePBPage || !createDNPage) {
    createPOPage = new CreatePurchaseOrderPage(world.page);
    managePOPage = new ManagePurchaseOrderPage(world.page);
    createPBPage = new CreatePurchaseBillPage(world.page);
    managePBPage = new ManagePurchaseBillPage(world.page);
    createDNPage = new CreateDebitNotePage(world.page);
  }
}

// --- Given: user is logged in ---
Given('the user is logged in with email {string} and password {string}', async function (email: string, password: string) {
  await this.launchBrowser();
  loginPage = new LoginPage(this.page);
  await loginPage.navigate();
  await loginPage.enterCredentials(email, password);
  await loginPage.clickContinue();
  await loginPage.verifyLogin('success');

  // Initialize page objects after login
  createPOPage = new CreatePurchaseOrderPage(this.page);
  managePOPage = new ManagePurchaseOrderPage(this.page);
  createPBPage = new CreatePurchaseBillPage(this.page);
  managePBPage = new ManagePurchaseBillPage(this.page);
  createDNPage = new CreateDebitNotePage(this.page);
});

// --- When: Create Purchase Order ---
When('the user creates a purchase order for supplier {string} with item {string}', async function (supplier: string, item: string) {
  ensurePurchasePagesInitialized(this);
  await createPOPage.createPurchaseOrder(supplier, item);
});

// --- When: Convert PO to Purchase Bill ---
When('the user converts that purchase order into a purchase bill', async function () {
  ensurePurchasePagesInitialized(this);
  await managePOPage.convertToPurchaseBill();
  console.log('✅ PO converted to Purchase Bill');
});

// --- When: Reconcile Purchase Bill ---
When('the user reconciles the purchase bill with a payment voucher', async function () {
  ensurePurchasePagesInitialized(this);
  await managePBPage.reconcilePurchaseBill();
  console.log('✅ Purchase Bill reconciled with Payment Voucher');
});

// --- When: Create Debit Note ---
When('the user creates a debit note for the purchase bill', async function () {
  ensurePurchasePagesInitialized(this);
  await createDNPage.createDebitNote();
});

// --- Then: Verify Purchase Order Status ---
Then('the purchase order status should be {string}', async function (status: string) {
  ensurePurchasePagesInitialized(this);
  await managePOPage.verifyStatus(status);
});

// --- Then: Verify Purchase Bill Status ---
Then('the purchase bill status should be {string}', async function (status: string) {
  ensurePurchasePagesInitialized(this);
  await managePBPage.verifyStatus(status);
  // Optional: close browser after test
  await this.closeBrowser();
});
