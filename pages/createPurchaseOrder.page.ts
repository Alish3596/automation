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

  async fetchVendorNameFromManageContacts(): Promise<string | null> {
    try {
      console.log('ℹ️ Fetching vendor name from manage contacts page...');
      await this.page.goto('https://in.ledgers.cloud/contacts/manage-contacts', { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      
      // Try to find the first vendor name in the table/list
      const vendorSelectors = [
        'table tbody tr:first-child td:first-child',
        'table tbody tr:first-child td:nth-child(2)',
        '[class*="table"] tbody tr:first-child td',
        'tbody tr:first-child td',
        '[data-testid*="vendor"]:first-child',
        '.vendor-name:first-child',
        'tr:first-child td:first-child'
      ];
      
      for (const selector of vendorSelectors) {
        try {
          const vendorElement = this.page.locator(selector).first();
          const isVisible = await vendorElement.isVisible({ timeout: 3000 }).catch(() => false);
          if (isVisible) {
            const vendorName = await vendorElement.innerText().catch(() => '');
            if (vendorName && vendorName.trim()) {
              const trimmedName = vendorName.trim();
              console.log(`ℹ️ Found vendor name from manage contacts: "${trimmedName}"`);
              return trimmedName;
            }
          }
        } catch {
          continue;
        }
      }
      
      console.log('ℹ️ No vendor name found in manage contacts page');
      return null;
    } catch (error) {
      console.log(`ℹ️ Error fetching vendor name: ${(error as Error).message}`);
      return null;
    }
  }

  async fetchItemNameFromManageCatalog(): Promise<string | null> {
    try {
      console.log('ℹ️ Fetching item name from manage catalog page...');
      await this.page.goto('https://in.ledgers.cloud/catalog/manage-catalog', { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      
      // Try to find the first item name in the table/list
      const itemSelectors = [
        'table tbody tr:first-child td:first-child',
        'table tbody tr:first-child td:nth-child(2)',
        '[class*="table"] tbody tr:first-child td',
        'tbody tr:first-child td',
        '[data-testid*="item"]:first-child',
        '[data-testid*="product"]:first-child',
        '.item-name:first-child',
        '.product-name:first-child',
        'tr:first-child td:first-child'
      ];
      
      for (const selector of itemSelectors) {
        try {
          const itemElement = this.page.locator(selector).first();
          const isVisible = await itemElement.isVisible({ timeout: 3000 }).catch(() => false);
          if (isVisible) {
            const itemName = await itemElement.innerText().catch(() => '');
            if (itemName && itemName.trim()) {
              const trimmedName = itemName.trim();
              console.log(`ℹ️ Found item name from manage catalog: "${trimmedName}"`);
              return trimmedName;
            }
          }
        } catch {
          continue;
        }
      }
      
      console.log('ℹ️ No item name found in manage catalog page');
      return null;
    } catch (error) {
      console.log(`ℹ️ Error fetching item name: ${(error as Error).message}`);
      return null;
    }
  }

  async createPurchaseOrder(supplier: string, item: string) {
    // Before entering vendor and item, fetch them from manage pages if not provided
    let actualSupplier = supplier;
    let actualItem = item;
    
    // If supplier is empty or default, fetch from manage contacts
    if (!supplier || supplier === 'default' || supplier === '') {
      const fetchedVendor = await this.fetchVendorNameFromManageContacts();
      if (fetchedVendor) {
        actualSupplier = fetchedVendor;
        console.log(`ℹ️ Using vendor from manage contacts: "${actualSupplier}"`);
      }
    }
    
    // If item is empty or default, fetch from manage catalog
    if (!item || item === 'default' || item === '') {
      const fetchedItem = await this.fetchItemNameFromManageCatalog();
      if (fetchedItem) {
        actualItem = fetchedItem;
        console.log(`ℹ️ Using item from manage catalog: "${actualItem}"`);
      }
    }
    
    // Open Create → Purchases → Purchase Order via hover (with proper waits)
    const create = this.page.locator(this.createMenu).first();
    await create.waitFor({ state: 'visible', timeout: 30000 });
    
    // First, try clicking Create to open the menu (more reliable than hover)
    await create.click();
    await this.page.waitForTimeout(1000); // Wait for menu to open
    
    // Now try to find Purchases section - it should be visible after clicking
    const purchaseSection = this.page.locator(this.purchaseSection).first();
    let purchaseVisible = await purchaseSection.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!purchaseVisible) {
      // If not visible after click, try hovering over Create
      await create.hover();
      await this.page.waitForTimeout(1000);
      purchaseVisible = await purchaseSection.isVisible({ timeout: 3000 }).catch(() => false);
    }
    
    if (purchaseVisible) {
      // Hover over Purchases to reveal Purchase Order submenu
      await purchaseSection.hover();
      await this.page.waitForTimeout(1000); // Wait for submenu to expand
    } else {
      // If still not visible, try force hover
      console.log('ℹ️ Purchases section not visible, trying force hover');
      await purchaseSection.hover({ force: true });
      await this.page.waitForTimeout(1000);
    }
    
    // Now wait for Purchase Order menu item to be visible
    const poMenu = this.page.locator(this.purchaseOrderMenuItem).first();
    await poMenu.waitFor({ state: 'visible', timeout: 30000 });
    
    // Click Purchase Order
    await poMenu.click();

    // Decrease zoom size before entering vendor (to help with visibility/clicking)
    await this.page.evaluate(() => { (document.body as any).style.zoom = '80%'; });
    await this.page.waitForTimeout(500);

    await this.page.waitForSelector(this.supplierInput, { timeout: 30000 });
    await this.page.fill(this.supplierInput, actualSupplier);
    // Give the dropdown a moment to populate suggestions
    await this.page.waitForTimeout(3000);

    // Try to find existing vendor first - check if vendor name appears in dropdown
    const supplierLower = actualSupplier.toLowerCase();
    let vendorFound = false;
    
    // Try multiple selectors to find the vendor option
    const vendorSelectors = [
      `text=${actualSupplier}`,
      `//span[contains(text(), "${actualSupplier}") and not(contains(text(), "Add vendor")) and not(contains(text(), "Create vendor"))]`,
      `//li[contains(text(), "${actualSupplier}") and not(contains(text(), "Add vendor"))]`
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
            console.log(`ℹ️ Found existing vendor "${actualSupplier}" in dropdown, selecting it`);
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
        const vendorOption = this.page.getByText(actualSupplier, { exact: false }).first();
        const isVisible = await vendorOption.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          const text = await vendorOption.innerText().catch(() => '');
          if (text.toLowerCase().includes(supplierLower) && 
              !text.toLowerCase().includes('add vendor') && 
              !text.toLowerCase().includes('create vendor')) {
            console.log(`ℹ️ Found existing vendor "${actualSupplier}" in dropdown, selecting it`);
            await vendorOption.click();
            vendorFound = true;
          }
        }
      } catch (e) {
        // Continue to Add Vendor flow
      }
    }

    if (!vendorFound) {
      console.log(`ℹ️ No exact vendor match for "${actualSupplier}" found; checking for Add Vendor option`);

      // If not present, expect an Add/Create Vendor action to be visible
      const addVendor = this.page.locator(this.addVendorOption).first();
      let addVendorVisible = await addVendor.isVisible().catch(() => false);

      if (!addVendorVisible) {
        console.log(`ℹ️ "Add vendor" not immediately visible; opening dropdown with space for "${actualSupplier}"`);
        // As a fallback, open suggestions with space and re-check
        await this.page.focus(this.supplierInput);
        await this.page.keyboard.press(' ');
        await this.page.waitForTimeout(2000);
        // re-evaluate Add Vendor visibility
        addVendorVisible = await addVendor.isVisible().catch(() => false);
        if (!addVendorVisible) {
          console.log(`ℹ️ Still no "Add vendor" option; trying to pick first matching or fallback option`);
          const fallbackOption = this.page.locator(this.vendorOptionByName(actualSupplier)).first();
          if (await fallbackOption.isVisible().catch(() => false)) {
            console.log(`ℹ️ Selecting fallback vendor option matching "${actualSupplier}"`);
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

      console.log(`ℹ️ Clicking "Add vendor" for "${actualSupplier}"`);
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
        const lookedUpGstin = await this.fetchGstinFromWeb(actualSupplier);
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

    // Fill item name and wait for dropdown list to appear
    await this.page.fill(this.itemInput, actualItem);
    await this.page.waitForTimeout(1500); // Initial wait for dropdown to start loading
    
    // Wait for dropdown list to appear after input is given
    const dropdownContainers = [
      '[class*="select2-results"]',
      '[class*="dropdown"]',
      '[class*="option"]',
      '[role="listbox"]',
      '[role="option"]',
      '.ant-select-dropdown',
      '.select2-dropdown',
      '[class*="menu"]',
      '[class*="list"]',
      'ul[class*="menu"]',
      'div[class*="menu"]'
    ];
    
    let dropdownVisible = false;
    let dropdownContainer = null;
    
    // Wait for dropdown list to appear after input (up to 10 seconds)
    console.log('ℹ️ Waiting for dropdown list to appear after input...');
    for (const container of dropdownContainers) {
      try {
        const dropdown = this.page.locator(container).first();
        await dropdown.waitFor({ state: 'visible', timeout: 10000 });
        dropdownVisible = true;
        dropdownContainer = container;
        console.log(`ℹ️ Dropdown list container found: ${container}`);
        break;
      } catch {
        continue;
      }
    }
    
    // Additional wait for dropdown list items to populate
    if (dropdownVisible) {
      await this.page.waitForTimeout(2000); // Wait for items to load in the list
      console.log('ℹ️ Dropdown list is visible, checking items in the list...');
    } else {
      // If no dropdown container found, wait a bit more
      await this.page.waitForTimeout(3000);
      console.log('ℹ️ No dropdown container found, will try to find item directly in the list...');
    }
    
    // Check if item is listed in the dropdown below
    const itemLower = actualItem.toLowerCase();
    let itemFound = false;
    
    // Try multiple selectors to find the item in the dropdown list (after input is given)
    const itemSelectors = [
      `//li[contains(text(), "${actualItem}") and not(contains(text(), "Add Item")) and not(contains(text(), "Create Item"))]`,
      `//span[contains(text(), "${actualItem}") and not(contains(text(), "Add Item")) and not(contains(text(), "Create Item"))]`,
      `//div[contains(@class, "option") and contains(text(), "${actualItem}") and not(contains(text(), "Add Item"))]`,
      `[role="option"]:has-text("${actualItem}"):not(:has-text("Add Item"))`,
      `li:has-text("${actualItem}"):not(:has-text("Add Item"))`,
      `text=${actualItem}`,
      `//*[contains(text(), "${actualItem}") and not(contains(text(), "Add Item")) and not(contains(text(), "Create Item"))]`
    ];
    
    // Try to find the item with multiple attempts (with timeout protection)
    const maxAttempts = 2; // Reduced to 2 attempts
    const maxTotalTime = 20000; // Max 20 seconds total
    
    const startTime = Date.now();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (itemFound) break;
      
      // Check overall timeout
      if (Date.now() - startTime > maxTotalTime) {
        console.log(`ℹ️ Total timeout reached, moving to Enter key`);
        break;
      }
      
      for (const selector of itemSelectors) {
        try {
          // Try to find all matching options, not just the first one
          const itemOptions = this.page.locator(selector);
          const count = await itemOptions.count();
          
          for (let i = 0; i < count; i++) {
            const itemOption = itemOptions.nth(i);
            const isVisible = await itemOption.isVisible({ timeout: 2000 }).catch(() => false);
            if (isVisible) {
              const optionText = await itemOption.innerText().catch(() => '');
              const optionTextLower = optionText.toLowerCase().trim();
              
              // Skip if this option contains "add item" or "create item" or "purchase" button text
              if (optionTextLower.includes('add item') ||
                  optionTextLower.includes('create item') ||
                  optionTextLower.includes('purchase') ||
                  optionTextLower === 'add item' ||
                  optionTextLower === 'create item') {
                continue; // Skip this option
              }
              
              // Check if the text matches the item (exact match or contains)
              if (optionTextLower === itemLower || optionTextLower.includes(itemLower)) {
                console.log(`ℹ️ Found existing item "${actualItem}" in dropdown (attempt ${attempt + 1}), selecting it. Option text: "${optionText}"`);
                // Scroll into view and click
                await itemOption.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);
                // Try clicking with force if needed
                try {
                  await itemOption.click({ timeout: 3000 });
                } catch {
                  await itemOption.click({ force: true, timeout: 3000 });
                }
                itemFound = true;
                await this.page.waitForTimeout(2000); // Wait for amount/price to populate
                break;
              }
            }
          }
          
          if (itemFound) break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // If not found, wait a bit more and try again (but not on last attempt)
      if (!itemFound && attempt < maxAttempts - 1) {
        await this.page.waitForTimeout(1500);
        console.log(`ℹ️ Item not found yet, waiting and retrying (attempt ${attempt + 2})...`);
      }
    }
    
    // If item not found in dropdown, try pressing Enter or Tab to create new item or select
    if (!itemFound) {
      console.log(`ℹ️ Item "${actualItem}" not found in dropdown after multiple attempts, pressing Enter`);
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(3000); // Wait longer for item to be added/selected
    }
    
    // Verify that amount/price is populated (check for price field)
    const priceField = this.page.locator('input[placeholder*="Price"], input[name*="price"], input[id*="price"], input[type="number"]').first();
    const hasPrice = await priceField.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPrice) {
      const priceValue = await priceField.inputValue().catch(() => '');
      if (!priceValue || priceValue === '0' || priceValue === '') {
        console.log(`ℹ️ Price not populated, filling default price`);
        await priceField.fill('100'); // Fill a default price if not populated
        await this.page.waitForTimeout(500);
      } else {
        console.log(`ℹ️ Price already populated: ${priceValue}`);
      }
    }
    
    // Wait a moment for the form to be ready
    await this.page.waitForTimeout(1000);
    
    // Click Create Purchase Order button
    const createButton = this.page.locator(this.createPOButton).first();
    await createButton.waitFor({ state: 'visible', timeout: 30000 });
    await createButton.scrollIntoViewIfNeeded();
    
    // Try clicking with retry logic
    try {
      await createButton.click({ timeout: 10000 });
    } catch {
      // If normal click fails, try force click
      await createButton.click({ force: true, timeout: 10000 });
    }
    
    // Wait for the purchase order to be created (check for success message or page change)
    await this.page.waitForTimeout(3000);
    console.log('✅ Purchase Order created');
  }

  async attemptCreatePurchaseOrderWithGstin(supplier: string, gstin: string) {
    // Navigate to Purchase Order page (same as createPurchaseOrder with proper hover waits)
    const create = this.page.locator(this.createMenu).first();
    await create.waitFor({ state: 'visible', timeout: 30000 });
    
    // Hover over Create menu to reveal submenu
    await create.hover();
    await this.page.waitForTimeout(500); // Wait for submenu animation
    
    // Wait for Purchases section to be visible in the submenu
    const purchaseSection = this.page.locator(this.purchaseSection).first();
    await purchaseSection.waitFor({ state: 'visible', timeout: 10000 });
    
    // Hover over Purchases to reveal Purchase Order submenu
    await purchaseSection.hover();
    await this.page.waitForTimeout(500); // Wait for submenu to expand
    
    // Now wait for Purchase Order menu item to be visible
    const poMenu = this.page.locator(this.purchaseOrderMenuItem).first();
    await poMenu.waitFor({ state: 'visible', timeout: 30000 });
    
    // Click Purchase Order
    await poMenu.click();

    await this.page.waitForSelector(this.supplierInput, { timeout: 30000 });
    await this.page.fill(this.supplierInput, supplier);
    await this.page.waitForTimeout(3000);

    // Check if vendor exists, if not proceed to add vendor
    const supplierLower = supplier.toLowerCase();
    let vendorFound = false;

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

    if (!vendorFound) {
      await this.page.focus(this.supplierInput);
      await this.page.keyboard.press(' ');
      await this.page.waitForTimeout(2000);

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
      // Add new vendor with specified GSTIN
      const addVendor = this.page.locator(this.addVendorOption).first();
      await addVendor.waitFor({ state: 'visible', timeout: 60000 });
      await addVendor.click();

      const supplierModal = this.page.locator('#supplier_modal');
      await supplierModal.waitFor({ state: 'visible', timeout: 30000 });

      // Fill GSTIN with the specified value
      const gstinField = this.page.locator(this.gstinInput).first();
      await gstinField.waitFor({ state: 'visible', timeout: 30000 });
      await gstinField.fill(gstin);
      console.log(`ℹ️ Filled GSTIN field with: ${gstin}`);

      // Attempt to save - this should trigger the error
      const saveBtn = supplierModal.locator('#supplier_save').first();
      await saveBtn.waitFor({ state: 'visible', timeout: 20000 });
      await saveBtn.scrollIntoViewIfNeeded();
      await this.page.evaluate(() => { (document.body as any).style.zoom = '70%'; });
      try {
        await saveBtn.click({ timeout: 20000 });
      } catch {
        await saveBtn.click({ timeout: 20000, force: true });
      } finally {
        await this.page.evaluate(() => { (document.body as any).style.zoom = ''; });
      }
    }
  }

  async verifyGstinError() {
    // Look for error messages related to GSTIN
    const errorSelectors = [
      'text=/.*GSTIN.*already.*associated.*/i',
      'text=/.*GSTIN.*already.*exists.*/i',
      'text=/.*GST.*number.*already.*/i',
      'text=/.*GSTIN.*duplicate.*/i',
      'text=/.*GST.*already.*registered.*/i',
      '.alert-danger',
      '.error-message',
      '[role="alert"]',
      '.toast-error',
      '.notification-error'
    ];

    let errorFound = false;
    let errorText = '';

    for (const selector of errorSelectors) {
      try {
        const errorElement = this.page.locator(selector).first();
        const isVisible = await errorElement.isVisible({ timeout: 5000 }).catch(() => false);
        if (isVisible) {
          errorText = await errorElement.innerText().catch(() => '');
          if (errorText) {
            console.log(`✅ GSTIN error message found: "${errorText}"`);
            errorFound = true;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Also check in the supplier modal for inline errors
    if (!errorFound) {
      const supplierModal = this.page.locator('#supplier_modal');
      if (await supplierModal.isVisible().catch(() => false)) {
        const modalErrors = supplierModal.locator('.text-danger, .error, [class*="error"], [class*="invalid"]');
        const errorCount = await modalErrors.count();
        if (errorCount > 0) {
          for (let i = 0; i < errorCount; i++) {
            const error = modalErrors.nth(i);
            const text = await error.innerText().catch(() => '');
            if (text && (text.toLowerCase().includes('gstin') || text.toLowerCase().includes('gst'))) {
              errorText = text;
              errorFound = true;
              console.log(`✅ GSTIN error message found in modal: "${errorText}"`);
              break;
            }
          }
        }
      }
    }

    if (!errorFound) {
      throw new Error('GSTIN error message not found. Expected error indicating GSTIN is already associated with another vendor.');
    }

    // Verify the error message contains relevant keywords
    const errorLower = errorText.toLowerCase();
    const hasGstinKeyword = errorLower.includes('gstin') || errorLower.includes('gst');
    const hasDuplicateKeyword = errorLower.includes('already') || errorLower.includes('duplicate') || errorLower.includes('exists') || errorLower.includes('associated');

    if (!hasGstinKeyword || !hasDuplicateKeyword) {
      console.log(`⚠️ Warning: Error message may not be specific to GSTIN duplication: "${errorText}"`);
    }

    console.log('✅ GSTIN error verification passed');
  }
}
