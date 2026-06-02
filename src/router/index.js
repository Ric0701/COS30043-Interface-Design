import { createRouter, createWebHistory } from "vue-router";
import homepage from "../views/homepage.vue";
import wish_counter from "../views/wish_counter.vue";
import calculator from "../views/calculator.vue";
import todo_list from "../views/todo_list.vue";
import about from "../views/about.vue";
import login from "../views/login.vue";
import registration from "../views/registration.vue";
import character from "../views/char_detail.vue";
import account_setting from "../views/account_setting.vue";
import goal_planner from "../views/goal_planner.vue";
import wish_analytics from "../views/wish_analytics.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: homepage,
    },
    {
      path: "/character",
      name: "character",
      component: character,
    },
    {
      path: "/wish-counter",
      name: "wish_counter",
      component: wish_counter,
    },
    {
      path: "/wish-analytics",
      name: "wish_analytics",
      component: wish_analytics,
    },
    {
      path: "/calculator",
      name: "calculator",
      component: calculator,
    },
    {
      path: "/todo-list",
      name: "todo_list",
      component: todo_list,
    },
    {
      path: "/planner",
      name: "goal_planner",
      component: goal_planner,
    },
    {
      path: "/about",
      name: "about",
      component: about,
    },
    {
      path: "/login",
      name: "login",
      component: login,
    },
    {
      path: "/registration",
      name: "registration",
      component: registration,
    },
    {
      path: "/account_setting",
      name: "account_setting",
      component: account_setting,
    },
  ],
});

export default router;
