<script setup>
import { defineProps, ref } from 'vue';
import { useGachaStore } from '../gacha_store';
import AddPullModal from '@/views/add_pull_modal.vue';

const props = defineProps({
    title: String,
    bannerType: String,
    lifeTimePulls: Number,
    fiveStarPity: Number,
    fourStarPity: Number,
    maxFiveStarPity: { type: Number, default: 90 },
    maxFourStarPity: { type: Number, default: 10 },
});

const gacha_store = useGachaStore()
const emit = defineEmits(['showHistory'])

const isEditing = ref(false);
const editFivePity = ref(0);
const editFourPity = ref(0);

const toggleEdit = () => {
    isEditing.value = !isEditing.value;
    if (isEditing.value) {
        editFivePity.value = props.fiveStarPity;
        editFourPity.value = props.fourStarPity;
    }
}

const saveEdit = () => {
    gacha_store.force_update_pity({
        type: props.bannerType,
        fivePity: Number(editFivePity.value) || 0,
        fourPity: Number(editFourPity.value) || 0
    })
    isEditing.value = false;
}

const getFiveStar = () => gacha_store.add_pull({ rarity: 5, type: props.bannerType })
const getFourStar = () => gacha_store.add_pull({ rarity: 4, type: props.bannerType })
const removeSinglePull = () => gacha_store.remove_pull({ type: props.bannerType })


const addSinglePull = () => {
    if (props.fourStarPity >= 9 || props.fiveStarPity >= props.maxFiveStarPity - 1) {
        showModal.value = true;
    } else {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        
        gacha_store.add_pull({ 
            name: 'Unknown',
            rarity: 3, 
            type: props.bannerType,
            time: now.toISOString().slice(0, 16)
        });
    }
}

const showModal = ref(false);

const getLastTime = () => {
    const history = gacha_store[`${props.bannerType}_lifetime_pulls`]
    if (history.length > 0) return history[history.length - 1].time
    return null
}
const handleModalAdd = (modalData) => {
    gacha_store.add_pull({
        ...modalData,
        itemType: modalData.type,
        type: props.bannerType,
        rarity: modalData.rarity
    })

    showModal.value = false;
}
</script>

<template>
    <!-- Add Pull Modal -->
    <AddPullModal 
        v-if="showModal" 
        :lastPullTime="getLastTime()" 
        @skip="showModal = false" 
        @add="handleModalAdd" 
    />

    <!-- Card Template -->
    <div class="col-12 col-md-6 col-lg-3">
        <div class="card custom-dark-card p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0 fw-bold">{{ title }}</h5>
                <div>
                    <button class="btn btn-sm btn-outline-secondary me-1" @click="toggleEdit">✏️</button>
                    <button class="btn btn-sm btn-outline-secondary" @click="$emit('showHistory')">≡</button>
                </div>
            </div>

            <div v-if="!isEditing">
                <div class="info-box mb-2 p-2 d-flex justify-content-between align-items-center">
                    <div>
                        <div class="small text-dark">Lifetime Pulls</div>
                        <div class="text-muted small">★ </div>
                    </div>
                    <div class="h3 mb-0 fw-bold text-info">{{ lifeTimePulls }}</div>
                </div>
                <div class="info-box mb-2 p-2 d-flex justify-content-between align-items-center">
                    <div>
                        <div class="small text-dark">5★ Pity</div>
                        <div class="text-muted small">Guaranteed at {{ maxFiveStarPity }} pulls</div>
                    </div>
                    <div class="h3 mb-0 fw-bold text-warning">{{ fiveStarPity }}</div>
                </div>
                <div class="info-box mb-2 p-2 d-flex justify-content-between align-items-center">
                    <div>
                        <div class="small text-dark">4★ Pity</div>
                        <div class="text-muted small">Guaranteed at {{ maxFourStarPity }} pulls</div>
                    </div>
                    <div class="h3 mb-0 fw-bold text-warning">{{ fourStarPity }}</div>
                </div>
                <div class="row g-2 mb-2">
                    <div class="row">
                        <div class="col-6">
                            <button class="btn btn-outline-dark w-100" @click="showModal = true">Get 5★</button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-dark w-100" @click="showModal = true">Get 4★</button>
                        </div>
                    </div>
                    <div class="row g-2">
                        <div class="col-4">
                            <button class="btn btn-outline-dark w-100" @click="addSinglePull">+1</button>
                        </div>
                        <div class="col-4">
                            <button class="btn btn-outline-dark w-100" @click="showModal = true">+10</button>
                        </div>
                        <div class="col-4">
                            <button class="btn btn-outline-dark w-100" @click="removeSinglePull">-1</button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else>
                <div class="mb-3">
                    <label class="small text-white mb-1">Lifetime Pulls</label>
                    <input type="text" class="form-control custom-input" :value="lifeTimePulls" disabled />
                </div>

                <div class="mb-3">
                    <label class="small text-white mb-1">5★ Pity (Guaranteed at {{ maxFiveStarPity }})</label>
                    <input type="number" class="form-control custom-input" v-model.number="editFivePity" min="0" :max="maxFiveStarPity" />
                </div>

                <div class="mb-4">
                    <label class="small text-white mb-1">4★ Pity (Guaranteed at {{ maxFourStarPity }})</label>
                    <input type="number" class="form-control custom-input" v-model.number="editFourPity" min="0" :max="maxFourStarPity" />
                </div>

                <button class="btn btn-outline-light w-100" style="background-color: #3f4561; border: none;" @click="saveEdit">Save</button>
            </div>
        </div>
    </div>
</template>