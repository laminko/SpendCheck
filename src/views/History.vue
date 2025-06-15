<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>History</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">

      <!-- Summary card -->
      <SummaryCard
        v-if="filteredEntries.length > 0"
        label="Total Last 7 Days"
        :amount="formatAmount(totalAmount)"
        :count="`${filteredEntries.length} transaction${filteredEntries.length !== 1 ? 's' : ''}`"
      />

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
                  {{ formatEntryTime(entry.date || entry.created_at || '') }}
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
import { onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
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
import SummaryCard from '@/components/SummaryCard.vue'
import { receiptOutline, trashOutline } from 'ionicons/icons'
import { useCurrency } from '@/composables/useCurrency'
import { useSpendingStore } from '@/composables/useSpendingStore'
import { useDateUtils } from '@/composables/useDateUtils'
import moment from 'moment-timezone'

const { formatAmount } = useCurrency()
const route = useRoute()
const { entries, loadEntries, deleteEntry } = useSpendingStore()
const { getDaysAgo, toLocalDateString, formatRelativeDate } = useDateUtils()

// Filter entries to show only last 7 days
const filteredEntries = computed(() => {
  const sevenDaysAgoString = getDaysAgo(7)
  
  return entries.value.filter(entry => {
    const entryDate = toLocalDateString(entry.date)
    return entryDate >= sevenDaysAgoString
  })
})

// Group entries by date in descending order
const groupedEntries = computed(() => {
  const groups: Record<string, Array<{ id?: string, date: string, amount: number, currency: string, category?: string, category_id?: string, created_at?: string }>> = {}
  
  filteredEntries.value.forEach(entry => {
    if (entry.id) {
      const entryLocalDate = toLocalDateString(entry.date)
      if (!groups[entryLocalDate]) {
        groups[entryLocalDate] = []
      }
      groups[entryLocalDate].push(entry)
    }
  })
  
  // Sort dates in descending order and sort entries within each date
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  
  return sortedDates.map(date => ({
    date,
    entries: groups[date].sort((a, b) => 
      new Date(b.date || b.created_at || '').getTime() - new Date(a.date || a.created_at || '').getTime()
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
  return formatRelativeDate(dateString)
}

const formatEntryTime = (timestamp: string) => {

  // Use yyyy-mm-dd format with AM/PM (e.g., "2024-12-14 2:30 PM")
  return moment(timestamp).format('YYYY-MM-DD h:mm A')

}


const confirmDelete = async (entry: { id?: string, amount: number, category?: string }) => {
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
        handler: () => {
          if (entry.id) {
            return handleDeleteEntry(entry.id)
          }
        }
      }
    ]
  })

  await alert.present()
}

const handleDeleteEntry = async (entryId: string) => {
  const deletedEntry = entries.value.find(entry => entry.id === entryId)
  
  try {
    await deleteEntry(entryId)

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
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  letter-spacing: -0.24px;
}

.entry-category {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
  font-weight: 400;
}

.entry-time {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
  font-weight: 400;
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
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-weight: 600;
  letter-spacing: -0.24px;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-weight: 400;
  letter-spacing: -0.24px;
}

ion-item-group {
  margin-bottom: 1rem;
}

ion-item-divider {
  --background: var(--ion-color-light);
  --color: var(--ion-color-dark);
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
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
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
}

.date-total {
  font-weight: 700;
  color: var(--ion-color-primary);
  font-size: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  letter-spacing: -0.24px;
}

.date-count {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
  font-weight: 400;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  
  .entries-section {
    margin-top: 0.75rem;
  }
  
  .entry-content {
    padding: 14px 0;
  }
  
  .entry-amount {
    font-size: 0.95rem;
  }
  
  .entry-category {
    font-size: 0.8125rem;
  }
  
  .entry-time {
    font-size: 0.8125rem;
  }
  
  .date-total {
    font-size: 0.9rem;
  }
  
  .date-count {
    font-size: 0.6875rem;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
  
  .empty-state h3 {
    font-size: 1.125rem;
  }
  
  .empty-state p {
    font-size: 0.875rem;
  }
}
</style>