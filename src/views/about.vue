<script setup></script>

<template>
  <div class="container-fluid mt-5 px-4 pb-5">
    <!-- Hero Header -->
    <div class="row justify-content-center mb-5">
      <div class="col-12 col-md-10 col-lg-8 text-center">
        <h1 class="fw-bold display-3 mb-2 about_gradient-text">
          Genshin Companion
        </h1>
        <p class="fs-5 text-dark-50 mb-0">
          The premium assistant for Teyvat travelers. Sync, calculate, plan, and chat with AI.
        </p>
      </div>
    </div>

    <!-- Project Purpose -->
    <div class="row justify-content-center mb-5">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="card about_glass-card p-4">
          <div class="d-flex align-items-center mb-3">
            <div class="about_icon-wrapper me-3 mb-0">
              <i class="bi bi-info-circle"></i>
            </div>
            <h4 class="fw-bold mb-0 text-dark">Project Purpose</h4>
          </div>
          <p class="text-dark mb-0 leading-relaxed">
            Genshin Companion is a comprehensive companion tool designed for Genshin Impact players.
            Its primary goal is to help you track your wish history, calculate character and weapon
            ascension materials, and manage your farming schedules efficiently. By eliminating the
            need for complex external spreadsheets, it streamlines your daily routine into a single,
            fluid web dashboard.
          </p>
        </div>
      </div>
    </div>

    <!-- Key Features Overview -->
    <div class="row justify-content-center mb-5">
      <div class="col-12 col-md-10 col-lg-10">
        <div class="text-center mb-4">
          <h2 class="fw-bold text-dark">Key Features</h2>
          <p class="text-dark-50">Explore the powerful toolsets built to enhance your gameplay</p>
        </div>

        <div class="row g-4 justify-content-center">
          <!-- Calculators -->
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card about_glass-card p-4 h-100">
              <div class="about_icon-wrapper">
                <i class="bi bi-calculator"></i>
              </div>
              <h5 class="fw-bold text-dark mb-2">Resource Calculators</h5>
              <p class="small text-dark mb-0">
                Instantly calculate required EXP materials, Mora, and track real-time Resin replenishment.
                Upgraded with smart AI-assisted auto-population to make planning your next farm run effortless.
              </p>
            </div>
          </div>

          <!-- Wish Counter -->
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card about_glass-card p-4 h-100">
              <div class="about_icon-wrapper">
                <i class="bi bi-stars"></i>
              </div>
              <h5 class="fw-bold text-dark mb-2">Wish Counter</h5>
              <p class="small text-dark mb-0">
                Track your limited, weapon, and standard banner pity count, lifetime pulls, and roll history.
                All pull history is synced securely to the cloud via Supabase for persistent cross-device access.
              </p>
            </div>
          </div>

          <!-- Todo List -->
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card about_glass-card p-4 h-100">
              <div class="about_icon-wrapper">
                <i class="bi bi-list-check"></i>
              </div>
              <h5 class="fw-bold text-dark mb-2">Smart Todo List</h5>
              <p class="small text-dark mb-0">
                An integrated daily planner with drag-and-drop task prioritization and scheduling.
                Todo items are cloud-synced instantly to your account profile using Supabase's real-time backend.
              </p>
            </div>
          </div>

          <!-- Goal Planner -->
          <div class="col-12 col-md-6 col-lg-6">
            <div class="card about_glass-card p-4 h-100">
              <div class="about_icon-wrapper">
                <i class="bi bi-journal-check"></i>
              </div>
              <h5 class="fw-bold text-dark mb-2">Goal Planner</h5>
              <p class="small text-dark mb-0">
                Plan character level-ups and weapon ascension targets. Set custom milestones, track required materials,
                and monitor your progression. Goals sync directly to your profile across all your devices in real-time.
              </p>
            </div>
          </div>

          <!-- Smart AI Companion -->
          <div class="col-12 col-md-6 col-lg-6">
            <div class="card about_glass-card p-4 h-100">
              <div class="about_icon-wrapper">
                <i class="bi bi-robot"></i>
              </div>
              <h5 class="fw-bold text-dark mb-2">Smart AI Companion</h5>
              <p class="small text-dark mb-0">
                Your agentic companion powered by fallback-resilient LLM engines. The AI can dynamically auto-fill
                calculator forms, trigger router navigation based on natural text commands, and acts as an interactive
                wiki for deep Genshin Impact lore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Technical Architecture -->
    <div class="row justify-content-center mb-5">
      <div class="col-12 col-md-10 col-lg-10">
        <div class="text-center mb-4">
          <h2 class="fw-bold text-dark">Technical Architecture</h2>
          <p class="text-dark-50">A look under the hood at our modern cloud-native stack</p>
        </div>

        <div class="row g-4">
          <!-- Vue 3 & Pinia -->
          <div class="col-12 col-md-6 col-lg-3">
            <div class="card about_glass-card p-4 h-100 border-0">
              <div class="mb-3">
                <span class="about_tech-badge">Frontend Core</span>
              </div>
              <h6 class="fw-bold text-dark">Vue 3 & Pinia</h6>
              <p class="small text-dark mb-0">
                Leverages Vue 3's reactive Composition API for rendering user-centric dashboard UI, and Pinia stores for global, client-side state management.
              </p>
            </div>
          </div>

          <!-- Supabase Backend -->
          <div class="col-12 col-md-6 col-lg-3">
            <div class="card about_glass-card p-4 h-100 border-0">
              <div class="mb-3">
                <span class="about_tech-badge">Cloud Database</span>
              </div>
              <h6 class="fw-bold text-dark">Supabase Cloud Sync</h6>
              <p class="small text-dark mb-0">
                Replaces local storage with a secure Supabase PostgreSQL database, ensuring real-time cloud synchronization of wishes, goals, and todo items.
              </p>
            </div>
          </div>

          <!-- Agentic AI Assistant -->
          <div class="col-12 col-md-6 col-lg-3">
            <div class="card about_glass-card p-4 h-100 border-0">
              <div class="mb-3">
                <span class="about_tech-badge">AI Assistant</span>
              </div>
              <h6 class="fw-bold text-dark">Agentic LLM Engine</h6>
              <p class="small text-dark mb-0">
                Features automated provider failover for high availability. Supports function calling, router navigation, and character lore generation.
              </p>
            </div>
          </div>

          <!-- Lenis Scrolling -->
          <div class="col-12 col-md-6 col-lg-3">
            <div class="card about_glass-card p-4 h-100 border-0">
              <div class="mb-3">
                <span class="about_tech-badge">User Experience</span>
              </div>
              <h6 class="fw-bold text-dark">Lenis Smooth Physics</h6>
              <p class="small text-dark mb-0">
                Integrated Lenis scrolling controls body viewport updates, yielding fluid smooth-scrolling animations and premium kinetic scrolling physics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Development Context -->
    <div class="row justify-content-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="card about_glass-card p-4 text-center">
          <div class="d-flex justify-content-center align-items-center mb-3">
            <div class="about_icon-wrapper mb-0 me-3">
              <i class="bi bi-mortarboard"></i>
            </div>
            <h5 class="fw-bold mb-0 text-dark">Development Context</h5>
          </div>
          <p class="text-dark small mb-0">
            This application was developed as a core project for the
            <strong>COS30043 Interface Design and Development</strong> unit. The
            technical focus was on designing an intuitive, user-centric dashboard and
            implementing efficient data-binding for game resource management.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
