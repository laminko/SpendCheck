import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { createRouter, createWebHistory } from '@ionic/vue-router'
import App from './App.vue'
import Tabs from './views/Tabs.vue'
import Home from './views/Home.vue'
import History from './views/History.vue'
import Graph from './views/Graph.vue'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

const routes = [
  {
    path: '/',
    redirect: '/tabs/home'
  },
  {
    path: '/tabs/',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: 'home'
      },
      {
        path: 'home',
        component: Home
      },
      {
        path: 'history',
        component: History
      },
      {
        path: 'graph',
        component: Graph
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

const app = createApp(App)
  .use(IonicVue, {
    mode: 'ios'
  })
  .use(router)

router.isReady().then(() => {
  app.mount('#app')
})