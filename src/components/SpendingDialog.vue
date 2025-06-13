<template>
  <ion-modal :is-open="isOpen" @did-dismiss="closeDialog">
    <div class="spending-dialog">
      <div class="dialog-header">
        <h2>Add Spending</h2>
        <ion-button fill="clear" size="small" @click="closeDialog">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </div>

      <div class="dialog-content">
        <!-- Amount Input -->
        <div class="amount-section">
          <label for="amount">Amount</label>
          <div class="amount-input-wrapper">
            <span class="currency-symbol">{{ currencySymbol }}</span>
            <ion-input
              ref="amountInput"
              v-model="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              class="amount-input"
            />
          </div>
        </div>

        <!-- Category Selector -->
        <div class="category-section">
          <label for="category">Category</label>
          <ion-select
            v-model="selectedCategory"
            placeholder="Select category"
            interface="action-sheet"
            class="category-select"
          >
            <ion-select-option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.icon }} {{ category.name }}
            </ion-select-option>
            <ion-select-option value="custom">
              ➕ Add new category
            </ion-select-option>
          </ion-select>
        </div>

        <!-- Custom Category Input (shown when "Add new category" is selected) -->
        <div v-if="selectedCategory === 'custom'" class="custom-category-section">
          <label for="customCategory">New Category Name</label>
          <ion-input
            v-model="customCategory"
            placeholder="Enter category name"
            class="custom-category-input"
          />
        </div>
      </div>

      <div class="dialog-actions">
        <ion-button fill="clear" color="medium" @click="closeDialog">
          Cancel
        </ion-button>
        <ion-button 
          fill="solid" 
          color="primary" 
          @click="saveSpending"
          :disabled="!isValid"
        >
          Save
        </ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { 
  IonModal, 
  IonButton, 
  IonIcon, 
  IonInput, 
  IonSelect, 
  IonSelectOption 
} from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import { useCurrency } from '@/composables/useCurrency'
import { useCategoryStore } from '@/composables/useCategoryStore'

// Props
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  save: [data: { amount: number; category?: string; categoryId?: string }]
}>()

// Composables
const { currencySymbol } = useCurrency()
const { categories, loadCategories, addCategory } = useCategoryStore()

// Reactive data
const amount = ref('')
const selectedCategory = ref('')
const customCategory = ref('')
const amountInput = ref()

// Computed
const isValid = computed(() => {
  const amountValid = amount.value && parseFloat(amount.value) > 0
  const categoryValid = !selectedCategory.value || 
    (selectedCategory.value !== 'custom' || (customCategory.value.trim().length > 0))
  return amountValid && categoryValid
})

// Methods
const closeDialog = () => {
  emit('close')
  resetForm()
}

const saveSpending = async () => {
  if (!isValid.value) return

  let categoryId = selectedCategory.value
  let categoryName = selectedCategory.value

  // Handle custom category creation
  if (selectedCategory.value === 'custom' && customCategory.value.trim()) {
    const newCategory = await addCategory({
      name: customCategory.value.trim(),
      icon: '📝'
    })
    
    if (newCategory) {
      categoryId = newCategory.id
      categoryName = newCategory.name
    }
  } else if (selectedCategory.value && selectedCategory.value !== 'custom') {
    // Find the selected category to get its name
    const category = categories.value.find(cat => cat.id === selectedCategory.value)
    categoryName = category?.name || selectedCategory.value
  }

  emit('save', {
    amount: parseFloat(amount.value),
    categoryId: categoryId === 'custom' ? undefined : categoryId,
    category: categoryName
  })
  
  // Reset form but keep the selected category if it was a custom one that was just created
  amount.value = ''
  if (selectedCategory.value === 'custom') {
    selectedCategory.value = categoryId || ''
  }
  customCategory.value = ''
}

const resetForm = () => {
  amount.value = ''
  selectedCategory.value = ''
  customCategory.value = ''
}

// Load categories on component mount
onMounted(() => {
  loadCategories()
})

// Watch for dialog opening to focus amount input
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      amountInput.value?.$el?.querySelector('input')?.focus()
    })
  }
})
</script>

<style scoped>
.spending-dialog {
  padding: 1.5rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.dialog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.amount-section,
.category-section,
.custom-category-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  background: white;
}

.amount-input-wrapper:focus-within {
  border-color: #3b82f6;
}

.currency-symbol {
  font-weight: 600;
  color: #6b7280;
  margin-right: 0.5rem;
}

.amount-input {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 500;
}

.amount-input ion-input {
  --padding: 0;
  --border: none;
  --box-shadow: none;
}

.category-select,
.custom-category-input {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  --padding: 0.75rem 1rem;
}

.category-select:focus-within,
.custom-category-input:focus-within {
  border-color: #3b82f6;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.dialog-actions ion-button {
  min-width: 80px;
}
</style>