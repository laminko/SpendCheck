<template>
  <div class="chart-toggle">
    <button 
      @click="$emit('change', 'grid')"
      class="toggle-button"
      :class="{ 'active': modelValue === 'grid' }"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="3" height="3" rx="0.5"/>
        <rect x="6" y="1" width="3" height="3" rx="0.5"/>
        <rect x="11" y="1" width="3" height="3" rx="0.5"/>
        <rect x="1" y="6" width="3" height="3" rx="0.5"/>
        <rect x="6" y="6" width="3" height="3" rx="0.5"/>
        <rect x="11" y="6" width="3" height="3" rx="0.5"/>
        <rect x="1" y="11" width="3" height="3" rx="0.5"/>
        <rect x="6" y="11" width="3" height="3" rx="0.5"/>
        <rect x="11" y="11" width="3" height="3" rx="0.5"/>
      </svg>
      <span>Grid</span>
    </button>
    
    <button 
      @click="$emit('change', 'line')"
      class="toggle-button"
      :class="{ 'active': modelValue === 'line' }"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 14L4 8L7 11L10 4L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="1" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="7" r="1.5" fill="currentColor"/>
      </svg>
      <span>Line</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: 'grid' | 'line'
}

defineProps<Props>()
defineEmits<{
  change: [value: 'grid' | 'line']
}>()
</script>

<style scoped>
.chart-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
}

.toggle-button:hover {
  color: #374151;
}

.toggle-button.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-button svg {
  width: 14px;
  height: 14px;
}
</style>