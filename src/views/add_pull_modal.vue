<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { useGachaStore } from "../gacha_store.js";

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  lastPullTime: { type: String, default: "" },
  bannerType: { type: String, default: "" },
  initialRarity: { type: Number, default: null },
  isMulti: { type: Boolean, default: false },
});

const emit = defineEmits(["skip", "add"]);

const gachaStore = useGachaStore();

const type = ref("");
const name = ref("");
const pity = ref(10);
const rarity = ref(null);

onMounted(async () => {
  // Ensure that game data is loaded
  await gachaStore.fetch_game_data();

  // Enforce default item type based on banner context
  if (props.bannerType === "limited_character") {
    type.value = "character";
  } else if (props.bannerType === "limited_weapon") {
    type.value = "weapon";
  } else {
    type.value = "character";
  }

  // Set initial rarity configuration
  if (props.isMulti) {
    rarity.value = null;
  } else if (props.initialRarity !== null && props.initialRarity !== undefined) {
    rarity.value = props.initialRarity;
  } else {
    rarity.value = 3;
  }
});

const STANDARD_5STAR_CHARACTERS = [
  "diluc",
  "jean",
  "qiqi",
  "mona",
  "keqing",
  "tighnari",
  "dehya"
];

const STANDARD_5STAR_WEAPONS = [
  "skyward_blade",
  "aquila_favonia",
  "skyward_pride",
  "wolfs_gravestone",
  "skyward_spine",
  "primordial_jade_winged-spear",
  "skyward_atlas",
  "lost_prayer_to_the_sacred_winds",
  "skyward_harp",
  "amos_bow"
];

const formatName = (id) => {
  if (!id) return "";
  return id
    .split("_")
    .map(part => {
      return part
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
    })
    .join(" ");
};

const filteredItems = computed(() => {
  // Strict Banner Context Filter rules:
  // Rule A: Limited Character Banner strictly lists characters only.
  // Rule B: Limited Weapon Banner strictly lists weapons only.
  // Rule C: Standard Banner allows switching / displays characters or weapons based on user selection.
  let baseList = [];
  if (props.bannerType === "limited_character") {
    baseList = gachaStore.character_list;
  } else if (props.bannerType === "limited_weapon") {
    baseList = gachaStore.weapon_list;
  } else {
    baseList = type.value === "character" ? gachaStore.character_list : gachaStore.weapon_list;
  }

  let items = baseList;
  if (rarity.value !== null && rarity.value !== undefined && rarity.value !== "") {
    items = baseList.filter(item => item.rarity === Number(rarity.value));
  }

  // Standard banner perm 5-star filter
  if (props.bannerType === "standard") {
    items = items.filter(item => {
      if (item.rarity === 5) {
        if (type.value === "character") {
          return STANDARD_5STAR_CHARACTERS.includes(item.name.toLowerCase());
        } else {
          return STANDARD_5STAR_WEAPONS.includes(item.name.toLowerCase());
        }
      }
      return true;
    });
  }

  return items;
});

watch([type, rarity], () => {
  const formattedNames = filteredItems.value.map(item => formatName(item.name));
  if (!formattedNames.includes(name.value)) {
    name.value = "";
  }
});

const submitPull = () => {
  const now = new Date();
  const localTimeStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  emit("add", {
    name: name.value,
    pity: pity.value,
    type: type.value,
    rarity: rarity.value || 3,
    timestamp: Date.now(),
    time: localTimeStr, // Maintain compatibility with previous components
  });
};
</script>

<template>
  <Teleport to="body">
    <div
      class="modal d-block add_pull_modal_modal-overlay"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content custom-dark-card p-4">
          <h5 class="fw-bold mb-4 text-dark">Add Pull Detail</h5>

          <!-- Conditionally show type select only on standard banner -->
          <select
            v-if="bannerType === 'standard'"
            class="form-select custom-input mb-3 text-dark"
            v-model="type"
          >
            <option value="character">Character</option>
            <option value="weapon">Weapon</option>
          </select>

          <select
            class="form-select custom-input mb-3 text-dark"
            v-model="rarity"
          >
            <option :value="null">All / Multi-Pull</option>
            <option :value="3">3 Star (Blue)</option>
            <option :value="4">4 Star (Purple)</option>
            <option :value="5">5 Star (Gold)</option>
          </select>

          <select
            class="form-select custom-input mb-3 text-dark"
            v-model="name"
            :disabled="filteredItems.length === 0"
          >
            <option value="" disabled>Select name...</option>
            <option
              v-for="item in filteredItems"
              :key="item.name"
              :value="formatName(item.name)"
            >
              {{ formatName(item.name) }} ({{ item.rarity }}★)
            </option>
          </select>

          <div class="d-flex align-items-center mb-4 text-dark">
            <span class="me-3">At Pity:</span>
            <input
              type="number"
              class="form-control custom-input text-dark add_pull_modal_pity-input"
              min="1"
              v-model="pity"
            />
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-outline-danger w-100" @click="$emit('skip')">
              Skip
            </button>
            <button
              class="btn btn-primary w-100"
              :disabled="!name"
              @click="submitPull"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
