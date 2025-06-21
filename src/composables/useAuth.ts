import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const userId = ref<string | null>(null)
const user = ref<any>(null)
const isRealUser = ref(false)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!userId.value)

  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) {
        console.error('Error signing in anonymously:', error)
        throw new Error('Failed to authenticate with Supabase')
      }
      
      if (data.user) {
        userId.value = data.user.id
        user.value = data.user
        isRealUser.value = !data.user.is_anonymous
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
        userId.value = session.user.id
        user.value = session.user
        isRealUser.value = !session.user.is_anonymous
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
          userId.value = session.user.id
          user.value = session.user
          isRealUser.value = !session.user.is_anonymous
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
        userId.value = data.user.id
        user.value = data.user
        isRealUser.value = true
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
        userId.value = data.user.id
        user.value = data.user
        isRealUser.value = true
        return { success: true, user: data.user, session: data.session }
      }
      
      throw new Error('No user returned from sign in')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
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

  // Listen for auth state changes
  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        userId.value = session.user.id
        user.value = session.user
        isRealUser.value = !session.user.is_anonymous
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
    signInAnonymously,
    signUpWithEmail,
    signInWithEmail,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    initializeAuth,
    ensureValidSession,
    signOut,
    setupAuthListener
  }
}