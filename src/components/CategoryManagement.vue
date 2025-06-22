<template>
  <ion-modal :is-open="isOpen" @did-dismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Manage Categories</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="closeModal">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading categories...</p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Add New Category Section -->
        <ion-list class="ion-margin-bottom">
          <ion-item button @click="openAddCategoryModal">
            <ion-icon :icon="addOutline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Add New Category</h3>
              <p>Create a custom spending category</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Default Categories Section -->
        <ion-list v-if="defaultCategoriesList.length > 0" class="ion-margin-bottom">
          <ion-list-header>
            <ion-label>Default Categories</ion-label>
          </ion-list-header>
          
          <ion-item
            v-for="category in defaultCategoriesList"
            :key="category.id"
            button
            @click="openEditCategoryModal(category)"
          >
            <div class="category-icon-wrapper" slot="start">
              <span class="category-icon">{{ category.icon || '📝' }}</span>
            </div>
            <ion-label>
              <h3>{{ category.name }}</h3>
              <p>Default category</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Custom Categories Section -->
        <ion-list v-if="customCategoriesList.length > 0" class="ion-margin-bottom">
          <ion-list-header>
            <ion-label>Custom Categories</ion-label>
          </ion-list-header>
          
          <ion-item
            v-for="category in customCategoriesList"
            :key="category.id"
            button
            @click="openEditCategoryModal(category)"
          >
            <div class="category-icon-wrapper" slot="start">
              <span class="category-icon">{{ category.icon || '📝' }}</span>
            </div>
            <ion-label>
              <h3>{{ category.name }}</h3>
              <p>Custom category</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div v-if="customCategoriesList.length === 0 && defaultCategoriesList.length === 0" class="empty-state">
          <ion-icon :icon="folderOpenOutline" class="empty-icon"></ion-icon>
          <h3>No Categories</h3>
          <p>Create your first category to get started</p>
        </div>
      </div>
    </ion-content>

    <!-- Add/Edit Category Modal -->
    <ion-modal :is-open="showCategoryForm" @did-dismiss="closeCategoryForm">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="closeCategoryForm">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <!-- Category Name -->
        <ion-item>
          <ion-input
            v-model="categoryForm.name"
            label="Category Name"
            labelPlacement="stacked"
            placeholder="Enter category name"
            :class="{ 'ion-invalid': !isCategoryNameValid && categoryForm.name.length > 0 }"
            clear-input
            @ion-blur="validateCategoryName"
          ></ion-input>
        </ion-item>
        <ion-text color="danger" v-if="categoryFormErrors.name">
          <p class="error-text">{{ categoryFormErrors.name }}</p>
        </ion-text>

        <!-- Category Icon -->
        <div class="form-section">
          <label class="form-label">Icon</label>
          <div class="icon-display-only">
            <div class="icon-preview">
              <span class="icon-display">{{ categoryForm.icon || '📝' }}</span>
            </div>
            <span class="icon-note">Default icon will be used</span>
          </div>
        </div>

        <!-- Color Selection -->
        <div class="form-section">
          <div class="color-header">
            <label class="form-label">Color</label>
            <span class="selected-color-name">{{ getSelectedColorName() }}</span>
          </div>
          <div class="color-grid">
            <div
              v-for="color in colorOptions"
              :key="color.value"
              class="color-option"
              :class="{ 'selected': categoryForm.color === color.value }"
              @click="categoryForm.color = color.value"
            >
              <div 
                class="color-swatch" 
                :class="{ 
                  'no-color': color.value === '',
                  'white-color': color.value === '#ffffff'
                }"
                :style="color.value ? { backgroundColor: color.value } : {}"
              >
                <ion-icon 
                  v-if="categoryForm.color === color.value" 
                  :icon="checkmarkOutline" 
                  class="check-icon"
                  :class="{ 'dark-check': color.value === '#ffffff' || color.value === '' }"
                ></ion-icon>
              </div>
              <span class="color-name">{{ color.name }}</span>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="form-section">
          <label class="form-label">Preview</label>
          <div class="preview-container">
            <div class="preview-item">
              <div 
                class="preview-icon" 
                :class="{ 
                  'no-color-preview': !categoryForm.color,
                  'white-color-preview': categoryForm.color === '#ffffff' 
                }"
                :style="categoryForm.color ? { backgroundColor: categoryForm.color } : {}"
              >
                <span 
                  class="preview-icon-text"
                  :class="{ 'dark-text': !categoryForm.color || categoryForm.color === '#ffffff' }"
                >{{ categoryForm.icon || '📝' }}</span>
              </div>
              <span class="preview-name">{{ categoryForm.name || 'Category Name' }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <div class="button-row">
            <ion-button 
              fill="clear" 
              @click="closeCategoryForm"
              :disabled="isSaving"
              class="cancel-button"
            >
              Cancel
            </ion-button>
            <ion-button 
              @click="saveCategory"
              :disabled="!isCategoryFormValid || isSaving"
              shape="round"
              color="primary"
              class="save-button"
            >
              <ion-spinner v-if="isSaving" name="crescent" slot="start"></ion-spinner>
              {{ editingCategory ? 'Update Category' : 'Create Category' }}
            </ion-button>
          </div>

          <!-- Delete Button for Custom Categories -->
          <ion-button 
            v-if="editingCategory && !editingCategory.is_default"
            expand="block" 
            fill="clear"
            color="danger"
            @click="confirmDelete(editingCategory)"
            :disabled="isSaving"
            class="delete-button"
          >
            <ion-icon :icon="trashOutline" slot="start"></ion-icon>
            Delete Category
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Delete Confirmation Alert -->
    <ion-alert
      :is-open="showDeleteAlert"
      header="Delete Category"
      :message="`Are you sure you want to delete '${categoryToDelete?.name}'? This action cannot be undone.`"
      :buttons="[
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => deleteCategory() }
      ]"
      @did-dismiss="showDeleteAlert = false"
    ></ion-alert>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonText,
  IonAlert,
  toastController
} from '@ionic/vue'
import {
  closeOutline,
  addOutline,
  trashOutline,
  folderOpenOutline,
  checkmarkOutline
} from 'ionicons/icons'
import { useCategoryStore } from '@/composables/useCategoryStore'
import type { Category } from '@/lib/supabase'

// Props
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Composables
const {
  isLoading,
  defaultCategoriesList,
  customCategoriesList,
  loadCategories,
  addCategory,
  updateCategory,
  deleteCategory: deleteCategoryFromStore,
  getCategoryByName
} = useCategoryStore()

// Reactive data
const showCategoryForm = ref(false)
const showDeleteAlert = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryToDelete = ref<Category | null>(null)
const isSaving = ref(false)

const categoryForm = ref({
  name: '',
  icon: '',
  color: ''
})

const categoryFormErrors = ref<{ name?: string }>({})

// Color options for categories
const colorOptions = [
  { name: 'No Color', value: '' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Gray', value: '#6b7280' }
]

// Computed
const isCategoryNameValid = computed(() => {
  const name = categoryForm.value.name.trim()
  if (name.length === 0) return false
  if (name.length < 2) return false
  if (name.length > 50) return false
  
  // Check for duplicate names (case-insensitive)
  const existingCategory = getCategoryByName(name)
  if (existingCategory && (!editingCategory.value || existingCategory.id !== editingCategory.value.id)) {
    return false
  }
  
  return true
})

const isCategoryFormValid = computed(() => {
  return isCategoryNameValid.value && Object.keys(categoryFormErrors.value).length === 0
})

// Methods
const closeModal = () => {
  emit('close')
}

const openAddCategoryModal = () => {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    icon: '📝',
    color: colorOptions[0].value
  }
  categoryFormErrors.value = {}
  showCategoryForm.value = true
}

const openEditCategoryModal = (category: Category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    icon: category.icon || '📝',
    color: category.color || colorOptions[0].value
  }
  categoryFormErrors.value = {}
  showCategoryForm.value = true
}

const closeCategoryForm = () => {
  showCategoryForm.value = false
  editingCategory.value = null
  categoryForm.value = { name: '', icon: '', color: '' }
  categoryFormErrors.value = {}
}

const validateCategoryName = () => {
  const name = categoryForm.value.name.trim()
  categoryFormErrors.value = { ...categoryFormErrors.value }
  
  if (name.length === 0) {
    categoryFormErrors.value.name = 'Category name is required'
  } else if (name.length < 2) {
    categoryFormErrors.value.name = 'Category name must be at least 2 characters'
  } else if (name.length > 50) {
    categoryFormErrors.value.name = 'Category name must be less than 50 characters'
  } else {
    const existingCategory = getCategoryByName(name)
    if (existingCategory && (!editingCategory.value || existingCategory.id !== editingCategory.value.id)) {
      categoryFormErrors.value.name = 'A category with this name already exists'
    } else {
      delete categoryFormErrors.value.name
    }
  }
}

const saveCategory = async () => {
  if (!isCategoryFormValid.value || isSaving.value) return
  
  validateCategoryName()
  if (categoryFormErrors.value.name) return
  
  isSaving.value = true
  
  try {
    const categoryData = {
      name: categoryForm.value.name.trim(),
      icon: categoryForm.value.icon || '📝',
      color: categoryForm.value.color || colorOptions[0].value
    }
    
    if (editingCategory.value) {
      // Update existing category
      await updateCategory(editingCategory.value.id, categoryData)
      await showSuccessToast(`Category "${categoryData.name}" updated successfully`)
    } else {
      // Create new category
      await addCategory(categoryData)
      await showSuccessToast(`Category "${categoryData.name}" created successfully`)
    }
    
    closeCategoryForm()
  } catch (err) {
    await showErrorToast(editingCategory.value ? 'Failed to update category' : 'Failed to create category')
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (category: Category) => {
  if (category.is_default) {
    showErrorToast('Default categories cannot be deleted')
    return
  }
  
  categoryToDelete.value = category
  showDeleteAlert.value = true
}

const deleteCategory = async () => {
  if (!categoryToDelete.value) return
  
  try {
    const success = await deleteCategoryFromStore(categoryToDelete.value.id)
    if (success) {
      await showSuccessToast(`Category "${categoryToDelete.value.name}" deleted successfully`)
    } else {
      await showErrorToast('Failed to delete category')
    }
  } catch (err) {
    await showErrorToast('Failed to delete category')
  } finally {
    categoryToDelete.value = null
    showDeleteAlert.value = false
  }
}

const showSuccessToast = async (message: string) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color: 'success'
  })
  await toast.present()
}

const showErrorToast = async (message: string) => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color: 'danger'
  })
  await toast.present()
}

const getSelectedColorName = () => {
  const selectedColor = colorOptions.find(color => color.value === categoryForm.value.color)
  return selectedColor?.name || 'No Color'
}

// Watch for modal opening to load categories
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadCategories()
  }
})
</script>

<style scoped>
/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.loading-container p {
  margin-top: 1rem;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

/* Category Icon */
.category-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.category-icon {
  font-size: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.empty-state h3 {
  color: var(--ion-color-medium);
  margin: 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

/* Form Sections */
.form-section {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  font-size: 1rem;
  color: var(--ion-color-step-850);
  margin-bottom: 0.75rem;
  font-weight: 600;
}

/* Icon Display Only */
.icon-display-only {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-preview {
  width: 60px;
  height: 60px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-display {
  font-size: 1.5rem;
}

.icon-note {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  font-style: italic;
}

/* Color Selection */
.color-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selected-color-name {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  background: #f8f9fa;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-weight: 500;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-swatch {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
}

.check-icon {
  color: white;
  font-size: 1rem;
  font-weight: bold;
}

.check-icon.dark-check {
  color: var(--ion-color-dark);
}

.color-swatch.no-color {
  background: repeating-conic-gradient(
    #e9ecef 0deg 90deg, 
    #f8f9fa 90deg 180deg
  ) 0 0 / 8px 8px;
  border: 2px solid #e9ecef;
}

.color-swatch.white-color {
  background: white;
  border: 2px solid #e9ecef;
}

.color-name {
  font-size: 0.75rem;
  color: var(--ion-color-step-600);
  text-align: center;
  font-weight: 500;
}

/* Preview Section */
.preview-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-icon-text {
  font-size: 1.25rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.preview-icon-text.dark-text {
  color: var(--ion-color-dark);
  text-shadow: none;
}

.preview-icon.no-color-preview {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
}

.preview-icon.white-color-preview {
  background: white;
  border: 2px solid #e9ecef;
}

.preview-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-step-850);
}

/* Action Buttons */
.action-buttons {
  margin-top: 2rem;
}

.button-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.cancel-button {
  flex: 1;
  --color: var(--ion-color-medium);
}

.save-button {
  flex: 2;
}

.delete-button {
  margin-top: 1rem;
}

/* Error Text */
.error-text {
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .loading-container {
    padding: 2rem 1rem;
  }
  
  .empty-state {
    padding: 3rem 1rem;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
  
  .empty-state h3 {
    font-size: 1.1rem;
  }
  
  .form-section {
    margin-bottom: 1.5rem;
  }
  
  .icon-preview {
    width: 50px;
    height: 50px;
  }
  
  .icon-display {
    font-size: 1.25rem;
  }
  
  .color-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  
  .color-swatch {
    width: 2rem;
    height: 2rem;
  }
  
  .color-name {
    font-size: 0.7rem;
  }
  
  .preview-container {
    padding: 1rem;
  }
  
  .preview-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .preview-icon-text {
    font-size: 1rem;
  }
  
  .preview-name {
    font-size: 1rem;
  }
  
  .button-row {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .cancel-button,
  .save-button {
    flex: none;
  }
}

@media (max-width: 480px) {
  .icon-display-only {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .color-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  
  .form-section {
    margin-bottom: 1.25rem;
  }
  
  .action-buttons {
    margin-top: 1.5rem;
  }
}
</style>