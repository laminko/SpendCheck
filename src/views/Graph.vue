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
import { ref, onMounted, computed } from 'vue'
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
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useCurrency } from '@/composables/useCurrency'

const entries = ref<Array<{ date: string, amount: number, currency: string, category?: string, category_id?: string }>>([])
const { ensureValidSession } = useAuth()
const { formatAmount } = useCurrency()


// Calculate current month total
const currentMonthTotal = computed(() => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  
  return entries.value
    .filter(entry => entry.date >= firstDay && entry.date <= lastDay)
    .reduce((sum, entry) => sum + entry.amount, 0)
})

// Calculate last month total
const lastMonthTotal = computed(() => {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const firstDay = lastMonth.toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  
  return entries.value
    .filter(entry => entry.date >= firstDay && entry.date <= lastDay)
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






const loadEntries = async () => {
  const userId = await ensureValidSession()

  try {
    const { data, error } = await supabase
      .from('spending_entries')
      .select('date, amount, currency, category, category_id')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    entries.value = data || []
  } catch (error) {
    console.error('Error loading entries:', error)
  }
}

onMounted(() => {
  loadEntries()
})
</script>

<style scoped>

</style>