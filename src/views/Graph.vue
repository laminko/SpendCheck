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

        <!-- Note: Time period removed for bar chart as it now shows current month only -->
      </div>

      <!-- Summary card -->
      <ion-card class="summary-card">
        <ion-card-content>
          <div class="summary-content">
            <div class="summary-amount">
              {{ formatAmount(totalAmount) }}
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
          <div class="chart-title">
            {{ getCurrentMonthTitle() }}
          </div>
          <div v-if="currentMonthChartData.datasets.length > 0 && currentMonthChartData.datasets.some(dataset => dataset.data.some(val => val > 0))" class="chartjs-container">
            <Bar :data="currentMonthChartData" :options="chartOptions" />
          </div>
          <div v-else class="empty-chart">
            <ion-icon :icon="barChartOutline" class="empty-icon"></ion-icon>
            <p>No spending data for {{ getCurrentMonthTitle() }}</p>
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
                  <div class="category-amount">{{ formatAmount(category.amount) }}</div>
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

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


const getSummaryLabel = () => {
  if (chartType.value === 'pie') return 'All Time'
  if (chartType.value === 'bar') return getCurrentMonthTitle()
  
  switch (timePeriod.value) {
    case 'daily': return 'Last 7 Days'
    case 'monthly': return 'Last 12 Months'
    case 'yearly': return 'All Years'
    default: return ''
  }
}

const getCurrentMonthTitle = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Calculate total amount based on current filters
const totalAmount = computed(() => {
  if (chartType.value === 'pie') {
    return entries.value.reduce((sum, entry) => sum + entry.amount, 0)
  }
  
  if (chartType.value === 'bar') {
    // For bar chart, show current month total
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    
    return entries.value
      .filter(entry => entry.date >= firstDay && entry.date <= lastDay)
      .reduce((sum, entry) => sum + entry.amount, 0)
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


// Current month chart data for Chart.js
const currentMonthChartData = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // Create labels for all days in the month
  const labels = []
  for (let day = 1; day <= daysInMonth; day++) {
    labels.push(day.toString())
  }
  
  // Get categories and assign colors
  const categories = [...new Set(entries.value.map(entry => entry.category || 'Uncategorized'))]
  const categoryColorMap = categories.reduce((map, category, index) => {
    map[category] = chartColors[index % chartColors.length]
    return map
  }, {} as Record<string, string>)
  
  // Create datasets for each category
  const datasets = categories.map(category => {
    const data = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(now.getFullYear(), now.getMonth(), day).toISOString().split('T')[0]
      const dayEntries = entries.value.filter(entry => 
        entry.date === dateStr && (entry.category || 'Uncategorized') === category
      )
      const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0)
      data.push(amount)
    }
    
    return {
      label: category,
      data,
      backgroundColor: categoryColorMap[category],
      borderColor: categoryColorMap[category],
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false
    }
  })
  
  return {
    labels,
    datasets
  }
})

// Chart.js options
const chartOptions = computed((): ChartOptions<'bar'> => {
  const { formatAmount } = useCurrency()
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            const category = context.dataset.label
            return `${category}: ${formatAmount(value)}`
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day of Month'
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount'
        },
        ticks: {
          callback: (value) => {
            return formatAmount(Number(value))
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  }
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

.chart-title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 1rem;
}

.chartjs-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 400px;
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
  .chartjs-container {
    height: 300px;
    padding: 1rem;
  }
  
  .chart-title {
    font-size: 1.1rem;
  }
  
  .category-item {
    padding: 0.5rem;
  }
  
  .category-info {
    gap: 0.75rem;
  }
}
</style>