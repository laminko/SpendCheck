<template>
  <div class="monthly-spending-chart">
    <!-- Monthly Overview -->
    <div class="analytics-header">
      <h2>{{ getCurrentMonthTitle() }}</h2>
    </div>

    <!-- Current Month Daily Chart -->
    <div class="chart-section">
      <div class="chart-card daily-spending-card">
        <div v-if="currentMonthChartData.datasets.length > 0 && currentMonthChartData.datasets.some(dataset => dataset.data.some(val => val > 0))" class="daily-spending-container">
          <Bar :data="currentMonthChartData" :options="monthlyChartOptions" />
        </div>
        <div v-else class="empty-chart">
          <ion-icon :icon="barChartOutline" class="empty-icon"></ion-icon>
          <p>No spending data for {{ getCurrentMonthTitle() }}</p>
        </div>
        <div class="peak-spending-info" v-if="peakDay.amount > 0">
          <span class="peak-spending-label">Peak spending: <strong>{{ peakDay.monthName }} {{ peakDay.day }}</strong></span>
          <span class="peak-spending-amount">{{ formatAmount(peakDay.amount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { barChartOutline } from 'ionicons/icons'
import { useCurrency } from '@/composables/useCurrency'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  ChartOptions
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
)

interface Props {
  entries: Array<{ date: string, amount: number, currency: string, category?: string, category_id?: string }>
}

const props = defineProps<Props>()
const { formatAmount } = useCurrency()

const getCurrentMonthTitle = () => {
  const now = new Date()
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return `This Month's Spending (${monthYear})`
}

// Current month chart data
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
    const dayEntries = props.entries.filter(entry => entry.date === dateStr)
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
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  
  // Filter entries for current month
  const currentMonthEntries = props.entries.filter(entry => entry.date >= firstDay && entry.date <= lastDay)
  
  // Group by date and find peak
  const dailyTotals: Record<string, number> = {}
  currentMonthEntries.forEach(entry => {
    dailyTotals[entry.date] = (dailyTotals[entry.date] || 0) + entry.amount
  })
  
  let maxAmount = 0
  let peakDate = ''
  
  Object.entries(dailyTotals).forEach(([date, amount]) => {
    if (amount > maxAmount) {
      maxAmount = amount
      peakDate = date
    }
  })
  
  const peakDayNumber = peakDate ? new Date(peakDate).getDate() : 0
  
  return {
    day: peakDayNumber,
    amount: maxAmount,
    monthName: now.toLocaleDateString('en-US', { month: 'long' })
  }
})

// Monthly chart options
const monthlyChartOptions = computed((): ChartOptions<'bar'> => {
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

.daily-spending-card {
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 16px;
}

.daily-spending-container {
  padding: 2rem 1.5rem 0.5rem 1.5rem;
  height: 220px;
  position: relative;
}

.peak-spending-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1.5rem 1rem 1.5rem;
}

.peak-spending-label {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #1C1C1E;
  letter-spacing: -0.24px;
}

.peak-spending-amount {
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
  .daily-spending-container {
    height: 200px;
    padding: 1.5rem 1rem 1rem 1rem;
  }
  
  .peak-spending-label {
    font-size: 14px;
  }
  
  .peak-spending-amount {
    font-size: 16px;
  }
  
  .analytics-header {
    padding: 1rem 0 0.75rem 0;
  }
  
  .analytics-header h2 {
    font-size: 1.5rem;
  }
  
  .chart-card {
    border-radius: 12px;
  }
  
  .chart-section {
    margin: 1rem 0;
  }
}
</style>