<template>
  <div ref="chartContainer" class="line-chart">
    <svg 
      ref="chartSvg"
      :width="chartWidth" 
      :height="chartHeight"
      class="chart-svg"
      @mousemove="onMouseMove"
      @mouseleave="hideTooltip"
    >
      <!-- Grid lines -->
      <g class="grid-lines">
        <!-- Horizontal grid lines -->
        <line 
          v-for="(line, index) in horizontalGridLines"
          :key="`h-${index}`"
          :x1="padding.left"
          :y1="line.y"
          :x2="chartWidth - padding.right"
          :y2="line.y"
          stroke="#f3f4f6"
          stroke-width="1"
        />
        <!-- Vertical grid lines -->
        <line 
          v-for="(line, index) in verticalGridLines"
          :key="`v-${index}`"
          :x1="line.x"
          :y1="padding.top"
          :x2="line.x"
          :y2="chartHeight - padding.bottom"
          stroke="#f3f4f6"
          stroke-width="1"
        />
      </g>

      <!-- Line path -->
      <path
        v-if="linePath"
        :d="linePath"
        fill="none"
        stroke="#3b82f6"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="line-path"
      />

      <!-- Data points -->
      <g class="data-points">
        <circle
          v-for="(point, index) in dataPoints"
          :key="index"
          :cx="point.x"
          :cy="point.y"
          :r="point.hasSpending ? 4 : 2"
          :fill="point.hasSpending ? '#3b82f6' : '#d1d5db'"
          :stroke="point.hasSpending ? '#1d4ed8' : '#9ca3af'"
          stroke-width="1"
          class="data-point"
          :class="{ 'has-spending': point.hasSpending }"
        />
      </g>

      <!-- Y-axis labels -->
      <g class="y-axis-labels">
        <text
          v-for="label in yAxisLabels"
          :key="label.value"
          :x="padding.left - 8"
          :y="label.y + 3"
          text-anchor="end"
          class="axis-label"
        >
          {{ label.text }}
        </text>
      </g>

      <!-- X-axis labels -->
      <g class="x-axis-labels">
        <text
          v-for="label in xAxisLabels"
          :key="label.date"
          :x="label.x"
          :y="chartHeight - padding.bottom + 16"
          text-anchor="middle"
          class="axis-label"
        >
          {{ label.text }}
        </text>
      </g>
    </svg>

    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      class="tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-date">{{ tooltip.date }}</div>
      <div class="tooltip-amount">{{ tooltip.amount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCurrency } from '@/composables/useCurrency'

interface Props {
  entries: Array<{ date: string, amount: number, currency: string, category?: string }>
}

const props = defineProps<Props>()
const { formatAmount } = useCurrency()

const chartSvg = ref<SVGElement>()
const chartContainer = ref<HTMLElement>()
const chartWidth = ref(350)
const chartHeight = ref(200)
const padding = { top: 20, right: 20, bottom: 40, left: 50 }

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  date: '',
  amount: ''
})

const chartData = computed(() => {
  const data = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayEntries = props.entries.filter(entry => entry.date === dateStr)
    const hasSpending = dayEntries.length > 0
    const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0)
    const currency = dayEntries[0]?.currency || '$'
    
    data.push({
      date: dateStr,
      dateObj: date,
      hasSpending,
      amount,
      currency
    })
  }
  
  return data
})

const maxAmount = computed(() => {
  const amounts = chartData.value.map(d => d.amount)
  const max = Math.max(...amounts, 0)
  return max === 0 ? 100 : max * 1.1 // Add 10% padding
})

const dataPoints = computed(() => {
  const plotWidth = chartWidth.value - padding.left - padding.right
  const plotHeight = chartHeight.value - padding.top - padding.bottom
  
  return chartData.value.map((item, index) => {
    const x = padding.left + (index / (chartData.value.length - 1)) * plotWidth
    const y = padding.top + plotHeight - (item.amount / maxAmount.value) * plotHeight
    
    return {
      x,
      y: isNaN(y) ? padding.top + plotHeight : y,
      hasSpending: item.hasSpending,
      amount: item.amount,
      date: item.date,
      currency: item.currency
    }
  })
})

const linePath = computed(() => {
  if (dataPoints.value.length === 0) return ''
  
  const spendingPoints = dataPoints.value.filter(p => p.hasSpending)
  if (spendingPoints.length === 0) return ''
  
  let path = `M ${spendingPoints[0].x} ${spendingPoints[0].y}`
  
  for (let i = 1; i < spendingPoints.length; i++) {
    const point = spendingPoints[i]
    path += ` L ${point.x} ${point.y}`
  }
  
  return path
})

const horizontalGridLines = computed(() => {
  const lines = []
  const plotHeight = chartHeight.value - padding.top - padding.bottom
  const steps = 4
  
  for (let i = 0; i <= steps; i++) {
    const y = padding.top + (i / steps) * plotHeight
    lines.push({ y })
  }
  
  return lines
})

const verticalGridLines = computed(() => {
  const lines = []
  const plotWidth = chartWidth.value - padding.left - padding.right
  const step = 7 // Show grid every 7 days
  
  for (let i = 0; i < chartData.value.length; i += step) {
    const x = padding.left + (i / (chartData.value.length - 1)) * plotWidth
    lines.push({ x })
  }
  
  return lines
})

const yAxisLabels = computed(() => {
  const labels = []
  const steps = 4
  const plotHeight = chartHeight.value - padding.top - padding.bottom
  
  for (let i = 0; i <= steps; i++) {
    const value = (maxAmount.value / steps) * (steps - i)
    const y = padding.top + (i / steps) * plotHeight
    
    labels.push({
      value,
      y,
      text: value === 0 ? '0' : formatAmount(value, undefined, true)
    })
  }
  
  return labels
})

const xAxisLabels = computed(() => {
  const labels = []
  const plotWidth = chartWidth.value - padding.left - padding.right
  const step = 7 // Show label every 7 days
  
  for (let i = 0; i < chartData.value.length; i += step) {
    const item = chartData.value[i]
    const x = padding.left + (i / (chartData.value.length - 1)) * plotWidth
    
    labels.push({
      date: item.date,
      x,
      text: item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
  }
  
  return labels
})

const onMouseMove = (event: MouseEvent) => {
  const rect = chartSvg.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Find closest data point
  let closestPoint = null
  let minDistance = Infinity
  
  for (const point of dataPoints.value) {
    const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
    if (distance < minDistance && distance < 20) { // Within 20px
      minDistance = distance
      closestPoint = point
    }
  }
  
  if (closestPoint && closestPoint.hasSpending) {
    tooltip.value = {
      show: true,
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
      date: new Date(closestPoint.date).toLocaleDateString(),
      amount: formatAmount(closestPoint.amount)
    }
  } else {
    hideTooltip()
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

// Responsive functionality
const updateSize = () => {
  if (chartContainer.value) {
    const containerWidth = chartContainer.value.clientWidth
    chartWidth.value = Math.max(containerWidth, 300) // Minimum width of 300px
    chartHeight.value = Math.min(containerWidth * 0.6, 250) // Maintain aspect ratio, max height 250px
  }
}

const resizeObserver = new ResizeObserver(() => {
  updateSize()
})

onMounted(() => {
  updateSize()
  if (chartContainer.value) {
    resizeObserver.observe(chartContainer.value)
  }
})

onUnmounted(() => {
  resizeObserver.disconnect()
})
</script>

<style scoped>
.line-chart {
  position: relative;
  width: 100%;
  display: block;
}

.chart-svg {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: auto;
}

.line-path {
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2));
}

.data-point {
  transition: all 0.2s;
  cursor: pointer;
}

.data-point:hover {
  r: 6;
}

.data-point.has-spending:hover {
  fill: #1d4ed8;
}

.axis-label {
  font-size: 10px;
  fill: #6b7280;
  font-weight: 500;
}

.tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}

.tooltip-date {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.tooltip-amount {
  color: #93c5fd;
  font-weight: 600;
}

</style>