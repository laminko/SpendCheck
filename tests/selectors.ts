/**
 * Test Selectors - Specific selectors for Playwright tests
 * These selectors are designed to be unique and avoid strict mode violations
 */

export const Selectors = {
  // Navigation
  homeTab: '#tab-button-home',
  historyTab: '#tab-button-history', 
  graphTab: '#tab-button-graph',
  settingsTab: '#tab-button-settings',
  
  // Page Titles (specific to page headers, not tab labels)
  historyPageTitle: 'ion-header ion-title:has-text("History")',
  settingsPageTitle: 'ion-header ion-title:has-text("Settings")',
  homePageTitle: 'ion-title:has-text("SpendCheck")',
  graphPageTitle: 'ion-header ion-title:has-text("Stats")',

  // Settings Page
  settingsTitle: 'ion-header ion-title:has-text("Settings")',
  accountSection: 'ion-list-header:has-text("Account")',
  currencySection: 'ion-list-header:has-text("Currency")',
  categoriesSection: 'ion-list-header:has-text("Categories")',
  aboutSection: 'ion-list-header:has-text("About")',
  preferencesSection: 'ion-list-header:has-text("Preferences")',

  // Authentication
  signInButton: 'ion-item:has-text("Sign In")',
  guestStateText: 'text=You\'re currently using SpendCheck as a guest',
  signInDescription: 'text=Save your preferences and access advanced features',
  currencySignInPrompt: 'text=Sign in to save currency preference',
  categorySignInPrompt: 'text=Sign in to manage custom categories',
  
  // Auth Modal
  authModal: 'ion-modal:has(ion-title:text("Sign In"))',
  continueWithEmailButton: 'ion-button:has-text("Continue with Email")',
  emailInput: 'ion-input[type="email"]',
  passwordInput: 'ion-input[type="password"]',
  signInModalButton: 'ion-button:has-text("Sign In"):not([fill="clear"])',
  googleSignInButton: 'ion-button:has-text("Continue with Google")',
  facebookSignInButton: 'ion-button:has-text("Continue with Facebook")',
  
  // Currency
  preferredCurrencyItem: 'ion-item:has-text("Preferred Currency")',
  currencyPickerButton: 'button.currency-button',
  currencyModal: 'ion-modal:has(ion-title:text("Select Currency"))',
  currencySearchInput: 'ion-searchbar input',
  
  // Spending Entry
  spendButton: 'button.circular-spend-button',
  spendingDialog: 'ion-modal:has(ion-title:text("Add Spending"))',
  amountInput: 'input[placeholder="0.00"]',
  saveButton: 'ion-button[color="primary"]:has-text("Save")',
  saveButtonDisabled: 'ion-button[color="primary"]:has-text("Save")[disabled]',
  cancelButton: 'ion-button[fill="clear"]:has-text("Cancel")',
  categoryLabel: 'ion-label:has-text("Category")',
  categorySelect: 'ion-select[placeholder="Select category (optional)"]',
  closeButton: 'ion-modal ion-header ion-button[fill="clear"]',
  
  // Categories
  categoryItems: '.category-item',
  categoryButton: (categoryName: string) => `.category-item:has-text("${categoryName}")`,
  
  // Stats
  todayTotalCard: 'ion-card:has(.stat-label:text("Total Today"))',
  monthTotalCard: 'ion-card:has(.stat-label:text("This Month"))',
  
  // App Info
  appVersionText: 'text=Version 1.2.0',
  spendCheckTitle: 'ion-item:has-text("SpendCheck") h3',
  
  // Theme and Preferences
  themeSelect: 'ion-select[placeholder="Select Theme"]',
  notificationToggle: 'ion-toggle[checked]',
}