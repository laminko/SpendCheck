<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Analytics</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Chart type and period selectors -->
      <div class="controls-section">
        <!-- Chart Type Toggle -->
        <ion-segment v-model="chartType" @ionChange="onChartTypeChange">
          <ion-segment-button value="bar">
            <ion-icon :icon="barChartOutline"></ion-icon>
            <ion-label>Bar</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pie">
            <ion-icon :icon="pieChartOutline"></ion-icon>
            <ion-label>Categories</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Time Period (only for bar charts) -->
        <ion-segment v-if="chartType === 'bar'" v-model="timePeriod" @ionChange="onTimePeriodChange">
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
      </div>

      <!-- Summary card -->
      <ion-card class="summary-card">
        <ion-card-content>
          <div class="summary-content">
            <div class="summary-amount">
              {{ formatAmount(totalAmount, undefined, true) }}
            </div>
            <div class="summary-label">
              Total {{ getSummaryLabel() }}
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Charts Section -->
      <div class="chart-section">
        <!-- Bar Chart -->
        <div v-if="chartType === 'bar'" class="bar-chart-container">
          <div v-if="barChartData.length > 0" class="bar-chart">
            <div 
              v-for="(item, index) in barChartData" 
              :key="index"
              class="bar-item"
            >
              <div class="bar-container">
                <div 
                  class="bar" 
                  :style="{ height: `${item.percentage}%` }"
                  :title="`${item.label}: ${formatAmount(item.amount, undefined, true)}`"
                ></div>
              </div>
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-amount">{{ formatAmount(item.amount, undefined, true) }}</div>
            </div>
          </div>
          <div v-else class="empty-chart">
            <ion-icon :icon="barChartOutline" class="empty-icon"></ion-icon>
            <p>No data available for this period</p>
          </div>
        </div>

        <!-- Pie Chart (Categories) -->
        <div v-if="chartType === 'pie'" class="pie-chart-container">
          <div v-if="categoryData.length > 0" class="category-breakdown">
            <div 
              v-for="(category, index) in categoryData" 
              :key="index"
              class="category-item"
            >
              <div class="category-info">
                <div 
                  class="category-color" 
                  :style="{ backgroundColor: category.color }"
                ></div>
                <div class="category-details">
                  <div class="category-name">{{ category.name }}</div>
                  <div class="category-amount">{{ formatAmount(category.amount, undefined, true) }}</div>
                </div>
              </div>
              <div class="category-percentage">{{ category.percentage.toFixed(1) }}%</div>
            </div>
          </div>
          <div v-else class="empty-chart">
            <ion-icon :icon="pieChartOutline" class="empty-icon"></ion-icon>
            <p>No category data available</p>
          </div>
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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonIcon
} from '@ionic/vue'
import { barChartOutline, pieChartOutline } from 'ionicons/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'

const chartType = ref('bar')
const timePeriod = ref('daily')
const entries = ref<Array<{ date: string, amount: number, currency: string, category?: string, category_id?: string }>>([])
const { ensureValidSession } = useAuth()
const { formatAmount } = useCurrency()

// Chart colors for categories
const chartColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
  '#ec4899', '#6366f1', '#14b8a6', '#eab308'
]

const onChartTypeChange = (event: CustomEvent) => {
  chartType.value = event.detail.value
}

const onTimePeriodChange = (event: CustomEvent) => {
  timePeriod.value = event.detail.value
}

const getSummaryLabel = () => {
  if (chartType.value === 'pie') return 'All Time'
  
  switch (timePeriod.value) {
    case 'daily': return 'Last 7 Days'
    case 'monthly': return 'Last 12 Months'
    case 'yearly': return 'All Years'
    default: return ''
  }
}

// Calculate total amount based on current filters
const totalAmount = computed(() => {
  if (chartType.value === 'pie') {
    return entries.value.reduce((sum, entry) => sum + entry.amount, 0)
  }
  
  const now = new Date()
  let filteredEntries = entries.value

  switch (timePeriod.value) {
    case 'daily':
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      filteredEntries = entries.value.filter(entry => 
        new Date(entry.date) >= sevenDaysAgo
      )
      break
    case 'monthly':
      const twelveMonthsAgo = new Date(now)
      twelveMonthsAgo.setMonth(now.getMonth() - 12)
      filteredEntries = entries.value.filter(entry => 
        new Date(entry.date) >= twelveMonthsAgo
      )
      break
  }

  return filteredEntries.reduce((sum, entry) => sum + entry.amount, 0)
})

// Bar chart data preparation
const barChartData = computed(() => {
  const now = new Date()
  let data: Array<{ label: string, amount: number, percentage: number }> = []

  switch (timePeriod.value) {
    case 'daily':
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(now.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayEntries = entries.value.filter(entry => entry.date === dateStr)
        const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0)
        
        data.push({
          label: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
          amount,
          percentage: 0
        })
      }
      break

    case 'monthly':
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        
        const monthEntries = entries.value.filter(entry => {
          const entryDate = new Date(entry.date)
          return entryDate >= date && entryDate < nextMonth
        })
        const amount = monthEntries.reduce((sum, entry) => sum + entry.amount, 0)
        
        data.push({
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          amount,
          percentage: 0
        })
      }
      break

    case 'yearly':
      // Group by year
      const yearGroups: Record<number, number> = {}
      entries.value.forEach(entry => {
        const year = new Date(entry.date).getFullYear()
        yearGroups[year] = (yearGroups[year] || 0) + entry.amount
      })
      
      data = Object.entries(yearGroups)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([year, amount]) => ({
          label: year,
          amount,
          percentage: 0
        }))
      break
  }

  // Calculate percentages
  const maxAmount = Math.max(...data.map(d => d.amount), 1)
  data.forEach(item => {
    item.percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0
  })

  return data
})

// Category data for pie chart
const categoryData = computed(() => {
  const categoryGroups: Record<string, number> = {}
  
  entries.value.forEach(entry => {
    const category = entry.category || 'Uncategorized'
    categoryGroups[category] = (categoryGroups[category] || 0) + entry.amount
  })

  const totalCategoryAmount = Object.values(categoryGroups).reduce((sum, amount) => sum + amount, 0)
  
  const data = Object.entries(categoryGroups)
    .sort(([, a], [, b]) => b - a)
    .map(([name, amount], index) => ({
      name,
      amount,
      percentage: totalCategoryAmount > 0 ? (amount / totalCategoryAmount) * 100 : 0,
      color: chartColors[index % chartColors.length]
    }))

  return data
})

const loadEntries = async () => {
  const userId = await ensureValidSession()

  try {
    const { data, error } = await supabase
      .from('spending_entries')
      .select('date, amount, currency, category, category_id')
      .eq('user_id', userId)
      .order('date', { ascending: false })

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
.controls-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-card {
  margin: 1rem 0;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
}

.chart-section {
  margin-top: 1rem;
}

/* Bar Chart Styles */
.bar-chart {
  display: flex;
  align-items: end;
  gap: 0.5rem;
  height: 200px;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.bar-container {
  height: 150px;
  width: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
}

.bar {
  width: 80%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: all 0.3s ease;
}

.bar:hover {
  opacity: 0.8;
  transform: scaleY(1.05);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.bar-amount {
  font-size: 0.7rem;
  color: var(--ion-color-dark);
  font-weight: 600;
}

/* Category (Pie Chart) Styles */
.category-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.category-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-name {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.category-amount {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.category-percentage {
  font-weight: 600;
  color: var(--ion-color-primary);
}

/* Empty State */
.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.empty-chart p {
  color: var(--ion-color-medium);
  margin: 0;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .bar-chart {
    height: 180px;
    padding: 0.75rem;
  }
  
  .bar-container {
    height: 120px;
  }
  
  .bar-label, .bar-amount {
    font-size: 0.7rem;
  }
  
  .category-item {
    padding: 0.5rem;
  }
  
  .category-info {
    gap: 0.75rem;
  }
}
</style>