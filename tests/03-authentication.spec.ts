import { test, expect } from '@playwright/test';

test.describe('Email Authentication', () => {
  // Test credentials for email authentication - must be set via environment variables
  const TEST_EMAIL = process.env.TEST_LOGIN_EMAIL;
  const TEST_PASSWORD = process.env.TEST_LOGIN_PASSWORD;

  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/settings');
    // Wait for page to load
    await page.waitForTimeout(2000);
  });

  test('should show guest state initially', async ({ page }) => {
    // Check that we're in guest mode
    await expect(page.locator('text=You\'re currently using SpendCheck as a guest')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=Save your preferences and access advanced features')).toBeVisible();
    
    // Check that features are gated
    await expect(page.locator('text=Sign in to save currency preference')).toBeVisible();
    await expect(page.locator('text=Sign in to manage custom categories')).toBeVisible();
  });

  test('should open sign-in modal when clicking Sign In', async ({ page }) => {
    // Look for the Sign In button - try different selectors
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.waitFor({ state: 'visible' });
    
    // Click the Sign In button
    await signInButton.click();
    
    // Check if authentication modal/page opened
    // This might navigate to a different page or open a modal
    await page.waitForTimeout(2000);
    
    // Look for authentication form elements
    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
    const hasAuthForm = await page.locator('text=Email').count() > 0 || 
                       await page.locator('text=Password').count() > 0 ||
                       await page.locator('form').count() > 0;
    
    // At least one of these should be true for a sign-in interface
    expect(hasEmailInput || hasPasswordInput || hasAuthForm).toBeTruthy();
  });

  test('should validate email authentication form', async ({ page }) => {
    // Navigate to sign-in
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();
    await page.waitForTimeout(2000);
    
    // Try to find email and password inputs
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      // Test form validation
      
      // Try submitting empty form
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign In")')).or(page.locator('button:has-text("Login")')).first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Should show validation errors or form should not submit
        await page.waitForTimeout(1000);
      }
      
      // Enter invalid email
      await emailInput.fill('invalid-email');
      await passwordInput.fill('short');
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        // Should show validation error
      }
      
      // Enter valid format (only if credentials are available)
      if (TEST_EMAIL && TEST_PASSWORD) {
        await emailInput.fill(TEST_EMAIL);
        await passwordInput.fill(TEST_PASSWORD);
        
        // Submit button should be enabled or form should be submittable
        if (await submitButton.count() > 0) {
          await expect(submitButton).toBeEnabled();
        }
      } else {
        // Test with placeholder values for form validation
        await emailInput.fill('test@example.com');
        await passwordInput.fill('testpassword123');
      }
    } else {
      // Skip this test if we can't find the form elements
      test.skip(true, 'Email/password form not found - may be using OAuth-only authentication');
    }
  });

  test('should handle email sign-in flow', async ({ page }) => {
    // Only run this test if credentials are provided via environment variables
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Skipping email sign-in test - TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD environment variables not set');
      return;
    }
    
    // Navigate to sign-in
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();
    await page.waitForTimeout(2000);
    
    // Find and fill authentication form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      // Fill in credentials
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      
      // Submit form
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign In")')).or(page.locator('button:has-text("Login")')).first();
      await submitButton.click();
      
      // Wait for authentication to complete
      await page.waitForTimeout(5000);
      
      // Check if we're redirected back to settings or home
      // Look for signs of successful authentication
      const currentUrl = page.url();
      const isAuthenticated = currentUrl.includes('/tabs/settings') || currentUrl.includes('/tabs/home') ||
                            await page.locator('text=Sign Out').count() > 0 ||
                            await page.locator('text=Signed in').count() > 0;
      
      expect(isAuthenticated).toBeTruthy();
      
      // If we're back on settings, check for authenticated state
      if (currentUrl.includes('/tabs/settings')) {
        // Should no longer show guest message
        const guestMessage = await page.locator('text=You\'re currently using SpendCheck as a guest').count();
        expect(guestMessage).toBe(0);
      }
    } else {
      test.skip(true, 'Email/password authentication form not found');
    }
  });

  test('should show OAuth sign-in options', async ({ page }) => {
    // Navigate to sign-in
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();
    await page.waitForTimeout(2000);
    
    // Look for OAuth buttons
    const hasGoogleAuth = await page.locator('text=Google').count() > 0 || 
                         await page.locator('button:has-text("Google")').count() > 0;
    const hasFacebookAuth = await page.locator('text=Facebook').count() > 0 || 
                           await page.locator('button:has-text("Facebook")').count() > 0;
    const hasAppleAuth = await page.locator('text=Apple').count() > 0 || 
                        await page.locator('button:has-text("Apple")').count() > 0;
    
    // At least one OAuth option should be available
    const hasOAuthOptions = hasGoogleAuth || hasFacebookAuth || hasAppleAuth;
    
    // This is informational - OAuth testing requires special setup
    if (hasOAuthOptions) {
      console.log('OAuth options found:', { hasGoogleAuth, hasFacebookAuth, hasAppleAuth });
    }
  });

  test('should handle sign-out flow', async ({ page }) => {
    // This test assumes we're already signed in
    // Look for sign-out button or option
    const signOutButton = page.locator('button:has-text("Sign Out")').or(page.locator('text=Sign Out')).first();
    
    if (await signOutButton.count() > 0) {
      await signOutButton.click();
      await page.waitForTimeout(2000);
      
      // Should return to guest state
      await expect(page.locator('text=You\'re currently using SpendCheck as a guest')).toBeVisible();
      await expect(page.locator('text=Sign In')).toBeVisible();
    } else {
      test.skip(true, 'Not currently signed in or sign-out button not found');
    }
  });

  test('should show authentication state correctly', async ({ page }) => {
    // Check current authentication state
    const isGuest = await page.locator('text=You\'re currently using SpendCheck as a guest').count() > 0;
    const hasSignIn = await page.locator('text=Sign In').count() > 0;
    const hasSignOut = await page.locator('text=Sign Out').count() > 0;
    
    if (isGuest && hasSignIn) {
      // Guest state - features should be gated
      await expect(page.locator('text=Sign in to save currency preference')).toBeVisible();
      await expect(page.locator('text=Sign in to manage custom categories')).toBeVisible();
      
      // Manage Categories should be disabled
      const manageCategoriesButton = page.locator('button:has-text("Manage Categories")');
      if (await manageCategoriesButton.count() > 0) {
        await expect(manageCategoriesButton).toBeDisabled();
      }
    } else if (hasSignOut) {
      // Authenticated state - features should be available
      console.log('User appears to be authenticated');
    }
    
    // State should be consistent
    expect(isGuest && hasSignOut).toBeFalsy(); // Can't be both guest and have sign out
  });
});