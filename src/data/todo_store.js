import { defineStore } from "pinia";
import { useAuthStore } from "./auth_store";

export const useTodoStore = defineStore("todo", {
  state: () => ({
    todos: [],
  }),
  actions: {
    loadData() {
      const authStore = useAuthStore();
      if (!authStore.currentUser) {
        this.todos = [];
        return;
      }
      const data = localStorage.getItem(`todos_${authStore.currentUser}`);
      this.todos = data ? JSON.parse(data) : [];
    },
    saveData() {
      const authStore = useAuthStore();
      if (authStore.currentUser) {
        localStorage.setItem(
          `todos_${authStore.currentUser}`,
          JSON.stringify(this.todos),
        );
      }
    },
    addTodo(item) {
      // Assign a simple unique ID based on the current timestamp
      this.todos.push({
        id: Date.now(),
        ...item,
      });
      this.saveData();
    },
    removeTodo(id) {
      // Filter out the task that matches the ID
      this.todos = this.todos.filter((task) => task.id !== id);
      this.saveData();
    },
    /**
     * Reorders the task array using splicing.
     * Extracts the dragged item and inserts it at the target drop index.
     * @param {number} oldIndex - The original position of the task
     * @param {number} newIndex - The new position it was dropped at
     */
    reorderTodos(oldIndex, newIndex) {
      const [movedItem] = this.todos.splice(oldIndex, 1);
      this.todos.splice(newIndex, 0, movedItem);
      this.saveData(); // Instantly persist the new queue order to localStorage
    },
  },
  getters: {
    summary(state) {
      // Calculate the total Mora and combine identical items across all tasks
      let totalMora = 0;
      let itemSummary = {};

      state.todos.forEach((task) => {
        totalMora += task.mora;

        task.items.forEach((item) => {
          if (item.count > 0) {
            // If item doesn't exist in summary yet, add it
            if (!itemSummary[item.name]) {
              itemSummary[item.name] = { label: item.label, count: 0 };
            }
            // Add the count to the total
            itemSummary[item.name].count += item.count;
          }
        });
      });

      return {
        mora: totalMora,
        items: Object.values(itemSummary), // Convert object back to an array for easy looping
      };
    },
  },
});
