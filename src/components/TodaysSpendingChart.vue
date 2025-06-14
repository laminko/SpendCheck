<template>
  <div class="todays-spending-chart">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { barChartOutline } from 'ionicons/icons'
import { useCurrency } from '@/composables/useCurrency'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

interface Props {
  entries: Array<{ date: string, amount: number, currency: string, category?: string, category_id?: string }>
}

const props = defineProps<Props>()
const { formatAmount } = useCurrency()

// Apple Design System colors for charts
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

// Today's category spending data
const todayCategoryData = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayEntries = props.entries.filter(entry => entry.date === today)
  
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

// Today's doughnut chart options
const todayChartOptions = computed((): ChartOptions<'doughnut'> => {
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

.doughnut-container {
  padding: 2rem 1.5rem;
  height: 350px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
  .doughnut-container {
    height: 320px;
    padding: 1.5rem 1rem;
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