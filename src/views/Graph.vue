<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Analytics</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Total This Month Summary -->
      <SummaryCard
        label="Total This Month"
        :amount="formatAmount(currentMonthTotal)"
        :change="monthlyChangePercentage !== null ? `${monthlyChangePercentage >= 0 ? '+' : ''}${monthlyChangePercentage}% from last month` : undefined"
        :change-value="monthlyChangePercentage || 0"
      />

      <!-- Today's Spending Chart -->
      <TodaysSpendingChart :entries="entries" />

      <!-- Monthly Spending Chart -->
      <MonthlySpendingChart :entries="entries" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from '@ionic/vue'
import SummaryCard from '@/components/SummaryCard.vue'
import TodaysSpendingChart from '@/components/TodaysSpendingChart.vue'
import MonthlySpendingChart from '@/components/MonthlySpendingChart.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useSpendingStore } from '@/composables/useSpendingStore'
import { useDateUtils } from '@/composables/useDateUtils'

const { formatAmount } = useCurrency()
const { entries, loadEntries } = useSpendingStore()
const { getThisMonthFirstDay, getThisMonthLastDay, getLastMonthFirstDay, getLastMonthLastDay, toLocalDateString } = useDateUtils()


// Calculate current month total
const currentMonthTotal = computed(() => {
  const firstDay = getThisMonthFirstDay()
  const lastDay = getThisMonthLastDay()
  
  return entries.value
    .filter(entry => {
      const entryDate = toLocalDateString(entry.date)
      return entryDate >= firstDay && entryDate <= lastDay
    })
    .reduce((sum, entry) => sum + entry.amount, 0)
})

// Calculate last month total
const lastMonthTotal = computed(() => {
  const firstDay = getLastMonthFirstDay()
  const lastDay = getLastMonthLastDay()
  
  return entries.value
    .filter(entry => {
      const entryDate = toLocalDateString(entry.date)
      return entryDate >= firstDay && entryDate <= lastDay
    })
    .reduce((sum, entry) => sum + entry.amount, 0)
})

// Calculate percentage change from last month
const monthlyChangePercentage = computed(() => {
  if (lastMonthTotal.value === 0) {
    return currentMonthTotal.value > 0 ? 100 : null
  }
  
  const change = ((currentMonthTotal.value - lastMonthTotal.value) / lastMonthTotal.value) * 100
  return Math.round(change)
})







onMounted(() => {
  loadEntries()
})
</script>

<style scoped>

</style>