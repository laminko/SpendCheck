<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>History</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Time filter segments -->
      <ion-segment v-model="selectedPeriod" @ionChange="onPeriodChange">
        <ion-segment-button value="daily">
          <ion-label>Daily</ion-label>
        </ion-segment-button>
        <ion-segment-button value="monthly">
          <ion-label>Monthly</ion-label>
        </ion-segment-button>
        <ion-segment-button value="yearly">
          <ion-label>Yearly</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Summary card -->
      <ion-card class="summary-card" v-if="filteredEntries.length > 0">
        <ion-card-content>
          <div class="summary-content">
            <div class="summary-amount">
              {{ formatAmount(totalAmount, undefined, true) }}
            </div>
            <div class="summary-label">
              Total {{ selectedPeriod === 'daily' ? 'Today' : selectedPeriod === 'monthly' ? 'This Month' : 'This Year' }}
            </div>
            <div class="summary-count">
              {{ filteredEntries.length }} transaction{{ filteredEntries.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Entries list -->
      <div v-if="filteredEntries.length > 0" class="entries-section">
        <ion-card v-for="entry in filteredEntries" :key="`${entry.date}-${entry.amount}`" class="entry-card">
          <ion-card-content>
            <div class="entry-content">
              <div class="entry-main">
                <div class="entry-amount">
                  {{ formatAmount(entry.amount, undefined, true) }}
                </div>
                <div class="entry-category" v-if="entry.category">
                  {{ entry.category }}
                </div>
              </div>
              <div class="entry-date">
                {{ formatDate(entry.date, entry.created_at) }}
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <ion-icon :icon="receiptOutline" class="empty-icon"></ion-icon>
        <h3>No spending recorded</h3>
        <p>No transactions found for the selected period.</p>
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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonIcon
} from '@ionic/vue'
import { receiptOutline } from 'ionicons/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'

const selectedPeriod = ref('daily')
const entries = ref<Array<{ date: string, amount: number, currency: string, category?: string, category_id?: string, created_at?: string }>>([])
const { ensureValidSession } = useAuth()
const { formatAmount } = useCurrency()

// Filter entries based on selected period
const filteredEntries = computed(() => {
  const now = new Date()
  let startDate: string

  switch (selectedPeriod.value) {
    case 'daily':
      startDate = now.toISOString().split('T')[0]
      return entries.value.filter(entry => entry.date === startDate)
    
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      return entries.value.filter(entry => entry.date >= startDate)
    
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      return entries.value.filter(entry => entry.date >= startDate)
    
    default:
      return entries.value
  }
})

// Calculate total amount for filtered entries
const totalAmount = computed(() => {
  return filteredEntries.value.reduce((sum, entry) => sum + entry.amount, 0)
})

const onPeriodChange = (event: CustomEvent) => {
  selectedPeriod.value = event.detail.value
}

const formatDate = (dateString: string, createdAt?: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // For daily view, show more detailed time information
  if (selectedPeriod.value === 'daily') {
    // If we have a timestamp (created_at), use it for relative time
    if (createdAt) {
      const createdDate = new Date(createdAt)
      const now = new Date()
      const diffMs = now.getTime() - createdDate.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 1) {
        return 'Just now'
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
      } else if (diffHours < 24 && createdDate.toDateString() === now.toDateString()) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      } else if (createdDate.toDateString() === now.toDateString()) {
        return createdDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      } else if (createdDate.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${createdDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`
      }
    }
    
    // Fallback for entries without timestamp
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
  }

  // For monthly/yearly view or fallback, show date
  return date.toLocaleDateString('en-US', {
    weekday: selectedPeriod.value === 'daily' ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  })
}

const loadEntries = async () => {
  const userId = await ensureValidSession()

  try {
    const { data, error } = await supabase
      .from('spending_entries')
      .select('date, amount, currency, category, category_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    entries.value = data || []
  } catch (error) {
    console.error('Error loading entries:', error)
  }
}

onMounted(() => {
  loadEntries()
})
</script>

<style scoped>
.summary-card {
  margin: 1rem 0;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.summary-content {
  text-align: center;
  color: white;
}

.summary-amount {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.summary-label {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.summary-count {
  font-size: 0.875rem;
  opacity: 0.8;
}

.entries-section {
  margin-top: 1rem;
}

.entry-card {
  margin-bottom: 0.5rem;
}

.entry-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.entry-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.entry-amount {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.entry-category {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.entry-date {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  text-align: right;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--ion-color-dark);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0;
}

ion-segment {
  margin-bottom: 1rem;
}
</style>