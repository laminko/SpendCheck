import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const userId = ref<string | null>(null)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!userId.value)

  const generateAnonymousId = () => {
    const id = 'anon_' + Math.random().toString(36).substring(2, 11)
    localStorage.setItem('spendcheck_user_id', id)
    userId.value = id
    return id
  }

  const getCurrentUserId = () => {
    if (userId.value) return userId.value
    
    const stored = localStorage.getItem('spendcheck_user_id')
    if (stored) {
      userId.value = stored
      return stored
    }
    
    return generateAnonymousId()
  }

  const signInAnonymously = async () => {
    try {
      // First try Supabase anonymous auth
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (!error && data.user) {
        // Use Supabase's anonymous user ID
        const id = data.user.id
        localStorage.setItem('spendcheck_user_id', id)
        userId.value = id
        return { success: true, userId: id }
      }
      
      // If Supabase anonymous auth fails, fallback to local anonymous ID
      const id = generateAnonymousId()
      return { success: true, userId: id }
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      // Fallback to local anonymous ID
      const id = generateAnonymousId()
      return { success: true, userId: id }
    }
  }

  const initializeAuth = async () => {
    try {
      // Check if we have an existing Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        userId.value = session.user.id
        localStorage.setItem('spendcheck_user_id', session.user.id)
        return session.user.id
      }
      
      // Check for stored user ID that starts with 'anon_' (local anonymous users)
      const stored = localStorage.getItem('spendcheck_user_id')
      if (stored && stored.startsWith('anon_')) {
        userId.value = stored
        return stored
      }
      
      // If we have a stored UUID (from previous Supabase session), try to restore session
      if (stored && stored.length === 36) {
        // This might be a Supabase user ID, but we don't have a session
        // Clear it and create a new anonymous session
        localStorage.removeItem('spendcheck_user_id')
      }
      
      // Sign in anonymously
      const result = await signInAnonymously()
      return result.userId || generateAnonymousId()
    } catch (error) {
      console.error('Error initializing auth:', error)
      return generateAnonymousId()
    }
  }

  const ensureValidSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        return session.user.id
      }
      
      // No valid session, initialize auth
      return await initializeAuth()
    } catch (error) {
      console.error('Error ensuring valid session:', error)
      return generateAnonymousId()
    }
  }

  return {
    userId: computed(() => userId.value),
    isAuthenticated,
    getCurrentUserId,
    signInAnonymously,
    initializeAuth,
    ensureValidSession
  }
}