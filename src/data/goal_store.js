import { defineStore } from "pinia";
import { useAuthStore } from "./auth_store.js";
import { useGachaStore } from "../gacha_store.js";
import { supabase } from "../services/supabase.js";

export const useGoalStore = defineStore("goal", {
  state: () => ({
    goals: [],
  }),
  actions: {
    async loadData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) {
        this.goals = [];
        return;
      }
      try {
        const { data, error } = await supabase
          .from("goals")
          .select("*");

        if (error) throw error;
        if (data) {
          this.goals = data.map((g) => ({
            id: g.id,
            goalName: g.goal_name,
            targetWeek: g.target_week,
            pullType: g.pull_type,
            neededWishes: Number(g.needed_wishes) || 0,
          }));
        }
      } catch (error) {
        console.error("[Goal Store] Failed to load goals from Supabase:", error);
      }
    },
    async addGoal({ goalName, targetWeek, pullType, neededWishes }) {
      const authStore = useAuthStore();
      if (!authStore.currentUser) return;

      const newGoal = {
        id: crypto.randomUUID(),
        goalName,
        targetWeek,
        pullType,
        neededWishes: Number(neededWishes) || 0,
      };

      // Optimistic update
      this.goals.push(newGoal);

      try {
        const { error } = await supabase.from("goals").insert([{
          id: newGoal.id,
          goal_name: newGoal.goalName,
          target_week: newGoal.targetWeek,
          pull_type: newGoal.pullType,
          needed_wishes: newGoal.neededWishes,
        }]);
        if (error) throw error;
      } catch (error) {
        console.error("[Goal Store] Failed to add goal to Supabase:", error);
      }
    },
    async removeGoal(id) {
      // Optimistic update
      this.goals = this.goals.filter((goal) => goal.id !== id);

      try {
        const { error } = await supabase.from("goals").delete().eq("id", id);
        if (error) throw error;
      } catch (error) {
        console.error("[Goal Store] Failed to delete goal from Supabase:", error);
      }
    },
    async updateGoal(id, patch) {
      const goal = this.goals.find((g) => g.id === id);
      if (goal) {
        // Optimistic update
        Object.assign(goal, patch);

        const dbPatch = {};
        if (patch.goalName !== undefined) dbPatch.goal_name = patch.goalName;
        if (patch.targetWeek !== undefined) dbPatch.target_week = patch.targetWeek;
        if (patch.pullType !== undefined) dbPatch.pull_type = patch.pullType;
        if (patch.neededWishes !== undefined) dbPatch.needed_wishes = Number(patch.neededWishes) || 0;

        try {
          const { error } = await supabase
            .from("goals")
            .update(dbPatch)
            .eq("id", id);
          if (error) throw error;
        } catch (error) {
          console.error("[Goal Store] Failed to update goal in Supabase:", error);
        }
      }
    },
  },
  getters: {
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
