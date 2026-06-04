<script setup>
import { onMounted, watch, computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import nav_bar from "./components/nav_bar.vue";
import footer_bar from "./components/footer.vue";
import ai_assistant_widget from "./components/ai_assistant_widget.vue";

import { useTodoStore } from "./data/todo_store.js";
import { useGachaStore } from "./gacha_store.js";
import { useGoalStore } from "./data/goal_store.js";
import { useAuthStore } from "./data/auth_store.js";

const route = useRoute();
const authStore = useAuthStore();

const isNotHomepage = computed(() => route.path !== "/" && route.path !== "/login" && route.path !== "/registration");

onMounted(async () => {
  await authStore.loadData();
  await Promise.all([
    useTodoStore().loadData(),
    useGachaStore().loadData(),
    useGoalStore().loadData(),
  ]);

  const { default: Lenis } =
    await import("https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm");

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    infinite: false,
  });

  window.lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
});

// 4. Watch for route changes to reset scroll to the top
watch(
  () => route.path,
  () => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }
  },
);
</script>

<template>
  <div
    class="d-flex flex-column min-vh-100"
    :class="{ 'main-content-offset': isNotHomepage }"
  >
    <nav_bar />

    <!-- Global Warning/Validation Toast -->
    <div
      v-if="authStore.toastMessage"
      class="validation_toast-alert"
    >
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ authStore.toastMessage }}</span>
    </div>

    <RouterView />

    <footer_bar />

    <ai_assistant_widget />
  </div>
</template>
