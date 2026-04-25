<script setup>
  import { RouterView } from 'vue-router';
  import nav_bar from './components/nav_bar.vue';
</script>

<template>
  <nav_bar />

  <main>
    <RouterView />
  </main>
</template>

<style scoped></style>
