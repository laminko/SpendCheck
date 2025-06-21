<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
        <!-- Authentication Section -->
        <ion-list class="ion-margin-bottom" style="max-width: 600px; margin-left: auto; margin-right: auto;">
          <ion-list-header>
            <ion-label>Account</ion-label>
          </ion-list-header>

          <div v-if="!isRealUser" class="auth-section">
            <p class="auth-description">
              Sign in to save your preferences and access advanced features
            </p>

            <ion-button expand="block" fill="outline" @click="showAuthModal = true">
              <ion-icon :icon="personOutline" slot="start"></ion-icon>
              Sign In
            </ion-button>

            <p class="ion-text-center ion-margin-top" style="color: var(--ion-color-medium); font-size: 14px;">
              <ion-icon :icon="eyeOffOutline" style="margin-right: 8px;"></ion-icon>
              You're currently using SpendCheck as a guest
            </p>
          </div>

          <ion-item v-else>
            <ion-icon :icon="personCircleOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>{{ userProfile?.email || userProfile?.user_metadata?.full_name || 'Authenticated User' }}</h3>
              <p>{{ userProfile?.email || 'Signed in' }}</p>
            </ion-label>
            <ion-button fill="clear" color="danger" slot="end" @click="handleSignOut">
              <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
              Sign Out
            </ion-button>
          </ion-item>
        </ion-list>

        <!-- Currency Section -->
        <ion-list class="ion-margin-bottom" style="max-width: 600px; margin-left: auto; margin-right: auto;">
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

          <ion-note v-if="!isRealUser" class="guest-note">
            Sign in to save currency preference
          </ion-note>
        </ion-list>

        <!-- Categories Section -->
        <ion-list class="ion-margin-bottom" style="max-width: 600px; margin-left: auto; margin-right: auto;">
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

          <ion-note v-if="!isRealUser" class="guest-note">
            Sign in to manage custom categories
          </ion-note>
        </ion-list>

        <!-- App Info Section -->
        <ion-list class="ion-margin-bottom" style="max-width: 600px; margin-left: auto; margin-right: auto;">
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

      <!-- Authentication Modal -->
      <ion-modal :is-open="showAuthModal" @did-dismiss="resetAuthModal">
        <div class="auth-modal">
          <div class="auth-modal-content">
            <h2 v-if="!showEmailForm">Sign In</h2>
            <h2 v-else>{{ isSignUp ? 'Create Account' : 'Sign In' }}</h2>
            <p v-if="!showEmailForm">Choose how you'd like to sign in</p>

            <!-- Email/Password Form -->
            <div v-if="showEmailForm" class="email-form">
              <div class="form-container">
                <!-- Email Input -->
                <div class="input-group">
                  <ion-item lines="none" class="input-item">
                    <ion-input 
                      v-model="email" 
                      type="email" 
                      label="Email"
                      labelPlacement="floating"
                      fill="outline"
                      placeholder="Enter your email"
                      :class="{ 'ion-invalid': !isEmailValid && email.length > 0, 'ion-touched': email.length > 0 }"
                      autocomplete="email"
                      clear-input
                      @ion-blur="validateField('email')"
                    ></ion-input>
                  </ion-item>
                  <div class="error-message" v-if="formErrors.email">
                    {{ formErrors.email }}
                  </div>
                </div>

                <!-- Password Input -->
                <div class="input-group">
                  <ion-item lines="none" class="input-item">
                    <ion-input 
                      v-model="password" 
                      type="password" 
                      label="Password"
                      labelPlacement="floating"
                      fill="outline"
                      placeholder="Enter your password"
                      :class="{ 'ion-invalid': !isPasswordValid && password.length > 0, 'ion-touched': password.length > 0 }"
                      autocomplete="current-password"
                      clear-input
                      @ion-blur="validateField('password')"
                    ></ion-input>
                  </ion-item>
                  <div class="helper-text" v-if="!formErrors.password && isSignUp">
                    Password must be at least 6 characters
                  </div>
                  <div class="error-message" v-if="formErrors.password">
                    {{ formErrors.password }}
                  </div>
                </div>

                <!-- Confirm Password Input (Sign Up Only) -->
                <div class="input-group" v-if="isSignUp">
                  <ion-item lines="none" class="input-item">
                    <ion-input 
                      v-model="confirmPassword" 
                      type="password" 
                      label="Confirm Password"
                      labelPlacement="floating"
                      fill="outline"
                      placeholder="Confirm your password"
                      :class="{ 'ion-invalid': !isConfirmPasswordValid && confirmPassword.length > 0, 'ion-touched': confirmPassword.length > 0 }"
                      autocomplete="new-password"
                      clear-input
                      @ion-blur="validateField('confirmPassword')"
                    ></ion-input>
                  </ion-item>
                  <div class="error-message" v-if="formErrors.confirmPassword">
                    {{ formErrors.confirmPassword }}
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="button-group">
                <ion-button 
                  expand="block" 
                  size="large"
                  @click="handleEmailAuth"
                  :disabled="!isFormValid || isLoading"
                  class="primary-button"
                >
                  <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                  <span v-else>{{ isSignUp ? 'Create Account' : 'Sign In' }}</span>
                </ion-button>

                <ion-button 
                  expand="block" 
                  fill="clear" 
                  size="large"
                  @click="toggleSignUpMode"
                  :disabled="isLoading"
                  class="secondary-button"
                >
                  {{ isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up' }}
                </ion-button>

                <ion-button 
                  expand="block" 
                  fill="clear" 
                  size="default"
                  @click="resetAuthModal"
                  :disabled="isLoading"
                  class="tertiary-button"
                >
                  Back
                </ion-button>
              </div>
            </div>

            <!-- OAuth Buttons -->
            <div v-else class="auth-buttons">
              <ion-button expand="block" fill="outline" @click="showEmailForm = true">
                <ion-icon :icon="mailOutline" slot="start" style="font-size: 24px; margin-right: 8px;"></ion-icon>
                Continue with Email
              </ion-button>

              <ion-button expand="block" fill="outline" @click="signInWithGoogle">
                <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" slot="start" style="width: 24px; height: 24px; margin-right: 8px;" />
                Continue with Google
              </ion-button>

              <ion-button expand="block" fill="outline" @click="signInWithFacebook">
                <ion-icon :icon="logoFacebook" slot="start" style="font-size: 24px; margin-right: 8px;"></ion-icon>
                Continue with Facebook
              </ion-button>

              <ion-button expand="block" fill="clear" @click="resetAuthModal">
                Cancel
              </ion-button>
            </div>
          </div>
        </div>
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
  IonIcon,
  IonItem,
  IonLabel,
  IonNote,
  IonModal,
  IonList,
  IonListHeader,
  IonInput,
  IonSpinner,
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
  mailOutline
} from 'ionicons/icons'

import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'
import CurrencyPicker from '@/components/CurrencyPicker.vue'

const { user, isRealUser, signOut, signInWithOAuth, signInWithEmail, signUpWithEmail } = useAuth()
const { currentCurrency, loadSavedCurrency } = useCurrency()

const showAuthModal = ref(false)
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
  // TODO: Navigate to category management page
  console.log('Manage categories')
}

onMounted(async () => {
  // Initialize authentication to ensure we have proper state
  try {
    const { ensureValidSession } = useAuth()
    await ensureValidSession() // This will create anonymous session if needed

    // Load saved currency preference
    loadSavedCurrency()
  } catch (error) {
    console.error('Error initializing settings:', error)
  }
})
</script>

<style scoped>
.auth-section {
  text-align: center;
  padding: 24px 16px;
}

.auth-description {
  margin-bottom: 24px;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.guest-note {
  display: block;
  margin: 8px 16px;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.auth-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}

.auth-modal-content {
  background: var(--ion-color-light);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
  transition: all 0.3s ease;
}

.auth-modal-content h2 {
  text-align: center;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--ion-color-dark);
  letter-spacing: -0.5px;
}

.auth-modal-content p {
  text-align: center;
  color: var(--ion-color-medium);
  margin-bottom: 32px;
  font-size: 16px;
  line-height: 1.5;
}

/* Email Form Styles */
.email-form {
  display: flex;
  flex-direction: column;
  gap: 0;
  animation: fadeInUp 0.3s ease;
}

.form-container {
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-item {
  --border-radius: 12px;
  --border-width: 1.5px;
  --border-color: #e1e5e9;
  --highlight-color-focused: var(--ion-color-primary);
  --background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.input-item:hover {
  --border-color: #c7d2d7;
}

.input-item.ion-focused {
  --border-color: var(--ion-color-primary);
  --background: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.input-item ion-input {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-size: 16px;
  font-weight: 400;
}

.helper-text {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
  margin-left: 16px;
  line-height: 1.3;
}

.error-message {
  font-size: 12px;
  color: var(--ion-color-danger);
  margin-top: 4px;
  margin-left: 16px;
  font-weight: 500;
  line-height: 1.3;
}

/* Button Styles */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.primary-button {
  --background: var(--ion-color-primary);
  --background-hover: #2563eb;
  --background-activated: #1d4ed8;
  --color: white;
  --border-radius: 12px;
  --box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  --ripple-color: rgba(255, 255, 255, 0.3);
  height: 52px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.25px;
  margin: 0;
  transition: all 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  --box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.primary-button:disabled {
  --background: #e5e7eb;
  --color: #9ca3af;
  --box-shadow: none;
  transform: none;
}

.secondary-button {
  --color: var(--ion-color-primary);
  --ripple-color: rgba(59, 130, 246, 0.1);
  height: 48px;
  font-weight: 500;
  font-size: 15px;
  margin: 0;
  transition: all 0.2s ease;
}

.secondary-button:hover {
  --background: rgba(59, 130, 246, 0.05);
}

.tertiary-button {
  --color: var(--ion-color-medium);
  --ripple-color: rgba(107, 114, 128, 0.1);
  height: 44px;
  font-weight: 400;
  font-size: 14px;
  margin: 0;
  transition: all 0.2s ease;
}

.tertiary-button:hover {
  --color: var(--ion-color-dark);
}

/* OAuth Buttons */
.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.auth-buttons ion-button {
  margin: 0;
  height: 52px;
  font-weight: 500;
  font-size: 16px;
  --border-radius: 12px;
  --border-width: 1.5px;
  --border-color: #e1e5e9;
  --background: white;
  --color: var(--ion-color-dark);
  --ripple-color: rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.auth-buttons ion-button:hover {
  --border-color: #c7d2d7;
  --background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.auth-buttons ion-button[fill="clear"] {
  --background: transparent;
  --color: var(--ion-color-medium);
  height: 44px;
  font-size: 14px;
}

.auth-buttons ion-button[fill="clear"]:hover {
  --color: var(--ion-color-dark);
  --background: rgba(0, 0, 0, 0.02);
  transform: none;
  box-shadow: none;
}

/* Loading State */
ion-spinner {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .auth-modal-content {
    background: var(--ion-color-step-50);
    border: 1px solid var(--ion-color-step-150);
  }
  
  .input-item {
    --background: var(--ion-color-step-100);
    --border-color: var(--ion-color-step-200);
  }
  
  .auth-buttons ion-button {
    --background: var(--ion-color-step-100);
    --border-color: var(--ion-color-step-200);
    --color: var(--ion-color-step-800);
  }
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-buttons {
  margin-top: 16px;
}
</style>