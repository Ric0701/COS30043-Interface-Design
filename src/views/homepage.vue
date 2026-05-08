<!-- Follow this example: https://duna.com/ -->

<script setup>
    import { ref, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import anime from 'animejs/lib/anime.es.js'

    const router = useRouter()

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
                    src="../assests/lib/genshin-impact-mondstadt.jpg" 
                    alt="Background loading screen" 
                    class="fullscreen-image"
                ></img>
                <div class="video-overlay"></div>
            </div>
            <div class="scroll-prompt" @click="scrollToStart">
                <h1 class="scroll-text">Scroll to Start</h1>
                <i class="bi bi-chevron-double-down text-white fs-2"></i>
            </div>
        </section>

        <!-- 2. Current Event Section -->
        <section id="current-event" class="container py-5 mt-5">
            <h2 class="fw-bold text-dark text-center mb-4">Current Banners</h2>
            <div class="row g-4 justify-content-center">
                <div class="col-12 col-md-10">
                    <div class="card custom-dark-card p-4 text-center">
                        <div class="badge bg-danger mb-2 w-auto d-inline-block">Live Now</div>
                        <h3 class="fw-bold">Version 5.2: Teyvat Explorations</h3>
                        <p class="text-muted">Character Banner: Alhaitham / Furina</p>
                        <router-link to="/wish-counter" class="btn btn-primary mt-2">Check Your Pity</router-link>
                    </div>
                </div>
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
        <section class="container py-5 text-center mb-5">
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