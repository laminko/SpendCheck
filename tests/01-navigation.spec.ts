import { test, expect } from '@playwright/test';
import { Selectors } from './selectors';

test.describe('Essential App Navigation', () => {
  test('should load home page and show core elements', async ({ page }) => {
    await page.goto('/');
    
    // Verify app loads correctly
    await expect(page).toHaveURL('/tabs/home');
    await expect(page).toHaveTitle('SpendCheck');
    
    // Verify essential business elements are present
    await expect(page.locator('text=SpendCheck')).toBeVisible();
    await expect(page.locator(Selectors.spendButton)).toBeVisible();
    await expect(page.locator('text=Total Today')).toBeVisible();
    await expect(page.locator('text=Total This Month')).toBeVisible();
  });

  test('should navigate to key business pages', async ({ page }) => {
    await page.goto('/');
    
    // Test History page (view past spending)
    await page.goto('/tabs/history');
    await expect(page).toHaveURL('/tabs/history');
    await expect(page.locator(Selectors.historyPageTitle)).toBeVisible();
    
    // Test Stats page (analytics)
    await page.goto('/tabs/graph');
    await expect(page).toHaveURL('/tabs/graph');
    await expect(page.locator(Selectors.graphPageTitle)).toBeVisible();
    
    // Return to Home (core functionality)
    await page.goto('/tabs/home');
    await expect(page).toHaveURL('/tabs/home');
  });
});