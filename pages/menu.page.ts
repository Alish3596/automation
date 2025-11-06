import { Page, expect } from '@playwright/test';

export class MenuPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Verify that the Create menu is visible on the Ledgers page
   */
  async verifyCreateMenuVisible() {
    const createMenu = this.page.locator('text=Create');

    try {
      await expect(createMenu).toBeVisible({ timeout: 20000 });
      console.log('✅ "Create" menu is visible on the Ledgers page');
    } catch (error) {
      console.error('❌ "Create" menu not found on the Ledgers page');
      throw new Error('Create menu verification failed');
    }
  }

  /**
   * Click the Create menu
   */
  async clickCreateMenu() {
    const createMenu = this.page.locator('text=Create');
    await createMenu.click();
    console.log('✅ Clicked "Create" menu');
  }

  /**
   * Generic menu item verification by name
   */
  async verifyMenuItemVisible(menuName: string) {
    const menuItem = this.page.locator(`text=${menuName}`);
    await expect(menuItem).toBeVisible({ timeout: 10000 });
    console.log(`✅ Menu item "${menuName}" is visible`);
  }
}
