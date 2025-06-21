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
              <h3>{{ userProfile?.display_name || 'Authenticated User' }}</h3>
              <p>{{ userProfile?.email || 'Anonymous' }}</p>
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
      <ion-modal :is-open="showAuthModal" @did-dismiss="showAuthModal = false">
        <div class="auth-modal">
          <div class="auth-modal-content">
            <h2>Sign In</h2>
            <p>Choose how you'd like to sign in</p>

            <div class="auth-buttons">
              <ion-button expand="block" fill="outline" @click="signInWithGoogle">
                <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" slot="start" style="width: 24px; height: 24px; margin-right: 8px;" />
                Continue with Google
              </ion-button>

              <ion-button expand="block" fill="outline" @click="signInWithFacebook">
                <ion-icon :icon="logoFacebook" slot="start" style="font-size: 24px; margin-right: 8px;"></ion-icon>
                Continue with Facebook
              </ion-button>

              <ion-button expand="block" fill="outline" @click="signInWithPhone">
                <ion-icon :icon="callOutline" slot="start" style="font-size: 24px; margin-right: 8px;"></ion-icon>
                Continue with Phone
              </ion-button>
            </div>

            <ion-button expand="block" fill="clear" @click="showAuthModal = false">
              Cancel
            </ion-button>
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
  callOutline
} from 'ionicons/icons'

import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'
import CurrencyPicker from '@/components/CurrencyPicker.vue'

const { signOut } = useAuth()
const { currentCurrency, loadSavedCurrency } = useCurrency()

const showAuthModal = ref(false)
const userProfile = ref<any>(null)

// For now, treat all users as guests since we only have anonymous auth
// This will be updated when we add real authentication
const isRealUser = computed(() => false)

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