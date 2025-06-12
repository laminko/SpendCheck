<template>
  <div class="currency-picker">
    <button @click="showDropdown = !showDropdown" class="currency-button">
      <span class="currency-display">{{ currentCurrency.symbol }} {{ currentCurrency.code }}</span>
      <span class="arrow" :class="{ 'rotated': showDropdown }">▼</span>
    </button>
    
    <div v-if="showDropdown" class="currency-dropdown">
      <div class="dropdown-header">
        <input 
          v-model="searchQuery" 
          placeholder="Search currencies..." 
          class="currency-search"
          @click.stop
        />
      </div>
      <div class="currency-list">
        <button
          v-for="currency in filteredCurrencies"
          :key="currency.code"
          @click="selectCurrency(currency)"
          class="currency-option"
          :class="{ 'selected': currency.code === currentCurrency.code }"
        >
          <span class="currency-symbol">{{ currency.symbol }}</span>
          <span class="currency-info">
            <span class="currency-code">{{ currency.code }}</span>
            <span class="currency-name">{{ currency.name }}</span>
          </span>
          <span v-if="currency.code === currentCurrency.code" class="check">✓</span>
        </button>
      </div>
    </div>
    
    <div v-if="showDropdown" class="dropdown-backdrop" @click="closeDropdown"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCurrency, type Currency } from '@/composables/useCurrency'

const { currentCurrency, currencies, setCurrency } = useCurrency()
const showDropdown = ref(false)
const searchQuery = ref('')

const filteredCurrencies = computed(() => {
  if (!searchQuery.value) return currencies
  
  const query = searchQuery.value.toLowerCase()
  return currencies.filter(currency => 
    currency.code.toLowerCase().includes(query) ||
    currency.name.toLowerCase().includes(query) ||
    currency.symbol.includes(query)
  )
})

const selectCurrency = (currency: Currency) => {
  setCurrency(currency)
  showDropdown.value = false
  searchQuery.value = ''
}

const closeDropdown = () => {
  showDropdown.value = false
  searchQuery.value = ''
}

onMounted(() => {
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!(e.target as Element)?.closest('.currency-picker')) {
      closeDropdown()
    }
  })
  
  // Close dropdown on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown()
    }
  })
})
</script>

<style scoped>
.currency-picker {
  position: relative;
  z-index: 1000;
}

.currency-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 600;
}

.currency-button:hover {
  border-color: #3b82f6;
}

.currency-display {
  color: #1f2937;
}

.arrow {
  color: #6b7280;
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.arrow.rotated {
  transform: rotate(180deg);
}

.currency-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 280px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  max-height: 350px;
  overflow: hidden;
  z-index: 2000;
}

.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1500;
}

.dropdown-header {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.currency-search {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.9rem;
  outline: none;
}

.currency-search:focus {
  border-color: #3b82f6;
}

.currency-list {
  max-height: 200px;
  overflow-y: auto;
}

.currency-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.currency-option:hover {
  background: #f8fafc;
}

.currency-option.selected {
  background: #eff6ff;
}

.currency-symbol {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1f2937;
  min-width: 40px;
  text-align: left;
}

.currency-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.currency-code {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.currency-name {
  color: #6b7280;
  font-size: 0.8rem;
}

.check {
  color: #3b82f6;
  font-weight: 600;
}

@media (max-width: 480px) {
  .currency-dropdown {
    position: fixed;
    top: 120px;
    left: 1rem;
    right: 1rem;
    width: auto;
    transform: translateY(0);
    max-height: 60vh;
    z-index: 2000;
  }
  
  .currency-picker {
    z-index: 2000;
  }
}
</style>