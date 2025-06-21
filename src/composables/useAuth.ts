import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const userId = ref<string | null>(null)

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
        // Update local userId if needed
        if (userId.value !== session.user.id) {
          userId.value = session.user.id
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      userId.value = null
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return {
    userId: computed(() => userId.value),
    isAuthenticated,
    signInAnonymously,
    initializeAuth,
    ensureValidSession,
    signOut
  }
}