import { defineStore } from "pinia";
import { useAuthStore } from "./auth_store.js";
import { supabase } from "../services/supabase.js";
import { sanitizeString } from "../services/sanitize.js";

export const useTodoStore = defineStore("todo", {
  state: () => ({
    todos: [],
    pendingWrites: [],
  }),
  actions: {
    async loadData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) {
        try {
          const cached = localStorage.getItem("todos");
          this.todos = cached ? JSON.parse(cached) : [];
        } catch (e) {
          console.error("[Todo Store] Failed to parse local cached todos:", e);
          this.todos = [];
        }
        return;
      }

      // Automatically migrate guest todos if any exist
      await this.migrateLocalTodos();

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
            mora: todo.mora || 0,
            items: todo.items || [],
            currentLevel: todo.current_level || 1,
            targetLevel: todo.target_level || 90,
          }));
        }
      } catch (error) {
        console.error("[Todo Store] Failed to load todos from Supabase:", error);
      }
    },
    async migrateLocalTodos() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) return;

      try {
        const cached = localStorage.getItem("todos");
        if (!cached) return;

        const localTodos = JSON.parse(cached);
        if (!Array.isArray(localTodos) || localTodos.length === 0) return;

        console.log(`[Todo Store] Migrating ${localTodos.length} local todos to Supabase...`);

        const rowsToInsert = localTodos.map(todo => ({
          id: todo.id || crypto.randomUUID(),
          task_name: todo.task_name,
          task_type: todo.task_type || "character",
          status: todo.status || (todo.done ? "completed" : "pending"),
          current_level: todo.currentLevel || 1,
          target_level: todo.targetLevel || 90,
          mora: todo.mora || 0,
          items: todo.items || [],
        }));

        const { error } = await supabase.from("todos").insert(rowsToInsert);
        if (error) throw error;

        // Clear local storage guest todos
        localStorage.removeItem("todos");
        console.log("[Todo Store] Local todos successfully migrated to Supabase.");
      } catch (error) {
        console.error("[Todo Store] Failed to migrate local todos to Supabase:", error);
      }
    },
    async addTodo(item) {
      const authStore = useAuthStore();

      let rawName = item.task_name || item.name || "Unknown";
      let nameIsMalicious = /<[^>]*>/g.test(rawName);
      let task_name = sanitizeString(rawName);

      if (nameIsMalicious) {
        authStore.showToast("Malicious HTML/Script payload detected and sanitized!", "warning");
      }

      const task_type = item.task_type || item.type || "character";
      const currentLevel = Number(item.currentLevel) || 1;
      const targetLevel = Number(item.targetLevel) || 90;

      // Unique signature for race-condition locking
      const key = `${task_name}_${task_type}_${currentLevel}_${targetLevel}`;
      
      // Check if duplicate addition is already in-flight
      if (this.pendingWrites.includes(key)) {
        console.warn("[Todo Store] Duplicate addition blocked for key:", key);
        return { success: false, reason: "duplicate" };
      }
      
      // Optimistic check against already existing active tasks
      const isAlreadyAdded = this.todos.some(
        (t) =>
          t.task_name === task_name &&
          t.task_type === task_type &&
          t.currentLevel === currentLevel &&
          t.targetLevel === targetLevel &&
          !t.done
      );
      if (isAlreadyAdded) {
        return { success: false, reason: "exists" };
      }

      this.pendingWrites.push(key);

      const newTodo = {
        id: crypto.randomUUID(),
        task_name,
        task_type,
        done: false,
        status: "pending",
        mora: Number(item.mora) || 0,
        items: item.items || [],
        currentLevel,
        targetLevel,
      };

      if (!authStore.currentUser) {
        // Guest mode
        this.todos.push(newTodo);
        localStorage.setItem("todos", JSON.stringify(this.todos));
        this.pendingWrites = this.pendingWrites.filter((k) => k !== key);
        return { success: true };
      }

      try {
        const { error } = await supabase.from("todos").insert([{
          id: newTodo.id,
          task_name: newTodo.task_name,
          task_type: newTodo.task_type,
          status: newTodo.status,
          current_level: newTodo.currentLevel,
          target_level: newTodo.targetLevel,
          mora: newTodo.mora,
          items: newTodo.items,
        }]);
        if (error) throw error;

        // Reactivity Fix: Update local state immediately after database write succeeds
        this.todos.push(newTodo);
        return { success: true };
      } catch (error) {
        console.error("[Todo Store] Failed to add todo to Supabase:", error);
        return { success: false, reason: error.message };
      } finally {
        this.pendingWrites = this.pendingWrites.filter((k) => k !== key);
      }
    },
    async removeTodo(id) {
      const authStore = useAuthStore();
      this.todos = this.todos.filter((task) => task.id !== id);

      if (!authStore.currentUser) {
        localStorage.setItem("todos", JSON.stringify(this.todos));
        return;
      }

      try {
        const { error } = await supabase.from("todos").delete().eq("id", id);
        if (error) throw error;
      } catch (error) {
        console.error("[Todo Store] Failed to delete todo from Supabase:", error);
      }
    },
    async completeTodo(id) {
      const authStore = useAuthStore();
      const task = this.todos.find((t) => t.id === id);
      if (task) {
        task.done = !task.done;
        task.status = task.done ? "completed" : "pending";

        if (!authStore.currentUser) {
          localStorage.setItem("todos", JSON.stringify(this.todos));
          return;
        }

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
      const authStore = useAuthStore();
      const [movedItem] = this.todos.splice(oldIndex, 1);
      this.todos.splice(newIndex, 0, movedItem);

      if (!authStore.currentUser) {
        localStorage.setItem("todos", JSON.stringify(this.todos));
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
