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
          <ion-item>
            <ion-label position="stacked">Amount ({{ currencySymbol }})</ion-label>
            <ion-input
              ref="amountInput"
              v-model="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </ion-item>
        </div>

        <!-- Date Selector -->
        <div class="date-section">
          <ion-item>
            <ion-label position="stacked">Date</ion-label>
            <ion-datetime-button datetime="spending-date"></ion-datetime-button>
          </ion-item>
        </div>

        <!-- Category Selector -->
        <div class="category-section">
          <ion-item>
            <ion-label position="stacked">Category</ion-label>
            <ion-select
              v-model="selectedCategory"
              placeholder="Select category (optional)"
              interface="action-sheet"
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
          </ion-item>
        </div>

        <!-- Custom Category Input (shown when "Add new category" is selected) -->
        <div v-if="selectedCategory === 'custom'" class="custom-category-section">
          <ion-item>
            <ion-label position="stacked">New Category Name</ion-label>
            <ion-input
              v-model="customCategory"
              placeholder="Enter category name"
            />
          </ion-item>
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
          strong
        >
          <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
          Save
        </ion-button>
      </div>
    </div>

  </ion-modal>

  <ion-modal>
    <ion-datetime 
      id="spending-date"
      v-model="selectedDate"
      presentation="date-time"
      :max="maxDate"
      @ion-change="onDateChange"
    >
      <div slot="title">Select Date & Time</div>
    </ion-datetime>
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
  IonSelectOption,
  IonItem,
  IonLabel,
  IonDatetime,
  IonDatetimeButton
} from '@ionic/vue'
import { closeOutline, checkmarkOutline } from 'ionicons/icons'
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
  save: [data: { amount: number; category?: string; categoryId?: string; date?: string }]
}>()

// Composables
const { currencySymbol } = useCurrency()
const { categories, loadCategories, addCategory } = useCategoryStore()

// Reactive data
const amount = ref('')
const selectedCategory = ref('')
const customCategory = ref('')
const amountInput = ref()
const selectedDate = ref(new Date().toISOString())

// Computed
const maxDate = computed(() => {
  return new Date().toISOString()
})

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

const onDateChange = (event: any) => {
  selectedDate.value = event.detail.value
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
    category: categoryName,
    date: selectedDate.value
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
  selectedDate.value = new Date().toISOString()
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
  color: var(--ion-color-primary);
}

.dialog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.amount-section,
.date-section,
.category-section,
.custom-category-section {
  margin-bottom: 1rem;
}

.amount-section ion-item,
.date-section ion-item,
.category-section ion-item,
.custom-category-section ion-item {
  --border-radius: 12px;
  --background: var(--ion-color-light);
  margin-bottom: 0.5rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
}

.dialog-actions ion-button {
  min-width: 100px;
}
</style>