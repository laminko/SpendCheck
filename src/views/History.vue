<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>History</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">

      <!-- Summary card -->
      <ion-card class="summary-card" v-if="filteredEntries.length > 0">
        <ion-card-content>
          <div class="summary-content">
            <div class="summary-amount">
              {{ formatAmount(totalAmount) }}
            </div>
            <div class="summary-label">
              Total Last 7 Days
            </div>
            <div class="summary-count">
              {{ filteredEntries.length }} transaction{{ filteredEntries.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Entries list grouped by date -->
      <div v-if="groupedEntries.length > 0" class="entries-section">
        <ion-item-group v-for="group in groupedEntries" :key="group.date">
          <ion-item-divider>
            <ion-label>
              <div class="date-divider-content">
                <span class="date-text">{{ formatDateDivider(group.date) }}</span>
                <span class="date-total">{{ formatAmount(group.total) }}</span>
              </div>
              <div class="date-count">{{ group.count }} transaction{{ group.count !== 1 ? 's' : '' }}</div>
            </ion-label>
          </ion-item-divider>
          
          <ion-item-sliding v-for="entry in group.entries" :key="entry.id">
            <ion-item>
              <div class="entry-content">
                <div class="entry-main">
                  <div class="entry-amount">
                    {{ formatAmount(entry.amount) }}
                  </div>
                  <div class="entry-category" v-if="entry.category">
                    {{ entry.category }}
                  </div>
                </div>
                <div class="entry-time">
                  {{ formatEntryTime(entry.created_at || entry.date) }}
                </div>
              </div>
            </ion-item>
            
            <ion-item-options side="end">
              <ion-item-option color="danger" @click="confirmDelete(entry)">
                <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-item-group>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <ion-icon :icon="receiptOutline" class="empty-icon"></ion-icon>
        <h3>No spending recorded</h3>
        <p>No transactions found in the last 7 days.</p>
      </div>
    </ion-content>
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
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  alertController,
  toastController
} from '@ionic/vue'
import { receiptOutline, trashOutline } from 'ionicons/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'

const entries = ref<Array<{ id: string, date: string, amount: number, currency: string, category?: string, category_id?: string, created_at?: string }>>([])
const { ensureValidSession } = useAuth()
const { formatAmount } = useCurrency()
const route = useRoute()

// Filter entries to show only last 7 days
const filteredEntries = computed(() => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
  const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0]
  
  return entries.value.filter(entry => entry.date >= sevenDaysAgoString)
})

// Group entries by date in descending order
const groupedEntries = computed(() => {
  const groups: Record<string, Array<{ id: string, date: string, amount: number, currency: string, category?: string, category_id?: string, created_at?: string }>> = {}
  
  filteredEntries.value.forEach(entry => {
    if (!groups[entry.date]) {
      groups[entry.date] = []
    }
    groups[entry.date].push(entry)
  })
  
  // Sort dates in descending order and sort entries within each date
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  
  return sortedDates.map(date => ({
    date,
    entries: groups[date].sort((a, b) => 
      new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    ),
    total: groups[date].reduce((sum, entry) => sum + entry.amount, 0),
    count: groups[date].length
  }))
})

// Calculate total amount for filtered entries
const totalAmount = computed(() => {
  return filteredEntries.value.reduce((sum, entry) => sum + entry.amount, 0)
})


const formatDateDivider = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }
}

const formatEntryTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMins < 1) {
    return 'Just now'
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24 && date.toDateString() === now.toDateString()) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
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

const confirmDelete = async (entry: { id: string, amount: number, category?: string }) => {
  const alert = await alertController.create({
    header: 'Delete Entry',
    message: `Are you sure you want to delete this ${formatAmount(entry.amount)} ${entry.category ? `(${entry.category})` : ''} entry?`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deleteEntry(entry.id)
      }
    ]
  })

  await alert.present()
}

const deleteEntry = async (entryId: string) => {
  const userId = await ensureValidSession()

  try {
    const { error } = await supabase
      .from('spending_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId)

    if (error) throw error

    // Remove entry from local state
    const deletedEntry = entries.value.find(entry => entry.id === entryId)
    entries.value = entries.value.filter(entry => entry.id !== entryId)

    // Show success toast
    const toast = await toastController.create({
      message: `${formatAmount(deletedEntry?.amount || 0)} ${deletedEntry?.category ? `(${deletedEntry.category})` : ''} deleted successfully`,
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
    console.error('Error deleting entry:', error)
    
    // Show error toast
    const toast = await toastController.create({
      message: 'Failed to delete entry. Please try again.',
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
  }
}

onMounted(() => {
  loadEntries()
})

// Watch for route changes to this tab
watch(() => route.path, (newPath) => {
  if (newPath === '/tabs/history') {
    loadEntries()
  }
}, { immediate: false })
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

.entry-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 0;
}

.entry-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entry-amount {
  font-weight: 600;
  color: var(--ion-color-primary);
}

.entry-category {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.entry-time {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
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

ion-item-group {
  margin-bottom: 1rem;
}

ion-item-divider {
  --background: var(--ion-color-light);
  --color: var(--ion-color-dark);
  font-weight: 600;
}

.date-divider-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.date-text {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.date-total {
  font-weight: 700;
  color: var(--ion-color-primary);
  font-size: 1rem;
}

.date-count {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
}
</style>