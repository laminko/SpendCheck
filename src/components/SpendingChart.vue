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
          :id="`chart-day-${index}`"
          class="chart-day"
          :class="{ 
            'has-spending': day.hasSpending,
            'invisible': !day.isVisible
          }"
          :style="{ opacity: day.hasSpending ? day.intensity : (day.isVisible ? 0.5 : 0.15) }"
          :title="day.isVisible ? `${day.date}: ${day.hasSpending ? `${day.currency || '$'}${day.amount.toFixed(2)}` : 'No spending'}` : ''"
          @click="day.isVisible ? openPopover($event, day, index) : null"
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

    <!-- Daily Spending Popover -->
    <ion-popover
      :is-open="isPopoverOpen"
      :trigger="popoverTrigger"
      :dismiss-on-select="true"
      @didDismiss="closePopover"
      placement="top"
    >
      <ion-content class="popover-content">
        <div class="spending-detail">
          <div class="spending-date">{{ formatDate(selectedDay?.date || '') }}</div>
          <div class="spending-amount" :class="{ 'no-spending': !selectedDay?.hasSpending }">
            {{ selectedDay?.hasSpending ? formatAmount(selectedDay.amount, selectedDay.currency) : 'No spending' }}
          </div>
          <div v-if="selectedDay?.hasSpending" class="spending-entries">
            {{ getEntriesForDay(selectedDay.date || '').length }} {{ getEntriesForDay(selectedDay.date || '').length === 1 ? 'entry' : 'entries' }}
          </div>
        </div>
      </ion-content>
    </ion-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IonPopover, IonContent } from '@ionic/vue'
import ChartToggle from './ChartToggle.vue'
import LineChart from './LineChart.vue'
import { CURRENCIES } from '@/composables/useCurrency'

interface Props {
  entries: Array<{ date: string, amount: number, currency: string, category?: string }>
}

interface ChartDay {
  date: string
  hasSpending: boolean
  amount: number
  currency: string
  intensity: number
  isVisible: boolean
}

const props = defineProps<Props>()
const chartType = ref<'grid' | 'line'>('grid')

// Popover state
const isPopoverOpen = ref(false)
const popoverTrigger = ref<string>('')
const selectedDay = ref<ChartDay | null>(null)

const updateChartType = (type: 'grid' | 'line') => {
  chartType.value = type
}

// Popover methods
const openPopover = (_event: Event, day: ChartDay, index: number) => {
  selectedDay.value = day
  popoverTrigger.value = `chart-day-${index}`
  isPopoverOpen.value = true
}

const closePopover = () => {
  isPopoverOpen.value = false
  selectedDay.value = null
  popoverTrigger.value = ''
}

// Helper methods
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

const formatAmount = (amount: number, currency: string) => {
  const currencyData = CURRENCIES.find(c => c.code === currency)
  const symbol = currencyData?.symbol || currency
  return `${symbol}${amount.toFixed(2)}`
}

const getEntriesForDay = (dateStr: string) => {
  return props.entries.filter(entry => entry.date === dateStr)
}

const chartData = computed(() => {
  const amounts = props.entries.map(e => e.amount)
  const maxAmount = Math.max(...amounts, 1)
  
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
      const currentDate = new Date(startSunday)
      currentDate.setDate(startSunday.getDate() + (week * 7) + day)
      
      const gridIndex = day * 14 + week // day * 14 + week (row * columns + column)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // Only include dates within our range
      if (currentDate <= today && currentDate >= startDate) {
        const dayEntries = props.entries.filter(entry => entry.date === dateStr)
        const hasSpending = dayEntries.length > 0
        const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0)
        const currency = dayEntries[0]?.currency || '$'
        const intensity = hasSpending ? Math.max(0.75, amount / maxAmount) : 0
        
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
}

.chart-grid, .line-chart {
  transition: opacity 0.3s ease;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 0.3rem;
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
    grid-template-columns: repeat(14, 1fr);
    grid-template-rows: repeat(7, 1fr);
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
    grid-template-columns: repeat(14, 1fr);
    grid-template-rows: repeat(7, 1fr);
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
    grid-template-columns: repeat(14, 1fr);
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

/* Popover Styles */
.popover-content {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.spending-detail {
  padding: 1rem;
  text-align: center;
  min-width: 150px;
}

.spending-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.spending-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.spending-amount.no-spending {
  color: #9ca3af;
  font-size: 1rem;
  font-weight: 500;
}

.spending-entries {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}
</style>