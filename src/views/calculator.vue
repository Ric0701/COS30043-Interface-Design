<script setup>
    import { ref, computed, onMounted, onUnmounted } from 'vue'
    import { character_exp } from '../data/character_exp.js'
    import { weapon_exp } from '../data/weapon_exp.js'
    import { useTodoStore } from '../data/todo_store.js'
    import { useGachaStore } from '../gacha_store.js'

    // import { characterList, weaponList } from '../data/entity_list.js'

    const todoStore = useTodoStore()
    const gachaStore = useGachaStore()
    const calcType = ref('character') 
    const hasCalculated = ref(false)

    // EXP calculator
    // Set defaults to the first item in our database arrays to prevent null errors
    const selectedCharacter = ref(null)
    const selectedWeapon = ref(null)
    
    const currentLevel = ref(1)
    const intendedLevel = ref(90)
    const currentExp = ref(0)

    const moraNeeded = ref(0)
    const itemsNeeded = ref([0, 0, 0])
    const wastedExp = ref(0)

    const charResources = [
        { name: "Hero's Wit", exp: 20000, label: "Hero's Wit (20k)" },
        { name: "Adventurer's Experience", exp: 5000, label: "Adventurer's Experience (5k)" },
        { name: "Wanderer's Advice", exp: 1000, label: "Wanderer's Advice (1k)" }
    ]

    const weaponResources = [
        { name: "Mystic Enhancement Ore", exp: 10000, label: "Mystic Enhancement Ore (10k)" },
        { name: "Fine Enhancement Ore", exp: 2000, label: "Fine Enhancement Ore (2k)" },
        { name: "Enhancement Ore", exp: 400, label: "Enhancement Ore (400)" }
    ]

    const activeResources = computed(() => calcType.value === 'character' ? charResources : weaponResources)

    // Resin calculator
    const currentResin = ref(0)
    const targetResin = ref(200)
    const currentTimeString = ref('')
    let timerInterval = null
    const condensedResinCount = ref(0)
    const remainingOriginalResin = ref(0)
    const completionTime = ref('')
    const dayOffsetString = ref('')

    // Live Clock
    const updateTime = () => {
        const now = new Date()
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayName = days[now.getDay()]
        const timeString = now.toLocaleTimeString('en-US', { hour12: false }) 
        currentTimeString.value = `${dayName} ${timeString}`
    }

    onMounted(() => {
        updateTime()
        timerInterval = setInterval(updateTime, 1000)

        gachaStore.fetch_game_data().then(() => {
            if (gachaStore.character_list.length > 0) {
                selectedCharacter.value = gachaStore.character_list[0]
            }
            if (gachaStore.weapon_list.length > 0) {
                selectedWeapon.value = gachaStore.weapon_list[0]
            }
        })
    })

    onUnmounted(() => {
        if (timerInterval) clearInterval(timerInterval)
    })

    const changeType = (newType) => {
        calcType.value = newType
        hasCalculated.value = false 
    }

    const calculate = () => {
        if (calcType.value === 'resin') {
            calculateResinLogic()
        } else {
            calculateExpLogic()
        }
    }

    const calculateResinLogic = () => {
        if (currentResin.value >= targetResin.value) {
            alert("Desired resin must be higher than current resin.")
            return
        }

        condensedResinCount.value = Math.floor(targetResin.value / 40)
        remainingOriginalResin.value = targetResin.value % 40

        const resinNeeded = targetResin.value - currentResin.value
        const totalMinutes = resinNeeded * 8 

        const now = new Date()
        const finishedAt = new Date(now.getTime() + totalMinutes * 60000)
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const finishDayName = days[finishedAt.getDay()]
        const finishTimeString = finishedAt.toLocaleTimeString('en-US', { hour12: false })

        const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endDay = new Date(finishedAt.getFullYear(), finishedAt.getMonth(), finishedAt.getDate())
        const diffTime = Math.abs(endDay - startDay)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
            dayOffsetString.value = "(in a day)"
        } else if (diffDays > 1) {
            dayOffsetString.value = `(in ${diffDays} days)`
        } else {
            dayOffsetString.value = "(today)"
        }

        completionTime.value = `${finishDayName} ${finishTimeString} ${dayOffsetString.value}`
        hasCalculated.value = true
    }

    const calculateExpLogic = () => {
        if (currentLevel.value >= intendedLevel.value) {
            alert("Intended level must be higher than current level.")
            return
        }

        let targetExp = 0

        if (calcType.value === 'character') {
            targetExp = character_exp[intendedLevel.value - 1] - (character_exp[currentLevel.value - 1] + currentExp.value)
        } else {
            // AUTOMATIC RARITY DETECTION: Pulls rarity directly from the selected weapon object
            let rarity = selectedWeapon.value.rarity
            let curveIndex = rarity <= 2 ? 0 : (rarity === 3 ? 1 : 2)
            targetExp = weapon_exp[curveIndex][intendedLevel.value - 1] - (weapon_exp[curveIndex][currentLevel.value - 1] + currentExp.value)
        }

        if (targetExp <= 0) {
            itemsNeeded.value = [0, 0, 0]
            moraNeeded.value = 0
            wastedExp.value = 0
            hasCalculated.value = true
            return
        }

        let remaining = targetExp
        const vals = activeResources.value.map(r => r.exp)

        const item0 = Math.floor(remaining / vals[0])
        remaining -= item0 * vals[0]

        const item1 = Math.floor(remaining / vals[1])
        remaining -= item1 * vals[1]

        const item2 = Math.ceil(remaining / vals[2])

        itemsNeeded.value = [item0, item1, item2]

        const totalExpGained = (item0 * vals[0]) + (item1 * vals[1]) + (item2 * vals[2])
        wastedExp.value = totalExpGained - targetExp
        moraNeeded.value = calcType.value === 'character' ? totalExpGained / 5 : totalExpGained / 10

        hasCalculated.value = true

    }

    const addTodo = () => {
        // Figure out which name we are saving based on the mode
        const isChar = calcType.value === 'character'
        const nameToSave = isChar ? selectedCharacter.value.name : selectedWeapon.value.name

        // Format the items so the Todo list can easily read them
        const formattedItems = activeResources.value.map((res, index) => {
            return {
                name: res.name,
                label: res.label,
                count: itemsNeeded.value[index]
            }
        }).filter(item => item.count > 0) // Only save items we actually need

        // Send to the Pinia store
        todoStore.addTodo({
            type: calcType.value,
            name: nameToSave,
            currentLevel: currentLevel.value,
            targetLevel: intendedLevel.value,
            mora: Math.ceil(moraNeeded.value),
            items: formattedItems
        })

        alert(`${nameToSave} added to Todo List!`)
    }
</script>

<style scoped>
    
</style>

<template>
    <div class="container-fluid d-flex flex-column justify-content-center mt-5 mb-5">
        <h1 class="fw-bold display-4 mb-4 text-dark text-center">Calculators</h1>
        
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                
                <div class="card custom-dark-card p-4 mb-4">
                    
                    <div class="btn-group w-100 mb-4 shadow-sm">
                        <button class="btn btn-nav" :class="{ 'active': calcType === 'character' }" @click="changeType('character')">Character</button>
                        <button class="btn btn-nav" :class="{ 'active': calcType === 'weapon' }" @click="changeType('weapon')">Weapon</button>
                        <button class="btn btn-nav" :class="{ 'active': calcType === 'resin' }" @click="changeType('resin')">Resin</button>
                    </div>

                    <!-- Character & Weapon Inputs -->
                    <div v-if="calcType === 'character' || calcType === 'weapon'">
                        <div v-if="gachaStore.is_fetching_data" class="text-dark mb-3 text-center fw-bold">
                            Loading database...
                        </div>

                        <div v-else>
                            <!-- Character Selection Dropdown -->
                            <div class="mb-3" v-if="calcType === 'character'">
                                <label class="text-dark small mb-1">Select Character</label>
                                <select class="form-select text-dark custom-input" v-model="selectedCharacter">
                                    <option v-for="char in gachaStore.character_list" :key="char.name" :value="char">
                                        {{ char.name }} ({{ char.rarity }}-Star)
                                    </option>
                                </select>
                            </div>

                            <!-- Weapon Selection Dropdown -->
                            <div class="mb-3" v-if="calcType === 'weapon'">
                                <label class="text-dark small mb-1">Select Weapon</label>
                                <select class="form-select text-dark custom-input" v-model="selectedWeapon">
                                    <option v-for="weap in gachaStore.weapon_list" :key="weap.name" :value="weap">
                                        {{ weap.name }} ({{ weap.rarity }}-Star)
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-6">
                                <label class="text-dark small mb-1">Current Level</label>
                                <input type="number" class="form-control custom-input text-dark" v-model.number="currentLevel" min="1" max="90">
                            </div>
                            <div class="col-6">
                                <label class="text-dark small mb-1">Intended Level</label>
                                <input type="number" class="form-control custom-input text-dark" v-model.number="intendedLevel" :min="currentLevel" max="90">
                            </div>
                        </div>
                        
                        <div class="mb-2">
                            <label class="text-dark small mb-1">Current EXP (Optional)</label>
                            <input type="number" class="form-control custom-input text-dark" v-model.number="currentExp" min="0">
                        </div>
                    </div>

                    <!-- Resin Inputs -->
                    <div v-if="calcType === 'resin'">
                        <div class="mb-3">
                            <label class="text-dark small mb-1 text-center w-100">Current Resin</label>
                            <input type="number" class="form-control custom-input py-2 text-dark" v-model.number="currentResin" min="0" max="2000">
                        </div>
                        <div class="mb-3 text-center text-muted small">or Desired Resin</div>
                        <div class="mb-4">
                            <input type="number" class="form-control custom-input py-2 text-dark" v-model.number="targetResin" :min="currentResin + 1" max="2000">
                        </div>
                        <div class="text-center text-dark mb-3">
                            Current Time: {{ currentTimeString }}
                        </div>
                    </div>

                    <button 
                        class="btn py-2 fw-bold calculate-btn" 
                        @click="calculate"
                        :disabled="gachaStore.is_fetching_data || (!selectedCharacter && calcType === 'character')"
                    >
                        {{ gachaStore.is_fetching_data ? 'Loading...' : 'Calculate' }}
                    </button>
                </div>

                <!-- EXP Results Card -->
                <div class="card custom-dark-card p-4" v-if="hasCalculated && (calcType === 'character' || calcType === 'weapon')">
                    <h5 class="fw-bold mb-3 text-dark">Resources Needed</h5>
                    <ul class="list-group list-group-flush mb-4" style="border-radius: 8px; overflow: hidden;">
                        <li v-for="(item, index) in activeResources" :key="index" class="list-group-item d-flex justify-content-between align-items-center bg-light-blue text-dark border-secondary py-3">
                            {{ item.label }}
                            <span class="badge bg-primary rounded-pill fs-6">{{ itemsNeeded[index] }}</span>
                        </li>
                    </ul>
                    <div class="info-box p-3 mb-2 rounded bg-light-blue d-flex justify-content-between align-items-center">
                        <span class="text-black">Mora Needed</span>
                        <span class="text-dark fw-bold fs-5">{{ Math.ceil(moraNeeded).toLocaleString() }}</span>
                    </div>
                    <div class="info-box p-3 rounded bg-light-blue d-flex justify-content-between align-items-center" v-if="wastedExp > 0">
                        <span class="text-black">Wasted EXP</span>
                        <span class="text-danger fw-bold fs-5">{{ wastedExp.toLocaleString() }}</span>
                    </div>
                    <button class="btn btn-outline-primary w-100 mt-3 py-2 fw-bold" @click="addTodo">
                        <i class="bi bi-card-checklist me-2"></i> Add to Todo List
                    </button>
                </div>

                <!-- Resin Results Card -->
                <div class="card custom-dark-card p-4" v-if="hasCalculated && calcType === 'resin'">
                    <div class="resin-results p-4">
                        <div class="text-center resin-text mb-3 text-black">
                            {{ targetResin }} × Original Resin
                        </div>
                        <div class="divider">
                            <span>or</span>
                        </div>
                        <div class="text-center resin-text mb-2 text-black">
                            {{ remainingOriginalResin }} × Original Resin
                        </div>
                        <div class="text-center resin-text mb-4 text-black">
                            {{ condensedResinCount }} × Condensed Resin
                        </div>
                        <div class="text-danger mt-3 pb-2 border-bottom border-secondary fw-bold">
                            Will be replenished at: {{ completionTime }}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>