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
              <ion-item>
                <ion-input 
                  v-model="email" 
                  type="email" 
                  placeholder="Email" 
                  fill="outline"
                  required
                ></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-input 
                  v-model="password" 
                  type="password" 
                  placeholder="Password" 
                  fill="outline"
                  required
                ></ion-input>
              </ion-item>

              <ion-button 
                expand="block" 
                @click="handleEmailAuth"
                :disabled="!email || !password"
              >
                {{ isSignUp ? 'Create Account' : 'Sign In' }}
              </ion-button>

              <ion-button 
                expand="block" 
                fill="clear" 
                @click="isSignUp = !isSignUp"
              >
                {{ isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up' }}
              </ion-button>

              <ion-button 
                expand="block" 
                fill="clear" 
                @click="showEmailForm = false"
              >
                Back
              </ion-button>
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
const userProfile = computed(() => user.value)

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

const handleEmailAuth = async () => {
  try {
    if (isSignUp.value) {
      await signUpWithEmail(email.value, password.value)
      await showSuccessToast('Account created successfully! Please check your email for verification.')
    } else {
      await signInWithEmail(email.value, password.value)
      await showSuccessToast('Signed in successfully!')
    }
    
    resetAuthModal()
  } catch (error) {
    const message = isSignUp.value ? 'Failed to create account' : 'Failed to sign in'
    await showErrorToast(message)
  }
}


const resetAuthModal = () => {
  showAuthModal.value = false
  showEmailForm.value = false  
  isSignUp.value = false
  email.value = ''
  password.value = ''
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

.auth-modal,
.auth-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 16px;
}

.auth-modal-content {
  background: var(--ion-color-light);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.auth-modal-content h2 {
  text-align: center;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.auth-modal-content p {
  text-align: center;
  color: var(--ion-color-medium);
  margin-bottom: 24px;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.modal-buttons {
  margin-top: 16px;
}
</style>