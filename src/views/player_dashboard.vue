<style scoped>
    
</style>

<template>
    <div class="container-fluid mt-4 px-4">

        <div class="row g-4">
            <div class="col-12 col-md-6 col-lg-3"> <!-- Make it compatible with multiple screens -->
                <div class="card custom-dark-card mb-4">
                    <div class="card-body">
                        <h5 class="card-title fw-bold">Welcome to Genshin</h5>
                        <p class="card-text text-muted">Your Genshin companion for pull tracking, farming planning, ascension calculations, and progress management with todo lists and wish counters.</p>
                    </div>
                </div>

                <div class="card custom-dark-card mb-4">
                    <div class="card-body">
                        <p class="card-text text-muted">Calculate character and weapon ascension materials and talent books.</p>
                        <router-link to="/calculator" class="btn btn-outline-dark btn-sm mt-2">
                            <i class="bi bi-calculator"></i> Calculator
                        </router-link>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card custom-dark-card mb-4">
                    <div class="card-body">
                        <p class="card-text text-muted">Import your wish history to keep it for more than 6 months!</p>
                        <router-link to="/wish-counter" class="btn btn-outline-dark btn-sm mt-2">
                            <i class="bi bi-plus-circle"></i> Wish Counter
                        </router-link>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card custom-dark-card mb-4">
                    <div class="card-body text-center">
                        <h5 class="card-title">Current Banners</h5>
                        <p class="text-muted">Banner</p>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>