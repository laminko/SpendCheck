import { test, expect } from '@playwright/test';

test.describe('Spending Entry Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for authentication to initialize
    await page.waitForTimeout(2000);
  });

  test('should open spending dialog when clicking spend button', async ({ page }) => {
    // Click the main spending button
    await page.click('button:has-text("Any spending?")');
    
    // Check that dialog opened
    await expect(page.locator('text=Add Spending')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should validate amount input', async ({ page }) => {
    await page.click('button:has-text("Any spending?")');
    await expect(page.locator('text=Add Spending')).toBeVisible();
    
    // Save button should be disabled initially
    await expect(page.locator('button:has-text("Save")')).toBeDisabled();
    
    // Enter a valid amount
    await page.fill('input[placeholder="0.00"]', '25.50');
    
    // Save button should now be enabled
    await expect(page.locator('button:has-text("Save")')).toBeEnabled();
    
    // Clear amount
    await page.fill('input[placeholder="0.00"]', '');
    
    // Save button should be disabled again
    await expect(page.locator('button:has-text("Save")')).toBeDisabled();
  });

  test('should add spending entry successfully', async ({ page }) => {
    // Record initial totals
    const initialTodayTotal = await page.locator('text=Total Today').locator('..').locator('div').first().textContent();
    
    // Open spending dialog
    await page.click('button:has-text("Any spending?")');
    await expect(page.locator('text=Add Spending')).toBeVisible();
    
    // Enter amount
    await page.fill('input[placeholder="0.00"]', '15.75');
    await expect(page.locator('button:has-text("Save")')).toBeEnabled();
    
    // Save the entry
    await page.click('button:has-text("Save")');
    
    // Check for success message
    await expect(page.locator('text=tracked successfully')).toBeVisible({ timeout: 10000 });
    
    // Wait for data to update
    await page.waitForTimeout(3000);
    
    // Check that totals updated (should be different from initial)
    const newTodayTotal = await page.locator('text=Total Today').locator('..').locator('div').first().textContent();
    expect(newTodayTotal).not.toBe(initialTodayTotal);
  });

  test('should handle date and time selection', async ({ page }) => {
    await page.click('button:has-text("Any spending?")');
    await expect(page.locator('text=Add Spending')).toBeVisible();
    
    // Check that date/time elements are present
    await expect(page.locator('text=Date')).toBeVisible();
    
    // Current date/time should be pre-selected
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: '2-digit' 
    });
    
    // Date button should show current date
    await expect(page.locator(`text=${currentDate}`)).toBeVisible();
  });

  test('should handle category selection', async ({ page }) => {
    await page.click('button:has-text("Any spending?")');
    await expect(page.locator('text=Add Spending')).toBeVisible();
    
    // Check category selector
    await expect(page.locator('text=Select category (optional)')).toBeVisible();
    
    // Enter amount to enable save
    await page.fill('input[placeholder="0.00"]', '10.00');
    
    // Should be able to save without category
    await expect(page.locator('button:has-text("Save")')).toBeEnabled();
  });

  test('should cancel spending entry', async ({ page }) => {
    await page.click('button:has-text("Any spending?")');
    await expect(page.locator('text=Add Spending')).toBeVisible();
    
    // Enter some data
    await page.fill('input[placeholder="0.00"]', '20.00');
    
    // Cancel the dialog
    await page.click('button:has-text("Cancel")');
    
    // Dialog should close
    await expect(page.locator('text=Add Spending')).not.toBeVisible();
    
    // Should be back on home page
    await expect(page.locator('text=Did you spend money today?')).toBeVisible();
  });

  test('should close dialog with X button', async ({ page }) => {
    await page.click('button:has-text("Any spending?")');
    await expect(page.locator('text=Add Spending')).toBeVisible();
    
    // Click the X button (close icon)
    await page.click('ion-button[fill="clear"]');
    
    // Dialog should close
    await expect(page.locator('text=Add Spending')).not.toBeVisible();
  });

  test('should persist multiple spending entries', async ({ page }) => {
    // Add first entry
    await page.click('button:has-text("Any spending?")');
    await page.fill('input[placeholder="0.00"]', '5.00');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=tracked successfully')).toBeVisible({ timeout: 10000 });
    
    // Wait for toast to disappear
    await page.waitForTimeout(3000);
    
    // Add second entry
    await page.click('button:has-text("Any spending?")');
    await page.fill('input[placeholder="0.00"]', '8.25');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=tracked successfully')).toBeVisible({ timeout: 10000 });
    
    // Wait for data to update
    await page.waitForTimeout(3000);
    
    // Total should reflect both entries
    const finalTotal = await page.locator('text=Total Today').locator('..').locator('div').first().textContent();
    expect(finalTotal).toContain('13.25'); // 5.00 + 8.25
  });
});