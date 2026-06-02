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
          .select("*");

        if (error) throw error;
        if (data) {
          this.todos = data.map(todo => ({
            id: todo.id,
            task_name: todo.task_name,
            task_type: todo.task_type || "character",
            done: todo.status === "completed" || todo.status === "done",
            status: todo.status || "pending",
            mora: 0,
            items: [],
            currentLevel: 1,
            targetLevel: 90,
          }));
        }
      } catch (error) {
        console.error("[Todo Store] Failed to load todos from Supabase:", error);
      }
    },
    async addTodo(item) {
      const authStore = useAuthStore();
      if (!authStore.currentUser) return;

      const newTodo = {
        id: crypto.randomUUID(),
        task_name: item.task_name || "Unknown",
        task_type: item.type || "character",
        done: false,
        status: "pending",
        mora: Number(item.mora) || 0,
        items: item.items || [],
        currentLevel: item.currentLevel || 1,
        targetLevel: item.targetLevel || 90,
      };

      // Optimistic update
      this.todos.push(newTodo);

      try {
        const { error } = await supabase.from("todos").insert([{
          id: newTodo.id,
          task_name: newTodo.task_name,
          task_type: newTodo.task_type,
          status: newTodo.status,
        }]);
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
        task.done = !task.done;
        task.status = task.done ? "completed" : "pending";

        try {
          const { error } = await supabase
            .from("todos")
            .update({ status: task.status })
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
      // Reorder locally since 'position' column does not exist in Supabase
      const [movedItem] = this.todos.splice(oldIndex, 1);
      this.todos.splice(newIndex, 0, movedItem);
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
