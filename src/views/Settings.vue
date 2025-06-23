<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
        <!-- Authentication Section -->
        <ion-list class="ion-margin-bottom">
          <ion-list-header>
            <ion-label>Account</ion-label>
          </ion-list-header>

          <ion-item v-if="!isRealUser" button @click="showAuthModal = true">
            <ion-icon :icon="personOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Sign In</h3>
              <p>Save your preferences and access advanced features</p>
            </ion-label>
          </ion-item>

          <ion-item v-if="!isRealUser" lines="none">
            <ion-icon :icon="eyeOffOutline" slot="start" color="medium"></ion-icon>
            <ion-label color="medium">
              <p>You're currently using SpendCheck as a guest</p>
            </ion-label>
          </ion-item>

          <ion-item v-if="isRealUser">
            <ion-icon :icon="personCircleOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>{{ userProfile?.email || userProfile?.user_metadata?.full_name || 'Authenticated User' }}</h3>
              <p>{{ userProfile?.email || 'Signed in' }}</p>
            </ion-label>
            <ion-button fill="clear" color="danger" slot="end" @click="handleSignOut">
              <ion-icon :icon="logOutOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>

        <!-- Currency Section -->
        <ion-list class="ion-margin-bottom">
          <ion-list-header>
            <ion-label>Currency</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon :icon="cardOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Preferred Currency</h3>
              <p>{{ currentCurrency.name }} ({{ currentCurrency.symbol }})</p>
            </ion-label>
            <CurrencyPicker slot="end" />
          </ion-item>

          <ion-item v-if="!isRealUser" lines="none">
            <ion-label color="medium">
              <p>Sign in to save currency preference</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Preferences Section -->
        <ion-list class="ion-margin-bottom" v-if="isRealUser">
          <ion-list-header>
            <ion-label>Preferences</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon :icon="contrastOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Theme</h3>
              <p>{{ theme === 'auto' ? 'System Default' : theme === 'dark' ? 'Dark Mode' : 'Light Mode' }}</p>
            </ion-label>
            <ion-select 
              :value="theme" 
              slot="end" 
              interface="popover" 
              placeholder="Select Theme"
              @ion-change="handleThemeChange"
              :disabled="isLoadingPreferences"
            >
              <ion-select-option value="auto">System Default</ion-select-option>
              <ion-select-option value="light">Light Mode</ion-select-option>
              <ion-select-option value="dark">Dark Mode</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-icon :icon="notificationsOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Notifications</h3>
              <p>Receive reminders and updates</p>
            </ion-label>
            <ion-toggle 
              :checked="notificationsEnabled" 
              slot="end"
              @ion-change="handleNotificationToggle"
              :disabled="isLoadingPreferences"
            ></ion-toggle>
          </ion-item>
        </ion-list>

        <!-- Categories Section -->
        <ion-list class="ion-margin-bottom">
          <ion-list-header>
            <ion-label>Categories</ion-label>
          </ion-list-header>

          <ion-item button @click="manageCategoriesDisabled" :disabled="!isRealUser">
            <ion-icon :icon="folderOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Manage Categories</h3>
              <p>Create and customize spending categories</p>
            </ion-label>
          </ion-item>

          <ion-item v-if="!isRealUser" lines="none">
            <ion-label color="medium">
              <p>Sign in to manage custom categories</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- App Info Section -->
        <ion-list class="ion-margin-bottom">
          <ion-list-header>
            <ion-label>About</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon :icon="informationCircleOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>SpendCheck</h3>
              <p>Version 1.2.0</p>
            </ion-label>
          </ion-item>
        </ion-list>

      <!-- Category Management Modal -->
      <CategoryManagement 
        :is-open="showCategoryManagement" 
        @close="showCategoryManagement = false" 
      />

      <!-- Authentication Modal -->
      <ion-modal :is-open="showAuthModal" @did-dismiss="resetAuthModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ showEmailForm ? (isSignUp ? 'Create Account' : 'Sign In') : 'Sign In' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="resetAuthModal">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="ion-padding">
          <!-- Email/Password Form -->
          <div v-if="showEmailForm">
            <ion-list>
              <ion-item>
                <ion-input 
                  v-model="email" 
                  type="email" 
                  label="Email"
                  labelPlacement="floating"
                  placeholder="Enter your email"
                  :class="{ 'ion-invalid': !isEmailValid && email.length > 0, 'ion-touched': email.length > 0 }"
                  autocomplete="email"
                  clear-input
                  @ion-blur="validateField('email')"
                ></ion-input>
              </ion-item>
              <ion-text color="danger" v-if="formErrors.email">
                <p class="ion-margin-start">{{ formErrors.email }}</p>
              </ion-text>

              <ion-item>
                <ion-input 
                  v-model="password" 
                  type="password" 
                  label="Password"
                  labelPlacement="floating"
                  placeholder="Enter your password"
                  :class="{ 'ion-invalid': !isPasswordValid && password.length > 0, 'ion-touched': password.length > 0 }"
                  autocomplete="current-password"
                  clear-input
                  @ion-blur="validateField('password')"
                ></ion-input>
              </ion-item>
              <ion-text color="medium" v-if="!formErrors.password && isSignUp">
                <p class="ion-margin-start">Password must be at least 6 characters</p>
              </ion-text>
              <ion-text color="danger" v-if="formErrors.password">
                <p class="ion-margin-start">{{ formErrors.password }}</p>
              </ion-text>

              <ion-item v-if="isSignUp">
                <ion-input 
                  v-model="confirmPassword" 
                  type="password" 
                  label="Confirm Password"
                  labelPlacement="floating"
                  placeholder="Confirm your password"
                  :class="{ 'ion-invalid': !isConfirmPasswordValid && confirmPassword.length > 0, 'ion-touched': confirmPassword.length > 0 }"
                  autocomplete="new-password"
                  clear-input
                  @ion-blur="validateField('confirmPassword')"
                ></ion-input>
              </ion-item>
              <ion-text color="danger" v-if="formErrors.confirmPassword">
                <p class="ion-margin-start">{{ formErrors.confirmPassword }}</p>
              </ion-text>
            </ion-list>

            <div class="ion-margin-top">
              <ion-button 
                expand="block" 
                @click="handleEmailAuth"
                :disabled="!isFormValid || isLoading"
              >
                <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
                {{ isSignUp ? 'Create Account' : 'Sign In' }}
              </ion-button>

              <ion-button 
                expand="block" 
                fill="clear" 
                @click="toggleSignUpMode"
                :disabled="isLoading"
              >
                {{ isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up' }}
              </ion-button>

              <ion-button 
                expand="block" 
                fill="clear" 
                color="medium"
                @click="resetAuthModal"
                :disabled="isLoading"
              >
                Back
              </ion-button>
            </div>
          </div>

          <!-- OAuth Options -->
          <div v-else>
            <p class="ion-text-center ion-margin-bottom">Choose how you'd like to sign in</p>
            
            <ion-button expand="block" fill="outline" @click="showEmailForm = true" class="ion-margin-bottom">
              <ion-icon :icon="mail" slot="start" style="margin-right: 12px;"></ion-icon>
              Continue with Email
            </ion-button>

            <ion-button expand="block" fill="outline" @click="signInWithGoogle" class="ion-margin-bottom">
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" slot="start" style="width: 20px; height: 20px; margin-right: 12px;" />
              Continue with Google
            </ion-button>

            <ion-button expand="block" fill="outline" @click="signInWithFacebook" class="ion-margin-bottom">
              <ion-icon :icon="logoFacebook" slot="start" style="margin-right: 12px;"></ion-icon>
              Continue with Facebook
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonList,
  IonListHeader,
  IonInput,
  IonSpinner,
  IonText,
  IonSelect,
  IonSelectOption,
  IonToggle,
  toastController
} from '@ionic/vue'
import {
  personOutline,
  eyeOffOutline,
  personCircleOutline,
  logOutOutline,
  cardOutline,
  folderOutline,
  informationCircleOutline,
  logoFacebook,
  mail,
  closeOutline,
  contrastOutline,
  notificationsOutline
} from 'ionicons/icons'

import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'
import { useUserPreferences } from '@/composables/useUserPreferences'
import CurrencyPicker from '@/components/CurrencyPicker.vue'
import CategoryManagement from '@/components/CategoryManagement.vue'

const { user, isRealUser, signOut, signInWithOAuth, signInWithEmail, signUpWithEmail } = useAuth()
const { currentCurrency, loadSavedCurrency } = useCurrency()
const { theme, notificationsEnabled, updateTheme, updateNotifications, isLoadingPreferences } = useUserPreferences()

const showAuthModal = ref(false)
const showCategoryManagement = ref(false)
const showEmailForm = ref(false)
const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const formErrors = ref<{ email?: string; password?: string; confirmPassword?: string }>({})
const userProfile = computed(() => user.value)

// Form validation
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return email.value.length === 0 || emailRegex.test(email.value)
})

const isPasswordValid = computed(() => {
  return password.value.length === 0 || password.value.length >= 6
})

const isConfirmPasswordValid = computed(() => {
  return !isSignUp.value || confirmPassword.value === password.value
})

const isFormValid = computed(() => {
  return email.value.length > 0 && 
         password.value.length > 0 && 
         isEmailValid.value && 
         isPasswordValid.value && 
         isConfirmPasswordValid.value
})

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
    duration: 2000,
    color: 'danger'
  })
  await toast.present()
}

const handleSignOut = async () => {
  try {
    await signOut()
    await showSuccessToast('Signed out successfully')
  } catch (error) {
    await showErrorToast('Failed to sign out')
  }
}

const signInWithGoogle = async () => {
  try {
    await signInWithOAuth('google')
    resetAuthModal()
    await showSuccessToast('Redirecting to Google...')
  } catch (error) {
    await showErrorToast('Failed to sign in with Google')
  }
}

const signInWithFacebook = async () => {
  try {
    await signInWithOAuth('facebook')
    resetAuthModal()
    await showSuccessToast('Redirecting to Facebook...')
  } catch (error) {
    await showErrorToast('Failed to sign in with Facebook')
  }
}

const validateField = (field: string) => {
  formErrors.value = { ...formErrors.value }
  
  switch (field) {
    case 'email':
      if (!isEmailValid.value && email.value.length > 0) {
        formErrors.value.email = 'Please enter a valid email address'
      } else {
        delete formErrors.value.email
      }
      break
    case 'password':
      if (!isPasswordValid.value && password.value.length > 0) {
        formErrors.value.password = 'Password must be at least 6 characters'
      } else {
        delete formErrors.value.password
      }
      break
    case 'confirmPassword':
      if (!isConfirmPasswordValid.value && confirmPassword.value.length > 0) {
        formErrors.value.confirmPassword = 'Passwords do not match'
      } else {
        delete formErrors.value.confirmPassword
      }
      break
  }
}

const toggleSignUpMode = () => {
  if (isLoading.value) return
  
  isSignUp.value = !isSignUp.value
  confirmPassword.value = ''
  formErrors.value = {}
}

const handleEmailAuth = async () => {
  if (!isFormValid.value || isLoading.value) return
  
  // Validate all fields before submission
  validateField('email')
  validateField('password')
  if (isSignUp.value) {
    validateField('confirmPassword')
  }
  
  if (Object.keys(formErrors.value).length > 0) {
    return
  }
  
  isLoading.value = true
  
  try {
    if (isSignUp.value) {
      await signUpWithEmail(email.value, password.value)
      await showSuccessToast('Account created successfully! Please check your email for verification.')
    } else {
      await signInWithEmail(email.value, password.value)
      await showSuccessToast('Signed in successfully!')
    }
    
    resetAuthModal()
  } catch (error: any) {
    let message = isSignUp.value ? 'Failed to create account' : 'Failed to sign in'
    
    // Handle specific error messages
    if (error?.message) {
      if (error.message.includes('User already registered')) {
        message = 'An account with this email already exists'
      } else if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password'
      } else if (error.message.includes('Password should be at least')) {
        message = 'Password must be at least 6 characters'
      } else if (error.message.includes('Unable to validate email address')) {
        message = 'Please enter a valid email address'
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please check your email and click the confirmation link before signing in'
      }
    }
    
    await showErrorToast(message)
  } finally {
    isLoading.value = false
  }
}


const resetAuthModal = () => {
  showAuthModal.value = false
  showEmailForm.value = false  
  isSignUp.value = false
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  formErrors.value = {}
  isLoading.value = false
}

const manageCategoriesDisabled = () => {
  if (!isRealUser.value) {
    return
  }
  showCategoryManagement.value = true
}

// Theme and notification handlers
const handleThemeChange = async (event: CustomEvent) => {
  const newTheme = event.detail.value
  try {
    await updateTheme(newTheme)
    await showSuccessToast(`Theme updated to ${newTheme === 'auto' ? 'system default' : newTheme + ' mode'}`)
  } catch (error) {
    console.error('Failed to update theme:', error)
    await showErrorToast('Failed to update theme preference')
  }
}

const handleNotificationToggle = async (event: CustomEvent) => {
  const enabled = event.detail.checked
  try {
    await updateNotifications(enabled)
    await showSuccessToast(`Notifications ${enabled ? 'enabled' : 'disabled'}`)
  } catch (error) {
    console.error('Failed to update notifications:', error)
    await showErrorToast('Failed to update notification preference')
  }
}

onMounted(async () => {
  // Initialize authentication to ensure we have proper state
  try {
    const { ensureValidSession } = useAuth()
    await ensureValidSession() // This will create anonymous session if needed

    // Load saved currency preference
    await loadSavedCurrency()
  } catch (error) {
    console.error('Error initializing settings:', error)
  }
})
</script>


