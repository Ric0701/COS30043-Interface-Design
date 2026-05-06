import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        users: []
    }),
    actions: {
        registerUser(username, password) {
            const userExists = this.users.find(u => u.username === username)
            if (userExists) {
                return { success: false, message: 'Username already exists.' }
            }
            this.users.push({ username, password })
            return { success: true, message: 'Registration successful!' }
        },
        loginUser(username, password) {
            const user = this.users.find(u => u.username === username && u.password === password)
            if (user) {
                return { success: true, message: 'Login successful!' }
            }
            return { success: false, message: 'Invalid username or password.' }
        }
    }
})