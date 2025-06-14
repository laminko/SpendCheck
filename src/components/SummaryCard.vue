<template>
  <ion-card class="summary-card">
    <ion-card-content>
      <div class="summary-content">
        <div class="summary-label">
          {{ label }}
        </div>
        <div class="summary-amount">
          {{ amount }}
        </div>
        <div v-if="change" class="summary-change">
          <span :class="(changeValue || 0) >= 0 ? 'change-positive' : 'change-negative'">
            {{ change }}
          </span>
        </div>
        <div v-else-if="count" class="summary-count">
          {{ count }}
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent } from '@ionic/vue'

interface Props {
  label: string
  amount: string
  change?: string
  count?: string
  changeValue?: number
}

defineProps<Props>()

</script>

<style scoped>
.summary-card {
  margin: 1rem 0 1.5rem 0;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 122, 255, 0.25);
  border: none;
}

.summary-content {
  text-align: center;
  color: white;
  padding: 1rem;
}

.summary-amount {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  letter-spacing: -0.45px;
  line-height: 1.1;
}

.summary-label {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
  margin-bottom: 0.5rem;
}

.summary-change {
  font-size: 0.875rem;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
}

.summary-count {
  font-size: 0.875rem;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.24px;
  color: rgba(255, 255, 255, 0.8);
}

.change-positive {
  color: rgba(255, 255, 255, 0.8);
}

.change-negative {
  color: rgba(255, 255, 255, 0.8);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .summary-amount {
    font-size: 1.875rem;
  }
  
  .summary-card {
    margin: 0.75rem 0 1rem 0;
  }
  
  .summary-content {
    padding: 0.875rem;
  }
  
  .summary-label {
    font-size: 0.9rem;
    margin-bottom: 0.375rem;
  }
  
  .summary-count {
    font-size: 0.8125rem;
  }
  
  .summary-change {
    font-size: 0.8125rem;
  }
}
</style>