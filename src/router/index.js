import { createRouter, createWebHistory } from 'vue-router'
import homepage from '../views/homepage.vue'
// import player_dashboard from '../views/player_dashboard.vue'
import wish_counter from '../views/wish_counter.vue'
import calculator from '../views/calculator.vue'
import todo_list from '../views/todo_list.vue'
import about from '../views/about.vue'
import login from '../views/login.vue'
import registration from '../views/registration.vue'
import character from '../views/current_banner_details.vue'
import account_setting from '../views/account_setting.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: homepage
    },
    {
      path: '/character',
      name: 'character',
      component: character
    },
    // {
    //   path: '/player_dashboard',
    //   name: 'player_dashboard',
    //   component: player_dashboard
    // },
    {
      path: '/wish-counter',
      name: 'wish_counter',
      component: wish_counter
    },
    {
      path: '/calculator',
      name: 'calculator',
      component: calculator
    },
    {
      path: '/todo-list',
      name: 'todo_list',
      component: todo_list
    },
    {
      path: '/about',
      name: 'about',
      component: about
    },
    {
      path: '/login',
      name: 'login',
      component: login
    },
    {
      path: '/registration',
      name: 'registration',
      component: registration
    },
    {
      path: '/account_setting',
      name: 'account_setting',
      component: account_setting
    }
  ],
})

export default router
