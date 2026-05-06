<script setup>
  import { onMounted } from 'vue'
  import { RouterView } from 'vue-router'
  import nav_bar from './components/nav_bar.vue'
  import footer_bar from './components/footer.vue'

  import { useTodoStore } from './data/todo_store.js'
  import { useGachaStore } from './gacha_store.js'

  onMounted(() => {
   useTodoStore().loadData()
   useGachaStore().loadData()
  })
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <nav_bar />

    <main class="flex-grow-1">
      <RouterView />
    </main>

    <footer_bar />
  </div>
</template>

<style scoped></style>
