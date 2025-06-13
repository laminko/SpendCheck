<template>
  <div class="spending-chart">
    <div class="chart-header">
      <h3>Last 90 Days</h3>
      <ChartToggle :model-value="chartType" @change="updateChartType" />
    </div>
    
    <div class="chart-container">
      <!-- Grid Chart -->
      <div v-if="chartType === 'grid'" class="chart-grid">
        <div 
          v-for="(day, index) in chartData" 
          :key="index"
          class="chart-day"
          :class="{ 
            'has-spending': day.hasSpending,
            'invisible': !day.isVisible
          }"
          :style="{ opacity: day.hasSpending ? day.intensity : (day.isVisible ? 0.2 : 0.05) }"
          :title="day.isVisible ? `${day.date}: ${day.hasSpending ? `${day.currency || '$'}${day.amount.toFixed(2)}` : 'No spending'}` : ''"
        >
        </div>
      </div>
      
      <!-- Line Chart -->
      <LineChart v-else :entries="entries" />
      
      <!-- Legend (only for grid view) -->
      <div v-if="chartType === 'grid'" class="chart-legend">
        <div class="legend-item">
          <div class="legend-color no-spend"></div>
          <span>No spending</span>
        </div>
        <div class="legend-item">
          <div class="legend-color light-spend"></div>
          <span>Low amount</span>
        </div>
        <div class="legend-item">
          <div class="legend-color has-spend"></div>
          <span>High amount</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ChartToggle from './ChartToggle.vue'
import LineChart from './LineChart.vue'

interface Props {
  entries: Array<{ date: string, amount: number, currency: string }>
}

const props = defineProps<Props>()
const chartType = ref<'grid' | 'line'>('grid')

const updateChartType = (type: 'grid' | 'line') => {
  chartType.value = type
}

const chartData = computed(() => {
  const amounts = props.entries.map(e => e.amount)
  const maxAmount = Math.max(...amounts, 1)
  
  // Create a 7×13 grid (91 cells) arranged by weeks
  const grid = Array(91).fill(null)
  const today = new Date()
  
  // Calculate the start date to fill 13 weeks
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 90) // 90 days ago
  
  // Find the Sunday before or on the start date
  const startSunday = new Date(startDate)
  const daysSinceLastSunday = startDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  startSunday.setDate(startDate.getDate() - daysSinceLastSunday)
  
  // Fill the grid with proper week arrangement
  for (let week = 0; week < 13; week++) {
    for (let day = 0; day < 7; day++) { // 0 = Sunday, 6 = Saturday
      const currentDate = new Date(startSunday)
      currentDate.setDate(startSunday.getDate() + (week * 7) + day)
      
      const gridIndex = week * 7 + day
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // Only include dates within our range
      if (currentDate <= today && currentDate >= startDate) {
        const entry = props.entries.find(entry => entry.date === dateStr)
        const hasSpending = !!entry
        const amount = entry?.amount || 0
        const currency = entry?.currency || '$'
        const intensity = hasSpending ? Math.max(0.3, amount / maxAmount) : 0
        
        grid[gridIndex] = {
          date: dateStr,
          hasSpending,
          amount,
          currency,
          intensity,
          isVisible: true
        }
      } else {
        // Empty cell for dates outside our range
        grid[gridIndex] = {
          date: dateStr,
          hasSpending: false,
          amount: 0,
          currency: '$',
          intensity: 0,
          isVisible: false
        }
      }
    }
  }
  
  return grid.filter(cell => cell !== null)
})
</script>

<style scoped>
.spending-chart {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.spending-chart h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  min-height: 200px;
}

.chart-grid, .line-chart {
  transition: opacity 0.3s ease;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 0.2rem;
  max-width: 100%;
  overflow: hidden;
}

.chart-day {
  aspect-ratio: 1;
  border-radius: 3px;
  background: #f3f4f6;
  transition: all 0.2s ease;
  cursor: pointer;
}

.chart-day.has-spending {
  background: #3b82f6;
}

.chart-day.invisible {
  pointer-events: none;
  cursor: default;
}

.chart-day:hover {
  transform: scale(1.1);
}

.chart-day.invisible:hover {
  transform: none;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  font-size: 0.8rem;
  color: #6b7280;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.no-spend {
  background: #f3f4f6;
  opacity: 0.2;
}

.legend-color.light-spend {
  background: #3b82f6;
  opacity: 0.4;
}

.legend-color.has-spend {
  background: #3b82f6;
  opacity: 1;
}

/* Tablet breakpoint */
@media (max-width: 768px) {
  .chart-grid {
    grid-template-columns: repeat(13, 1fr);
    gap: 0.15rem;
  }
  
  .chart-legend {
    font-size: 0.75rem;
    gap: 0.75rem;
  }
}

/* Small tablet/large phone breakpoint */
@media (max-width: 600px) {
  .chart-grid {
    grid-template-columns: repeat(13, 1fr);
    gap: 0.1rem;
  }
  
  .chart-legend {
    font-size: 0.7rem;
    gap: 0.5rem;
  }
}

/* Mobile breakpoint */
@media (max-width: 480px) {
  .chart-grid {
    grid-template-columns: repeat(13, 1fr);
    grid-template-rows: repeat(7, 1fr);
    gap: 0.05rem;
  }
  
  .chart-day {
    border-radius: 2px;
  }
  
  .chart-legend {
    font-size: 0.7rem;
    gap: 0.5rem;
  }
}
</style>