/**
 * Unified User Preferences Composable
 * Handles the integration between guest and authenticated user states
 * Manages data migration and preference synchronization
 */

import { ref, computed, watch } from 'vue'
import { useAuth } from './useAuth'
import { useCurrency } from './useCurrency'
import { useSupabaseUserService } from '@/services/supabaseUserService'
import type { UserPreference } from '@/lib/supabase'

// Global state for user preferences
const userPreferences = ref<UserPreference | null>(null)
const isLoadingPreferences = ref(false)
const preferencesError = ref<string | null>(null)

export function useUserPreferences() {
  const { isAuthenticated, isRealUser, user } = useAuth()
  const { getUserPreferences, updateUserPreferences, initializeUser } = useSupabaseUserService()
  const { loadSavedCurrency } = useCurrency()

  // Computed properties
  const hasPreferences = computed(() => !!userPreferences.value)
  const theme = computed(() => userPreferences.value?.theme || 'auto')
  const notificationsEnabled = computed(() => userPreferences.value?.notifications_enabled ?? true)

  /**
   * Load user preferences from database
   */
  const loadUserPreferences = async (): Promise<void> => {
    if (!isAuthenticated.value || !isRealUser.value || !user.value) {
      userPreferences.value = null
      return
    }

    try {
      isLoadingPreferences.value = true
      preferencesError.value = null

      const preferences = await getUserPreferences()
      userPreferences.value = preferences

      // Sync currency preference if loaded successfully
      if (preferences?.currency_code) {
        // Update the currency composable with database preference
        await loadSavedCurrency()
      }

      console.log('✅ User preferences loaded successfully')
    } catch (error) {
      preferencesError.value = error instanceof Error ? error.message : 'Failed to load preferences'
      console.error('❌ Failed to load user preferences:', error)
    } finally {
      isLoadingPreferences.value = false
    }
  }

  /**
   * Save current guest preferences to database for authenticated users
   */
  const migrateGuestPreferences = async (): Promise<void> => {
    if (!isAuthenticated.value || !isRealUser.value || !user.value) {
      console.log('Cannot migrate preferences: user not authenticated')
      return
    }

    try {
      console.log('🔄 Migrating guest preferences to database...')

      // Get current guest currency preference from localStorage
      const guestCurrency = localStorage.getItem('spendcheck_currency')
      let currencyUpdates = {}

      if (guestCurrency) {
        try {
          const parsed = JSON.parse(guestCurrency)
          currencyUpdates = {
            currency_code: parsed.code,
            currency_symbol: parsed.symbol,
            currency_name: parsed.name
          }
        } catch (error) {
          console.error('Failed to parse guest currency preference:', error)
        }
      }

      // Create or update user preferences with guest data
      const preferences = await updateUserPreferences({
        ...currencyUpdates,
        // Keep existing theme and notification preferences, or use defaults
        theme: userPreferences.value?.theme || 'auto',
        notifications_enabled: userPreferences.value?.notifications_enabled ?? true
      })

      if (preferences) {
        userPreferences.value = preferences
        console.log('✅ Guest preferences migrated successfully')
        
        // Clean up localStorage after successful migration
        localStorage.removeItem('spendcheck_currency')
      }
    } catch (error) {
      console.error('❌ Failed to migrate guest preferences:', error)
    }
  }

  /**
   * Initialize user preferences when user first authenticates
   */
  const initializeUserPreferences = async (): Promise<void> => {
    if (!isAuthenticated.value || !isRealUser.value) {
      return
    }

    try {
      console.log('🚀 Initializing user preferences...')

      // First, initialize the user (creates default preferences if needed)
      await initializeUser()

      // Load existing preferences
      await loadUserPreferences()

      // Migrate any guest preferences if this is a new user
      if (hasPreferences.value) {
        await migrateGuestPreferences()
      }

      console.log('✅ User preferences initialization complete')
    } catch (error) {
      console.error('❌ Failed to initialize user preferences:', error)
      preferencesError.value = error instanceof Error ? error.message : 'Failed to initialize preferences'
    }
  }

  /**
   * Update theme preference
   */
  const updateTheme = async (newTheme: string): Promise<void> => {
    if (!isAuthenticated.value || !isRealUser.value) {
      console.log('Theme preference not saved: user not authenticated')
      return
    }

    try {
      const updated = await updateUserPreferences({ theme: newTheme })
      if (updated) {
        userPreferences.value = updated
        console.log('✅ Theme preference updated')
      }
    } catch (error) {
      console.error('❌ Failed to update theme preference:', error)
    }
  }

  /**
   * Update notification preference
   */
  const updateNotifications = async (enabled: boolean): Promise<void> => {
    if (!isAuthenticated.value || !isRealUser.value) {
      console.log('Notification preference not saved: user not authenticated')
      return
    }

    try {
      const updated = await updateUserPreferences({ notifications_enabled: enabled })
      if (updated) {
        userPreferences.value = updated
        console.log('✅ Notification preference updated')
      }
    } catch (error) {
      console.error('❌ Failed to update notification preference:', error)
    }
  }

  /**
   * Reset to guest mode (clear preferences)
   */
  const resetToGuestMode = (): void => {
    userPreferences.value = null
    preferencesError.value = null
    console.log('🔄 Reset to guest mode')
  }

  // Watch for authentication state changes
  watch([isAuthenticated, isRealUser], async ([newAuth, newRealUser]) => {
    if (newAuth && newRealUser) {
      // User just authenticated, initialize preferences
      await initializeUserPreferences()
    } else {
      // User signed out or became anonymous, reset to guest mode
      resetToGuestMode()
    }
  }, { immediate: false })

  // Initial load for already authenticated users
  if (isAuthenticated.value && isRealUser.value) {
    loadUserPreferences()
  }

  return {
    // State
    userPreferences: computed(() => userPreferences.value),
    isLoadingPreferences: computed(() => isLoadingPreferences.value),
    preferencesError: computed(() => preferencesError.value),
    hasPreferences,
    
    // Computed preferences
    theme,
    notificationsEnabled,
    
    // Actions
    loadUserPreferences,
    initializeUserPreferences,
    migrateGuestPreferences,
    updateTheme,
    updateNotifications,
    resetToGuestMode,
    
    // Auth state
    isAuthenticated,
    isRealUser
  }
}