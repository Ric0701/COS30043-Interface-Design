import { defineStore } from 'pinia'

export const useTodoStore = defineStore('todo', {
    state: () => ({
        todos: []
    }),
    actions: {
        addTodo(item) {
            // Assign a simple unique ID based on the current timestamp
            this.todos.push({
                id: Date.now(),
                ...item
            })
        },
        removeTodo(id) {
            // Filter out the task that matches the ID
            this.todos = this.todos.filter(task => task.id !== id)
        }
    },
    getters: {
        summary(state) {
            // Calculate the total Mora and combine identical items across all tasks
            let totalMora = 0
            let itemSummary = {}

            state.todos.forEach(task => {
                totalMora += task.mora
                
                task.items.forEach(item => {
                    if (item.count > 0) {
                        // If item doesn't exist in summary yet, add it
                        if (!itemSummary[item.name]) {
                            itemSummary[item.name] = { label: item.label, count: 0 }
                        }
                        // Add the count to the total
                        itemSummary[item.name].count += item.count
                    }
                })
            })

            return {
                mora: totalMora,
                items: Object.values(itemSummary) // Convert object back to an array for easy looping
            }
        }
    }
});