<template>
  <div class="home">
    <header class="header">
      <div class="header-top">
        <div class="logo-title">
          <img src="/logo.svg" alt="SpendCheck Logo" class="logo" />
          <h1>SpendCheck</h1>
        </div>
        <CurrencyPicker />
      </div>
      <p>Did you spend money today?</p>
    </header>

    <main class="main">
      <div class="tap-section">
        <div v-if="!showAmountInput && !todayLogged" class="spend-button-container">
          <button 
            class="spend-button"
            @click="showAmountInput = true"
            :disabled="loading"
          >
            <div class="button-content">
              <div class="icon">💳</div>
              <div class="text">Tap if you spent today</div>
            </div>
          </button>
        </div>

        <div v-else-if="showAmountInput" class="amount-input-container">
          <div class="amount-input-wrapper">
            <span class="currency">{{ currencySymbol }}</span>
            <input 
              ref="amountInput"
              v-model="currentAmount" 
              type="number" 
              step="0.01"
              placeholder="0.00"
              class="amount-input"
              @keyup.enter="logSpending"
              @blur="onAmountBlur"
            />
          </div>
          <div class="amount-actions">
            <button @click="cancelAmount" class="cancel-btn">Cancel</button>
            <button @click="logSpending" :disabled="!currentAmount || loading" class="save-btn">
              {{ todayLogged ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>

        <div v-else class="logged-container">
          <div class="logged-icon">✓</div>
          <div class="logged-text">{{ formatAmount(parseFloat(todayAmount)) }} logged for today!</div>
          <button @click="editTodayAmount" class="edit-btn">Edit</button>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat">
          <div class="stat-number">{{ streak }}</div>
          <div class="stat-label">Current Streak</div>
        </div>
        <div class="stat">
          <div class="stat-number">{{ thisMonthDays }}</div>
          <div class="stat-label">Days This Month</div>
        </div>
        <div class="stat">
          <div class="stat-number">{{ formatAmount(parseFloat(thisMonthTotal), undefined, true) }}</div>
          <div class="stat-label">Total This Month</div>
        </div>
      </div>

      <SpendingChart :entries="entries" />

      <div class="ad-space">
        <div class="ad-placeholder">Ad Space</div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
const amountInput = ref<HTMLInputElement>()

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

const logSpending = async () => {
  if (!currentAmount.value) return
  
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
  setTimeout(() => amountInput.value?.focus(), 100)
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
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  padding: 2rem 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  position: relative;
}

.logo-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 40px;
  height: 40px;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tap-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  position: relative;
  z-index: 1;
}

.spend-button {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.spend-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
}

.spend-button:active {
  transform: translateY(0);
}

.amount-input-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 280px;
  width: 100%;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}

.amount-input-wrapper:focus-within {
  border-color: #3b82f6;
}

.currency {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-right: 0.5rem;
}

.amount-input {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  outline: none;
  width: 120px;
  text-align: left;
}

.amount-input::placeholder {
  color: #9ca3af;
}

.amount-actions {
  display: flex;
  gap: 1rem;
}

.cancel-btn, .save-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: #3b82f6;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #2563eb;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logged-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.1);
  border: 2px solid #10b981;
}

.logged-icon {
  font-size: 3rem;
  color: #10b981;
}

.logged-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
}

.edit-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #059669;
}

.spend-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.stats-section {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.stat {
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 70px;
  flex: 1;
  max-width: 100px;
}

.stat-number {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1f2937;
  word-break: break-all;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.ad-space {
  margin-top: auto;
  padding: 1rem 0;
}

.ad-placeholder {
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .home {
    padding: 0.5rem;
  }
  
  .spend-button {
    width: 180px;
    height: 180px;
  }
  
  .stats-section {
    gap: 0.5rem;
  }
}
</style>