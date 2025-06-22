<template>
  <ion-button 
    fill="clear" 
    @click="showModal = true"
    class="currency-button"
  >
    <span class="currency-display">{{ currentCurrency.symbol }} {{ currentCurrency.code }}</span>
    <ion-icon :icon="chevronDown" slot="end"></ion-icon>
  </ion-button>

  <ion-modal :is-open="showModal" @did-dismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Select Currency</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-searchbar
        v-model="searchQuery"
        placeholder="Search currencies..."
        show-clear-button="focus"
      ></ion-searchbar>
      
      <ion-list>
        <ion-item
          v-for="currency in filteredCurrencies"
          :key="currency.code"
          button
          @click="selectCurrency(currency)"
        >
          <ion-label>
            <div class="currency-item">
              <span class="currency-symbol">{{ currency.symbol }}</span>
              <div class="currency-info">
                <div class="currency-code">{{ currency.code }}</div>
                <div class="currency-name">{{ currency.name }}</div>
              </div>
              <ion-icon 
                v-if="currency.code === currentCurrency.code" 
                :icon="checkmark" 
                color="primary"
              ></ion-icon>
            </div>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/vue'
import { chevronDown, close, checkmark } from 'ionicons/icons'
import { useCurrency, type Currency } from '@/composables/useCurrency'

const { currentCurrency, currencies, setCurrency } = useCurrency()
const showModal = ref(false)
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

const selectCurrency = async (currency: Currency) => {
  try {
    await setCurrency(currency)
    showModal.value = false
    searchQuery.value = ''
  } catch (error) {
    console.error('Error setting currency:', error)
    // Still close modal on error
    showModal.value = false
    searchQuery.value = ''
  }
}

const closeModal = () => {
  showModal.value = false
  searchQuery.value = ''
}
</script>

<style scoped>
.currency-display {
  font-size: 0.9rem;
  font-weight: 600;
  margin-right: 0.25rem;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.currency-symbol {
  font-weight: 600;
  font-size: 1.1rem;
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
  font-size: 0.9rem;
}

.currency-name {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}
</style>