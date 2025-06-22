import { test, expect } from '@playwright/test';

test.describe('Navigation and Page Loading', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that we're redirected to /tabs/home
    await expect(page).toHaveURL('/tabs/home');
    
    // Check page title
    await expect(page).toHaveTitle('SpendCheck');
    
    // Check main elements are present
    await expect(page.locator('text=SpendCheck')).toBeVisible();
    await expect(page.locator('text=Did you spend money today?')).toBeVisible();
    await expect(page.locator('text=Any spending?')).toBeVisible();
    await expect(page.locator('text=Total Today')).toBeVisible();
    await expect(page.locator('text=Total This Month')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Test History tab
    await page.goto('/tabs/history');
    await expect(page).toHaveURL('/tabs/history');
    await expect(page.locator('text=History')).toBeVisible();
    
    // Test Stats/Graph tab
    await page.goto('/tabs/graph');
    await expect(page).toHaveURL('/tabs/graph');
    await expect(page.locator('text=Analytics')).toBeVisible();
    
    // Test Settings tab
    await page.goto('/tabs/settings');
    await expect(page).toHaveURL('/tabs/settings');
    await expect(page.locator('text=Settings')).toBeVisible();
    
    // Return to Home
    await page.goto('/tabs/home');
    await expect(page).toHaveURL('/tabs/home');
  });

  test('should show correct initial state', async ({ page }) => {
    await page.goto('/');
    
    // Check initial amounts are $0.00
    await expect(page.locator('text=$0.00').first()).toBeVisible();
    
    // Check currency selector shows USD
    await expect(page.locator('text=$ USD')).toBeVisible();
    
    // Check activity section
    await expect(page.locator('text=Activity')).toBeVisible();
    await expect(page.locator('text=Grid')).toBeVisible();
    await expect(page.locator('text=Line')).toBeVisible();
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/');
    
    // Check that main spending button is visible
    await expect(page.locator('button:has-text("Any spending?")')).toBeVisible();
    
    // Check that tab bar is present
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Home")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("History")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Stats")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Settings")')).toBeVisible();
  });
});