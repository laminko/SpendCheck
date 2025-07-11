<template>
  <ion-modal :is-open="isOpen" @did-dismiss="closeDialog">
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Spending</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="closeDialog">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <!-- Date Selector -->
      <div class="date-selector">
        <div class="date-wrapper">
          <label class="date-label">Date</label>
          <ion-datetime-button datetime="spending-date"></ion-datetime-button>
        </div>
      </div>

      <!-- DateTime Modal -->
      <ion-modal keep-contents-mounted="true" class="datetime-modal">
        <ion-datetime 
          id="spending-date"
          v-model="selectedDate"
          presentation="date-time"
          mode="ios"
          :max="maxDate"
          :formatOptions="{
            date: {
              weekday: 'short',
              month: 'short',
              day: '2-digit',
            },
            time: {
              hour: '2-digit',
              minute: '2-digit',
            },
          }"
          @ion-change="onDateChange"
        >
        </ion-datetime>
      </ion-modal>

      <!-- Amount Input -->
      <ion-item>
        <ion-label position="stacked">Amount ({{ currencySymbol }})</ion-label>
        <ion-input
          ref="amountInput"
          v-model="amount"
          type="number"
          inputmode="decimal"
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </ion-item>

      <!-- Category Selector -->
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

      <!-- Custom Category Input (shown when "Add new category" is selected) -->
      <ion-item v-if="selectedCategory === 'custom'">
        <ion-label position="stacked">New Category Name</ion-label>
        <ion-input
          v-model="customCategory"
          placeholder="Enter category name"
        />
      </ion-item>

      <!-- Action Buttons -->
      <div class="ion-padding" style="text-align: right;">
        <ion-button fill="clear" color="medium" @click="closeDialog">
          Cancel
        </ion-button>
        <ion-button 
          fill="solid" 
          color="primary" 
          shape="round"
          @click="saveSpending"
          :disabled="!isValid || isSaving"
          strong
        >
          <ion-icon :icon="checkmarkOutline" slot="start" v-if="!isSaving"></ion-icon>
          <ion-spinner v-if="isSaving" slot="start" name="crescent"></ion-spinner>
          {{ isSaving ? 'Saving...' : 'Save' }}
        </ion-button>
      </div>
    </ion-content>

  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { 
  IonModal, 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton, 
  IonIcon, 
  IonInput, 
  IonSelect, 
  IonSelectOption,
  IonItem,
  IonLabel,
  IonDatetime,
  IonDatetimeButton,
  IonSpinner
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
  setSaving: [saving: boolean]
}>()

// Composables
const { currencySymbol } = useCurrency()
const { categories, loadCategories, addCategory } = useCategoryStore()

// Helper function to get local datetime string
const getLocalDatetimeString = () => {
  const now = new Date()
  // Format as YYYY-MM-DDTHH:mm:SS without milliseconds and timezone
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  const dateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  return dateString
}

// Reactive data
const amount = ref('')
const selectedCategory = ref('')
const customCategory = ref('')
const amountInput = ref()
const selectedDate = ref(getLocalDatetimeString())
const isSaving = ref(false)

// Computed
const maxDate = computed(() => {
  return getLocalDatetimeString()
})

// Computed
const isValid = computed(() => {
  const amountValue = parseFloat(amount.value)
  const amountValid = amount.value.trim() !== '' && !isNaN(amountValue) && amountValue > 0
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
  if (!isValid.value || isSaving.value) return

  isSaving.value = true
  emit('setSaving', true)

  try {
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
        // Reload categories to update the list
        await loadCategories()
      }
    } else if (selectedCategory.value && selectedCategory.value !== 'custom') {
      // Find the selected category to get its name
      const category = categories.value.find(cat => cat.id === selectedCategory.value)
      categoryName = category?.name || selectedCategory.value
    }

    // Convert local datetime to UTC ISO string for database storage
    const localDate = new Date(selectedDate.value)
    const utcISOString = localDate.toISOString()

    emit('save', {
      amount: parseFloat(amount.value),
      categoryId: categoryId === 'custom' ? undefined : categoryId,
      category: categoryName,
      date: utcISOString
    })
    
    // Reset form but keep the selected category if it was a custom one that was just created
    amount.value = ''
    if (selectedCategory.value === 'custom') {
      selectedCategory.value = categoryId || ''
    }
    customCategory.value = ''
    
    // Reset selectedDate to current time
    selectedDate.value = getLocalDatetimeString()
  } finally {
    isSaving.value = false
    emit('setSaving', false)
  }
}

const resetForm = () => {
  amount.value = ''
  selectedCategory.value = ''
  customCategory.value = ''
  // Don't reset selectedDate here - let it keep the current value
}

// Watch selectedDate changes
watch(selectedDate, () => {
  // selectedDate watcher - removed console logs
}, { immediate: true })

// Load categories on component mount
onMounted(() => {
  loadCategories()
})

// Watch for dialog opening to focus amount input
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Reset date to current time when dialog opens
    selectedDate.value = getLocalDatetimeString()
    nextTick(() => {
      amountInput.value?.$el?.querySelector('input')?.focus()
    })
  }
})
</script>

<style scoped>
/* Date selector styling */
.date-selector {
  margin-bottom: 16px;
  padding-left: 16px;
}

.date-wrapper {
  padding: 12px 0;
  --border-color: var(--ion-item-border-color, var(--ion-border-color, var(--ion-color-step-250, var(--ion-background-color-step-250, #c8c7cc))));
  border-bottom: 0.55px solid var(--border-color);
}

.date-label {
  display: block;
  font-size: 0.875rem;
  color: var(--color);
  margin-bottom: 2px;
  letter-spacing: 0.03em;
  font-family: var(--ion-font-family, inherit);
}

/* iOS-style DateTime modal styling */
.datetime-modal {
  --border-radius: 16px;
  --box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  --background: rgba(255, 255, 255, 0.95);
  --backdrop-opacity: 0.4;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
}

.datetime-modal::part(content) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
</style>

