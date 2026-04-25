import { createRouter, createWebHistory } from 'vue-router'
import player_dashboard from '../views/player_dashboard.vue'
import wish_counter from '@/views/wish_counter.vue'
import calculator from '@/views/calculator.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'player_dashboard',
      component: player_dashboard
    },
    {
      path: '/wish-counter',
      name: 'wish_counter',
      component: wish_counter
    },
    {
      path: '/calculator',
      name: 'calculator',
      component: calculator
    }
  ],
})

export default router
