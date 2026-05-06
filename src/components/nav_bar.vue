<!-- components/nav_bar.vue -->
<script setup>
    import { ref } from 'vue';
    import { RouterLink, useRouter } from 'vue-router';
    import { useAuthStore } from '../data/auth_store.js'

    const isMenuOpen = ref(false);
    const isUserDropdownOpen = ref(false)
    const authStore = useAuthStore();
    const router = useRouter();

    const toggleMenu = () => {
        isMenuOpen.value = !isMenuOpen.value;
    };

    const toggleUserDropdown = () => {
        isUserDropdownOpen.value = !isUserDropdownOpen.value
    }

    const handleLogout = () => {
        authStore.logout();
        router.push('/');
        isMenuOpen.value = false;
        isUserDropdownOpen.value = false;
    };
</script>

<template>
    <nav class="navbar navbar-expand-lg navbar-color navbar-dark sticky-top" style="z-index: 1060;">
        <div class="container-fluid">
            
            <RouterLink class="navbar-brand text-white fw-bold" to="/">
                <img 
                    src="../assests/lib/paimon-icon.png" 
                    alt="User Icon" 
                    class="rounded-circle border shadow-sm" 
                    style="width: 40px; height: 40px; object-fit: cover; background-color: white; cursor: pointer;"
                >
                &nbsp; Genshin
            </RouterLink>

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
                    
                    <template v-if="!authStore.currentUser">
                        <RouterLink class="nav-link text-white" to="/login" @click="isMenuOpen = false">Login</RouterLink> 
                    </template>
                    
                    <template v-else>
                        <div class="nav-item dropdown ms-lg-3 mt-2 mt-lg-0 position-relative">
                            <!-- The clickable icon (acts as the button) -->
                            <a 
                                class="nav-link p-0 text-decoration-none" 
                                href="#" 
                                role="button" 
                                @click.prevent="toggleUserDropdown"
                            >
                                <img 
                                    src="../assests/lib/account.png" 
                                    alt="User Icon" 
                                    class="rounded-circle border shadow-sm" 
                                    style="width: 40px; height: 40px; object-fit: cover; background-color: #b1d0ff; cursor: pointer;"
                                >
                            </a>
                            
                            <!-- The Dropdown List -->
                            <ul 
                                class="dropdown-menu dropdown-menu-end mt-2 shadow profile-dropdown" 
                                :class="{ show: isUserDropdownOpen }" 
                            >
                                <li>
                                    <!-- Account Setting Link -->
                                    <RouterLink 
                                        to="/account_setting" 
                                        class="dropdown-item text-dark"
                                        @click="isMenuOpen = false; isUserDropdownOpen = false"
                                    >
                                        <i class="bi bi-gear me-2"></i> Account Setting
                                    </RouterLink>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <!-- Logout Button -->
                                    <button 
                                        class="dropdown-item text-danger fw-bold" 
                                        @click="handleLogout"
                                    >
                                        <i class="bi bi-box-arrow-right me-2"></i> Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </nav>
</template>