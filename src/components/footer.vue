<template>
  <footer class="footer_custom-footer">
    <!-- SVG Wave Divider -->
    <div class="footer_wave-container">
      <svg
        class="footer_waves"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shape-rendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
          />
        </defs>
        <g class="footer_parallax">
          <use
            xlink:href="#gentle-wave"
            x="48"
            y="0"
            fill="rgba(59, 78, 119, 0.7)"
          />
          <use
            xlink:href="#gentle-wave"
            x="48"
            y="3"
            fill="rgba(59, 78, 119, 0.5)"
          />
          <use
            xlink:href="#gentle-wave"
            x="48"
            y="5"
            fill="rgba(59, 78, 119, 0.3)"
          />
          <use xlink:href="#gentle-wave" x="48" y="7" fill="rgb(59, 78, 119)" />
        </g>
      </svg>
    </div>

    <!-- Main Footer Content -->
    <div class="container-fluid footer_content-wrapper py-4 px-5">
      <div class="row align-items-center">
        <!-- Logo and Description -->
        <div class="col-12 col-md-4 text-center text-md-start mb-4 mb-md-0">
          <h4 class="fw-bold text-white mb-2 footer_logo">
            <img
              src="../assets/lib/paimon-icon.png"
              alt="Paimon"
              class="footer_logo-img me-2"
            />
            Genshin Companion
          </h4>
          <p class="small text-white-50 mb-0 footer_description">
            Your ultimate companion for wish tracking, planning, and task optimization. Crafted for players seeking maximum efficiency.
          </p>
        </div>

        <!-- Navigation Links — full site map -->
        <div class="col-12 col-md-4 text-center mb-4 mb-md-0">
          <p class="text-white-50 small text-uppercase fw-semibold mb-2 footer_nav-heading">Quick Navigation</p>

          <!-- Row 1: Core tools -->
          <div class="footer_nav-grid">
            <RouterLink to="/" class="footer_footer-link footer_nav-item">🏠 Home</RouterLink>
            <RouterLink to="/calculator" class="footer_footer-link footer_nav-item">🧮 Calculator</RouterLink>
            <RouterLink to="/wish-counter" class="footer_footer-link footer_nav-item">✨ Wish Counter</RouterLink>
            <RouterLink to="/analytics" class="footer_footer-link footer_nav-item">📊 Analytics</RouterLink>
            <RouterLink to="/todo-list" class="footer_footer-link footer_nav-item">📝 Todo List</RouterLink>
            <RouterLink to="/planner" class="footer_footer-link footer_nav-item">🎯 Goal Planner</RouterLink>
            <RouterLink to="/about" class="footer_footer-link footer_nav-item">ℹ️ About</RouterLink>
          </div>
        </div>

        <!-- Social Icons and Back to Top -->
        <div
          class="col-12 col-md-4 text-center text-md-end d-flex flex-column align-items-center align-items-md-end gap-3"
        >
          <div class="d-flex gap-3 footer_social-wrapper">
            <a
              target="_blank"
              href="https://github.com/Ric0701/COS30043-Interface-Design"
              class="footer_social-icon"
              title="GitHub"
            >
              <i class="bi bi-github"></i>
            </a>
            <a href="#" class="footer_social-icon" title="Discord" @click.prevent>
              <i class="bi bi-discord"></i>
            </a>
            <a href="#" class="footer_social-icon" title="Twitter" @click.prevent>
              <i class="bi bi-twitter-x"></i>
            </a>
          </div>

          <!-- Back to Top Button -->
          <button
            class="btn footer_back-to-top"
            @click="scrollToTop"
            title="Back to Top"
          >
            <i class="bi bi-arrow-up-circle-fill"></i>
          </button>
        </div>
      </div>

      <!-- Academic Project Notice -->
      <div
        class="border-top border-secondary border-opacity-25 mt-4 pt-3 text-center"
      >
        <p class="small text-white-50 mb-0">
          &copy; 2026 Genshin Companion. Academic Project for Software Engineering. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { onMounted } from "vue";
import anime from "animejs";

const scrollToTop = () => {
  if (window.lenis) {
    window.lenis.scrollTo(0, { duration: 1.5 });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

onMounted(() => {
  // Floating glow/scale animations for social icons
  const icons = document.querySelectorAll(".footer_social-icon");
  icons.forEach((icon) => {
    icon.addEventListener("mouseenter", () => {
      anime({
        targets: icon,
        translateY: -5,
        scale: 1.12,
        duration: 300,
        easing: "easeOutElastic(1, .6)",
      });
    });

    icon.addEventListener("mouseleave", () => {
      anime({
        targets: icon,
        translateY: 0,
        scale: 1,
        duration: 300,
        easing: "easeOutQuad",
      });
    });
  });
});
</script>
