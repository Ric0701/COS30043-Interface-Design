<script setup>
    import { useTodoStore } from '../data/todo_store.js'
    const todoStore = useTodoStore()
</script>

<template>
    <div class="container-fluid d-flex min-vh-100 flex-column justify-content-center pt-4 px-4 pb-5">
        <h1 class="fw-bold mb-4 text-black">Todo List</h1>
        
        <div class="row g-4">
            
            <!-- LEFT COLUMN: Summary -->
            <div class="col-12 col-lg-4">
                <div class="card custom-card p-4 sticky-top" style="top: 80px;">
                    <h4 class="fw-bold mb-4 text-black">Summary</h4>
                    
                    <div class="summary-box mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-black">Mora Needed</span>
                            <span class="fw-bold text-black">{{ todoStore.summary.mora.toLocaleString() }}</span>
                        </div>
                    </div>

                    <div class="summary-box">
                        <h6 class="mb-3 text-black fw-bold">Items Needed</h6>
                        <ul class="list-group list-group-flush">
                            <li v-for="(item, index) in todoStore.summary.items" :key="index" class="list-group-item d-flex justify-content-between align-items-center px-0 text-black">
                                {{ item.label }}
                                <span class="badge bg-primary rounded-pill text-white">{{ item.count }}</span>
                            </li>
                        </ul>
                        <div v-if="todoStore.summary.items.length === 0" class="text-black small text-center mt-2">
                            No items required.
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Individual Tasks -->
            <div class="col-12 col-lg-8">
                <div v-if="todoStore.todos.length === 0" class="text-center text-black mt-5">
                    <h5 class="text-black">Your Todo List is empty.</h5>
                    <p class="text-black">Go to the Calculator to add resources here.</p>
                </div>

                <div class="card custom-card p-4 mb-4" v-for="(task, index) in todoStore.todos" :key="task.id">
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-3">
                        <div>
                            <h4 class="fw-bold mb-0 text-black">{{ task.name }}</h4>
                            <span class="text-black small">Level {{ task.currentLevel }} → {{ task.targetLevel }}</span>
                        </div>
                        <button class="btn btn-outline-danger btn-sm text-black" @click="todoStore.removeTodo(task.id)">
                            <i class="bi bi-x-lg"></i> Delete
                        </button>
                    </div>

                    <ul class="list-group list-group-flush mb-0">
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0 text-black">
                            Mora
                            <span class="fw-bold text-black">{{ task.mora.toLocaleString() }}</span>
                        </li>
                        <li v-for="(item, i) in task.items" :key="i" class="list-group-item d-flex justify-content-between align-items-center px-0 text-black">
                            {{ item.label }}
                            <span class="badge bg-primary rounded-pill text-white">{{ item.count }}</span>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    </div>
</template>