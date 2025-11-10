import { Page } from 'playwright';

export class CreatePurchaseOrderPage {
  readonly page: Page;
  readonly supplierInput = '#supplier_list';
  readonly itemInput = 'input[placeholder="Item name"]';
  readonly createPOButton = 'button:has-text("Create Purchase Order")';
  readonly createMenu = 'text=Create';
  readonly purchaseSection = 'text=Purchases';
  readonly purchaseOrderMenuItem = 'text=Purchase Order';
  // Vendor dropdown + actions
  readonly addVendorOption = "//span[normalize-space()='Add vendor' or normalize-space()='Add Vendor' or normalize-space()='Create vendor' or normalize-space()='Create Vendor']";
  readonly vendorOptionByName = (name: string) =>
    `//span[normalize-space()="${name}" and (contains(@class,"select2-results__option") or contains(@class,"ant-select-item-option-content") or contains(@class,"menu-title"))]`;
  readonly vendorFallbackOptions =
    "//span[contains(@class,'select2-results__option') or contains(@class,'ant-select-item-option-content') or contains(@class,'menu-title')]";
  // GSTIN modal
  readonly gstinInput = '#sup_modal_gstin_number, #gstin, input[name="gstin"], input[placeholder="GSTIN"], input[placeholder="Gstin"], input[placeholder="GST Number"]';
  readonly saveButton = 'button:has-text("Save"), button:has-text("OK"), button:has-text("Ok"), button:has-text("Create")';

  private async fetchGstinFromWeb(supplier: string): Promise<string | null> {
    const queries = [
      `https://www.google.com/search?q=${encodeURIComponent(`${supplier} gstin`)}`,
      `https://www.bing.com/search?q=${encodeURIComponent(`${supplier} gstin`)}`,
    ];
    const gstinRegex = /\b[0-9A-Z]{15}\b/;
    for (const url of queries) {
      try {
        const searchPage = await this.page.context().newPage();
        await searchPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const content = await searchPage.locator('body').innerText({ timeout: 10000 }).catch(() => '');
        await searchPage.close();
        const match = content.match(gstinRegex);
        if (match && match[0]) {
          console.log(`ℹ️ Extracted GSTIN "${match[0]}" from ${url}`);
          return match[0];
        }
      } catch (e) {
        console.log(`ℹ️ GSTIN lookup failed for ${url}: ${(e as Error).message}`);
      }
    }
    return null;
  }

  constructor(page: Page) {
    this.page = page;
  }

  async createPurchaseOrder(supplier: string, item: string) {
    // Open Create → Purchases → Purchase Order via hover (fallback to click)
    const create = this.page.locator(this.createMenu).first();
    await create.waitFor({ state: 'visible', timeout: 30000 });
    
    // Click Create to open menu (hover may not work reliably)
    await create.click();
    await this.page.waitForTimeout(500);
    
    // Try to find Purchase Order directly, or navigate via Purchases section
    const poMenu = this.page.locator(this.purchaseOrderMenuItem).first();
    const poVisible = await poMenu.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!poVisible) {
      // If Purchase Order not directly visible, try hovering over Purchases section
      const purchaseSection = this.page.locator(this.purchaseSection).first();
      try {
        await purchaseSection.waitFor({ state: 'visible', timeout: 5000 });
        await purchaseSection.hover({ force: true });
        await this.page.waitForTimeout(500);
      } catch {
        // If Purchases section not found, try clicking Create again
        await create.click();
        await this.page.waitForTimeout(500);
      }
    }
    
    await poMenu.waitFor({ state: 'visible', timeout: 30000 });
    await poMenu.click();

    await this.page.waitForSelector(this.supplierInput, { timeout: 30000 });
    await this.page.fill(this.supplierInput, supplier);
    // Give the dropdown a moment to populate suggestions
    await this.page.waitForTimeout(3000);

    // Try to find existing vendor first - check if vendor name appears in dropdown
    const supplierLower = supplier.toLowerCase();
    let vendorFound = false;
    
    // Try multiple selectors to find the vendor option
    const vendorSelectors = [
      `text=${supplier}`,
      `//span[contains(text(), "${supplier}") and not(contains(text(), "Add vendor")) and not(contains(text(), "Create vendor"))]`,
      `//li[contains(text(), "${supplier}") and not(contains(text(), "Add vendor"))]`
    ];

    for (const selector of vendorSelectors) {
      try {
        const vendorOption = this.page.locator(selector).first();
        const isVisible = await vendorOption.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          const optionText = await vendorOption.innerText().catch(() => '');
          // Make sure it's not the "Add vendor" option
          if (optionText.toLowerCase().includes(supplierLower) && 
              !optionText.toLowerCase().includes('add vendor') && 
              !optionText.toLowerCase().includes('create vendor')) {
            console.log(`ℹ️ Found existing vendor "${supplier}" in dropdown, selecting it`);
            await vendorOption.click();
            vendorFound = true;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // If still not found, try pressing space to open dropdown and check again
    if (!vendorFound) {
      await this.page.focus(this.supplierInput);
      await this.page.keyboard.press(' ');
      await this.page.waitForTimeout(2000);
      
      // Check all dropdown options using getByText
      try {
        const vendorOption = this.page.getByText(supplier, { exact: false }).first();
        const isVisible = await vendorOption.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          const text = await vendorOption.innerText().catch(() => '');
          if (text.toLowerCase().includes(supplierLower) && 
              !text.toLowerCase().includes('add vendor') && 
              !text.toLowerCase().includes('create vendor')) {
            console.log(`ℹ️ Found existing vendor "${supplier}" in dropdown, selecting it`);
            await vendorOption.click();
            vendorFound = true;
          }
        }
      } catch (e) {
        // Continue to Add Vendor flow
      }
    }

    if (!vendorFound) {
      console.log(`ℹ️ No exact vendor match for "${supplier}" found; checking for Add Vendor option`);

      // If not present, expect an Add/Create Vendor action to be visible
      const addVendor = this.page.locator(this.addVendorOption).first();
      let addVendorVisible = await addVendor.isVisible().catch(() => false);

      if (!addVendorVisible) {
        console.log(`ℹ️ "Add vendor" not immediately visible; opening dropdown with space for "${supplier}"`);
        // As a fallback, open suggestions with space and re-check
        await this.page.focus(this.supplierInput);
        await this.page.keyboard.press(' ');
        await this.page.waitForTimeout(2000);
        // re-evaluate Add Vendor visibility
        addVendorVisible = await addVendor.isVisible().catch(() => false);
        if (!addVendorVisible) {
          console.log(`ℹ️ Still no "Add vendor" option; trying to pick first matching or fallback option`);
          const fallbackOption = this.page.locator(this.vendorOptionByName(supplier)).first();
          if (await fallbackOption.isVisible().catch(() => false)) {
            console.log(`ℹ️ Selecting fallback vendor option matching "${supplier}"`);
            await fallbackOption.click();
            return;
          }
          const firstFallback = this.page.locator(this.vendorFallbackOptions).first();
          await firstFallback.waitFor({ state: 'visible', timeout: 10000 });
          const fallbackText = await firstFallback.innerText().catch(() => 'unknown');
          console.log(`ℹ️ Selecting first available vendor option: "${fallbackText}"`);
          await firstFallback.click();
          return;
        }
      }

      console.log(`ℹ️ Clicking "Add vendor" for "${supplier}"`);
      await addVendor.waitFor({ state: 'visible', timeout: 60000 });
      await addVendor.click();

      const supplierModal = this.page.locator('#supplier_modal');
      if (await supplierModal.isVisible().catch(() => false)) {
        console.log('ℹ️ Supplier modal detected; populating required fields');
        const modalInputs = supplierModal.locator('input');
        const inputCount = await modalInputs.count();
        for (let i = 0; i < inputCount; i += 1) {
          const input = modalInputs.nth(i);
          const name = await input.getAttribute('name');
          const id = await input.getAttribute('id');
          const placeholder = await input.getAttribute('placeholder');
          console.log(`ℹ️ Modal input detected -> index: ${i}, id: ${id}, name: ${name}, placeholder: ${placeholder}`);
        }
      } else {
        await supplierModal.waitFor({ state: 'visible', timeout: 30000 }).catch(() => console.log('ℹ️ Supplier modal did not appear within 30s'));
      }

      // Fill GSTIN if prompted and confirm
      const gstinField = this.page.locator(this.gstinInput).first();
      try {
        await gstinField.waitFor({ state: 'visible', timeout: 30000 });
        console.log('ℹ️ GSTIN field visible; searching the web for GSTIN and attempting to Save');
        const lookedUpGstin = await this.fetchGstinFromWeb(supplier);
        const gstinToUse = lookedUpGstin ?? '33AAHFJ0166D1ZU';
        await gstinField.fill(gstinToUse);
        // Prefer explicit save button by id as per app: #supplier_save
        const saveBtn = supplierModal.locator('#supplier_save').first();
        await saveBtn.waitFor({ state: 'visible', timeout: 20000 });
        // Ensure visible and within viewport; some UIs require scroll/zoom
        await saveBtn.scrollIntoViewIfNeeded();
        // Temporary zoom out to ensure no overlay intercepts the click
        await this.page.evaluate(() => { (document.body as any).style.zoom = '70%'; });
        try {
          await saveBtn.click({ timeout: 20000 });
        } catch {
          // Retry with force if needed
          await saveBtn.click({ timeout: 20000, force: true });
        } finally {
          await this.page.evaluate(() => { (document.body as any).style.zoom = ''; });
        }
        await supplierModal.waitFor({ state: 'hidden', timeout: 30000 });
      } catch (error) {
        console.log(`ℹ️ Unable to populate GSTIN/save vendor automatically: ${(error as Error).message}`);
        throw error;
      }

      await this.page.waitForTimeout(500);
    }

    await this.page.fill(this.itemInput, item);
    await this.page.keyboard.press('Enter');
    await this.page.click(this.createPOButton);
    console.log('✅ Purchase Order created');
  }
}
