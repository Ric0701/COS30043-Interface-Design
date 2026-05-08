<script setup>
    import { ref, computed } from 'vue'
    import { useGachaStore } from '../gacha_store.js'
    import PullStatusCard from '../components/pull_status_card.vue'

    const gacha_store = useGachaStore()

    const activeHistory = ref('')

    const historyTitle = computed(() => {
        if (activeHistory.value === 'limited_character') return 'Character Banner'
        if (activeHistory.value === 'limited_weapon') return 'Weapon Banner'
        if (activeHistory.value === 'standard') return 'Standard Banner'
        return ''
    })
</script>

<template>
    <div class="container-fluid d-flex min-vh-100 flex-column justify-content-center">
        
        <div v-if="!activeHistory">
            <div class="text-left mb-4 text-dark">
                <h1 class="fw-bold display-4 text-center">Wish Counter</h1>
            </div>

            <div class="row g-4 justify-content-center">
                <!-- Limited Banner Character -->
                <PullStatusCard
                    title="Limited Banner Character"
                    bannerType="limited_character"
                    :lifeTimePulls="gacha_store.limited_character_lifetime_pulls.length"
                    :fiveStarPity="gacha_store.limited_character_five_star_pity"
                    :fourStarPity="gacha_store.limited_character_four_star_pity"
                    @show-history="activeHistory = 'limited_character'"
                />

                <!-- Limited Banner Weapon -->
                <PullStatusCard
                    title="Limited Banner Weapon"
                    :bannerType="'limited_weapon'"
                    :lifeTimePulls="gacha_store.limited_weapon_lifetime_pulls.length"
                    :fiveStarPity="gacha_store.limited_weapon_five_star_pity"
                    :fourStarPity="gacha_store.limited_weapon_four_star_pity"
                    @show-history="activeHistory = 'limited_weapon'"
                />

                <!-- Standard Banner -->
                <PullStatusCard
                    title="Standard Banner"
                    :bannerType="'standard'"
                    :lifeTimePulls="gacha_store.standard_lifetime_pulls.length"
                    :fiveStarPity="gacha_store.standard_five_star_pity"
                    :fourStarPity="gacha_store.standard_four_star_pity"
                    @show-history="activeHistory = 'standard'"
                />
            </div>
        </div>

        <!-- History View -->
        <div v-else>
            <div class="d-flex align-items-center mb-4">
                <button class="btn btn-link text-dark text-decoration-none fs-3 me-2" @click="activeHistory = ''">
                    &larr; 
                </button>
                <h2 class="fw-bold mb-0 text-dark">Wish Counter <span class="text-primary">{{ historyTitle }}</span></h2>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card custom-dark-card p-3">
                        <div class="table-responsive">
                            <table class="table table-dark-blue table-hover mb-0" style="background-color: transparent;">
                                <thead>
                                    <tr style="border-bottom: 2px solid #3f4561;">
                                        <th>Time</th>
                                        <th>Pity</th>
                                        <th>Name</th>
                                        <th>★</th>
                                        <th>#Roll</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(pull, index) in gacha_store[`${activeHistory}_lifetime_pulls`].slice().reverse()" :key="index">
                                        <td class="text-muted">{{ pull.time ? pull.time.replace('T', ' ') : 'N/A' }}</td>
                                        <td class="text-muted">{{ pull.pity || 1 }}</td>
                                        <td class="fw-bold">{{ pull.name || 'Unknown' }}</td>
                                        <td :class="{
                                            'text-warning': pull.rarity === 5,
                                            'text-info': pull.rarity === 4,
                                            'text-white': pull.rarity === 3
                                        }">{{ pull.rarity || 3 }}</td>
                                        <td class="text-muted">{{ gacha_store[`${activeHistory}_lifetime_pulls`].length - index }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>