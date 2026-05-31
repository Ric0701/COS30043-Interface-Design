<!-- components/pity_progress_bar.vue -->
<script setup>
import { computed } from 'vue'
import { useGachaStore } from '../gacha_store'

// Import assets
import characterIcon from '../assets/lib/Intertwined_Fate.png'
import weaponIcon from '../assets/lib/weapon_icon.png'
import standardIcon from '../assets/lib/acquaint_fate.png'

const props = defineProps({
    mode: {
        type: String,
        required: true, // 'mobile' or 'desktop'
    }
})

const gachaStore = useGachaStore()

// Banners Pity Configuration
const banners = computed(() => [
    {
        id: 'character',
        name: 'Character',
        pity: gachaStore.limited_character_five_star_pity,
        max: 90,
        icon: characterIcon,
        color: '#b8860b' // Dark gold to be readable on light background
    },
    {
        id: 'weapon',
        name: 'Weapon',
        pity: gachaStore.limited_weapon_five_star_pity,
        max: 90,
        icon: weaponIcon,
        color: '#0d6efd' // Blue
    },
    {
        id: 'standard',
        name: 'Standard',
        pity: gachaStore.standard_five_star_pity,
        max: 90,
        icon: standardIcon,
        color: '#6f42c1' // Purple
    }
])

const getPercent = (pity, max) => {
    if (!pity) return 0
    return Math.min(100, Math.round((pity / max) * 100))
}
</script>

<template>
  <div class="pity-progress-bar-wrapper">
    <!-- MOBILE VIEW (Exclusively display icon and percentage text) -->
    <div v-if="mode === 'mobile'" class="d-flex d-lg-none align-items-center justify-content-center gap-2 py-1 bg-white border rounded-pill px-3 shadow-sm" style="font-size: 0.85rem; height: 32px; border-color: rgba(0, 0, 0, 0.12);">
        <div v-for="banner in banners" :key="'mob-' + banner.id" class="d-flex align-items-center gap-1">
            <img :src="banner.icon" class="rounded-circle border" :style="{ borderColor: banner.color }" style="width: 20px; height: 20px; object-fit: cover; background-color: white; border-width: 1.5px !important;" :title="banner.name + ' Banner'" />
            <span class="fw-bold" :style="{ color: banner.color }">{{ getPercent(banner.pity, banner.max) }}%</span>
        </div>
    </div>

    <!-- DESKTOP VIEW (Display icon, progress bar, and percentage text) -->
    <div v-else-if="mode === 'desktop'" class="d-none d-lg-flex align-items-center gap-2">
        <div v-for="banner in banners" :key="'desk-' + banner.id" class="d-flex align-items-center gap-1 py-0 px-2 border rounded-pill bg-light-subtle shadow-sm" style="border-color: rgba(0,0,0,0.08); font-size: 0.75rem; height: 26px;" :title="banner.name + ' Pity: ' + banner.pity + '/90'">
            <!-- Icon -->
            <img :src="banner.icon" class="rounded-circle border" :style="{ borderColor: banner.color }" style="width: 18px; height: 18px; object-fit: cover; background-color: white; border-width: 1px !important;" />
            
            <!-- Progress Bar -->
            <div class="progress border" style="height: 7px; width: 42px; background-color: rgba(0, 0, 0, 0.08); border-radius: 4px; overflow: hidden; border-color: rgba(0,0,0,0.05) !important;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" :style="{ width: getPercent(banner.pity, banner.max) + '%', backgroundColor: banner.color }" :aria-valuenow="banner.pity" aria-valuemin="0" aria-valuemax="90">
                </div>
            </div>

            <!-- Percentage Text -->
            <span class="fw-bold" style="min-width: 26px;" :style="{ color: banner.color }">{{ getPercent(banner.pity, banner.max) }}%</span>
        </div>
    </div>
  </div>
</template>

<style scoped>
.progress-bar {
    transition: width 0.4s ease-out;
}
</style>
