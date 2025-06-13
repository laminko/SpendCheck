<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>
          <div class="logo-title">
            <img src="/logo.svg" alt="SpendCheck Logo" class="logo" />
            SpendCheck
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <CurrencyPicker />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">SpendCheck</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="subtitle">
        <p>Did you spend money today?</p>
      </div>

      <div class="main-content">
        <div class="tap-section">
          <div v-if="!showAmountInput && !todayLogged" class="spend-button-container">
            <ion-button 
              shape="round"
              size="large"
              class="spend-button"
              @click="handleSpendButtonClick"
              :disabled="loading"
            >
              <div class="button-content">
                <div class="icon">💳</div>
                <div class="text">Tap if you spent today</div>
              </div>
            </ion-button>
          </div>

          <div v-else-if="showAmountInput" class="amount-input-container">
            <ion-card>
              <ion-card-content>
                <ion-item>
                  <ion-label position="stacked">Amount ({{ currencySymbol }})</ion-label>
                  <ion-input
                    ref="amountInput"
                    v-model="currentAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    @keyup.enter="logSpending"
                    @ion-blur="onAmountBlur"
                  ></ion-input>
                </ion-item>
                <div class="amount-actions">
                  <ion-button fill="clear" @click="cancelAmount">Cancel</ion-button>
                  <ion-button @click="logSpending" :disabled="!currentAmount || loading">
                    {{ todayLogged ? 'Update' : 'Save' }}
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <div v-else class="logged-container">
            <ion-card color="success">
              <ion-card-content class="ion-text-center">
                <ion-icon :icon="checkmarkCircle" size="large" class="logged-icon"></ion-icon>
                <p class="logged-text">{{ formatAmount(parseFloat(todayAmount)) }} logged for today!</p>
                <ion-button fill="clear" @click="editTodayAmount">Edit</ion-button>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

        <div class="stats-section">
          <ion-grid>
            <ion-row>
              <ion-col size="4">
                <ion-card class="stat-card">
                  <ion-card-content class="ion-text-center">
                    <div class="stat-number">{{ streak }}</div>
                    <div class="stat-label">Current Streak</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="4">
                <ion-card class="stat-card">
                  <ion-card-content class="ion-text-center">
                    <div class="stat-number">{{ thisMonthDays }}</div>
                    <div class="stat-label">Days This Month</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="4">
                <ion-card class="stat-card">
                  <ion-card-content class="ion-text-center">
                    <div class="stat-number">{{ formatAmount(parseFloat(thisMonthTotal), undefined, true) }}</div>
                    <div class="stat-label">Total This Month</div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <SpendingChart :entries="entries" />

        <div class="ad-space">
          <ion-card>
            <ion-card-content class="ion-text-center">
              <p class="ad-placeholder">Ad Space</p>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/vue'
import { checkmarkCircle } from 'ionicons/icons'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { supabase } from '@/lib/supabase'
import SpendingChart from '@/components/SpendingChart.vue'
import CurrencyPicker from '@/components/CurrencyPicker.vue'
import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'

const loading = ref(false)
const entries = ref<Array<{ date: string, amount: number, currency: string }>>([])
const { ensureValidSession } = useAuth()
const { currencySymbol, currencyCode, loadSavedCurrency, formatAmount } = useCurrency()
const showAmountInput = ref(false)
const currentAmount = ref('')
const amountInput = ref()

const todayLogged = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return entries.value.some(entry => entry.date === today)
})

const todayAmount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayEntry = entries.value.find(entry => entry.date === today)
  return todayEntry ? todayEntry.amount.toFixed(2) : '0.00'
})

const streak = computed(() => {
  if (entries.value.length === 0) return 0
  
  let currentStreak = 0
  const today = new Date()
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]
    
    if (entries.value.some(entry => entry.date === dateStr)) {
      currentStreak++
    } else {
      break
    }
  }
  
  return currentStreak
})

const thisMonthDays = computed(() => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  
  return entries.value.filter(entry => entry.date >= firstDay).length
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
  showAmountInput.value = true
}

const logSpending = async () => {
  if (!currentAmount.value) return
  
  // Haptic feedback for save action
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (error) {
    // Haptics not available on web
  }
  
  loading.value = true
  const today = new Date().toISOString().split('T')[0]
  const userId = await ensureValidSession()
  const amount = parseFloat(currentAmount.value)
  
  try {
    if (todayLogged.value) {
      // Update existing entry
      const { error } = await supabase
        .from('spending_entries')
        .update({ amount: amount, currency: currencyCode.value })
        .eq('user_id', userId)
        .eq('date', today)
      
      if (error) throw error
      
      // Update local data
      const entryIndex = entries.value.findIndex(entry => entry.date === today)
      if (entryIndex !== -1) {
        entries.value[entryIndex].amount = amount
        entries.value[entryIndex].currency = currencyCode.value
      }
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('spending_entries')
        .insert([
          {
            user_id: userId,
            amount: amount,
            currency: currencyCode.value,
            date: today
          }
        ])
      
      if (error) throw error
      
      entries.value.push({ date: today, amount, currency: currencyCode.value })
    }
    
    showAmountInput.value = false
    currentAmount.value = ''
  } catch (error) {
    console.error('Error logging spending:', error)
  } finally {
    loading.value = false
  }
}

const cancelAmount = () => {
  showAmountInput.value = false
  currentAmount.value = ''
}

const editTodayAmount = () => {
  currentAmount.value = todayAmount.value
  showAmountInput.value = true
  setTimeout(() => amountInput.value?.$el.setFocus(), 100)
}

const onAmountBlur = () => {
  setTimeout(() => {
    if (!document.activeElement?.closest('.amount-input-container')) {
      cancelAmount()
    }
  }, 100)
}

const loadEntries = async () => {
  const userId = await ensureValidSession()
  
  try {
    const { data, error } = await supabase
      .from('spending_entries')
      .select('date, amount, currency')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
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
</script>

<style scoped>
.logo-title {
  display: flex;
  align-items: center;
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

.spend-button {
  --width: 200px;
  --height: 200px;
  --border-radius: 50%;
  --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  --box-shadow: 0 10px 25px rgba(var(--ion-color-primary-rgb), 0.3);
  width: 200px !important;
  height: 200px !important;
  border-radius: 50% !important;
  margin: 0;
  flex-shrink: 0;
  aspect-ratio: 1;
}

.spend-button:hover {
  --box-shadow: 0 15px 35px rgba(var(--ion-color-primary-rgb), 0.4);
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  font-size: 2rem;
}

.text {
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
}

.amount-input-container {
  display: flex;
  justify-content: center;
}

.amount-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.logged-icon {
  color: var(--ion-color-success);
  margin-bottom: 0.5rem;
}

.logged-text {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

.stat-card {
  margin: 0;
}

.stat-number {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  word-break: break-all;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-top: 0.25rem;
}

.ad-placeholder {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin: 0;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .spend-button {
    --width: 180px;
    --height: 180px;
    width: 180px !important;
    height: 180px !important;
  }
}
</style>