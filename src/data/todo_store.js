import { defineStore } from "pinia";
import { useAuthStore } from "./auth_store.js";
import { supabase } from "../services/supabase.js";

export const useTodoStore = defineStore("todo", {
  state: () => ({
    todos: [],
  }),
  actions: {
    async loadData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) {
        this.todos = [];
        return;
      }
      try {
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .eq("username", authStore.currentUser)
          .order("position", { ascending: true });

        if (error) throw error;
        if (data) {
          this.todos = data;
        }
      } catch (error) {
        console.error("[Todo Store] Failed to load todos from Supabase:", error);
      }
    },
    async addTodo(item) {
      const authStore = useAuthStore();
      if (!authStore.currentUser) return;

      const newTodo = {
        id: Date.now(),
        username: authStore.currentUser,
        text: item.text,
        done: false,
        mora: Number(item.mora) || 0,
        items: item.items || [],
        priority: item.priority || "low",
        position: this.todos.length,
      };

      // Optimistic update
      this.todos.push(newTodo);

      try {
        const { error } = await supabase.from("todos").insert([newTodo]);
        if (error) throw error;
      } catch (error) {
        console.error("[Todo Store] Failed to add todo to Supabase:", error);
      }
    },
    async removeTodo(id) {
      // Optimistic update
      this.todos = this.todos.filter((task) => task.id !== id);

      try {
        const { error } = await supabase.from("todos").delete().eq("id", id);
        if (error) throw error;
      } catch (error) {
        console.error("[Todo Store] Failed to delete todo from Supabase:", error);
      }
    },
    async completeTodo(id) {
      const task = this.todos.find((t) => t.id === id);
      if (task) {
        // Toggle done status
        task.done = !task.done;

        try {
          const { error } = await supabase
            .from("todos")
            .update({ done: task.done })
            .eq("id", id);
          if (error) throw error;
        } catch (error) {
          console.error(
            "[Todo Store] Failed to update complete status in Supabase:",
            error,
          );
        }
      }
    },
    async reorderTodos(oldIndex, newIndex) {
      // Reorder locally
      const [movedItem] = this.todos.splice(oldIndex, 1);
      this.todos.splice(newIndex, 0, movedItem);

      // Save updated order values back to Supabase
      try {
        const updates = this.todos.map((todo, index) => {
          todo.position = index;
          return supabase
            .from("todos")
            .update({ position: index })
            .eq("id", todo.id);
        });
        await Promise.all(updates);
      } catch (error) {
        console.error(
          "[Todo Store] Failed to persist new todo order to Supabase:",
          error,
        );
      }
    },
  },
  getters: {
    summary(state) {
      let totalMora = 0;
      let itemSummary = {};

      state.todos.forEach((task) => {
        totalMora += Number(task.mora) || 0;

        if (Array.isArray(task.items)) {
          task.items.forEach((item) => {
            if (item && item.count > 0) {
              if (!itemSummary[item.name]) {
                itemSummary[item.name] = { label: item.label, count: 0 };
              }
              itemSummary[item.name].count += item.count;
            }
          });
        }
      });

      return {
        mora: totalMora,
        items: Object.values(itemSummary),
      };
    },
  },
});
