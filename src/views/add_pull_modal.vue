<script setup>
import { onMounted, ref } from "vue";

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  lastPullTime: { type: String, default: "" },
});

const emit = defineEmits(["skip", "add"]);

const type = ref("");
const name = ref("");
const pity = ref(10);
const forgetTime = ref(false);
const time = ref("");
const rarity = ref(3);

onMounted(() => {
  time.value = props.lastPullTime;
});

const handleAdd = () => {
  emit("add", {
    name: name.value,
    time: forgetTime.value ? null : time.value,
    pity: pity.value,
    type: type.value,
    rarity: rarity.value,
  });
};
</script>

<template>
  <Teleport to="body">
    <div
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.7)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content custom-dark-card p-4">
          <h5 class="fw-bold mb-4 text-dark">Add Pull Detail</h5>

          <select
            class="form-select custom-input mb-3 text-dark"
            v-model="type"
          >
            <option value="character">Character</option>
            <option value="weapon">Weapon</option>
          </select>

          <select
            class="form-select custom-input mb-3 text-dark"
            v-model.number="rarity"
          >
            <option value="3">3 Star (Blue)</option>
            <option value="4">4 Star (Purple)</option>
            <option value="5">5 Star (Gold)</option>
          </select>

          <input
            type="text"
            class="form-control custom-input mb-3 text-dark"
            placeholder="Select name..."
            v-model="name"
          />

          <div class="form-check form-switch mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="timeToggle"
              v-model="forgetTime"
            />
            <label class="form-check-label text-muted small" for="timeToggle"
              >I don't remember the time</label
            >
          </div>

          <input
            v-if="!forgetTime"
            type="datetime-local"
            class="form-control custom-input mb-3 text-dark"
            v-model="time"
          />

          <div class="d-flex align-items-center mb-4 text-dark">
            <span class="me-3">At Pity:</span>
            <input
              type="number"
              class="form-control custom-input text-dark"
              style="width: 80px"
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
              @click="handleAdd"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
