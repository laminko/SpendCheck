<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>
          <div class="logo-title">
            <img src="/logo.png" alt="SpendCheck Logo" class="logo" />
            SpendCheck
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <CurrencyPicker />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">

      <div class="subtitle">
        <p>Did you spend money today?</p>
      </div>

      <div class="main-content">
        <div class="tap-section">
          <div class="spend-button-container">
            <button
              class="circular-spend-button"
              @click="handleSpendButtonClick"
              :disabled="loading"
            >
              <ion-icon :icon="cardOutline" class="card-icon"></ion-icon>
              <div class="button-text">
                Any spending?<br>
                Tap to track!
              </div>
            </button>
          </div>

        </div>

        <div class="stats-section">
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <ion-card class="stat-card">
                  <ion-card-content class="ion-text-center">
                    <div class="stat-number">{{ formatAmount(parseFloat(todayTotal)) }}</div>
                    <div class="stat-label">Total Today</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6">
                <ion-card class="stat-card">
                  <ion-card-content class="ion-text-center">
                    <div class="stat-number">{{ formatAmount(parseFloat(thisMonthTotal)) }}</div>
                    <div class="stat-label">Total This Month</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <SpendingChart :entries="entries" />
      </div>
    </ion-content>

    <!-- Spending Dialog -->
    <SpendingDialog
      :is-open="showSpendingDialog"
      @close="showSpendingDialog = false"
      @save="logSpending"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonCard,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  toastController
} from '@ionic/vue'
import { cardOutline } from 'ionicons/icons'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { supabase } from '@/lib/supabase'
import SpendingChart from '@/components/SpendingChart.vue'
import CurrencyPicker from '@/components/CurrencyPicker.vue'
import SpendingDialog from '@/components/SpendingDialog.vue'
import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'

const loading = ref(false)
const entries = ref<Array<{ id?: string, date: string, amount: number, currency: string, category?: string, category_id?: string, created_at?: string }>>([])
const { ensureValidSession } = useAuth()
const { currencyCode, loadSavedCurrency, formatAmount } = useCurrency()
const showSpendingDialog = ref(false)
const route = useRoute()


const todayTotal = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return entries.value
    .filter(entry => entry.date === today)
    .reduce((sum, entry) => sum + entry.amount, 0)
    .toFixed(2)
})


const thisMonthTotal = computed(() => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  return entries.value
    .filter(entry => entry.date >= firstDay)
    .reduce((sum, entry) => sum + entry.amount, 0)
    .toFixed(2)
})

const handleSpendButtonClick = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch (error) {
    // Haptics not available on web
  }
  showSpendingDialog.value = true
}

const logSpending = async (spendingData: { amount: number; category?: string; categoryId?: string }) => {
  // Haptic feedback for save action
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (error) {
    // Haptics not available on web
  }

  loading.value = true
  const today = new Date().toISOString().split('T')[0]
  const userId = await ensureValidSession()
  const { amount, category, categoryId } = spendingData

  try {
    // Always insert new entry
    const { error } = await supabase
      .from('spending_entries')
      .insert([
        {
          user_id: userId,
          amount: amount,
          currency: currencyCode.value,
          category: category || null,
          category_id: categoryId || null,
          date: today
        }
      ])

    if (error) throw error

    entries.value.push({
      date: today,
      amount,
      currency: currencyCode.value,
      category,
      category_id: categoryId
    })

    showSpendingDialog.value = false

    // Show success toast
    const toast = await toastController.create({
      message: `${formatAmount(amount)} ${category ? `for ${category}` : ''} tracked successfully!`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    })
    await toast.present()
  } catch (error) {
    console.error('Error logging spending:', error)
    
    // Show error toast
    const toast = await toastController.create({
      message: 'Failed to track spending. Please try again.',
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    })
    await toast.present()
  } finally {
    loading.value = false
  }
}


const loadEntries = async () => {
  const userId = await ensureValidSession()

  try {
    const { data, error } = await supabase
      .from('spending_entries')
      .select('id, date, amount, currency, category, category_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    entries.value = data || []
  } catch (error) {
    console.error('Error loading entries:', error)
  }
}

onMounted(() => {
  loadSavedCurrency()
  loadEntries()
})

// Watch for route changes to this tab
watch(() => route.path, (newPath) => {
  if (newPath === '/tabs/home') {
    loadEntries()
  }
}, { immediate: false })
</script>

<style scoped>
.logo-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.logo {
  width: 32px;
  height: 32px;
}

.subtitle {
  text-align: center;
  padding: 1rem 0;
}

.subtitle p {
  color: var(--ion-color-medium);
  font-size: 1.1rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tap-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.circular-spend-button {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 15px 40px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
}

.circular-spend-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4);
}

.circular-spend-button:active {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
}

.circular-spend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.card-icon {
  font-size: 3rem;
  color: white;
  opacity: 0.9;
}

.button-text {
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  line-height: 1.2;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}


.stat-card {
  margin: 0;
}

.stat-number {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  word-break: keep-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-top: 0.25rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .circular-spend-button {
    width: 240px;
    height: 240px;
  }

  .card-icon {
    font-size: 2.5rem;
  }

  .button-text {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .circular-spend-button {
    width: 200px;
    height: 200px;
  }

  .card-icon {
    font-size: 2rem;
  }

  .button-text {
    font-size: 0.9rem;
  }

  .tap-section {
    min-height: 150px;
  }
}
</style>