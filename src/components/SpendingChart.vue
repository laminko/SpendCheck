<template>
  <div class="spending-chart">
    <div class="chart-header">
      <h3>Activity</h3>
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
            'invisible': !day.isVisible,
            [`intensity-${day.colorIntensity}`]: day.hasSpending
          }"
          :title="day.isVisible ? `${day.date}: ${day.hasSpending ? `${day.currency || '$'}${day.amount.toFixed(2)}` : 'No spending'}` : ''"
        />
      </div>
      
      <!-- Line Chart -->
      <LineChart v-else :entries="entries" />
      
      <!-- Legend (only for grid view) -->
      <div v-if="chartType === 'grid'" class="chart-legend">
        <div class="legend-item">
          <div class="legend-color no-spend" />
          <span>No spending</span>
        </div>
        <div class="legend-item">
          <div class="legend-color light-spend" />
          <span>Low amount</span>
        </div>
        <div class="legend-item">
          <div class="legend-color has-spend" />
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
import { useDateUtils } from '@/composables/useDateUtils'

interface Props {
  entries: Array<{ date: string, amount: number, currency: string, category?: string }>
}

const props = defineProps<Props>()
const chartType = ref<'grid' | 'line'>('grid')
const { toLocalDateString } = useDateUtils()

const updateChartType = (type: 'grid' | 'line') => {
  chartType.value = type
}

const chartData = computed(() => {
  // First, group entries by date to get daily totals
  const dailyTotals = new Map()
  props.entries.forEach(entry => {
    const entryLocalDate = toLocalDateString(entry.date)
    const current = dailyTotals.get(entryLocalDate) || 0
    dailyTotals.set(entryLocalDate, current + entry.amount)
  })
  
  const dailyAmounts = Array.from(dailyTotals.values())
  const maxAmount = dailyAmounts.length > 0 ? Math.max(...dailyAmounts) : 1
  
  // Create a 7×14 grid (98 cells) arranged by days (rows) and weeks (columns)
  const grid = Array(98).fill(null)
  const today = new Date()
  
  // Find the Sunday of the current week (week containing today)
  const todaySunday = new Date(today)
  const daysSinceLastSunday = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  todaySunday.setDate(today.getDate() - daysSinceLastSunday)
  
  // Calculate the start Sunday (13 weeks before today's Sunday)
  const startSunday = new Date(todaySunday)
  startSunday.setDate(todaySunday.getDate() - (13 * 7)) // 13 weeks back (14 weeks total including current week)
  
  // Calculate the actual start date for filtering
  const startDate = new Date(startSunday)
  
  // Fill the grid with proper day arrangement (rows = days, columns = weeks)
  for (let week = 0; week < 14; week++) {
    for (let day = 0; day < 7; day++) { // 0 = Sunday, 6 = Saturday
      // Use getTime() for reliable date arithmetic across month boundaries
      const totalDays = (week * 7) + day
      const currentDate = new Date(startSunday.getTime() + (totalDays * 24 * 60 * 60 * 1000))
      
      // Map JavaScript day (0=Sun, 1=Mon, ..., 6=Sat) to grid rows
      // GitHub style typically shows: Sun, Mon, Tue, Wed, Thu, Fri, Sat
      const gridIndex = day * 14 + week // day * 14 + week (row * columns + column)
      // Convert to local date string for comparison with backend UTC dates
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      
      // Only include dates within our range
      if (currentDate <= today && currentDate >= startDate) {
        // Filter entries by converting UTC dates to local dates for comparison
        const dayEntries = props.entries.filter(entry => {
          // Convert UTC date from backend to local timezone and format as YYYY-MM-DD
          const entryLocalDate = toLocalDateString(entry.date)
          return entryLocalDate === dateStr
        })
        const hasSpending = dayEntries.length > 0
        const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0)
        const currency = dayEntries[0]?.currency || '$'
        const intensity = hasSpending ? Math.round((amount / maxAmount) * 100) : 0 // 0-100 scale
        const colorIntensity = hasSpending ? Math.min(10, Math.max(1, Math.ceil(intensity / 10))) : 0 // 1-10 levels
        
        grid[gridIndex] = {
          date: dateStr,
          hasSpending,
          amount,
          currency,
          intensity,
          colorIntensity,
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
          colorIntensity: 0,
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
  background: #FFFFFF;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #E5E5EA;
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
}

.chart-grid, .line-chart {
  transition: opacity 0.3s ease;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 0.5rem;
  max-width: 100%;
  overflow: hidden;
  padding: 0.5rem;
}

.chart-day {
  aspect-ratio: 1;
  border-radius: 3px;
  background: #f3f4f6;
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 2px;
  min-height: 12px;
  min-width: 12px;
}

.chart-day.intensity-1 {
  background: #eaf2ff;
}

.chart-day.intensity-2 {
  background: #d3e4ff;
}

.chart-day.intensity-3 {
  background: #bcd6ff;
}

.chart-day.intensity-4 {
  background: #a4c7ff;
}

.chart-day.intensity-5 {
  background: #8eb9ff;
}

.chart-day.intensity-6 {
  background: #3b82f6;
}

.chart-day.intensity-7 {
  background: #306ae0;
}

.chart-day.intensity-8 {
  background: #295bcc;
}

.chart-day.intensity-9 {
  background: #224c99;
}

.chart-day.intensity-10 {
  background: #1c3d66;
}

.chart-day:not(.has-spending) {
  background: #f3f4f6;
  opacity: 0.6;
}

.chart-day.invisible {
  pointer-events: none;
  cursor: default;
  opacity: 0.25;
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
}

.legend-color.light-spend {
  background: #eaf2ff;
}

.legend-color.has-spend {
  background: #1c3d66;
}

/* Tablet breakpoint */
@media (max-width: 768px) {
  .chart-grid {
    grid-template-columns: repeat(14, 1fr);
    grid-template-rows: repeat(7, 1fr);
    gap: 0.4rem;
    padding: 0.4rem;
  }
  
  .chart-legend {
    font-size: 0.75rem;
    gap: 0.75rem;
  }
}

/* Small tablet/large phone breakpoint */
@media (max-width: 600px) {
  .chart-grid {
    grid-template-columns: repeat(14, 1fr);
    grid-template-rows: repeat(7, 1fr);
    gap: 0.3rem;
    padding: 0.3rem;
  }
  
  .chart-legend {
    font-size: 0.7rem;
    gap: 0.5rem;
  }
}

/* Mobile breakpoint */
@media (max-width: 480px) {
  .chart-grid {
    grid-template-columns: repeat(14, 1fr);
    grid-template-rows: repeat(7, 1fr);
    gap: 0.2rem;
    padding: 0.2rem;
  }
  
  .chart-day {
    border-radius: 2px;
    min-height: 10px;
    min-width: 10px;
  }
  
  .chart-legend {
    font-size: 0.7rem;
    gap: 0.5rem;
  }
}
</style>