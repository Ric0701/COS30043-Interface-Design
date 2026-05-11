<!-- Follow this example: https://duna.com/ -->
<!-- https://www.youtube.com/watch?v=lSzfYAQYKU0&list=PLcTpn5-ROA4xWA5cJFoUnt58PXs6eWNT8 -->
<!-- https://github.com/wrongakram/micro-interactions-docket/blob/master/src/assets/styles/notes.scss -->

<script setup>
    import { ref, computed, onMounted, onUnmounted } from 'vue'
    import { useRouter } from 'vue-router'
    import anime from 'animejs/lib/anime.es.js'

    import { useAuthStore } from '../data/auth_store'

    import profile_1 from '../assets/lib/Linnea-Profile.png'
    import banner_1 from '../assets/lib/Linnea-Banner.webp'
    import profile_2 from '../assets/lib/Chascha-Profile.png'
    import banner_2 from '../assets/lib/Chascha-Banner.webp'

    const router = useRouter()

    const authStore = useAuthStore()

    // Section 1: Banner Info
    const bannersList = [
        {
            faceImage: profile_1,
            bannerImage: banner_1
        },
        {
            faceImage: profile_2,
            bannerImage: banner_2
        }
    ]

    // Section 2: Interactive Banner Logic
    const trackRef = ref(null)
    const scrollProgress = ref(0)

    const handleScroll = () => {
        if (!trackRef.value) return
        
        const rect = trackRef.value.getBoundingClientRect()
        
        // trackTop: Distance from the top of the screen to the top of our 300vh track
        const trackTop = rect.top
        // scrollableDistance: Total height of the track MINUS one screen height (100vh)
        const scrollableDistance = rect.height - window.innerHeight

        if (trackTop > 0) {
            // User hasn't reached the track yet
            scrollProgress.value = 0
        } else if (-trackTop >= scrollableDistance) {
            // User has scrolled past the entire track
            scrollProgress.value = 1
        } else {
            // User is actively scrolling inside the track. Calculate percentage (0.0 to 1.0)
            scrollProgress.value = -trackTop / scrollableDistance
        }
    }

    // Attach native scroll listener
    onMounted(() => window.addEventListener('scroll', handleScroll))
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))

    const currentBannerIndex = computed(() => {
        const index = Math.floor(scrollProgress.value * bannersList.length)
        return Math.min(index, bannersList.length - 1)
    })
    
    const switchBanner = (index) => {
        // Manually set scrollProgress to jump to the desired banner
        scrollProgress.value = index / bannersList.length
        // Scroll to the track's top position
        trackRef.value.scrollIntoView({ behavior: 'smooth' })
    }

    // Section 3: Showcase Data
    const tools = [
        { title: 'Pity Calculator', desc: 'Plan your resources precisely for character or weapon levels.', icon: 'bi-calculator', link: '/calculator' },
        { title: 'Wish Counter', desc: 'Track your banner history and never lose sight of your pity.', icon: 'bi-stars', link: '/wish-counter' },
        { title: 'Todo Planner', desc: 'Automatically aggregate all materials needed for your goals.', icon: 'bi-journal-check', link: '/todo-list' }
    ]

    // Section 4: Mock Data for Codes
    const activeCodes = ref([
        { text: 'GENSHINGIFT', reward: '50 Primogems, 3 Hero\'s Wit' },
        { text: 'WTKBM69V9S68', reward: '100 Primogems' }
    ])

    const copyCode = (code) => {
        navigator.clipboard.writeText(code)
        alert(`Code ${code} copied to clipboard!`)
    }

    // Section 1: Smooth Scroll logic
    const scrollToStart = () => {
        const nextSection = document.getElementById('current-event')
        nextSection.scrollIntoView({ behavior: 'smooth' })
    }

    // Anime.js Entry Animation
    onMounted(() => {
        anime({
            targets: '.showcase-card',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(200),
            easing: 'easeOutQuad',
            duration: 1000,
            autoplay: true
        })
    })
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
                >
                <div class="video-overlay"></div>
            </div>
                
            <div class="hero-title-container">
                <h1 class="display-4 fw-bold text-white mb-3 text-shadow">Genshin Impact</h1>
                <p class="text-white fw-bold mb-4 text-shadow">A role-playing game, a fantasy world of exploration in Teyvat.</p>
            </div>

            <div class="scroll-prompt" @click="scrollToStart">
                <h4 class="scroll-text mb-0">Click to Start</h4>
                <i class="bi bi-chevron-double-down text-white fs-2 mt-2 d-block"></i>
            </div>
        </section>

        <!-- 2. Current Event Section -->
        <section id="current-event" class="scroll-track bg-light" ref="trackRef">
            
            <!-- The viewport sticks to the screen while the user scrolls through the 300vh track -->
            <div class="sticky-viewport d-flex flex-column align-items-center justify-content-center py-5">
                <h2 class="fw-bold text-dark text-center mb-5">Current Banners</h2>
                
                <!-- <div class="outer-frame"> -->
                    <div id="main-component" class="main-frame">
                        
                        <div 
                            v-for="(banner, index) in bannersList" 
                            :key="'circle-' + index"
                            class="character-circle" 
                            :class="['circle-' + (index + 1), { active: currentBannerIndex === index }]"
                            :style="{ backgroundImage: `url(${banner.faceImage})` }"
                            @click="switchBanner(index)"
                        ></div>

                        <div 
                            v-for="(banner, index) in bannersList" 
                            :key="'banner-' + index"
                            class="banner-content"
                            :class="{ active: currentBannerIndex === index }"
                        >
                            <div class="banner-image" :style="{ backgroundImage: `url(${banner.bannerImage})` }"></div>
                        </div>

                        <button class="about-btn"
                            onclick="window.location.href='https://www.hoyolab.com/article/44512635'">
                            About
                        </button>
                    </div>
                <!-- </div> -->
                
                <!-- Debugger -->
                <!-- <div class="mt-4 text-muted small">
                    Scroll Progress: {{ (scrollProgress * 100).toFixed(0) }}% | Active Index: {{ currentBannerIndex }}
                </div> -->
            </div>
        </section>

        <!-- 3. Showcase Section -->
        <section class="bg-light-blue py-5">
            <div class="container">
                <h2 class="fw-bold text-dark text-center mb-5">Explore Our Tools</h2>
                <div class="row g-4">
                    <div v-for="tool in tools" :key="tool.title" class="col-12 col-md-4">
                        <div class="card custom-dark-card h-100 p-4 showcase-card border-0">
                            <i :class="['bi', tool.icon, 'fs-1 text-primary mb-3']"></i>
                            <h4 class="fw-bold">{{ tool.title }}</h4>
                            <p class="text-muted flex-grow-1">{{ tool.desc }}</p>
                            <router-link :to="tool.link" class="btn btn-outline-primary mt-3">Try Now</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 4. Redeem Code Section -->
        <section class="container py-5">
            <div class="card custom-dark-card p-4 shadow-sm border-0">
                <h3 class="fw-bold mb-4"><i class="bi bi-gift-fill text-danger me-2"></i>Active Redeem Codes</h3>
                <div class="row g-3">
                    <div v-for="code in activeCodes" :key="code.text" class="col-12 col-md-6">
                        <div class="p-3 border rounded d-flex justify-content-between align-items-center bg-white">
                            <div>
                                <span class="fw-bold text-dark fs-5">{{ code.text }}</span>
                                <div class="small text-muted">{{ code.reward }}</div>
                            </div>
                            <button class="btn btn-sm btn-dark" @click="copyCode(code.text)">Copy</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 5. Call to Action Section -->
        <section class="container py-5 text-center mb-5" v-if="!authStore.currentUser">
            <div class="py-5 px-4 rounded-4 shadow-lg bg-dark text-white">
                <h2 class="display-5 fw-bold mb-3">Wanna be a member?</h2>
                <p class="lead mb-4 text-white-50">Sync your pulls and plans across all your devices seamlessly.</p>
                <div class="d-flex justify-content-center gap-3">
                    <button class="btn btn-primary btn-lg px-5 fw-bold" @click="router.push('/registration')">Register</button>
                    <button class="btn btn-outline-light btn-lg px-5" @click="router.push('/login')">Sign In</button>
                </div>
            </div>
        </section>

    </div>
</template>