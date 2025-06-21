<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useAuth } from '@/composables/useAuth'

const { setupAuthListener } = useAuth()

onMounted(() => {
  setupAuthListener()
})
</script>

<style>
/* Custom CSS variables for theming */
:root {
  --ion-color-primary: #3b82f6;
  --ion-color-primary-rgb: 59, 130, 246;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3474e6;
  --ion-color-primary-tint: #4f8ff7;

  --ion-background-color: #f8fafc;
  --ion-text-color: #1f2937;
}

/* Keep existing mobile optimizations */
body {
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
</style>