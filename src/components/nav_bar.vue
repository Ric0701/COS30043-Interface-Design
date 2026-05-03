<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const isMenuOpen = ref(false);

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};
</script>

<template>
    <nav class="navbar navbar-expand-lg navbar-color navbar-dark sticky-top" style="z-index: 1060;">
        <div class="container-fluid">
            <RouterLink class="navbar-brand text-white fw-bold" to="/">Genshin Pull Analysis</RouterLink>

            <button class="navbar-toggler" type="button" @click="toggleMenu" aria-controls="navbarContent" aria-expanded="isMenuOpen" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div :class="['collapse', 'navbar-collapse', { show: isMenuOpen }]" id="navbarContent">
                <div class="navbar-nav ms-auto">
                    <RouterLink class="nav-link text-white" to="/" @click="isMenuOpen = false">Character</RouterLink>
                    <RouterLink class="nav-link text-white" to="/calculator" @click="isMenuOpen = false">Calculator</RouterLink>
                    <RouterLink class="nav-link text-white" to="/wish-counter" @click="isMenuOpen = false">Wish Counter</RouterLink>
                    <RouterLink class="nav-link text-white" to="/todo-list" @click="isMenuOpen = false">Todo List</RouterLink>
                    <RouterLink class="nav-link text-white" to="/planner" @click="isMenuOpen = false">Planner</RouterLink>
                    <RouterLink class="nav-link text-white" to="/login" @click="isMenuOpen = false">Login</RouterLink>
                </div>
            </div>
        </div>
    </nav>
</template>