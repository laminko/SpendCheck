import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const userId = ref<string | null>(null)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!userId.value)

  const generateAnonymousId = () => {
    const id = 'anon_' + Math.random().toString(36).substr(2, 9)
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
      const id = generateAnonymousId()
      return { success: true, userId: id }
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      return { success: false, error }
    }
  }

  return {
    userId: computed(() => userId.value),
    isAuthenticated,
    getCurrentUserId,
    signInAnonymously
  }
}