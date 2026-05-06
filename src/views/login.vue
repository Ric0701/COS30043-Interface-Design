<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../data/auth_store.js'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

const handleLogin = async () => {
    if (!username.value || !password.value) {
        alert('Please enter both username and password.')
        return
    }

    const result = await authStore.loginUser(username.value, password.value)
    
    if (result.success) {
        alert(result.message)
        router.push('/')
    } else {
        alert(result.message)
    }
}
</script>

<template>
    <div class="container-fluid mt-5 px-4 pb-5 d-flex justify-content-center">
        <div class="card custom-dark-card p-4 shadow" style="width: 100%; max-width: 400px;">
            <h2 class="fw-bold mb-4 text-dark text-center">Login</h2>
            
            <form @submit.prevent="handleLogin">
                <div class="mb-3">
                    <label class="text-dark small mb-1" for="username">Username</label>
                    <input 
                        type="text" 
                        id="username" 
                        class="form-control custom-input text-dark" 
                        v-model="username" 
                        placeholder="Enter username" 
                        required
                    >
                </div>
                
                <div class="mb-4">
                    <label class="text-dark small mb-1" for="password">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        class="form-control custom-input text-dark" 
                        v-model="password" 
                        placeholder="Enter password" 
                        required
                    >
                </div>
                
                <button type="submit" class="btn btn-primary w-100 py-2 fw-bold mb-3">Sign In</button>
                
                <div class="text-center text-dark small">
                    Don't have an account? 
                    <router-link to="/registration" class="text-primary text-decoration-none fw-bold">Register here</router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
</style>