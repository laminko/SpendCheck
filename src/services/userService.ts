/**
 * User Service - Handles user signup and preferences creation
 * Replaces database trigger: create_user_preferences_on_signup
 */

import { db } from '@/lib/database'
import { useAuth } from '@/composables/useAuth'

export class UserService {
  /**
   * Handle new user signup - creates default preferences
   * This replaces the database trigger functionality
   */
  static async handleUserSignup(userId: string): Promise<void> {
    try {
      // Create default user preferences
      await db.createDefaultUserPreferences(userId)
      
      // Seed system categories if needed (idempotent operation)
      await db.seedSystemCategories()
      
      console.log(`✅ User preferences created for user: ${userId}`)
    } catch (error) {
      console.error('❌ Failed to create user preferences:', error)
      throw error
    }
  }

  /**
   * Get user preferences with fallback creation
   */
  static async getUserPreferences(userId: string) {
    try {
      let preferences = await db.getUserPreferences(userId)
      
      // If preferences don't exist, create them
      if (!preferences) {
        console.log('Creating missing user preferences...')
        preferences = await db.createDefaultUserPreferences(userId)
      }
      
      return preferences
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      throw error
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string,
    updates: {
      currencyCode?: string
      currencySymbol?: string
      currencyName?: string 
      theme?: string
      notificationsEnabled?: boolean
    }
  ) {
    try {
      return await db.updateUserPreferences(userId, updates)
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      throw error
    }
  }

  /**
   * Initialize user data on first authentication
   * Call this when user first signs in/up
   */
  static async initializeUserData(userId: string): Promise<void> {
    try {
      // Ensure user preferences exist
      await this.handleUserSignup(userId)
      
      console.log(`✅ User data initialized for: ${userId}`)
    } catch (error) {
      console.error('❌ Failed to initialize user data:', error)
      throw error
    }
  }
}

/**
 * Enhanced useAuth composable with ORM integration
 * Extends the existing auth composable with user service integration
 */
export function useUserService() {
  const { user, isAuthenticated } = useAuth()

  /**
   * Initialize user preferences when user signs in
   */
  const initializeUser = async () => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }

    await UserService.initializeUserData(user.value.id)
  }

  /**
   * Get user preferences
   */
  const getUserPreferences = async () => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }

    return await UserService.getUserPreferences(user.value.id)
  }

  /**
   * Update user preferences
   */
  const updateUserPreferences = async (updates: Parameters<typeof UserService.updateUserPreferences>[1]) => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }

    return await UserService.updateUserPreferences(user.value.id, updates)
  }

  return {
    initializeUser,
    getUserPreferences,
    updateUserPreferences
  }
}