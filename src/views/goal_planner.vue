<script setup>
import { ref, computed } from "vue";
import { useGoalStore } from "../data/goal_store.js";
import { useAuthStore } from "../data/auth_store.js";

const goalStore = useGoalStore();
const authStore = useAuthStore();

// Form input references
const goalName = ref("");
const targetWeek = ref("");
const pullType = ref("limited_character");
const neededWishes = ref(180);

const formErrors = ref({
  goalName: "",
  targetWeek: "",
  neededWishes: "",
});

/**
 * Native JS Helper: Computes the Monday of a given date object.
 * Sets time to midnight to ensure clean day-level date comparisons.
 */
const getMondayOfDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust for Sunday (0) which is day 7 in ISO week system
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Native JS Helper: Parses an ISO Week string (e.g., '2026-W34')
 * and returns a Date object corresponding to the Monday of that week.
 */
const getMondayOfISOWeek = (weekStr) => {
  if (!weekStr) return null;
  const parts = weekStr.split("-W");
  if (parts.length !== 2) return null;
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  // Jan 4th is guaranteed to always fall in Week 1 of any ISO year
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay();
  const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

  const mondayOfJan4 = new Date(jan4);
  mondayOfJan4.setDate(jan4.getDate() - isoDayOfWeek + 1);
  mondayOfJan4.setHours(0, 0, 0, 0);

  // Offset Monday of Jan 4 week by (week - 1) * 7 days
  const targetMonday = new Date(mondayOfJan4);
  targetMonday.setDate(mondayOfJan4.getDate() + (week - 1) * 7);
  return targetMonday;
};

/**
 * Native JS Helper: Formats a Date object into an ISO Week string (e.g. '2026-W23').
 */
const getISOWeekString = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay();
  // Set to nearest Thursday: current date + 4 - current day number (Sunday is 7)
  d.setUTCDate(d.getUTCDate() + 4 - (dayNum || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const weekStr = weekNo < 10 ? `0${weekNo}` : `${weekNo}`;
  return `${d.getUTCFullYear()}-W${weekStr}`;
};

// Current system week helper label
const currentSystemWeek = computed(() => {
  return getISOWeekString(new Date());
});

/**
 * Reactive Computed Goal List: Maps raw goals to their temporal computations.
 * Reacts automatically to changes in gachaStore pity values.
 */
const goalsWithCalculations = computed(() => {
  return goalStore.goals.map((goal) => {
    const currentPity = goalStore.getPityForPullType(goal.pullType);
    const targetMonday = getMondayOfISOWeek(goal.targetWeek);
    const currentMonday = getMondayOfDate(new Date());

    let weeksRemaining = 0;
    if (targetMonday && currentMonday) {
      const diffMs = targetMonday.getTime() - currentMonday.getTime();
      // Round to closest integer to gracefully absorb daylight saving time shifts
      weeksRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
    }

    const remainingResources = Math.max(0, goal.neededWishes - currentPity);

    let weeklyTarget = 0;
    let dailyTarget = 0;
    let isOverdue = false;

    if (weeksRemaining > 0) {
      weeklyTarget = Math.ceil(remainingResources / weeksRemaining);
      dailyTarget = Math.ceil(weeklyTarget / 7);
    } else {
      isOverdue = true;
    }

    const progressPercentage = goal.neededWishes > 0
      ? Math.min(100, Math.round((currentPity / goal.neededWishes) * 100))
      : 0;

    return {
      ...goal,
      currentPity,
      weeksRemaining,
      remainingResources,
      weeklyTarget: isOverdue ? "Overdue" : weeklyTarget,
      dailyTarget: isOverdue ? "Overdue" : dailyTarget,
      progressPercentage,
      isOverdue,
      goalMet: remainingResources === 0,
    };
  });
});

/**
 * Handles goal form submission, validating input constraints before adding.
 */
const handleSubmit = () => {
  // Reset errors
  formErrors.value = { goalName: "", targetWeek: "", neededWishes: "" };
  let isValid = true;

  if (!goalName.value.trim()) {
    formErrors.value.goalName = "Goal Name is required.";
    isValid = false;
  }

  if (!targetWeek.value) {
    formErrors.value.targetWeek = "Target Week is required.";
    isValid = false;
  }

  if (!neededWishes.value || neededWishes.value <= 0) {
    formErrors.value.neededWishes = "Needed Wishes must be greater than 0.";
    isValid = false;
  }

  if (!isValid) return;

  goalStore.addGoal({
    goalName: goalName.value.trim(),
    targetWeek: targetWeek.value,
    pullType: pullType.value,
    neededWishes: neededWishes.value,
  });

  // Reset inputs
  goalName.value = "";
  targetWeek.value = "";
  pullType.value = "limited_character";
  neededWishes.value = 180;
};

const getProgressBarClass = (type) => {
  if (type === "limited_character") return "goal_planner_progress-character";
  if (type === "limited_weapon") return "goal_planner_progress-weapon";
  return "goal_planner_progress-standard";
};

const getBannerBadgeClass = (type) => {
  if (type === "limited_character") return "bg-warning text-dark";
  if (type === "limited_weapon") return "goal_planner_bg-purple text-white";
  return "bg-info text-dark";
};

const getBannerLabel = (type) => {
  if (type === "limited_character") return "Character Banner";
  if (type === "limited_weapon") return "Weapon Banner";
  return "Standard Banner";
};
</script>

<template>
  <div class="container-fluid d-flex min-vh-100 flex-column justify-content-start pt-4 px-4 pb-5">
    <div class="text-left mb-4 text-dark mt-4">
      <h1 class="fw-bold display-5 text-center text-md-start">Smart Goal Planner</h1>
      <p class="text-muted text-center text-md-start">
        Plan your saving goals and calculate how many wishes you need to secure daily and weekly.
      </p>
    </div>

    <!-- User Warning if Not Logged In -->
    <div v-if="!authStore.currentUser" class="alert alert-warning border-warning shadow-sm mb-4" role="alert">
      <h5 class="alert-heading fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Not Logged In</h5>
      <p class="mb-0">
        You are currently viewing the planner in guest mode. Please <RouterLink to="/login" class="fw-bold text-dark text-decoration-underline">log in</RouterLink> to save, persist, and manage your goals.
      </p>
    </div>

    <div class="row g-4">
      <!-- Left Column: Add Goal Form -->
      <div class="col-12 col-lg-4">
        <div class="card custom-card goal_planner_custom-card p-4 shadow-sm">
          <h4 class="fw-bold mb-4 text-dark border-bottom pb-2">Create New Goal</h4>
          <form @submit.prevent="handleSubmit">
            <!-- Goal Name -->
            <div class="mb-3">
              <label for="goalName" class="form-label fw-semibold text-dark">Goal Name</label>
              <input
                id="goalName"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': formErrors.goalName }"
                v-model="goalName"
                placeholder="e.g. C0 Zhongli, Staff of Homa"
                :disabled="!authStore.currentUser"
              />
              <div class="invalid-feedback">{{ formErrors.goalName }}</div>
            </div>

            <!-- Target Week -->
            <div class="mb-3">
              <label for="targetWeek" class="form-label fw-semibold text-dark">Target Week</label>
              <input
                id="targetWeek"
                type="week"
                class="form-control"
                :class="{ 'is-invalid': formErrors.targetWeek }"
                v-model="targetWeek"
                :disabled="!authStore.currentUser"
              />
              <div class="form-text text-muted small mt-1">
                Current Week: <span class="badge bg-secondary text-white">{{ currentSystemWeek }}</span>
              </div>
              <div class="invalid-feedback">{{ formErrors.targetWeek }}</div>
            </div>

            <!-- Pull Type Select -->
            <div class="mb-3">
              <label for="pullType" class="form-label fw-semibold text-dark">Pull Banner Type</label>
              <select
                id="pullType"
                class="form-select"
                v-model="pullType"
                :disabled="!authStore.currentUser"
              >
                <option value="limited_character">Limited Character Banner</option>
                <option value="limited_weapon">Limited Banner Weapon</option>
                <option value="standard">Standard Banner</option>
              </select>
            </div>

            <!-- Needed Wishes -->
            <div class="mb-4">
              <label for="neededWishes" class="form-label fw-semibold text-dark">Needed Wishes</label>
              <input
                id="neededWishes"
                type="number"
                class="form-control"
                :class="{ 'is-invalid': formErrors.neededWishes }"
                v-model.number="neededWishes"
                min="1"
                placeholder="180"
                :disabled="!authStore.currentUser"
              />
              <div class="invalid-feedback">{{ formErrors.neededWishes }}</div>
              <div class="form-text text-muted small mt-1">
                Typical guaranteed characters require up to 180 wishes, while weapons require 160 or 240 (max Fate Points).
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary w-100 py-2 fw-semibold"
              :disabled="!authStore.currentUser"
            >
              Add Goal
            </button>
          </form>
        </div>
      </div>

      <!-- Right Column: Goals Grid -->
      <div class="col-12 col-lg-8">
        <div v-if="goalsWithCalculations.length === 0" class="card custom-card goal_planner_custom-card p-5 text-center shadow-sm">
          <i class="bi bi-journal-check text-muted display-3 mb-3"></i>
          <h5 class="fw-bold text-dark">No Active Savings Goals</h5>
          <p class="text-muted mb-0">
            Use the planner tool on the left to set your first saving target week and wish limit!
          </p>
        </div>

        <div v-else class="row g-3">
          <div
            v-for="goal in goalsWithCalculations"
            :key="goal.id"
            class="col-12 col-md-6"
          >
            <div class="card custom-card goal_planner_custom-card h-100 shadow-sm border-0 d-flex flex-column justify-content-between position-relative overflow-hidden">
              <!-- Corner Met Badge -->
              <div v-if="goal.goalMet" class="goal_planner_goal-met-ribbon">
                <i class="bi bi-star-fill me-1"></i> MET
              </div>

              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span :class="['badge rounded-pill', getBannerBadgeClass(goal.pullType)]">
                    {{ getBannerLabel(goal.pullType) }}
                  </span>
                  <button
                    class="btn btn-link text-danger p-0 border-0"
                    title="Delete Goal"
                    @click="goalStore.removeGoal(goal.id)"
                  >
                    <i class="bi bi-trash fs-5"></i>
                  </button>
                </div>

                <h3 class="fw-bold text-dark mb-1">{{ goal.goalName }}</h3>

                <!-- Target Week and Weeks Remaining -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="text-muted small">
                    Target: <strong class="text-dark">{{ goal.targetWeek }}</strong>
                  </span>
                  <span
                    :class="[
                      'badge fw-bold',
                      goal.isOverdue ? 'bg-danger text-white' : 'bg-light-blue text-dark'
                    ]"
                  >
                    <template v-if="goal.isOverdue">Overdue</template>
                    <template v-else-if="goal.weeksRemaining === 0">Current Week</template>
                    <template v-else>{{ goal.weeksRemaining }} week{{ goal.weeksRemaining > 1 ? 's' : '' }} left</template>
                  </span>
                </div>

                <!-- Progress / Pity Status -->
                <div class="mb-4">
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="small text-muted">
                      Pity: <strong>{{ goal.currentPity }}</strong> / {{ goal.neededWishes }} Wishes
                    </span>
                    <span class="small fw-semibold text-dark">{{ goal.progressPercentage }}%</span>
                  </div>
                  <div class="progress" style="height: 10px;">
                    <div
                      class="progress-bar progress-bar-striped progress-bar-animated"
                      :class="getProgressBarClass(goal.pullType)"
                      role="progressbar"
                      :style="{ width: goal.progressPercentage + '%' }"
                      :aria-valuenow="goal.progressPercentage"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>

                <!-- Targets -->
                <div class="row g-2 text-center mt-auto">
                  <div class="col-6">
                    <div class="bg-light-blue rounded p-2 border">
                      <div class="text-muted goal_planner_small-text">Weekly Target</div>
                      <div class="h4 mb-0 fw-bold text-dark">
                        <template v-if="goal.isOverdue">
                          <span class="text-danger fs-6 fw-bold">Overdue</span>
                        </template>
                        <template v-else-if="goal.goalMet">
                          <span class="text-success fs-6 fw-bold">Done</span>
                        </template>
                        <template v-else>
                          {{ goal.weeklyTarget }} <span class="fs-6 fw-normal">wishes</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="bg-light-blue rounded p-2 border">
                      <div class="text-muted goal_planner_small-text">Daily Target</div>
                      <div class="h4 mb-0 fw-bold text-dark">
                        <template v-if="goal.isOverdue">
                          <span class="text-danger fs-6 fw-bold">Overdue</span>
                        </template>
                        <template v-else-if="goal.goalMet">
                          <span class="text-success fs-6 fw-bold">Done</span>
                        </template>
                        <template v-else>
                          {{ goal.dailyTarget }} <span class="fs-6 fw-normal">wishes</span>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
