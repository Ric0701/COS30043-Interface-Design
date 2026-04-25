<script setup>
    import { ref, watch } from 'vue'
    import { character_exp } from '../data/character_exp.js'

    const currentLevel = ref(1)
    const currentExp = ref(0)
    const intendedLevel = ref(90)

    const moraNeeded = ref(0)
    const itemsNeeded = ref([0, 0, 0])
    const wastedExp = ref(0)
    const hasCalculated = ref(false)

    // Hero's Wit, Adventurer's Experience, Wanderer's Advice
    const resourceValues = [
        {
            name: "Hero's Wit",
            exp: 20000,
            count: 0
        },
        {
            name: "Adventurer's Experience",
            exp: 5000,
            count: 0
        },
        {
            name: "Wanderer's Advice",
            exp: 1000,
            count: 0
        }
    ]

    const values = resourceValues.map(r => r.exp)
    const calculate = () => {
        //Error prevention
        if (currentLevel.value >= intendedLevel.value) {
            alert("Intended level must be higher than current level.")
            return
        }

        const target = character_exp[intendedLevel.value - 1] - (character_exp[currentLevel.value - 1] + currentExp.value)
        let current = target
        let max = []

        // moraNeeded.value = (Math.floor(target / 1000) * 1000) / 5

        let items = [0, 0, 0]
        items[0] = Math.ceil(current / values[0])
        max.push({ usage: [...items], over: current - ((items[0] * values[0]) + (items[1] * values[1]) + (items[2] * values[2])) })

        //Backtracking Search
        const process = (usage, start) => {
            let i = start
            if (i === values.length - 1) return

            while (usage[i] > 0) {
                usage[i]--
                usage[i + 1]++
                
                let currentTotal = usage.reduce((total, e, f) => total + (e* values[f]), 0)
                usage[i + 1] = Math.ceil((target - currentTotal) / values[i + 1])

                currentTotal = usage.reduce((total, e, f) => total + (e* values[f]), 0)
                max.push({ usage: [...usage], over: target - currentTotal })

                if (usage[i] === 0) i++
                if (i === values.length - 1) break
                process([...usage], start + 1)
            }
        }

        process([...items], 1)

        //Find the most efficient combination
        const currentMax = max
            .filter(x => x.over <= 0)
            .sort((a, b) => b.over - a.over)[0]

        //Update values
        itemsNeeded.value = currentMax.usage
        wastedExp.value = Math.abs(currentMax.over)
        hasCalculated.value = true

        const totalExpGained = (currentMax.usage[0] * 20000) + (currentMax.usage[1] * 5000) + (currentMax.usage[2] * 1000)
        moraNeeded.value = totalExpGained / 5
    }
</script>

<style scoped>
/* Copied from your modal styles */
.custom-dark-card { background-color: #262636; border: none; border-radius: 12px; }
.custom-input { background-color: #1e1e2d; color: white; border: 1px solid #3f4561; }
</style>

<template>
<div class="container-fluid mt-4 px-4">
        <h1 class="fw-bold display-4 mb-4 text-dark">Character Calculator</h1>

        <div class="row g-4">
            <div class="col-12 col-lg-6">
                <div class="card custom-dark-card p-4">
                    <h5 class="fw-bold mb-3 text-white">Level Target</h5>
                    
                    <div class="mb-3">
                        <label class="text-white small mb-1">Current Level</label>
                        <input type="number" class="form-control custom-input" v-model.number="currentLevel" min="1" max="90">
                    </div>
                    
                    <div class="mb-3">
                        <label class="text-white small mb-1">Current EXP</label>
                        <input type="number" class="form-control custom-input" v-model.number="currentExp" min="0">
                    </div>

                    <div class="mb-4">
                        <label class="text-white small mb-1">Intended Level</label>
                        <input type="number" class="form-control custom-input" v-model.number="intendedLevel" :min="currentLevel" max="90">
                    </div>

                    <button class="btn btn-outline-light w-100" style="background-color: #3f4561; border: none;" @click="calculate">
                        Calculate Resources
                    </button>
                </div>
            </div>

            <div class="col-12 col-lg-6" v-if="hasCalculated">
                <div class="card custom-dark-card p-4 h-100">
                    <h5 class="fw-bold mb-3 text-white">Resources Needed</h5>
                    
                    <ul class="list-group list-group-flush mb-4" style="border-radius: 8px; overflow: hidden;">
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                            Hero's Wit (20k)
                            <span class="badge bg-primary rounded-pill">{{ itemsNeeded[0] }}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                            Adventurer's Experience (5k)
                            <span class="badge bg-primary rounded-pill">{{ itemsNeeded[1] }}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                            Wanderer's Advice (1k)
                            <span class="badge bg-primary rounded-pill">{{ itemsNeeded[2] }}</span>
                        </li>
                    </ul>

                    <div class="info-box p-3 mb-2 rounded bg-dark d-flex justify-content-between">
                        <span class="text-white">Mora Needed</span>
                        <span class="text-warning fw-bold">{{ moraNeeded.toLocaleString() }}</span>
                    </div>

                    <div class="info-box p-3 rounded bg-dark d-flex justify-content-between" v-if="wastedExp > 0">
                        <span class="text-white">Wasted EXP</span>
                        <span class="text-danger fw-bold">{{ wastedExp.toLocaleString() }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>