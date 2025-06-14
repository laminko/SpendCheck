import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useDateUtils } from '@/composables/useDateUtils'

// Global reactive state for spending entries
const entries = ref<Array<{ 
  id?: string
  date: string
  amount: number
  currency: string
  category?: string
  category_id?: string
  created_at?: string
}>>([])

export function useSpendingStore() {
  const { ensureValidSession } = useAuth()
  const { getTodayString, getThisMonthFirstDay, toLocalDateString } = useDateUtils()

  // Computed totals
  const todayTotal = computed(() => {
    const today = getTodayString()
    return entries.value
      .filter(entry => {
        const entryDate = toLocalDateString(entry.date)
        return entryDate === today
      })
      .reduce((sum, entry) => sum + entry.amount, 0)
      .toFixed(2)
  })

  const thisMonthTotal = computed(() => {
    const firstDay = getThisMonthFirstDay()
    
    return entries.value
      .filter(entry => {
        const entryDate = toLocalDateString(entry.date)
        return entryDate >= firstDay
      })
      .reduce((sum, entry) => sum + entry.amount, 0)
      .toFixed(2)
  })

  // Load entries from database
  const loadEntries = async () => {
    const userId = await ensureValidSession()

    try {
      const { data, error } = await supabase
        .from('spending_entries')
        .select('id, date, amount, currency, category, category_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      entries.value = data || []
    } catch (error) {
      console.error('Error loading entries:', error)
    }
  }

  // Add new entry
  const addEntry = async (entryData: {
    amount: number
    currency: string
    category?: string
    category_id?: string
  }) => {
    const userId = await ensureValidSession()

    try {
      const { error } = await supabase
        .from('spending_entries')
        .insert([{
          user_id: userId,
          amount: entryData.amount,
          currency: entryData.currency,
          category: entryData.category || null,
          category_id: entryData.category_id || null
        }])

      if (error) throw error

      // Reload entries to get the server-generated data
      await loadEntries()
    } catch (error) {
      console.error('Error adding entry:', error)
      throw error
    }
  }

  // Delete entry
  const deleteEntry = async (entryId: string) => {
    const userId = await ensureValidSession()

    try {
      const { error } = await supabase
        .from('spending_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId)

      if (error) throw error

      // Remove from local state
      entries.value = entries.value.filter(entry => entry.id !== entryId)
    } catch (error) {
      console.error('Error deleting entry:', error)
      throw error
    }
  }

  return {
    entries,
    todayTotal,
    thisMonthTotal,
    loadEntries,
    addEntry,
    deleteEntry
  }
}