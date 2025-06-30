/**
 * Supabase User Service - Handles user preferences with Supabase
 * Replaces Prisma-based user service for frontend use
 */

import { supabase } from '@/lib/supabase'
import type { UserPreference } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

export class SupabaseUserService {
  /**
   * Create default user preferences on signup
   */
  static async createDefaultUserPreferences(userId: string): Promise<UserPreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          currency_code: 'USD',
          currency_symbol: '$',
          currency_name: 'US Dollar',
          theme: 'auto',
          notifications_enabled: true
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to create user preferences:', error)
      return null
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          return await this.createDefaultUserPreferences(userId)
        }
        console.error('Error fetching user preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      return null
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string,
    updates: {
      currency_code?: string
      currency_symbol?: string
      currency_name?: string 
      theme?: string
      notifications_enabled?: boolean
    }
  ): Promise<UserPreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      return null
    }
  }

  /**
   * Initialize user data on first authentication
   */
  static async initializeUserData(userId: string): Promise<UserPreference | null> {
    try {
      // Ensure user preferences exist
      const preferences = await this.getUserPreferences(userId)
      
      return preferences
    } catch (error) {
      console.error('Failed to initialize user data:', error)
      return null
    }
  }
}

/**
 * Enhanced useUserService composable with Supabase integration
 */
export function useSupabaseUserService() {
  const { user, isAuthenticated, isRealUser } = useAuth()

  /**
   * Initialize user preferences when user signs in
   */
  const initializeUser = async (): Promise<UserPreference | null> => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }

    return await SupabaseUserService.initializeUserData(user.value.id)
  }

  /**
   * Get user preferences
   */
  const getUserPreferences = async (): Promise<UserPreference | null> => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }

    return await SupabaseUserService.getUserPreferences(user.value.id)
  }

  /**
   * Update user preferences
   */
  const updateUserPreferences = async (updates: Parameters<typeof SupabaseUserService.updateUserPreferences>[1]): Promise<UserPreference | null> => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }

    return await SupabaseUserService.updateUserPreferences(user.value.id, updates)
  }

  return {
    initializeUser,
    getUserPreferences,
    updateUserPreferences,
    isAuthenticated,
    isRealUser
  }
}