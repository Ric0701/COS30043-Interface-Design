import { defineStore } from 'pinia'
import { useTodoStore } from './todo_store.js'
import { useGachaStore } from '../gacha_store.js'

async function hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        users: JSON.parse(localStorage.getItem('genshin_users')) || [],
        currentUser: localStorage.getItem('genshin_current_user') || null
    }),
    actions: {
        async registerUser(username, password) {
            const userExists = this.users.find(u => u.username === username)
            
            if (userExists) {
                return { success: false, message: 'Username already exists.' }
            }

            const hashedPassword = await hashPassword(password)

            this.users.push({ username, password: hashedPassword })
            
            localStorage.setItem('genshin_users', JSON.stringify(this.users))

            return { success: true, message: 'Registration successful!' }
        },
        async loginUser(username, password) {
            const hashedPassword = await hashPassword(password)
            const user = this.users.find(u => u.username === username && u.password === hashedPassword)
           
            if (user) {
                this.currentUser = username
                localStorage.setItem('genshin_current_user', username)

                useTodoStore().loadData()
                useGachaStore().loadData()

                return { success: true, message: 'Login successful!' }
            }
            return { success: false, message: 'Invalid username or password.' }
        },
        logout() {
            this.currentUser = null
            localStorage.removeItem('genshin_current_user')

            useTodoStore().loadData()
            useGachaStore().loadData()
        }
    }
})