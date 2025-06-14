<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Analytics</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Total This Month Summary -->
      <ion-card class="summary-card">
        <ion-card-content>
          <div class="summary-content">
            <div class="summary-label">
              Total This Month
            </div>
            <div class="summary-amount">
              {{ formatAmount(currentMonthTotal) }}
            </div>
            <div class="summary-change" v-if="monthlyChangePercentage !== null">
              <span :class="monthlyChangePercentage >= 0 ? 'change-positive' : 'change-negative'">
                {{ monthlyChangePercentage >= 0 ? '+' : '' }}{{ monthlyChangePercentage }}% from last month
              </span>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Analytics title -->
      <div class="analytics-header">
        <h2>Today's Spending</h2>
      </div>

      <!-- Today's Categories Chart -->
      <div class="chart-section">
        <div class="chart-card">
          <div v-if="todayCategoryData.datasets.length > 0 && todayCategoryData.datasets.some(dataset => dataset.data.some(val => val > 0))" class="doughnut-container">
            <Doughnut :data="todayCategoryData" :options="todayChartOptions" />
          </div>
          <div v-else class="empty-chart">
            <ion-icon :icon="barChartOutline" class="empty-icon"></ion-icon>
            <p>No spending today</p>
          </div>
        </div>
      </div>

      <!-- Monthly Overview -->
      <div class="analytics-header">
        <h2>{{ getCurrentMonthTitle() }}</h2>
      </div>

      <!-- Current Month Daily Chart -->
      <div class="chart-section">
        <div class="chart-card daily-spending-card">
          <div v-if="currentMonthChartData.datasets.length > 0 && currentMonthChartData.datasets.some(dataset => dataset.data.some(val => val > 0))" class="daily-spending-container">
            <Bar :data="currentMonthChartData" :options="monthlyChartOptions" />
            <div class="peak-day-info" v-if="peakDay.amount > 0">
              <span class="peak-label">Peak day: {{ peakDay.monthName }} {{ peakDay.day }}</span>
              <span class="peak-amount">{{ formatAmount(peakDay.amount) }}</span>
            </div>
          </div>
          <div v-else class="empty-chart">
            <ion-icon :icon="barChartOutline" class="empty-icon"></ion-icon>
            <p>No spending data for {{ getCurrentMonthTitle() }}</p>
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
  IonCard,
  IonCardContent,
  IonIcon
} from '@ionic/vue'
import { barChartOutline } from 'ionicons/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const entries = ref<Array<{ date: string, amount: number, currency: string, category?: string, category_id?: string }>>([])
const { ensureValidSession } = useAuth()
const { formatAmount } = useCurrency()

// Refined Apple Design System colors for better visual harmony
const chartColors = [
  '#007AFF', // System Blue
  '#34C759', // System Green  
  '#FF9500', // System Orange
  '#AF52DE', // System Purple
  '#FF2D92', // System Pink
  '#00C7BE', // System Teal
  '#FF3B30', // System Red
  '#5856D6', // System Indigo
  '#FFCC00', // System Yellow
  '#32D74B', // System Mint
  '#8E8E93', // System Gray
  '#AC8E68'  // System Brown
]


const getCurrentMonthTitle = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Calculate current month total
const currentMonthTotal = computed(() => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  
  return entries.value
    .filter(entry => entry.date >= firstDay && entry.date <= lastDay)
    .reduce((sum, entry) => sum + entry.amount, 0)
})

// Calculate last month total
const lastMonthTotal = computed(() => {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const firstDay = lastMonth.toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  
  return entries.value
    .filter(entry => entry.date >= firstDay && entry.date <= lastDay)
    .reduce((sum, entry) => sum + entry.amount, 0)
})

// Calculate percentage change from last month
const monthlyChangePercentage = computed(() => {
  if (lastMonthTotal.value === 0) {
    return currentMonthTotal.value > 0 ? 100 : null
  }
  
  const change = ((currentMonthTotal.value - lastMonthTotal.value) / lastMonthTotal.value) * 100
  return Math.round(change)
})

// Today's category spending data
const todayCategoryData = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayEntries = entries.value.filter(entry => entry.date === today)
  
  if (todayEntries.length === 0) {
    return { labels: [], datasets: [] }
  }
  
  // Group by category
  const categoryGroups: Record<string, number> = {}
  todayEntries.forEach(entry => {
    const category = entry.category || 'Uncategorized'
    categoryGroups[category] = (categoryGroups[category] || 0) + entry.amount
  })
  
  const categories = Object.keys(categoryGroups)
  const amounts = Object.values(categoryGroups)
  const colors = categories.map((_, index) => chartColors[index % chartColors.length])
  const hoverColors = colors.map(color => {
    // Create lighter hover colors
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, 0.8)`
  })
  
  return {
    labels: categories,
    datasets: [{
      data: amounts,
      backgroundColor: colors,
      hoverBackgroundColor: hoverColors,
      borderColor: '#FFFFFF',
      hoverBorderColor: '#FFFFFF',
      borderWidth: 2,
      hoverBorderWidth: 4,
      offset: categories.map(() => 0), // No offset by default
      hoverOffset: 8 // Move slice out on hover
    }]
  }
})


// Current month chart data (simplified - no categories)
const currentMonthChartData = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // Create labels for all days in the month
  const labels = []
  const data = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    labels.push(day.toString())
    const dateStr = new Date(now.getFullYear(), now.getMonth(), day).toISOString().split('T')[0]
    const dayEntries = entries.value.filter(entry => entry.date === dateStr)
    const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0)
    data.push(amount)
  }
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
      borderWidth: 0,
      borderRadius: {
        topLeft: 3,
        topRight: 3,
        bottomLeft: 0,
        bottomRight: 0
      },
      borderSkipped: false,
      barThickness: 8, // Very thin bars like iOS
      maxBarThickness: 8
    }]
  }
})

// Peak day calculation
const peakDay = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  let maxAmount = 0
  let peakDayNumber = 0
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(now.getFullYear(), now.getMonth(), day).toISOString().split('T')[0]
    const dayEntries = entries.value.filter(entry => entry.date === dateStr)
    const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0)
    
    if (amount > maxAmount) {
      maxAmount = amount
      peakDayNumber = day
    }
  }
  
  return {
    day: peakDayNumber,
    amount: maxAmount,
    monthName: now.toLocaleDateString('en-US', { month: 'long' })
  }
})

// Today's doughnut chart options (Proper Chart.js Configuration)
const todayChartOptions = computed((): ChartOptions<'doughnut'> => {
  const { formatAmount } = useCurrency()
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Modern thin ring
    radius: '90%', // Chart size within container
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'center',
        labels: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            size: 14,
            weight: 500
          },
          color: '#1C1C1E',
          padding: 20,
          usePointStyle: false,
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        cornerRadius: 12,
        titleFont: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          size: 14,
          weight: 600
        },
        bodyFont: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          size: 13,
          weight: 400
        },
        padding: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed
            const total = context.dataset.data.reduce((sum: number, val) => sum + (val as number), 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${formatAmount(value)} (${percentage}%)`
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: false,
      duration: 800
    },
    interaction: {
      intersect: false,
      mode: 'nearest'
    }
  }
})

// Monthly chart options (Clean iOS Daily Spending style)
const monthlyChartOptions = computed((): ChartOptions<'bar'> => {
  const { formatAmount } = useCurrency()
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        cornerRadius: 12,
        titleFont: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          size: 14,
          weight: 600
        },
        bodyFont: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          size: 13,
          weight: 400
        },
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const day = parseInt(context[0].label)
            const now = new Date()
            const monthName = now.toLocaleDateString('en-US', { month: 'long' })
            const year = now.getFullYear()
            
            // Add ordinal suffix (st, nd, rd, th)
            const getOrdinalSuffix = (num: number) => {
              const j = num % 10
              const k = num % 100
              if (j === 1 && k !== 11) return 'st'
              if (j === 2 && k !== 12) return 'nd'
              if (j === 3 && k !== 13) return 'rd'
              return 'th'
            }
            
            return `${monthName} ${day}${getOrdinalSuffix(day)} ${year}`
          },
          label: (context) => {
            const value = context.parsed.y
            return formatAmount(value)
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#8E8E93',
          font: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            size: 13,
            weight: 400
          },
          padding: 10,
          maxRotation: 0,
          callback: function(value) {
            // Only show specific days for clean look
            const label = this.getLabelForValue(Number(value))
            return label !== '' ? label : undefined
          }
        }
      },
      y: {
        display: false, // Hide Y-axis for minimal design
        beginAtZero: true,
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 3,
          topRight: 3,
          bottomLeft: 0,
          bottomRight: 0
        }
      }
    }
  }
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
.analytics-header {
  padding: 1.5rem 0 1rem 0;
}

.analytics-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  letter-spacing: -0.41px;
  line-height: 1.2;
}

.summary-card {
  margin: 1rem 0 1.5rem 0;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 122, 255, 0.25);
  border: none;
}

.summary-content {
  text-align: center;
  color: white;
  padding: 1rem;
}

.summary-amount {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  letter-spacing: -0.45px;
  line-height: 1.1;
}

.summary-label {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
  margin-bottom: 0.5rem;
}

.summary-change {
  font-size: 0.875rem;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
}

.change-positive {
  color: rgba(255, 255, 255, 0.8);
}

.change-negative {
  color: rgba(255, 255, 255, 0.8);
}

.chart-section {
  margin: 1.5rem 0;
}

.chart-card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #E5E5EA;
  overflow: hidden;
}

.chartjs-container {
  padding: 1.5rem;
  height: 280px;
}

.doughnut-container {
  padding: 2rem 1.5rem;
  height: 350px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.daily-spending-card {
  background: #FAFAFA;
  border: none;
  border-radius: 20px;
}

.daily-spending-container {
  padding: 2rem 1.5rem 1rem 1.5rem;
  height: 220px;
  position: relative;
}

.peak-day-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
}

.peak-label {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #8E8E93;
  letter-spacing: -0.24px;
}

.peak-amount {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.43px;
}


/* Empty State */
.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #C7C7CC;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.empty-chart p {
  color: #8E8E93;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: -0.24px;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .chartjs-container {
    height: 240px;
    padding: 1rem;
  }
  
  .doughnut-container {
    height: 320px;
    padding: 1.5rem 1rem;
  }
  
  .daily-spending-container {
    height: 200px;
    padding: 1.5rem 1rem 1rem 1rem;
  }
  
  .peak-label {
    font-size: 14px;
  }
  
  .peak-amount {
    font-size: 16px;
  }
  
  .analytics-header {
    padding: 1rem 0 0.75rem 0;
  }
  
  .analytics-header h2 {
    font-size: 1.5rem;
  }
  
  .summary-amount {
    font-size: 1.875rem;
  }
  
  .chart-card {
    border-radius: 12px;
  }
  
  .chart-section {
    margin: 1rem 0;
  }
}
</style>