import { ref, computed } from 'vue'
import { supabase, type Category } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const categories = ref<Category[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Default categories that will be seeded for new users
const defaultCategories = [
  { name: 'Food & Dining', icon: '🍕', color: '#ef4444' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { name: 'Shopping', icon: '🛒', color: '#8b5cf6' },
  { name: 'Entertainment', icon: '🎬', color: '#f59e0b' },
  { name: 'Bills & Utilities', icon: '🏠', color: '#10b981' },
  { name: 'Healthcare', icon: '💊', color: '#ec4899' },
  { name: 'Education', icon: '📚', color: '#6366f1' },
  { name: 'Travel', icon: '✈️', color: '#14b8a6' },
  { name: 'Other', icon: '💰', color: '#6b7280' }
]

export function useCategoryStore() {
  const { userId, ensureValidSession } = useAuth()

  // Load categories for the current user
  const loadCategories = async () => {
    try {
      isLoading.value = true
      error.value = null

      // Ensure we have a valid user session
      const currentUserId = await ensureValidSession()
      
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', currentUserId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      categories.value = data || []

      // If no categories exist, seed default categories
      if (categories.value.length === 0) {
        await seedDefaultCategories(currentUserId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load categories'
      console.error('Error loading categories:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Seed default categories for new users
  const seedDefaultCategories = async (currentUserId: string) => {
    try {
      const categoriesToInsert = defaultCategories.map(cat => ({
        user_id: currentUserId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_default: true
      }))

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        .select()

      if (insertError) throw insertError

      categories.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to seed default categories'
      console.error('Error seeding categories:', err)
    }
  }

  // Add a new category
  const addCategory = async (categoryData: { name: string; icon?: string; color?: string }) => {
    try {
      error.value = null

      // Ensure we have a valid user session
      const currentUserId = await ensureValidSession()

      const insertData = {
        user_id: currentUserId,
        name: categoryData.name,
        icon: categoryData.icon || null,
        color: categoryData.color || null,
        is_default: false
      }

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert([insertData])
        .select()
        .single()

      if (insertError) throw insertError

      if (data) {
        categories.value.push(data)
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add category'
      console.error('Error adding category:', err)
    }

    return null
  }

  // Update a category
  const updateCategory = async (id: string, updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => {
    try {
      error.value = null

      const { data, error: updateError } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId.value!)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) {
        const index = categories.value.findIndex(cat => cat.id === id)
        if (index !== -1) {
          categories.value[index] = data
        }
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category'
      console.error('Error updating category:', err)
    }

    return null
  }

  // Delete a category
  const deleteCategory = async (id: string) => {
    try {
      error.value = null

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId.value!)

      if (deleteError) throw deleteError

      categories.value = categories.value.filter(cat => cat.id !== id)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete category'
      console.error('Error deleting category:', err)
      return false
    }
  }

  // Get category by ID
  const getCategoryById = (id: string) => {
    return categories.value.find(cat => cat.id === id)
  }

  // Get category by name
  const getCategoryByName = (name: string) => {
    return categories.value.find(cat => cat.name.toLowerCase() === name.toLowerCase())
  }

  // Computed properties
  const defaultCategoriesList = computed(() => 
    categories.value.filter(cat => cat.is_default)
  )

  const customCategoriesList = computed(() => 
    categories.value.filter(cat => !cat.is_default)
  )

  return {
    // State
    categories: computed(() => categories.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Computed
    defaultCategoriesList,
    customCategoriesList,
    
    // Methods
    loadCategories,
    seedDefaultCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryByName
  }
}