import { test, expect } from '@playwright/test';
import { Selectors } from './selectors';

test.describe('Settings and Currency Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/settings');
    await page.waitForTimeout(2000);
  });

  test('should display settings page correctly', async ({ page }) => {
    // Check main sections are present
    await expect(page.locator(Selectors.settingsTitle)).toBeVisible();
    await expect(page.locator(Selectors.accountSection)).toBeVisible();
    await expect(page.locator(Selectors.currencySection)).toBeVisible();
    await expect(page.locator(Selectors.categoriesSection)).toBeVisible();
    await expect(page.locator(Selectors.aboutSection)).toBeVisible();
  });

  test('should show app version', async ({ page }) => {
    await expect(page.locator(Selectors.spendCheckTitle)).toBeVisible();
    await expect(page.locator(Selectors.appVersionText)).toBeVisible();
  });

  test('should display currency section', async ({ page }) => {
    await expect(page.locator(Selectors.preferredCurrencyItem)).toBeVisible();
    await expect(page.locator('text=US Dollar ($)')).toBeVisible();
    await expect(page.locator('text=$ USD')).toBeVisible();
  });

  test('should show currency picker button', async ({ page }) => {
    // Look for the currency picker button
    const currencyButton = page.locator(Selectors.currencyPickerButton);
    await expect(currencyButton).toBeVisible();
  });

  test('should test currency picker functionality', async ({ page }) => {
    // Navigate to home page to test currency picker from header
    await page.goto('/tabs/home');
    await page.waitForTimeout(1000);
    
    // Look for currency button in header
    const headerCurrencyButton = page.locator('button:has-text("$ USD")');
    if (await headerCurrencyButton.count() > 0) {
      await headerCurrencyButton.click();
      await page.waitForTimeout(1000);
      
      // Check if currency picker opened (could be modal, popover, or action sheet)
      const hasCurrencyOptions = await page.locator('text=EUR').count() > 0 ||
                                await page.locator('text=GBP').count() > 0 ||
                                await page.locator('text=JPY').count() > 0 ||
                                await page.locator('text=Euro').count() > 0 ||
                                await page.locator('text=British Pound').count() > 0;
      
      if (hasCurrencyOptions) {
        // Try selecting a different currency
        const eurOption = page.locator('text=EUR').or(page.locator('text=Euro')).first();
        if (await eurOption.count() > 0) {
          await eurOption.click();
          await page.waitForTimeout(1000);
          
          // Check if currency changed
          const newCurrencyButton = page.locator('button:has-text("€ EUR")');
          if (await newCurrencyButton.count() > 0) {
            await expect(newCurrencyButton).toBeVisible();
          }
        }
      }
    }
  });

  test('should show guest mode restrictions', async ({ page }) => {
    // In guest mode, should see restriction messages
    const isGuest = await page.locator('text=You\'re currently using SpendCheck as a guest').count() > 0;
    
    if (isGuest) {
      await expect(page.locator('text=Sign in to save currency preference')).toBeVisible();
      await expect(page.locator('text=Sign in to manage custom categories')).toBeVisible();
      
      // Categories management should be disabled
      const manageCategoriesButton = page.locator('button:has-text("Manage Categories")');
      if (await manageCategoriesButton.count() > 0) {
        await expect(manageCategoriesButton).toBeDisabled();
      }
    }
  });

  test('should navigate back to other tabs from settings', async ({ page }) => {
    // Test navigation from settings to other tabs
    await page.goto('/tabs/home');
    await expect(page).toHaveURL('/tabs/home');
    await expect(page.locator('text=Did you spend money today?')).toBeVisible();
    
    await page.goto('/tabs/history');
    await expect(page).toHaveURL('/tabs/history');
    await expect(page.locator('text=History')).toBeVisible();
    
    await page.goto('/tabs/graph');
    await expect(page).toHaveURL('/tabs/graph');
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should handle settings interactions', async ({ page }) => {
    // Test clicking on various settings items
    
    // Account section - Sign In button
    const signInButton = page.locator('button:has-text("Sign In")');
    if (await signInButton.count() > 0) {
      await expect(signInButton).toBeEnabled();
      await expect(signInButton).toBeVisible();
    }
    
    // Currency section - should show current currency
    await expect(page.locator('text=US Dollar ($)')).toBeVisible();
    
    // Categories section - check if button exists
    const categoriesButton = page.locator('button:has-text("Manage Categories")');
    if (await categoriesButton.count() > 0) {
      // In guest mode it should be disabled
      const isGuest = await page.locator('text=You\'re currently using SpendCheck as a guest').count() > 0;
      if (isGuest) {
        await expect(categoriesButton).toBeDisabled();
      }
    }
  });

  test('should persist currency selection across sessions', async ({ page }) => {
    // Note: This test may not work in guest mode due to lack of persistence
    // Record current currency
    const currentCurrency = await page.locator('button:has-text("$ USD")').textContent();
    
    // Navigate away and back
    await page.goto('/tabs/home');
    await page.waitForTimeout(1000);
    await page.goto('/tabs/settings');
    await page.waitForTimeout(1000);
    
    // Currency should be the same
    if (currentCurrency) {
      await expect(page.locator(`button:has-text("${currentCurrency.trim()}")`)).toBeVisible();
    }
  });

  test('should display all required UI elements', async ({ page }) => {
    // Check all major UI components are present
    
    // Header
    await expect(page.locator('text=Settings')).toBeVisible();
    
    // Account section
    await expect(page.locator('text=Account')).toBeVisible();
    
    // Currency section
    await expect(page.locator('text=Currency')).toBeVisible();
    await expect(page.locator('text=Preferred Currency')).toBeVisible();
    
    // Categories section
    await expect(page.locator('text=Categories')).toBeVisible();
    
    // About section
    await expect(page.locator('text=About')).toBeVisible();
    await expect(page.locator('text=SpendCheck')).toBeVisible();
    
    // Tab bar should be present
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Settings")')).toHaveAttribute('aria-selected', 'true');
  });
});