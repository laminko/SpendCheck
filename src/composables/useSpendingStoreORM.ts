/**
 * Enhanced Spending Store using Prisma ORM
 * Replaces direct Supabase queries with type-safe ORM operations
 */

import { ref, computed, watch } from 'vue'
import { db } from '@/lib/database'
import { useAuth } from '@/composables/useAuth'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import type { SpendingEntry } from '@/lib/prisma'

// Reactive state
const entries = ref<SpendingEntry[]>([])
const isLoading = ref(false)
const lastError = ref<string | null>(null)

export function useSpendingStoreORM() {
  const { user, isAuthenticated } = useAuth()

  // Computed properties for spending analysis
  const todaysTotal = computed(() => {
    const today = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    
    return entries.value
      .filter(entry => {
        const entryDate = new Date(entry.date)
        return entryDate >= today && entryDate <= todayEnd
      })
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
  })

  const monthlyTotal = computed(() => {
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())
    
    return entries.value
      .filter(entry => {
        const entryDate = new Date(entry.date)
        return entryDate >= monthStart && entryDate <= monthEnd
      })
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
  })

  const todaysEntries = computed(() => {
    const today = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    
    return entries.value.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= today && entryDate <= todayEnd
    })
  })

  // Validate user session
  const ensureValidSession = async (): Promise<string> => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }
    return user.value.id
  }

  /**
   * Load spending entries with optional filters
   */
  const loadEntries = async (options: {
    limit?: number
    startDate?: Date
    endDate?: Date
    categoryId?: string
  } = {}) => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      const data = await db.getSpendingEntries(userId, options)
      
      entries.value = data
      console.log(`✅ Loaded ${data.length} spending entries`)
      
    } catch (error) {
      console.error('❌ Failed to load spending entries:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to load entries'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Add new spending entry
   */
  const addEntry = async (entryData: {
    amount: number
    currency: string
    category?: string
    categoryId?: string
    date: Date
  }) => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      
      const newEntry = await db.createSpendingEntry(userId, {
        amount: entryData.amount,
        currency: entryData.currency,
        category: entryData.category || null,
        categoryId: entryData.categoryId || null,
        date: entryData.date
      })

      // Add to local state
      entries.value.unshift(newEntry)
      
      console.log('✅ Added spending entry:', newEntry)
      return newEntry
      
    } catch (error) {
      console.error('❌ Failed to add spending entry:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to add entry'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update spending entry
   */
  const updateEntry = async (entryId: string, updates: {
    amount?: number
    currency?: string
    category?: string
    categoryId?: string
    date?: Date
  }) => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      
      const updatedEntry = await db.updateSpendingEntry(entryId, userId, updates)
      
      // Update in local state
      const index = entries.value.findIndex(e => e.id === entryId)
      if (index !== -1) {
        entries.value[index] = updatedEntry
      }
      
      console.log('✅ Updated spending entry:', updatedEntry)
      return updatedEntry
      
    } catch (error) {
      console.error('❌ Failed to update spending entry:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to update entry'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete spending entry
   */
  const deleteEntry = async (entryId: string) => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      
      await db.deleteSpendingEntry(entryId, userId)
      
      // Remove from local state
      entries.value = entries.value.filter(e => e.id !== entryId)
      
      console.log('✅ Deleted spending entry:', entryId)
      
    } catch (error) {
      console.error('❌ Failed to delete spending entry:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to delete entry'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get spending totals for date range
   */
  const getSpendingTotals = async (startDate: Date, endDate: Date) => {
    try {
      const userId = await ensureValidSession()
      return await db.getSpendingTotals(userId, startDate, endDate)
    } catch (error) {
      console.error('❌ Failed to get spending totals:', error)
      throw error
    }
  }

  /**
   * Get spending by category
   */
  const getSpendingByCategory = async (startDate: Date, endDate: Date) => {
    try {
      const userId = await ensureValidSession()
      return await db.getSpendingByCategory(userId, startDate, endDate)
    } catch (error) {
      console.error('❌ Failed to get spending by category:', error)
      throw error
    }
  }

  /**
   * Clear all data (for logout)
   */
  const clearData = () => {
    entries.value = []
    lastError.value = null
  }

  // Auto-reload when user changes
  watch(
    () => user.value?.id,
    (newUserId) => {
      if (newUserId) {
        loadEntries()
      } else {
        clearData()
      }
    },
    { immediate: true }
  )

  return {
    // State
    entries: entries.value,
    isLoading,
    lastError,
    
    // Computed
    todaysTotal,
    monthlyTotal,
    todaysEntries,
    
    // Methods
    loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    getSpendingTotals,
    getSpendingByCategory,
    clearData
  }
}