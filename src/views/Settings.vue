<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Settings</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="container">
        <!-- Authentication Section -->
        <div class="section">
          <h2>Account</h2>
          <div v-if="!isRealUser" class="auth-section">
            <p class="auth-description">
              Sign in to save your preferences and access advanced features
            </p>
            
            <ion-button expand="block" fill="outline" @click="showAuthModal = true">
              <ion-icon :icon="personOutline" slot="start"></ion-icon>
              Sign In
            </ion-button>
            
            <ion-button expand="block" fill="clear" color="medium" @click="continueAsGuest">
              <ion-icon :icon="eyeOffOutline" slot="start"></ion-icon>
              Continue as Guest
            </ion-button>
          </div>

          <div v-else class="user-section">
            <div class="user-info">
              <ion-icon :icon="personCircleOutline" class="user-avatar"></ion-icon>
              <div class="user-details">
                <h3>{{ userProfile?.display_name || 'Authenticated User' }}</h3>
                <p>{{ userProfile?.email || 'Anonymous' }}</p>
              </div>
            </div>
            
            <ion-button fill="clear" color="danger" @click="handleSignOut">
              <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
              Sign Out
            </ion-button>
          </div>
        </div>

        <!-- Currency Section -->
        <div class="section">
          <h2>Currency</h2>
          <ion-item button @click="showCurrencyModal = true">
            <ion-icon :icon="cardOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Preferred Currency</h3>
              <p>{{ currentCurrency.name }} ({{ currentCurrency.symbol }})</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>
          <ion-note v-if="!isRealUser" class="guest-note">
            Sign in to save currency preference
          </ion-note>
        </div>

        <!-- Categories Section -->
        <div class="section">
          <h2>Categories</h2>
          <ion-item button @click="manageCategoriesDisabled" :disabled="!isRealUser">
            <ion-icon :icon="folderOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Manage Categories</h3>
              <p>Create and customize spending categories</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>
          <ion-note v-if="!isRealUser" class="guest-note">
            Sign in to manage custom categories
          </ion-note>
        </div>

        <!-- App Info Section -->
        <div class="section">
          <h2>About</h2>
          <ion-item>
            <ion-icon :icon="informationCircleOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>SpendCheck</h3>
              <p>Version 1.2.0</p>
            </ion-label>
          </ion-item>
        </div>
      </div>

      <!-- Authentication Modal -->
      <ion-modal :is-open="showAuthModal" @did-dismiss="showAuthModal = false">
        <div class="auth-modal">
          <div class="auth-modal-content">
            <h2>Sign In</h2>
            <p>Choose how you'd like to sign in</p>
            
            <div class="auth-buttons">
              <ion-button expand="block" fill="outline" @click="signInWithGoogle">
                <ion-icon :icon="logoGoogle" slot="start"></ion-icon>
                Continue with Google
              </ion-button>
              
              <ion-button expand="block" fill="outline" @click="signInWithFacebook">
                <ion-icon :icon="logoFacebook" slot="start"></ion-icon>
                Continue with Facebook
              </ion-button>
              
              <ion-button expand="block" fill="outline" @click="signInWithPhone">
                <ion-icon :icon="callOutline" slot="start"></ion-icon>
                Continue with Phone
              </ion-button>
            </div>
            
            <ion-button expand="block" fill="clear" @click="showAuthModal = false">
              Cancel
            </ion-button>
          </div>
        </div>
      </ion-modal>

      <!-- Currency Selection Modal -->
      <ion-modal :is-open="showCurrencyModal" @did-dismiss="showCurrencyModal = false">
        <div class="currency-modal">
          <div class="currency-modal-content">
            <h2>Select Currency</h2>
            <ion-list>
              <ion-item 
                v-for="currency in currencies" 
                :key="currency.code"
                button
                @click="selectCurrency(currency)"
              >
                <ion-label>
                  <h3>{{ currency.name }}</h3>
                  <p>{{ currency.symbol }} ({{ currency.code }})</p>
                </ion-label>
                <ion-icon 
                  v-if="currentCurrency.code === currency.code" 
                  :icon="checkmarkOutline" 
                  slot="end" 
                  color="primary"
                ></ion-icon>
              </ion-item>
            </ion-list>
            
            <div class="modal-buttons">
              <ion-button expand="block" fill="clear" @click="showCurrencyModal = false">
                Done
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
  toastController
} from '@ionic/vue'
import {
  personOutline,
  eyeOffOutline,
  personCircleOutline,
  logOutOutline,
  cardOutline,
  chevronForwardOutline,
  folderOutline,
  informationCircleOutline,
  logoGoogle,
  logoFacebook,
  callOutline,
  checkmarkOutline
} from 'ionicons/icons'

import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'

const { signOut } = useAuth()
const { currencies, currentCurrency, setCurrency, loadSavedCurrency } = useCurrency()

const showAuthModal = ref(false)
const showCurrencyModal = ref(false)
const userProfile = ref<any>(null)

// For now, treat all users as guests since we only have anonymous auth
// This will be updated when we add real authentication
const isRealUser = computed(() => false)

const continueAsGuest = () => {
  showAuthModal.value = false
}

const handleSignOut = async () => {
  try {
    await signOut()
    const toast = await toastController.create({
      message: 'Signed out successfully',
      duration: 2000,
      color: 'success'
    })
    await toast.present()
  } catch (error) {
    const toast = await toastController.create({
      message: 'Error signing out',
      duration: 2000,
      color: 'danger'
    })
    await toast.present()
  }
}

const signInWithGoogle = () => {
  // TODO: Implement Google OAuth
  console.log('Sign in with Google')
  showAuthModal.value = false
}

const signInWithFacebook = () => {
  // TODO: Implement Facebook OAuth
  console.log('Sign in with Facebook')
  showAuthModal.value = false
}

const signInWithPhone = () => {
  // TODO: Implement Phone authentication
  console.log('Sign in with Phone')
  showAuthModal.value = false
}

const selectCurrency = async (currency: any) => {
  setCurrency(currency) // Pass the full currency object, not just the code
  
  const toast = await toastController.create({
    message: `Currency updated to ${currency.name}`,
    duration: 2000,
    color: 'success'
  })
  await toast.present()
  
  showCurrencyModal.value = false
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
.container {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.section {
  margin-bottom: 32px;
}

.section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--ion-color-primary);
}

.auth-section {
  text-align: center;
  padding: 24px 16px;
}

.auth-description {
  margin-bottom: 24px;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.user-section {
  padding: 16px;
  border: 1px solid var(--ion-color-light);
  border-radius: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.user-avatar {
  font-size: 48px;
  color: var(--ion-color-primary);
  margin-right: 16px;
}

.user-details h3 {
  margin: 0 0 4px 0;
  font-weight: 600;
}

.user-details p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

.guest-note {
  display: block;
  margin-top: 8px;
  margin-left: 48px;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.auth-modal,
.currency-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 16px;
}

.auth-modal-content,
.currency-modal-content {
  background: var(--ion-color-light);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.auth-modal-content h2,
.currency-modal-content h2 {
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

ion-item {
  --border-radius: 12px;
  --background: var(--ion-color-light);
  margin-bottom: 8px;
}

ion-item[disabled] {
  opacity: 0.5;
}
</style>