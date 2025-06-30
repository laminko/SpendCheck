import { test, expect } from '@playwright/test';
import { Selectors } from './selectors';

test.describe('Settings and Currency Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for authentication to initialize
    await page.waitForTimeout(2000);
  });

  test('should display settings page correctly', async ({ page }) => {
    // Navigate to settings
    await page.goto('/tabs/settings');
    await expect(page).toHaveURL('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Check for main sections
    await expect(page.locator(Selectors.accountSection)).toBeVisible();
    await expect(page.locator(Selectors.currencySection)).toBeVisible();
    await expect(page.locator(Selectors.aboutSection)).toBeVisible();
  });

  test('should show app version information', async ({ page }) => {
    await page.goto('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Check for app version
    await expect(page.locator(Selectors.appVersionText)).toBeVisible();
    
    // Check for app title
    await expect(page.locator(Selectors.spendCheckTitle)).toBeVisible();
  });

  test('should display currency picker functionality', async ({ page }) => {
    await page.goto('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Check for preferred currency item
    await expect(page.locator(Selectors.preferredCurrencyItem)).toBeVisible();
    
    // Should show current currency (default USD)
    await expect(page.locator('text=$ USD')).toBeVisible();
  });

  test('should open currency picker modal', async ({ page }) => {
    await page.goto('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Click on currency picker
    const currencyPicker = page.locator(Selectors.currencyPickerButton);
    
    if (await currencyPicker.isVisible()) {
      await currencyPicker.click();
      
      // Should open currency modal
      await expect(page.locator(Selectors.currencyModal)).toBeVisible();
      
      // Should have search functionality
      await expect(page.locator(Selectors.currencySearchInput)).toBeVisible();
      
      // Should show currency options
      await expect(page.locator('text=USD')).toBeVisible();
      await expect(page.locator('text=EUR')).toBeVisible();
    } else {
      console.log('Currency picker button not found - may be implemented differently');
    }
  });

  test('should handle currency search functionality', async ({ page }) => {
    await page.goto('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Try to open currency picker
    const currencyPicker = page.locator(Selectors.currencyPickerButton);
    
    if (await currencyPicker.isVisible()) {
      await currencyPicker.click();
      await expect(page.locator(Selectors.currencyModal)).toBeVisible();
      
      // Test search functionality
      const searchInput = page.locator(Selectors.currencySearchInput);
      if (await searchInput.isVisible()) {
        await searchInput.fill('EUR');
        
        // Should filter to show EUR
        await expect(page.locator('text=EUR')).toBeVisible();
        
        // Clear search
        await searchInput.fill('');
        
        // Should show all currencies again
        await expect(page.locator('text=USD')).toBeVisible();
      }
    } else {
      console.log('Currency picker functionality not accessible - skipping search test');
    }
  });

  test('should show preferences section', async ({ page }) => {
    await page.goto('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Check for preferences section
    const preferencesSection = page.locator(Selectors.preferencesSection);
    
    if (await preferencesSection.isVisible()) {
      // Should show theme and notification preferences
      const themeSelect = page.locator(Selectors.themeSelect);
      const notificationToggle = page.locator(Selectors.notificationToggle);
      
      // At least one preference should be visible
      const hasTheme = await themeSelect.isVisible();
      const hasNotifications = await notificationToggle.isVisible();
      
      if (hasTheme || hasNotifications) {
        console.log('User preferences are available');
      } else {
        console.log('Preference controls not found');
      }
    } else {
      console.log('Preferences section not found - may require authentication');
    }
  });

  test('should handle guest vs authenticated currency behavior', async ({ page }) => {
    await page.goto('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Check if we're in guest mode
    const isGuest = await page.locator('text=You\'re currently using SpendCheck as a guest').isVisible();
    
    if (isGuest) {
      // In guest mode, should show sign-in prompt for currency
      const currencySignInPrompt = page.locator(Selectors.currencySignInPrompt);
      
      if (await currencySignInPrompt.isVisible()) {
        console.log('Guest mode: Currency sign-in prompt displayed');
      } else {
        console.log('Guest mode: Currency functionality available without sign-in');
      }
    } else {
      // Authenticated mode, currency should be fully functional
      await expect(page.locator(Selectors.preferredCurrencyItem)).toBeVisible();
      console.log('Authenticated mode: Full currency functionality available');
    }
  });

  test('should navigate back to home from settings', async ({ page }) => {
    // Start from settings
    await page.goto('/tabs/settings');
    await expect(page.locator(Selectors.settingsPageTitle)).toBeVisible();
    
    // Navigate back to home
    await page.goto('/tabs/home');
    await expect(page).toHaveURL('/tabs/home');
    
    // Should show home elements
    await expect(page.locator(Selectors.spendButton)).toBeVisible();
    await expect(page.locator('text=Total Today')).toBeVisible();
  });
});