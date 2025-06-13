<template>
  <div class="spending-chart">
    <div class="chart-header">
      <h3>Last 30 Days</h3>
      <ChartToggle :model-value="chartType" @change="updateChartType" />
    </div>
    
    <div class="chart-container">
      <!-- Grid Chart -->
      <div v-if="chartType === 'grid'" class="chart-grid">
        <div 
          v-for="(day, index) in chartData" 
          :key="index"
          class="chart-day"
          :class="{ 'has-spending': day.hasSpending }"
          :style="{ opacity: day.hasSpending ? day.intensity : 0.2 }"
          :title="`${day.date}: ${day.hasSpending ? `${day.currency || '$'}${day.amount.toFixed(2)}` : 'No spending'}`"
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
  const data = []
  const today = new Date()
  const amounts = props.entries.map(e => e.amount)
  const maxAmount = Math.max(...amounts, 1)
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const entry = props.entries.find(entry => entry.date === dateStr)
    const hasSpending = !!entry
    const amount = entry?.amount || 0
    const currency = entry?.currency || '$'
    const intensity = hasSpending ? Math.max(0.3, amount / maxAmount) : 0
    
    data.push({
      date: dateStr,
      hasSpending,
      amount,
      currency,
      intensity
    })
  }
  
  return data
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
  grid-template-columns: repeat(10, 1fr);
  gap: 0.25rem;
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

.chart-day:hover {
  transform: scale(1.1);
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
    grid-template-columns: repeat(8, 1fr);
  }
  
  .chart-legend {
    font-size: 0.75rem;
    gap: 0.75rem;
  }
}

/* Small tablet/large phone breakpoint */
@media (max-width: 600px) {
  .chart-grid {
    grid-template-columns: repeat(7, 1fr);
  }
  
  .chart-legend {
    font-size: 0.7rem;
    gap: 0.5rem;
  }
}

/* Mobile breakpoint */
@media (max-width: 480px) {
  .chart-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .chart-legend {
    font-size: 0.7rem;
    gap: 0.5rem;
  }
}
</style>