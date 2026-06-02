<script setup>
import { ref } from "vue";
import anime from "animejs";
import { useTodoStore } from "../data/todo_store.js";

const todoStore = useTodoStore();

// Drag and Drop State Management
const draggedIndex = ref(null);
const dragOverIndex = ref(null);

// Fired when the user begins dragging a task card
const onDragStart = (event, index) => {
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", index);

  event.target.classList.add("todo_list_dragging-active");
};

// Fired continuously as the dragged item hovers over another item
const onDragEnter = (event, index) => {
  event.preventDefault();
  if (draggedIndex.value !== index) {
    dragOverIndex.value = index;
  }
};

// Fired continuously while hovering over a drop zone
const onDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

// Fired when the dragged item is released over a valid drop target
const onDrop = (event, index) => {
  event.preventDefault();
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    todoStore.reorderTodos(draggedIndex.value, index);
  }
  cleanupDrag();
};

// Fired when the drag operation completes (whether successful or not)
const onDragEnd = (event) => {
  event.target.classList.remove("todo_list_dragging-active");
  cleanupDrag();
};

// Resets the dragging state variables
const cleanupDrag = () => {
  draggedIndex.value = null;
  dragOverIndex.value = null;
};

// ---- Anime.js Animation Hooks for <transition-group> ----

// @enter hook: Called when an element is added to the DOM
const onEnter = (el, done) => {
  // Set initial state for the entering element
  el.style.opacity = 0;
  el.style.transform = "scale(0.9) translateY(20px)";

  // Use Anime.js for an elastic pop-in animation
  anime({
    targets: el,
    opacity: 1,
    scale: 1,
    translateY: 0,
    duration: 400,
    easing: "easeOutElastic(1, .8)",
    complete: done,
  });
};

// @leave hook: Called when an element is removed from the DOM
const onLeave = (el, done) => {
  const { width, height } = el.getBoundingClientRect();
  el.style.position = "absolute";
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  el.style.zIndex = -1;

  // Slide out animation
  anime({
    targets: el,
    opacity: 0,
    scale: 0.9,
    translateX: 50,
    duration: 300,
    easing: "easeInQuad",
    complete: done,
  });
};
</script>

<template>
  <div
    class="container-fluid d-flex min-vh-100 flex-column justify-content-center pt-4 px-4 pb-5">
    <h1 class="fw-bold mb-4 text-black">Todo List</h1>

    <div class="row g-4">
      <!-- LEFT COLUMN: Summary -->
      <div class="col-12 col-lg-4">
        <div class="card custom-card p-4 sticky-top" style="top: 80px">
          <h4 class="fw-bold mb-4 text-black">Summary</h4>

          <div class="summary-box mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-black">Mora Needed</span>
              <span class="fw-bold text-black">{{
                todoStore.summary.mora.toLocaleString()
              }}</span>
            </div>
          </div>

          <div class="summary-box">
            <h6 class="mb-3 text-black fw-bold">Items Needed</h6>
            <ul class="list-group list-group-flush">
              <li
                v-for="(item, index) in todoStore.summary.items"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center px-0 text-black"
              >
                {{ item.label }}
                <span class="badge bg-primary rounded-pill text-white">{{
                  item.count
                }}</span>
              </li>
            </ul>
            <div
              v-if="todoStore.summary.items.length === 0"
              class="text-black small text-center mt-2"
            >
              No items required.
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Individual Tasks -->
      <div class="col-12 col-lg-8">
        <div
          v-if="todoStore.todos.length === 0"
          class="text-center text-black mt-5"
        >
          <h5 class="text-black">Your Todo List is empty.</h5>
          <p class="text-black">Go to the Calculator to add resources here.</p>
        </div>

        <transition-group
          name="list"
          move-class="todo_list_list-move"
          tag="div"
          class="todo-list-container position-relative"
          @enter="onEnter"
          @leave="onLeave"
        >
          <div
            class="card custom-card p-4 mb-4 todo-card"
            v-for="(task, index) in todoStore.todos"
            :key="task.id"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragenter="onDragEnter($event, index)"
            @dragover="onDragOver"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
            :class="{ 'todo_list_drag-over': dragOverIndex === index }"
          >
            <div
              class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-3"
            >
              <div class="d-flex align-items-center">
                <!-- Native drag handle -->
                <div
                  class="pe-3 todo_list_drag-handle"
                  style="cursor: grab"
                  title="Drag to reorder"
                >
                  <i class="bi bi-grip-vertical fs-4"></i>
                </div>
                <div>
                  <h4 class="fw-bold mb-0 text-black">{{ task.task_name }}</h4>
                  <span class="text-black small"
                    >Level {{ task.currentLevel }} →
                    {{ task.targetLevel }}</span
                  >
                </div>
              </div>
              <button
                class="btn btn-outline-danger btn-sm text-black"
                @click="todoStore.removeTodo(task.id)"
              >
                <i class="bi bi-x-lg"></i> Delete
              </button>
            </div>

            <ul class="list-group list-group-flush mb-0">
              <li
                class="list-group-item d-flex justify-content-between align-items-center px-0 text-black"
              >
                Mora
                <span class="fw-bold text-black">{{
                  task.mora.toLocaleString()
                }}</span>
              </li>
              <li
                v-for="(item, i) in task.items"
                :key="i"
                class="list-group-item d-flex justify-content-between align-items-center px-0 text-black"
              >
                {{ item.label }}
                <span class="badge bg-primary rounded-pill text-white">{{
                  item.count
                }}</span>
              </li>
            </ul>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>
