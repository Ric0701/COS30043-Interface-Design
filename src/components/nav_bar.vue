<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../data/auth_store.js";
import PityProgressBar from "./pity_progress_bar.vue";

const isMenuOpen = ref(false);
const isUserDropdownOpen = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const elementRef = ref(null);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

const handleLogout = () => {
  authStore.logout();
  router.push("/");
  isMenuOpen.value = false;
  isUserDropdownOpen.value = false;
};

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.1 },
  );

  if (elementRef.value) observer.observe(elementRef.value);
});
</script>

<template>
  <nav
    ref="elementRef"
    class="navbar navbar-expand-lg nav_bar_glass-nav nav_bar_blur-transition-element nav_bar_fixed-top fixed-top"
  >
    <div class="container-fluid position-relative">
      <RouterLink class="navbar-brand text-black fw-bold" to="/">
        <img
          src="../assets/lib/paimon-icon.png"
          alt="User Icon"
          class="rounded-circle border shadow-sm nav_bar_logo-img"
        />
        <span class="d-none d-md-inline-block">&nbsp; Genshin</span>
      </RouterLink>

      <PityProgressBar
        v-if="!isMenuOpen"
        mode="mobile"
        class="position-absolute start-50 translate-middle-x"
      />

      <button
        class="navbar-toggler"
        type="button"
        @click="toggleMenu"
        aria-controls="navbarContent"
        aria-expanded="isMenuOpen"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div
        :class="['collapse', 'navbar-collapse', 'nav_bar_navbar-collapse', { show: isMenuOpen }]"
        id="navbarContent"
      >
        <div class="navbar-nav nav_bar_custom-nav-center">
          <RouterLink
            class="nav-link text-black"
            to="/character"
            @click="isMenuOpen = false"
            >Character</RouterLink
          >
          <RouterLink
            class="nav-link text-black"
            to="/calculator"
            @click="isMenuOpen = false"
            >Calculator</RouterLink
          >
          <RouterLink
            class="nav-link text-black"
            to="/wish-counter"
            @click="isMenuOpen = false"
            >Wish Counter</RouterLink
          >
          <RouterLink
            class="nav-link text-black"
            to="/wish-analytics"
            @click="isMenuOpen = false"
            >Analytics</RouterLink
          >
          <RouterLink
            class="nav-link text-black"
            to="/todo-list"
            @click="isMenuOpen = false"
            >Todo List</RouterLink
          >
          <RouterLink
            class="nav-link text-black"
            to="/planner"
            @click="isMenuOpen = false"
            >Planner</RouterLink
          >
        </div>

        <div class="navbar-nav nav_bar_custom-nav-right">
          <PityProgressBar mode="desktop" class="me-lg-3 my-2 my-lg-0" />

          <template v-if="!authStore.currentUser">
            <RouterLink
              class="nav-link text-black py-0 d-flex align-items-center"
              to="/login"
              @click="isMenuOpen = false"
              >Login</RouterLink
            >
          </template>

          <template v-else>
            <div
              class="nav-item dropdown ms-lg-3 mt-2 mt-lg-0 position-relative"
            >
              <a
                class="nav-link p-0 text-decoration-none"
                href="#"
                role="button"
                @click.prevent="toggleUserDropdown"
              >
                <img
                  src="../assets/lib/account.png"
                  alt="User Icon"
                  class="rounded-circle shadow-sm nav_bar_navbar-profile-icon"
                />
              </a>

              <ul
                class="dropdown-menu dropdown-menu-end mt-2 shadow nav_bar_profile-dropdown"
                :class="{ show: isUserDropdownOpen }"
              >
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <RouterLink
                    to="/account_setting"
                    class="dropdown-item text-dark"
                    @click="
                      isMenuOpen = false;
                      isUserDropdownOpen = false;
                    "
                  >
                    <i class="bi bi-gear me-2"></i> Account Setting
                  </RouterLink>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
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
