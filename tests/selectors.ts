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

  // Settings Page
  settingsTitle: 'ion-header ion-title:has-text("Settings")',
  accountSection: 'ion-list-header:has-text("Account")',
  currencySection: 'ion-list-header:has-text("Currency")',
  categoriesSection: 'ion-list-header:has-text("Categories")',
  aboutSection: 'ion-list-header:has-text("About")',
  preferencesSection: 'ion-list-header:has-text("Preferences")',

  // Authentication
  signInButton: 'ion-item:has-text("Save your preferences and access advanced features")',
  guestStateText: 'text=You\'re currently using SpendCheck as a guest',
  signInDescription: 'text=Save your preferences and access advanced features',
  currencySignInPrompt: 'text=Sign in to save currency preference',
  categorySignInPrompt: 'text=Sign in to manage custom categories',
  
  // Auth Modal
  authModal: 'ion-modal[is-open="true"]',
  emailInput: 'ion-input[label="Email"] input',
  passwordInput: 'ion-input[label="Password"] input',
  signInModalButton: 'ion-button:has-text("Sign In"):not([fill="clear"])',
  
  // Currency
  preferredCurrencyItem: 'ion-item:has-text("Preferred Currency")',
  currencyPickerButton: 'button.currency-button',
  currencyModal: 'ion-modal:has(ion-title:text("Select Currency"))',
  currencySearchInput: 'ion-searchbar input',
  
  // Spending Entry
  spendButton: 'button.circular-spend-button',
  spendingDialog: 'ion-modal:has(ion-title:text("Add Spending"))',
  amountInput: 'input[placeholder="0.00"]',
  saveButton: 'ion-button:has-text("Save")',
  cancelButton: 'ion-button:has-text("Cancel")',
  
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