<!-- Follow this example: https://duna.com/ -->
<!-- https://www.youtube.com/watch?v=lSzfYAQYKU0&list=PLcTpn5-ROA4xWA5cJFoUnt58PXs6eWNT8 -->
<!-- https://github.com/wrongakram/micro-interactions-docket/blob/master/src/assets/styles/notes.scss -->

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import anime from "animejs/lib/anime.es.js";

import { useAuthStore } from "../data/auth_store";
import { useGachaStore } from "../gacha_store";

import profile_1 from "../assets/lib/Linnea-Profile.png";
import banner_1 from "../assets/lib/Linnea-Banner.webp";
import profile_2 from "../assets/lib/Chasca-Profile.png";
import banner_2 from "../assets/lib/Chasca-Banner.webp";
import copyIcon from "../assets/lib/copy.png";

const router = useRouter();
const authStore = useAuthStore();
const gachaStore = useGachaStore();

// Section 1: Banner Info
const bannersList = [
  {
    faceImage: profile_1,
    bannerImage: banner_1,
  },
  {
    faceImage: profile_2,
    bannerImage: banner_2,
  },
];

// Section 2: Interactive Banner Logic
const trackRef = ref(null);
const scrollProgress = ref(0);

const handleScroll = () => {
  if (!trackRef.value) return;

  const rect = trackRef.value.getBoundingClientRect();

  // trackTop: Distance from the top of the screen to the top of our 300vh track
  const trackTop = rect.top;
  // scrollableDistance: Total height of the track MINUS one screen height (100vh)
  const scrollableDistance = rect.height - window.innerHeight;

  if (trackTop > 0) {
    // User hasn't reached the track yet
    scrollProgress.value = 0;
  } else if (-trackTop >= scrollableDistance) {
    // User has scrolled past the entire track
    scrollProgress.value = 1;
  } else {
    // User is actively scrolling inside the track. Calculate percentage (0.0 to 1.0)
    scrollProgress.value = -trackTop / scrollableDistance;
  }
};

// Attach native scroll listener
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  gachaStore.fetch_codes_data();
});
onUnmounted(() => window.removeEventListener("scroll", handleScroll));

const currentBannerIndex = computed(() => {
  const index = Math.floor(scrollProgress.value * bannersList.length);
  return Math.min(index, bannersList.length - 1);
});

const switchBanner = (index) => {
  // Manually set scrollProgress to jump to the desired banner
  scrollProgress.value = index / bannersList.length;
  // Scroll to the track's top position
  trackRef.value.scrollIntoView({ behavior: "smooth" });
};



// Section 4: Reward Parsing & Display Helper Functions
const formatQuantity = (qtyStr) => {
  const num = parseInt(qtyStr.replace(/,/g, ""), 10);
  if (isNaN(num)) return qtyStr;
  return num.toLocaleString();
};

const parseRewards = (rewardsStr) => {
  if (!rewardsStr) return [];

  if (rewardsStr.includes("*")) {
    return rewardsStr.split(";").map((part) => {
      const [name, qty] = part.split("*");
      return {
        name: name.trim(),
        qty: formatQuantity(qty.trim()),
      };
    });
  }

  const lowerStr = rewardsStr.toLowerCase();
  if (lowerStr.includes("60 primogems and five adventurer's experience")) {
    return [
      { name: "Primogem", qty: "60" },
      { name: "Adventurer's Experience", qty: "5" },
    ];
  }

  return [{ name: rewardsStr, qty: "" }];
};

const getRewardIcon = (itemName) => {
  const name = itemName.toLowerCase();
  if (name.includes("primogem")) return "✨";
  if (name.includes("mora")) return "🪙";
  if (name.includes("warrant")) return "📜";
  if (
    name.includes("torte") ||
    name.includes("turnover") ||
    name.includes("food")
  )
    return "🍰";
  if (name.includes("experience") || name.includes("wit")) return "📕";
  if (name.includes("adeptea")) return "🍵";
  return "📦";
};

const getRewardStyle = (itemName) => {
  const name = itemName.toLowerCase();
  if (name.includes("primogem")) return { color: "#0d6efd", fontWeight: "600" };
  if (name.includes("mora")) return { color: "#b8860b", fontWeight: "600" };
  return { color: "#212529" };
};

const getCodeDate = (code) => {
  const upperCode = code.toUpperCase();
  const dateMap = {
    OHOHONICOLE: "05/19",
    NMI20MAJGIBP: "05/23",
    MAGENICOLESPUZZLE: "05/16",
    PSCA8NL4ZSPD: "04/28",
    G5HS7EMI47D0: "05/02",
    PFY1S40I88T9: "05/09",
  };
  return dateMap[upperCode] || "05/01";
};

const copyCode = (code) => {
  navigator.clipboard.writeText(code);
  alert(`Code ${code} copied to clipboard!`);
};

// Section 1: Smooth Scroll logic
const scrollToStart = () => {
  const nextSection = document.getElementById("current-event");
  nextSection.scrollIntoView({ behavior: "smooth" });
};

// Anime.js Entry Animation
onMounted(() => {
  anime({
    targets: ".showcase-card",
    translateY: [50, 0],
    opacity: [0, 1],
    delay: anime.stagger(200),
    easing: "easeOutQuad",
    duration: 1000,
    autoplay: true,
  });
});
</script>

<template>
  <div class="homepage-container">
    <!-- 1. Image Background Section -->
    <section class="hero-section">
      <div class="intro-vid">
        <img
          src="../assets/lib/4K-mondstadt.jpg"
          alt="Background loading screen"
          class="fullscreen-image"
        />
        <div class="video-overlay"></div>
      </div>

      <div class="hero-title-container">
        <h1 class="display-4 fw-bold text-white mb-3 text-shadow">
          Genshin Impact
        </h1>
        <p class="text-white fw-bold mb-4 text-shadow">
          A role-playing game, a fantasy world of exploration in Teyvat.
        </p>
      </div>

      <div class="scroll-prompt" @click="scrollToStart">
        <h4 class="scroll-text mb-0">Click to Start</h4>
      </div>
    </section>

    <!-- 2. Current Event Section -->
    <section id="current-event" class="scroll-track bg-light" ref="trackRef">
      <!-- The viewport sticks to the screen while the user scrolls through the 300vh track -->
      <div
        class="sticky-viewport d-flex flex-column align-items-center justify-content-center py-5"
      >
        <h2 class="fw-bold text-dark text-center mb-5">Current Banners</h2>

        <!-- <div class="outer-frame"> -->
        <div id="main-component" class="main-frame">
          <div
            v-for="(banner, index) in bannersList"
            :key="'circle-' + index"
            class="character-circle"
            :class="[
              'circle-' + (index + 1),
              { active: currentBannerIndex === index },
            ]"
            :style="{ backgroundImage: `url(${banner.faceImage})` }"
            @click="switchBanner(index)"
          ></div>

          <div
            v-for="(banner, index) in bannersList"
            :key="'banner-' + index"
            class="banner-content"
            :class="{ active: currentBannerIndex === index }"
          >
            <div
              class="banner-image"
              :style="{ backgroundImage: `url(${banner.bannerImage})` }"
            ></div>
          </div>

          <router-link class="about-btn" to="/character"> About </router-link>
        </div>
        <!-- </div> -->

        <!-- Debugger -->
        <!-- <div class="mt-4 text-muted small">
                    Scroll Progress: {{ (scrollProgress * 100).toFixed(0) }}% | Active Index: {{ currentBannerIndex }}
                </div> -->
      </div>
    </section>

    <!-- 3. Showcase Section -->
    <section class="showcase_section py-5 position-relative overflow-hidden">
      <!-- Background ambient glow blobs -->
      <div class="showcase_glow-blob-1"></div>
      <div class="showcase_glow-blob-2"></div>
      
      <div class="container position-relative" style="z-index: 2;">
        <div class="text-center mb-5">
          <h2 class="fw-bold display-5 text-dark">
            Next-Gen <span class="about_gradient-text">Companion Core</span>
          </h2>
          <p class="text-muted fs-5">
            Cloud-connected, AI-automated tools designed to replace legacy spreadsheets.
          </p>
        </div>
        
        <div class="row g-4 justify-content-center">
          <!-- Card 1: Calculator -->
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card showcase_glass-card showcase-card h-100 border-0 p-4 d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-4">
                <div class="showcase_icon-wrapper calc-glow">
                  <i class="bi bi-calculator-fill fs-3 text-primary"></i>
                </div>
                <span class="badge showcase_badge-ai">AI-Automated</span>
              </div>
              <h3 class="fw-bold mb-3 text-dark">Advanced Material Calculator</h3>
              <p class="text-secondary flex-grow-1 leading-relaxed">
                Effortlessly maps material requirements from level 1 to 90 for both characters and weapons. 
                Fueled by our intelligent Agentic AI Assistant, the form fields auto-populate based on natural 
                chat dialogs, triggering real-time resource and Resin computations instantly.
              </p>
              <router-link to="/calculator" class="btn showcase_btn showcase_btn-primary mt-4 w-100">
                Launch Calculator <i class="bi bi-arrow-right ms-2"></i>
              </router-link>
            </div>
          </div>

          <!-- Card 2: Wish Counter -->
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card showcase_glass-card showcase-card h-100 border-0 p-4 d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-4">
                <div class="showcase_icon-wrapper wish-glow">
                  <i class="bi bi-stars fs-3 text-warning"></i>
                </div>
                <span class="badge showcase_badge-cloud">Cloud-Synced</span>
              </div>
              <h3 class="fw-bold mb-3 text-dark">Cloud-Synced Wish Counter</h3>
              <p class="text-secondary flex-grow-1 leading-relaxed">
                A robust wish tracking system that logs your pull history, calculates spending cost, and monitors active 
                pity counters. Every wish logged is securely stored on a Supabase PostgreSQL cloud database, 
                eliminating local storage reliance and ensuring persistent access on any device.
              </p>
              <router-link to="/wish-counter" class="btn showcase_btn showcase_btn-warning mt-4 w-100 text-white">
                Track Wishes <i class="bi bi-arrow-right ms-2"></i>
              </router-link>
            </div>
          </div>

          <!-- Card 3: Todo List -->
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card showcase_glass-card showcase-card h-100 border-0 p-4 d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-4">
                <div class="showcase_icon-wrapper todo-glow">
                  <i class="bi bi-card-checklist fs-3 text-success"></i>
                </div>
                <span class="badge showcase_badge-reactive">Live Reactive</span>
              </div>
              <h3 class="fw-bold mb-3 text-dark">Reactive Dynamic Todo List</h3>
              <p class="text-secondary flex-grow-1 leading-relaxed">
                An interactive farming pipeline that populates resource collection checklists dynamically. 
                Whether you manually send calculations from the Calculator, prompt the AI widget to log items, 
                or alternate between guest and authenticated modes, the checklist responds instantly with live state updates.
              </p>
              <router-link to="/todo-list" class="btn showcase_btn showcase_btn-success mt-4 w-100">
                Manage Todo List <i class="bi bi-arrow-right ms-2"></i>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Redeem Code Section -->
    <section class="container py-5">
      <div class="card custom-dark-card p-4 shadow-sm border-0">
        <h3 class="fw-bold mb-4">
          <i class="bi bi-gift-fill text-danger me-2"></i>Active Redeem Codes
        </h3>
        <div class="table-responsive">
          <table class="table align-middle table-hover border">
            <thead class="table-light">
              <tr>
                <th scope="col" style="width: 50%">Redeem Codes</th>
                <th scope="col" style="width: 50%">Rewards</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in gachaStore.codes_list" :key="item.id">
                <td>
                  <!-- Code container with copy button -->
                  <div
                    class="d-flex align-items-center mb-2"
                    style="max-width: 320px"
                  >
                    <div
                      class="form-control bg-light border text-dark fw-bold font-monospace py-1 px-3 flex-grow-1"
                      style="
                        height: auto;
                        font-size: 1.1rem;
                        line-height: 1.5;
                        border-radius: 4px 0 0 4px;
                      "
                    >
                      {{ item.code }}
                    </div>
                    <button
                      class="btn btn-primary d-flex align-items-center justify-content-center py-2 px-3"
                      style="border-radius: 0 4px 4px 0"
                      @click="copyCode(item.code)"
                      title="Copy Code"
                    >
                      <img
                        :src="copyIcon"
                        alt="Copy"
                        style="width: 20px; height: 20px"
                      />
                    </button>
                  </div>
                  <!-- Redeem Code Link -->
                  <div class="mb-1">
                    <a
                      :href="`https://genshin.hoyoverse.com/en/gift?code=${item.code}`"
                      target="_blank"
                      class="text-decoration-none fw-bold text-primary small d-inline-flex align-items-center"
                    >
                      <i class="bi bi-play-fill me-1 text-primary"></i>Redeem
                      Code Link
                    </a>
                  </div>
                  <!-- Date Added -->
                  <div class="text-muted small">
                    <span class="fw-bold">Date Added:</span>
                    {{ getCodeDate(item.code) }}
                  </div>
                </td>
                <td>
                  <div
                    v-if="parseRewards(item.rewards).length === 0"
                    class="text-muted small"
                  >
                    No rewards specified
                  </div>
                  <div v-else>
                    <div
                      v-for="(reward, index) in parseRewards(item.rewards)"
                      :key="index"
                      class="d-flex align-items-center mb-1"
                    >
                      <span class="me-2 fs-5">{{
                        getRewardIcon(reward.name)
                      }}</span>
                      <span :style="getRewardStyle(reward.name)">{{
                        reward.name
                      }}</span>
                      <span class="ms-1 fw-bold text-muted" v-if="reward.qty"
                        >x{{ reward.qty }}</span
                      >
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 5. Call to Action Section -->
    <section
      class="container py-5 text-center mb-5"
      v-if="!authStore.currentUser"
    >
      <div class="py-5 px-4 rounded-4 shadow-lg bg-dark text-white">
        <h2 class="display-5 fw-bold mb-3">Wanna be a member?</h2>
        <p class="lead mb-4 text-white-50">
          Sync your pulls and plans across all your devices seamlessly.
        </p>
        <div class="d-flex justify-content-center gap-3">
          <button
            class="btn btn-primary btn-lg px-5 fw-bold cta-btn"
            @click="router.push('/registration')"
          >
            Register
          </button>
          <button
            class="btn btn-outline-light btn-lg px-5 cta-btn"
            @click="router.push('/login')"
          >
            Sign In
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
