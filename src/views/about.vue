<script setup></script>

<template>
  <div class="container-fluid mt-4 px-4 pb-5">
    <h1 class="fw-bold display-4 mb-4 text-dark text-center">
      About the Project
    </h1>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <!-- Project Purpose -->
        <div class="card custom-dark-card p-4 mb-4">
          <h4 class="fw-bold mb-3 text-dark">
            <i class="bi bi-info-circle me-2"></i> Project Purpose
          </h4>
          <p class="text-dark mb-0">
            Genshin Companian is a comprehensive companion tool designed for
            Genshin Impact players. Its primary goal is to help you track your
            wish history, calculate character and weapon ascension materials,
            and manage your farming schedules efficiently—all without the need
            to rely on cumbersome external spreadsheets.
          </p>
        </div>

        <!-- Key Features Overview -->
        <div class="card custom-dark-card p-4 mb-4">
          <h4 class="fw-bold mb-3 text-dark">
            <i class="bi bi-star me-2"></i> Key Features
          </h4>
          <div class="row g-3">
            <div class="col-md-4">
              <div class="p-3 bg-light-blue rounded h-100">
                <h6 class="fw-bold text-dark">Calculators</h6>
                <p class="small text-dark mb-0">
                  Instantly calculate required EXP materials, Mora, and track
                  real-time Resin replenishment.
                </p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="p-3 bg-light-blue rounded h-100">
                <h6 class="fw-bold text-dark">Wish Counter</h6>
                <p class="small text-dark mb-0">
                  Keep track of your limited, weapon, and standard banner pity,
                  lifetime pulls, and roll history safely.
                </p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="p-3 bg-light-blue rounded h-100">
                <h6 class="fw-bold text-dark">Todo List</h6>
                <p class="small text-dark mb-0">
                  An integrated daily planner that automatically aggregates
                  required resources and Mora costs for your characters.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Architecture -->
        <div class="card custom-dark-card p-4 mb-4">
          <h4 class="fw-bold mb-3 text-dark">
            <i class="bi bi-code-slash me-2"></i> Technical Architecture
          </h4>
          <ul
            class="list-group list-group-flush mb-0"
            style="border-radius: 8px; overflow: hidden"
          >
            <li
              class="list-group-item bg-light-blue text-dark border-secondary py-3"
            >
              <strong>Frameworks:</strong> Built using Vue 3 for reactive UI
              rendering and Pinia for robust state management.
            </li>
            <li
              class="list-group-item bg-light-blue text-dark border-secondary py-3"
            >
              <strong>UI/UX:</strong> Utilizes Bootstrap 5 alongside custom CSS
              to create a responsive, component-based user interface.
            </li>
            <li
              class="list-group-item bg-light-blue text-dark border-secondary py-3"
            >
              <strong>Privacy First:</strong> Your pull history and to-do lists
              are processed and stored entirely locally. No personal data is
              sent to external servers.
            </li>
          </ul>
        </div>

        <!-- Development Context -->
        <div class="card custom-dark-card p-4 mb-4">
          <h4 class="fw-bold mb-3 text-dark">
            <i class="bi bi-mortarboard me-2"></i> Development Context
          </h4>
          <p class="text-dark mb-0">
            This application was developed as a core project for the
            <strong>COS30043 Interface Design and Development</strong> unit. The
            technical focus of this project was on designing an intuitive,
            user-centric dashboard and implementing efficient data-binding for
            game resource management.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
