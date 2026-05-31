<script setup>
    import { ref } from 'vue'
    import anime from 'animejs'
    import { useTodoStore } from '../data/todo_store.js'
    
    const todoStore = useTodoStore()

    // ---- Drag and Drop State Management ----
    // We track the index of the item currently being dragged, and the index 
    // of the item we are dragging over, to provide reactive visual feedback.
    const draggedIndex = ref(null)
    const dragOverIndex = ref(null)

    // Fired when the user begins dragging a task card
    const onDragStart = (event, index) => {
        draggedIndex.value = index
        // Use HTML5 dataTransfer to enable dragging natively and set move effect
        event.dataTransfer.effectAllowed = 'move'
        // Required for Firefox compatibility: set data on drag start
        event.dataTransfer.setData('text/plain', index)
        
        // Add a class directly to the dragging node for a lowered opacity effect
        event.target.classList.add('dragging-active')
    }

    // Fired continuously as the dragged item hovers over another item
    const onDragEnter = (event, index) => {
        event.preventDefault() // Necessary to allow dropping
        // Update the reactive dragOverIndex only if hovering over a different element
        if (draggedIndex.value !== index) {
            dragOverIndex.value = index
        }
    }

    // Fired continuously while hovering over a drop zone
    const onDragOver = (event) => {
        // Prevent default browser behavior (which is to not allow dropping)
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }

    // Fired when the dragged item is released over a valid drop target
    const onDrop = (event, index) => {
        event.preventDefault()
        // If we dragged an item and dropped it on a different index, reorder in the store
        if (draggedIndex.value !== null && draggedIndex.value !== index) {
            todoStore.reorderTodos(draggedIndex.value, index)
        }
        cleanupDrag()
    }

    // Fired when the drag operation completes (whether successful or not)
    const onDragEnd = (event) => {
        event.target.classList.remove('dragging-active')
        cleanupDrag()
    }

    // Resets the dragging state variables
    const cleanupDrag = () => {
        draggedIndex.value = null
        dragOverIndex.value = null
    }

    // ---- Anime.js Animation Hooks for <transition-group> ----
    
    // @enter hook: Called when an element is added to the DOM
    const onEnter = (el, done) => {
        // Set initial state for the entering element
        el.style.opacity = 0
        el.style.transform = 'scale(0.9) translateY(20px)'
        
        // Use Anime.js for an elastic pop-in animation
        anime({
            targets: el,
            opacity: 1,
            scale: 1,
            translateY: 0,
            duration: 400,
            easing: 'easeOutElastic(1, .8)',
            complete: done // Tell Vue the transition is finished
        })
    }

    // @leave hook: Called when an element is removed from the DOM
    const onLeave = (el, done) => {
        // To allow the FLIP animation (.list-move) to work smoothly on remaining items,
        // we must pull the leaving element out of the document flow using position: absolute.
        const { width, height } = el.getBoundingClientRect()
        el.style.position = 'absolute'
        el.style.width = `${width}px`
        el.style.height = `${height}px`
        el.style.zIndex = -1

        // Slide out animation
        anime({
            targets: el,
            opacity: 0,
            scale: 0.9,
            translateX: 50,
            duration: 300,
            easing: 'easeInQuad',
            complete: done
        })
    }
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

                <!-- 
                  Vue <transition-group> allows us to animate list insertions, removals, and reordering.
                  We use the tag="div" to render it as a standard container.
                  The JS hooks (@enter, @leave) wire up Anime.js to the lifecycle events.
                -->
                <transition-group 
                    name="list" 
                    tag="div" 
                    class="todo-list-container position-relative"
                    @enter="onEnter"
                    @leave="onLeave">
                    
                    <div class="card custom-card p-4 mb-4 todo-card" 
                         v-for="(task, index) in todoStore.todos" 
                         :key="task.id"
                         draggable="true"
                         @dragstart="onDragStart($event, index)"
                         @dragenter="onDragEnter($event, index)"
                         @dragover="onDragOver"
                         @drop="onDrop($event, index)"
                         @dragend="onDragEnd"
                         :class="{ 'drag-over': dragOverIndex === index }">
                        
                        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-3">
                            <div class="d-flex align-items-center">
                                <!-- Native drag handle -->
                                <div class="pe-3 drag-handle" style="cursor: grab;" title="Drag to reorder">
                                    <i class="bi bi-grip-vertical fs-4"></i>
                                </div>
                                <div>
                                    <h4 class="fw-bold mb-0 text-black">{{ task.name }}</h4>
                                    <span class="text-black small">Level {{ task.currentLevel }} → {{ task.targetLevel }}</span>
                                </div>
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
                </transition-group>
            </div>

        </div>
    </div>
</template>

<style scoped>
/**
 * FLIP Animation Utility
 * Vue's <transition-group> automatically applies the '-move' class to elements
 * when their position in the layout changes. We use it here to animate the transform,
 * making reordering look smooth instead of instantaneously snapping.
 */
.list-move {
    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

/**
 * Visual feedback applied directly to the item currently being dragged.
 * It lowers opacity to indicate it's lifted off the page.
 */
.dragging-active {
    opacity: 0.3 !important;
    transform: scale(0.98);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
}

/**
 * Reactive drop zone indicator.
 * Slightly pushes the hovered element down to show where the dragged element will drop.
 */
.drag-over {
    border-top: 3px solid #0d6efd !important;
    transform: translateY(4px);
    transition: transform 0.2s ease, border 0.2s ease;
}

/* Enhances user experience by clearly indicating draggable areas */
.drag-handle {
    cursor: grab;
    color: #6c757d;
}
.drag-handle:active {
    cursor: grabbing;
}
</style>