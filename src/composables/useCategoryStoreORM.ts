/**
 * Enhanced Category Store using Prisma ORM
 * Replaces direct Supabase queries with type-safe ORM operations
 */

import { ref, computed, watch } from 'vue'
import { db } from '@/lib/database'
import { useAuth } from '@/composables/useAuth'
import type { Category } from '@/lib/prisma'

// Reactive state
const categories = ref<Category[]>([])
const isLoading = ref(false)
const lastError = ref<string | null>(null)

export function useCategoryStoreORM() {
  const { user, isAuthenticated } = useAuth()

  // Computed properties
  const systemCategories = computed(() =>
    categories.value.filter(cat => cat.isDefault)
  )

  const userCategories = computed(() =>
    categories.value.filter(cat => !cat.isDefault && cat.isActive)
  )

  const allActiveCategories = computed(() =>
    categories.value.filter(cat => cat.isActive)
  )

  // Validate user session
  const ensureValidSession = async (): Promise<string> => {
    if (!isAuthenticated.value || !user.value) {
      throw new Error('User must be authenticated')
    }
    return user.value.id
  }

  /**
   * Load categories for the current user
   */
  const loadCategories = async () => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      const data = await db.getCategories(userId)
      
      categories.value = data
      console.log(`✅ Loaded ${data.length} categories`)
      
    } catch (error) {
      console.error('❌ Failed to load categories:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to load categories'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new user category
   */
  const createCategory = async (categoryData: {
    name: string
    color?: string
    icon?: string
  }) => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      
      // Validate category name uniqueness
      const existingCategory = categories.value.find(
        cat => cat.name.toLowerCase() === categoryData.name.toLowerCase() &&
               (cat.userId === userId || cat.isDefault)
      )
      
      if (existingCategory) {
        throw new Error(`Category "${categoryData.name}" already exists`)
      }

      const newCategory = await db.createCategory(userId, {
        name: categoryData.name,
        color: categoryData.color || '#3b82f6',
        icon: categoryData.icon || 'folder-outline'
      })

      // Add to local state
      categories.value.push(newCategory)
      
      console.log('✅ Created category:', newCategory)
      return newCategory
      
    } catch (error) {
      console.error('❌ Failed to create category:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to create category'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update user category
   */
  const updateCategory = async (categoryId: string, updates: {
    name?: string
    color?: string
    icon?: string
    isActive?: boolean
  }) => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      
      // Validate name uniqueness if name is being updated
      if (updates.name) {
        const existingCategory = categories.value.find(
          cat => cat.id !== categoryId && 
                 cat.name.toLowerCase() === updates.name!.toLowerCase() &&
                 (cat.userId === userId || cat.isDefault)
        )
        
        if (existingCategory) {
          throw new Error(`Category "${updates.name}" already exists`)
        }
      }

      const updatedCategory = await db.updateCategory(categoryId, userId, updates)
      
      // Update in local state
      const index = categories.value.findIndex(c => c.id === categoryId)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }
      
      console.log('✅ Updated category:', updatedCategory)
      return updatedCategory
      
    } catch (error) {
      console.error('❌ Failed to update category:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to update category'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete user category (soft delete)
   */
  const deleteCategory = async (categoryId: string) => {
    try {
      isLoading.value = true
      lastError.value = null

      const userId = await ensureValidSession()
      
      // Check if category is being used by any spending entries
      // This would require a query to spending entries - for safety, we'll warn but allow deletion
      const category = categories.value.find(c => c.id === categoryId)
      if (!category) {
        throw new Error('Category not found')
      }

      if (category.isDefault) {
        throw new Error('Cannot delete system categories')
      }

      await db.deleteCategory(categoryId, userId)
      
      // Update in local state (soft delete sets isActive = false)
      const index = categories.value.findIndex(c => c.id === categoryId)
      if (index !== -1) {
        categories.value[index].isActive = false
      }
      
      console.log('✅ Deleted category:', categoryId)
      
    } catch (error) {
      console.error('❌ Failed to delete category:', error)
      lastError.value = error instanceof Error ? error.message : 'Failed to delete category'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Find category by ID
   */
  const findCategory = (categoryId: string): Category | undefined => {
    return categories.value.find(c => c.id === categoryId)
  }

  /**
   * Find category by name
   */
  const findCategoryByName = (name: string): Category | undefined => {
    return categories.value.find(c => 
      c.name.toLowerCase() === name.toLowerCase() && c.isActive
    )
  }

  /**
   * Get default category for new entries
   */
  const getDefaultCategory = (): Category | undefined => {
    return systemCategories.value.find(c => c.name === 'Other') || 
           systemCategories.value[0]
  }

  /**
   * Initialize system categories (call once during app setup)
   */
  const initializeSystemCategories = async () => {
    try {
      await db.seedSystemCategories()
      console.log('✅ System categories initialized')
    } catch (error) {
      console.error('❌ Failed to initialize system categories:', error)
      throw error
    }
  }

  /**
   * Clear all data (for logout)
   */
  const clearData = () => {
    categories.value = []
    lastError.value = null
  }

  // Auto-reload when user changes
  watch(
    () => user.value?.id,
    (newUserId) => {
      if (newUserId) {
        loadCategories()
      } else {
        clearData()
      }
    },
    { immediate: true }
  )

  return {
    // State
    categories: categories.value,
    isLoading,
    lastError,
    
    // Computed
    systemCategories,
    userCategories,
    allActiveCategories,
    
    // Methods
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    findCategory,
    findCategoryByName,
    getDefaultCategory,
    initializeSystemCategories,
    clearData
  }
}