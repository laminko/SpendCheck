/**
 * Enhanced Auth Composable with ORM Integration
 * Extends the existing auth composable with automatic user preferences creation
 * Replaces database trigger functionality with application-level logic
 */

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { UserService } from '@/services/userService'

const userId = ref<string | null>(null)
const user = ref<any>(null)
const isRealUser = ref(false)
const isInitializingUser = ref(false)

export const useAuthORM = () => {
  const isAuthenticated = computed(() => !!userId.value)

  /**
   * Initialize user data when authenticated
   * Replaces the database trigger for user preferences creation
   */
  const initializeUserData = async (userObj: any) => {
    if (!userObj || isInitializingUser.value) return

    try {
      isInitializingUser.value = true
      
      // Only initialize for real users (not anonymous)
      if (!userObj.is_anonymous) {
        console.log('🔧 Initializing user data for:', userObj.id)
        await UserService.initializeUserData(userObj.id)
      }
    } catch (error) {
      console.error('❌ Failed to initialize user data:', error)
      // Don't throw error here as it shouldn't break the auth flow
    } finally {
      isInitializingUser.value = false
    }
  }

  /**
   * Update local auth state and initialize user data
   */
  const updateAuthState = async (userObj: any, shouldInitialize = false) => {
    userId.value = userObj.id
    user.value = userObj
    isRealUser.value = !userObj.is_anonymous

    // Initialize user data for new real users
    if (shouldInitialize && !userObj.is_anonymous) {
      await initializeUserData(userObj)
    }
  }

  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) {
        console.error('Error signing in anonymously:', error)
        throw new Error('Failed to authenticate with Supabase')
      }
      
      if (data.user) {
        await updateAuthState(data.user)
        return { success: true, userId: data.user.id }
      }
      
      throw new Error('No user returned from Supabase auth')
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      throw error
    }
  }

  const initializeAuth = async () => {
    try {
      // Check if we have an existing Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await updateAuthState(session.user)
        return session.user.id
      }
      
      // No existing session, create a new anonymous session
      const result = await signInAnonymously()
      return result.userId
    } catch (error) {
      console.error('Error initializing auth:', error)
      throw error
    }
  }

  const ensureValidSession = async () => {
    try {
      // First check if we have a current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Update local state if needed
        if (userId.value !== session.user.id) {
          await updateAuthState(session.user)
        }
        return session.user.id
      }
      
      // No valid session, initialize auth
      return await initializeAuth()
    } catch (error) {
      console.error('Error ensuring valid session:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        console.error('Error signing up:', error)
        throw error
      }
      
      if (data.user) {
        // Initialize user data for new signup
        await updateAuthState(data.user, true)
        return { success: true, user: data.user, session: data.session }
      }
      
      throw new Error('No user returned from sign up')
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Error signing in:', error)
        throw error
      }
      
      if (data.user) {
        // Check if this is a first-time sign in that needs initialization
        await updateAuthState(data.user, true)
        return { success: true, user: data.user, session: data.session }
      }
      
      throw new Error('No user returned from sign in')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      
      if (error) {
        console.error(`Error signing in with ${provider}:`, error)
        throw error
      }
      
      return { success: true }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('Error sending reset password email:', error)
        throw error
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error sending reset password email:', error)
      throw error
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('Error updating password:', error)
        throw error
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      userId.value = null
      user.value = null
      isRealUser.value = false
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Enhanced auth state change listener with user initialization
  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const wasAnonymous = userId.value && !isRealUser.value
        const isNewRealUser = !session.user.is_anonymous && Boolean(wasAnonymous)
        
        await updateAuthState(session.user, isNewRealUser)
        
        // Log auth events for debugging
        console.log(`🔐 Auth event: ${event}`, {
          userId: session.user.id,
          isAnonymous: session.user.is_anonymous,
          isNewRealUser
        })
      } else {
        userId.value = null
        user.value = null
        isRealUser.value = false
      }
    })
  }

  return {
    userId: computed(() => userId.value),
    user: computed(() => user.value),
    isRealUser: computed(() => isRealUser.value),
    isAuthenticated,
    isInitializingUser: computed(() => isInitializingUser.value),
    signInAnonymously,
    signUpWithEmail,
    signInWithEmail,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    initializeAuth,
    ensureValidSession,
    signOut,
    setupAuthListener,
    initializeUserData
  }
}