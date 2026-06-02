<script setup>
import { ref, computed } from "vue";
import { useGachaStore } from "../gacha_store.js";
import { useAuthStore } from "../data/auth_store.js";

const gachaStore = useGachaStore();
const authStore = useAuthStore();

// Demo data load trigger
const handleSimulateDemo = () => {
  gachaStore.loadDemoData();
  alert("Simulated real-world Genshin wish history loaded successfully!");
};

// Clear trigger
const handleClearData = () => {
  if (confirm("Are you sure you want to clear your current wish history?")) {
    gachaStore.resetData();
    gachaStore.saveData();
  }
};

// --- Spending Category computations ---
const categories = computed(() => gachaStore.spendingCategories);
const grandTotalPrimogems = computed(() => {
  return categories.value.reduce((sum, c) => sum + c.amount, 0);
});
const totalPulls = computed(() => {
  return gachaStore.limited_character_lifetime_pulls.length +
         gachaStore.limited_weapon_lifetime_pulls.length +
         gachaStore.standard_lifetime_pulls.length;
});

// --- Average Pity computations ---
const averagePity = computed(() => {
  const fiveStars = gachaStore.costPerFiveStar;
  if (fiveStars.length === 0) return 0;
  const totalPity = fiveStars.reduce((sum, f) => sum + f.pity, 0);
  return parseFloat((totalPity / fiveStars.length).toFixed(1));
});

// --- Monthly spending computations ---
const trendData = computed(() => gachaStore.monthlySpendingTrend);
const maxTrendAmount = computed(() => {
  const amounts = trendData.value.map(d => d.amount);
  return Math.max(...amounts, 16000); // minimum limit for nice scaling
});

// Cartesian coordinates for Monthly Trend Line Chart
const chartWidth = 600;
const chartHeight = 280;
const paddingLeft = 70;
const paddingRight = 30;
const paddingTop = 30;
const paddingBottom = 45;

const plotWidth = chartWidth - paddingLeft - paddingRight;
const plotHeight = chartHeight - paddingTop - paddingBottom;

const monthlyChartPoints = computed(() => {
  const data = trendData.value;
  if (data.length === 0) return [];
  const max = maxTrendAmount.value;

  return data.map((d, index) => {
    const x = paddingLeft + (index * plotWidth / (data.length - 1 || 1));
    const y = (chartHeight - paddingBottom) - (d.amount * plotHeight / max);
    return { x, y, month: d.month, amount: d.amount };
  });
});

const linePathData = computed(() => {
  const pts = monthlyChartPoints.value;
  if (pts.length === 0) return "";
  if (pts.length === 1) {
    return `M ${pts[0].x - 10} ${pts[0].y} L ${pts[0].x + 10} ${pts[0].y}`;
  }
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
});

const areaPathData = computed(() => {
  const pts = monthlyChartPoints.value;
  if (pts.length === 0) return "";
  const bottomY = chartHeight - paddingBottom;
  if (pts.length === 1) {
    return `M ${pts[0].x - 10} ${bottomY} L ${pts[0].x - 10} ${pts[0].y} L ${pts[0].x + 10} ${pts[0].y} L ${pts[0].x + 10} ${bottomY} Z`;
  }
  const pointsStr = pts.map(p => `L ${p.x} ${p.y}`).join(" ");
  return `M ${pts[0].x} ${bottomY} ${pointsStr} L ${pts[pts.length - 1].x} ${bottomY} Z`;
});

// Interactive tooltip state
const activeTooltipIndex = ref(null);

// --- Category Donut SVG parameters ---
const donutRadius = 60;
const donutCircumference = 2 * Math.PI * donutRadius;

const donutSegments = computed(() => {
  const cats = categories.value;
  let accumulatedPercent = 0;
  
  // Custom colors for banners
  const colors = ["#ff9800", "#af7bf0", "#00bcff"];
  
  return cats.map((c, index) => {
    const dasharray = `${(c.percentage / 100) * donutCircumference} ${donutCircumference}`;
    const dashoffset = `${-(accumulatedPercent / 100) * donutCircumference}`;
    accumulatedPercent += c.percentage;
    return {
      category: c.category,
      amount: c.amount,
      percentage: c.percentage,
      color: colors[index],
      dasharray,
      dashoffset
    };
  });
});
</script>

<template>
  <div class="container-fluid d-flex min-vh-100 flex-column justify-content-start pt-4 px-4 pb-5 wish_analytics_container">
    
    <!-- Title & Controls Header -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 mt-4">
      <div>
        <h1 class="fw-bold display-5 text-dark mb-1">Wish History Analytics</h1>
        <p class="text-muted mb-0">Visualize Primogem spending distributions and 5-star pity cost intervals.</p>
      </div>
      <div class="d-flex gap-2 mt-3 mt-md-0">
        <button class="btn btn-primary fw-semibold px-3" @click="handleSimulateDemo">
          <i class="bi bi-play-circle-fill me-2"></i>Simulate Demo Data
        </button>
        <button 
          v-if="totalPulls > 0" 
          class="btn btn-outline-danger fw-semibold px-3" 
          @click="handleClearData"
        >
          <i class="bi bi-trash3-fill me-2"></i>Clear Data
        </button>
      </div>
    </div>

    <!-- User Warning if Not Logged In -->
    <div v-if="!authStore.currentUser" class="alert alert-warning border-warning shadow-sm mb-4" role="alert">
      <h5 class="alert-heading fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Guest Mode</h5>
      <p class="mb-0">
        You are in guest mode. Please <RouterLink to="/login" class="fw-bold text-dark text-decoration-underline">log in</RouterLink> to persist and manage wish data.
      </p>
    </div>

    <!-- ZERO STATE VIEW -->
    <div v-if="totalPulls === 0" class="card custom-card p-5 text-center shadow-sm wish_analytics_empty-card">
      <i class="bi bi-bar-chart-line text-muted display-2 mb-3"></i>
      <h3 class="fw-bold text-dark">No Analytics Data Found</h3>
      <p class="text-muted mb-4 max-width-500 mx-auto">
        We found 0 pulls in your history. You can add pulls manually using the Wish Counter tool or instantly load simulated Genshin data using the demo button below.
      </p>
      <div>
        <button class="btn btn-primary btn-lg fw-semibold px-4 py-2 me-2" @click="handleSimulateDemo">
          Simulate Demo Data
        </button>
        <RouterLink to="/wish-counter" class="btn btn-outline-dark btn-lg fw-semibold px-4 py-2">
          Go to Wish Counter
        </RouterLink>
      </div>
    </div>

    <!-- DASHBOARD WORKSPACE -->
    <div v-else class="row g-4">
      
      <!-- METRIC CARDS ROW -->
      <div class="col-12">
        <div class="row g-3">
          
          <!-- Card 1: Total Primogems Spent -->
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card custom-card p-4 h-100 shadow-sm border-0 wish_analytics_metric-card">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted fw-bold small text-uppercase">Total Spent</span>
                <i class="bi bi-gem text-primary fs-4"></i>
              </div>
              <h2 class="fw-bold text-dark mb-1">{{ grandTotalPrimogems.toLocaleString() }}</h2>
              <span class="text-muted small">Primogems consumed</span>
            </div>
          </div>

          <!-- Card 2: Total Pulls -->
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card custom-card p-4 h-100 shadow-sm border-0 wish_analytics_metric-card">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted fw-bold small text-uppercase">Total Wishes</span>
                <i class="bi bi-star-fill text-warning fs-4"></i>
              </div>
              <h2 class="fw-bold text-dark mb-1">{{ totalPulls.toLocaleString() }}</h2>
              <span class="text-muted small">Total pulls executed</span>
            </div>
          </div>

          <!-- Card 3: Average Pity -->
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card custom-card p-4 h-100 shadow-sm border-0 wish_analytics_metric-card">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted fw-bold small text-uppercase">Avg 5★ Pity</span>
                <i class="bi bi-calculator text-success fs-4"></i>
              </div>
              <h2 class="fw-bold text-dark mb-1">{{ averagePity || "N/A" }}</h2>
              <span class="text-muted small">Pulls per 5-star</span>
            </div>
          </div>

          <!-- Card 4: Most Expensive Banner -->
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card custom-card p-4 h-100 shadow-sm border-0 wish_analytics_metric-card">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted fw-bold small text-uppercase">Most Expensive</span>
                <i class="bi bi-exclamation-octagon text-danger fs-4"></i>
              </div>
              <template v-if="gachaStore.mostExpensiveBanner">
                <h2 class="fw-bold text-dark mb-1 text-truncate" :title="gachaStore.mostExpensiveBanner.name">
                  {{ gachaStore.mostExpensiveBanner.name }}
                </h2>
                <span class="text-muted small">Cost: <strong>{{ gachaStore.mostExpensiveBanner.pity }}</strong> pulls ({{ gachaStore.mostExpensiveBanner.cost.toLocaleString() }} Primo)</span>
              </template>
              <template v-else>
                <h2 class="fw-bold text-dark mb-1">N/A</h2>
                <span class="text-muted small">No 5-stars recorded</span>
              </template>
            </div>
          </div>

        </div>
      </div>

      <!-- VISUAL CHARTS COLUMNS -->
      
      <!-- Chart 1: Monthly Spending Trend (Line/Area Chart) -->
      <div class="col-12 col-lg-7">
        <div class="card custom-card p-4 shadow-sm border-0 h-100 wish_analytics_chart-card">
          <h4 class="fw-bold text-dark mb-4">Monthly Spending Trend</h4>
          
          <div class="wish_analytics_chart-container position-relative">
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" width="100%" height="100%" class="wish_analytics_svg-chart">
              <defs>
                <!-- Area gradient -->
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#0d6efd" stop-opacity="0.4"/>
                  <stop offset="100%" stop-color="#0d6efd" stop-opacity="0.0"/>
                </linearGradient>
              </defs>

              <!-- Y-Axis Grid Lines & Labels -->
              <g class="wish_analytics_grid-lines">
                <line 
                  v-for="i in 5" 
                  :key="'line-'+i"
                  :x1="paddingLeft" 
                  :y1="paddingTop + ((i - 1) * plotHeight / 4)" 
                  :x2="chartWidth - paddingRight" 
                  :y2="paddingTop + ((i - 1) * plotHeight / 4)"
                  stroke="#373b3e"
                  stroke-dasharray="4,4"
                />
                
                <!-- Value Labels -->
                <text 
                  v-for="i in 5" 
                  :key="'text-'+i"
                  :x="paddingLeft - 10" 
                  :y="paddingTop + ((i - 1) * plotHeight / 4) + 4" 
                  text-anchor="end" 
                  fill="#6c757d"
                  class="wish_analytics_axis-label"
                >
                  {{ Math.round(maxTrendAmount - ((i - 1) * maxTrendAmount / 4)).toLocaleString() }}
                </text>
              </g>

              <!-- Plot Paths -->
              <g v-if="monthlyChartPoints.length > 0">
                <!-- Area Fill -->
                <path :d="areaPathData" fill="url(#areaGrad)" />
                
                <!-- Main Trend Line -->
                <path :d="linePathData" fill="none" stroke="#0d6efd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                
                <!-- Intersecting Data Points -->
                <g v-for="(p, index) in monthlyChartPoints" :key="'pt-'+index">
                  <circle 
                    :cx="p.x" 
                    :cy="p.y" 
                    r="6" 
                    fill="#0d6efd" 
                    stroke="#ffffff" 
                    stroke-width="2" 
                    class="wish_analytics_chart-dot"
                    @mouseenter="activeTooltipIndex = index"
                    @mouseleave="activeTooltipIndex = null"
                  />
                  <!-- Hover interactive tooltip box -->
                  <g v-if="activeTooltipIndex === index">
                    <rect 
                      :x="p.x - 55" 
                      :y="p.y - 45" 
                      width="110" 
                      height="35" 
                      rx="4" 
                      fill="#212529" 
                      stroke="#0d6efd" 
                      stroke-width="1"
                    />
                    <text 
                      :x="p.x" 
                      :y="p.y - 23" 
                      text-anchor="middle" 
                      fill="#ffffff" 
                      font-size="10" 
                      font-weight="bold"
                    >
                      {{ p.amount.toLocaleString() }} Primo
                    </text>
                  </g>
                </g>
              </g>

              <!-- X-Axis Labels -->
              <g class="wish_analytics_x-axis">
                <!-- Axis base line -->
                <line :x1="paddingLeft" :y1="chartHeight - paddingBottom" :x2="chartWidth - paddingRight" :y2="chartHeight - paddingBottom" stroke="#6c757d" />
                
                <text 
                  v-for="(p, index) in monthlyChartPoints" 
                  :key="'lbl-'+index"
                  :x="p.x" 
                  :y="chartHeight - paddingBottom + 20" 
                  text-anchor="middle" 
                  fill="#6c757d"
                  class="wish_analytics_axis-label"
                >
                  {{ p.month }}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- Chart 2: Category Breakdown (Donut Chart) -->
      <div class="col-12 col-lg-5">
        <div class="card custom-card p-4 shadow-sm border-0 h-100 wish_analytics_chart-card">
          <h4 class="fw-bold text-dark mb-4">Spending Categories</h4>

          <div class="row align-items-center h-100">
            <!-- SVG Donut -->
            <div class="col-12 col-sm-6 d-flex justify-content-center">
              <div class="wish_analytics_donut-wrapper position-relative">
                <svg width="200" height="200" viewBox="0 0 200 200" class="wish_analytics_donut-chart">
                  <!-- Grey base track -->
                  <circle cx="100" cy="100" :r="donutRadius" fill="transparent" stroke="#2b3035" stroke-width="16" />

                  <!-- Segment rings -->
                  <circle 
                    v-for="(seg, idx) in donutSegments" 
                    :key="'seg-'+idx"
                    cx="100" 
                    cy="100" 
                    :r="donutRadius" 
                    fill="transparent" 
                    :stroke="seg.color" 
                    stroke-width="16" 
                    :stroke-dasharray="seg.dasharray" 
                    :stroke-dashoffset="seg.dashoffset" 
                    transform="rotate(-90 100 100)"
                    class="wish_analytics_donut-ring"
                  />
                </svg>
                <!-- Center Info overlay -->
                <div class="wish_analytics_donut-center">
                  <span class="text-muted small-text">Total</span>
                  <span class="fw-bold text-dark h4 mb-0">{{ grandTotalPrimogems.toLocaleString() }}</span>
                  <span class="text-muted mini-text">Primo</span>
                </div>
              </div>
            </div>

            <!-- Side Legend -->
            <div class="col-12 col-sm-6 mt-3 mt-sm-0">
              <div class="d-flex flex-column gap-3">
                <div 
                  v-for="(seg, idx) in donutSegments" 
                  :key="'leg-'+idx"
                  class="d-flex align-items-start gap-2"
                >
                  <span class="wish_analytics_legend-dot" :style="{ backgroundColor: seg.color }"></span>
                  <div>
                    <div class="fw-bold text-dark lh-sm small">{{ seg.category }}</div>
                    <div class="text-muted small">
                      {{ seg.amount.toLocaleString() }} Primo ({{ seg.percentage }}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FIVE STAR COST HISTORY TABLE -->
      <div class="col-12">
        <div class="card custom-card p-4 shadow-sm border-0 wish_analytics_table-card">
          <h4 class="fw-bold text-dark mb-3">5★ Wish Cost History</h4>
          <p class="text-muted small mb-4">Traces the exact Primogem cost for securing each 5-star character or weapon based on its pity interval.</p>
          
          <div v-if="gachaStore.costPerFiveStar.length === 0" class="text-center py-4 text-muted">
            <i class="bi bi-stars fs-3 me-2"></i> No 5-star items obtained yet.
          </div>
          
          <div v-else class="table-responsive">
            <table class="table table-hover wish_analytics_history-table mb-0">
              <thead>
                <tr>
                  <th>Obtained Asset</th>
                  <th>Banner Type</th>
                  <th>Pity Rate</th>
                  <th>Primogem Cost</th>
                  <th>Time / Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in gachaStore.costPerFiveStar.slice().reverse()" :key="'fiv-'+idx">
                  <td class="fw-bold text-dark">
                    <i class="bi bi-star-fill text-warning me-2"></i>{{ item.name }}
                  </td>
                  <td>
                    <span class="badge bg-light-blue text-dark">{{ item.banner }}</span>
                  </td>
                  <td class="fw-bold">{{ item.pity }} pulls</td>
                  <td class="text-primary fw-bold">{{ item.cost.toLocaleString() }} Primogems</td>
                  <td class="text-muted">{{ item.time.replace("T", " ") }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
