<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../data/auth_store.js'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleRegister = () => {
    if (!username.value || !password.value || !confirmPassword.value) {
        alert('Please fill in all fields.')
        return
    }

    if (password.value !== confirmPassword.value) {
        alert('Passwords do not match.')
        return
    }

    const result = authStore.registerUser(username.value, password.value)
    
    if (result.success) {
        alert(result.message)
        router.push('/login')
    } else {
        alert(result.message)
    }
}
</script>

<template>
    <div class="container-fluid mt-5 px-4 pb-5 d-flex justify-content-center">
        <div class="card custom-dark-card p-4 shadow" style="width: 100%; max-width: 400px;">
            <h2 class="fw-bold mb-4 text-dark text-center">Register</h2>
            
            <form @submit.prevent="handleRegister">
                <div class="mb-3">
                    <label class="text-dark small mb-1" for="reg-username">Username</label>
                    <input 
                        type="text" 
                        id="reg-username" 
                        class="form-control custom-input text-dark" 
                        v-model="username" 
                        placeholder="Choose a username" 
                        required
                    >
                </div>
                
                <div class="mb-3">
                    <label class="text-dark small mb-1" for="reg-password">Password</label>
                    <input 
                        type="password" 
                        id="reg-password" 
                        class="form-control custom-input text-dark" 
                        v-model="password" 
                        placeholder="Create a password" 
                        required
                    >
                </div>

                <div class="mb-4">
                    <label class="text-dark small mb-1" for="confirm-password">Confirm Password</label>
                    <input 
                        type="password" 
                        id="confirm-password" 
                        class="form-control custom-input text-dark" 
                        v-model="confirmPassword" 
                        placeholder="Confirm password" 
                        required
                    >
                </div>
                
                <button type="submit" class="btn btn-primary w-100 py-2 fw-bold mb-3">Register</button>
                
                <div class="text-center text-dark small">
                    Already have an account? 
                    <router-link to="/login" class="text-primary text-decoration-none fw-bold">Sign In here</router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
</style>