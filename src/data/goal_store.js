import { defineStore } from "pinia";
import { useAuthStore } from "./auth_store.js";
import { useGachaStore } from "../gacha_store.js";

export const useGoalStore = defineStore("goal", {
  state: () => ({
    goals: [],
  }),
  actions: {
    /**
     * Loads goals from localStorage for the current authenticated user.
     * Clears goals if no user is logged in.
     */
    loadData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) {
        this.goals = [];
        return;
      }
      const data = localStorage.getItem(`goals_${authStore.currentUser}`);
      this.goals = data ? JSON.parse(data) : [];
    },

    /**
     * Saves the current goals to localStorage for the active user.
     */
    saveData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) return;
      localStorage.setItem(
        `goals_${authStore.currentUser}`,
        JSON.stringify(this.goals),
      );
    },

    /**
     * Adds a new goal with the specified fields, assigns a unique ID, and persists the change.
     */
    addGoal({ goalName, targetWeek, pullType, neededWishes }) {
      this.goals.push({
        id: Date.now(),
        goalName,
        targetWeek,
        pullType,
        neededWishes: Number(neededWishes) || 0,
      });
      this.saveData();
    },

    /**
     * Deletes a goal by ID and persists the change.
     */
    removeGoal(id) {
      this.goals = this.goals.filter((goal) => goal.id !== id);
      this.saveData();
    },
    updateGoal(id, patch) {
      // Merge patch fields into the matching goal record
      const goal = this.goals.find((g) => g.id === id);
      if (goal) {
        Object.assign(goal, patch);
        this.saveData();
      }
    },
  },
  getters: {
    /**
     * Maps a pullType to the corresponding current pity level in the gacha store.
     * Integrates existing Wish Counter and manual force edits reactively.
     */
    getPityForPullType: () => {
      const gachaStore = useGachaStore();
      return (pullType) => {
        if (pullType === "limited_character") {
          return gachaStore.limited_character_five_star_pity;
        } else if (pullType === "limited_weapon") {
          return gachaStore.limited_weapon_five_star_pity;
        } else if (pullType === "standard") {
          return gachaStore.standard_five_star_pity;
        }
        return 0;
      };
    },
  },
});
