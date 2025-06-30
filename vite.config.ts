import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries chunk
          vendor: ['vue', 'vue-router'],
          
          // Ionic chunk
          ionic: ['@ionic/vue', '@ionic/vue-router', '@ionic/core'],
          
          // Icons chunk  
          icons: ['ionicons'],
          
          // Supabase chunk
          supabase: ['@supabase/supabase-js'],
          
          // Chart.js chunk
          charts: ['chart.js', 'vue-chartjs'],
          
          // Utilities chunk
          utils: ['@capacitor/core', '@capacitor/haptics', '@capacitor/splash-screen', '@capacitor/status-bar'],
          
          // Date utilities
          dates: ['date-fns', 'date-fns-tz'],
          
          // Analytics
          analytics: ['@vercel/analytics']
        }
      }
    },
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000
  }
})