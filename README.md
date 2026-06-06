# 🌟 Genshin Companion — Cloud-Synced Tracker & Agentic AI Platform

> A full-stack Genshin Impact companion web application built with **Vue 3**, **Pinia**, and **Supabase PostgreSQL**. It features a cloud-synced Wish Counter, an intelligent Material Calculator, a reactive farming Todo List, a Goal Planner, and an embedded **Agentic AI Assistant** (Paimon) capable of autonomously executing in-app actions through natural language.

---

## 🔗 Deployment & Asset Links

| Resource | Link |
|---|---|
| 🌐 **Live Website** | <https://cos30043-interface-design.pages.dev> |
| 🎬 **Presentation Video** | <https://youtu.be/EIuQuOuc-0o> |

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features Architecture](#-key-features-architecture)
3. [Agentic AI Assistant — Paimon](#-agentic-ai-assistant--paimon)
4. [State Management & Hybrid Persistence](#-state-management--hybrid-persistence)
5. [Supabase Database Schema](#-supabase-database-schema)
6. [Application Views & Routing](#-application-views--routing)
7. [Tech Stack Breakdown](#-tech-stack-breakdown)
8. [Local Installation & Setup](#-local-installation--setup)
9. [Environment Variables Reference](#-environment-variables-reference)
10. [Recommended IDE & Browser Setup](#-recommended-ide--browser-setup)

---

## 🎯 Project Overview

**Genshin Companion** is a cloud-connected, full-stack web application designed as a productivity layer for players of HoYoverse's Genshin Impact. Rather than relying on fragile spreadsheets, it provides structured, database-backed tools that stay in sync across devices through Supabase's PostgreSQL BaaS.

The platform is centred on three primary utility tools — **Material Calculator**, **Cloud-Synced Wish Counter**, and **Reactive Todo List** — all of which are orchestrated by a globally mounted **Agentic AI Assistant** widget ("Paimon"). The assistant uses Google Gemini 2.5 Flash (with an OpenRouter fallback) to understand natural language and dispatch structured tool calls directly into the live Pinia stores, making it possible to log wishes, set pity counters, add farming tasks, create savings goals, or navigate the application entirely through chat.

Authentication is handled via a custom `profiles` table in Supabase rather than Supabase Auth, using SHA-256 password hashing via `crypto-js`. Session state is preserved in `sessionStorage`. Guest users are fully supported — their data is stored in `localStorage` and automatically migrated to the database upon first login.

---

## ⚙️ Key Features Architecture

### 1. 🧮 Material Calculator (`/calculator`)

**File:** [`src/views/calculator.vue`](src/views/calculator.vue)  
**Data Sources:** [`src/data/character_exp.js`](src/data/character_exp.js), [`src/data/weapon_exp.js`](src/data/weapon_exp.js)

The calculator supports three modes selectable via a tab group:

- **Character Mode** — Computes the exact quantity of `Hero's Wit` (20,000 EXP), `Adventurer's Experience` (5,000 EXP), and `Wanderer's Advice` (1,000 EXP) required, alongside the total Mora cost (EXP ÷ 5), for any character level range from 1 to 90. It reads cumulative EXP thresholds from the `character_exp` lookup table.

- **Weapon Mode** — Applies the same greedy-division algorithm using `Mystic Enhancement Ore`, `Fine Enhancement Ore`, and `Enhancement Ore`, with rarity-specific EXP curves sourced from `weapon_exp`. The correct curve index is automatically resolved from the selected weapon's rarity field.

- **Resin Mode** — Calculates how many minutes of Resin regeneration (at 1 per 8 minutes) are needed to reach a target amount, and projects the exact timestamp and day when the cap will be reached using a live updating clock.

**AI-Automated Value Injection:**  
The calculator is wired to a reactive `gachaStore.calculatorTarget` watcher. When the Paimon AI receives a `setup_calculator` tool call, it writes `{ item_name, current_level, target_level }` to this shared Pinia state. The `watch()` in `calculator.vue` detects the change, resolves the name against the loaded `character_list` or `weapon_list`, auto-populates all form fields, and immediately triggers `calculateExpLogic()` — producing a fully computed result without any user interaction.

**Push to Todo List:**  
After calculation, users can press "Add to Todo List" which calls `todoStore.addTodo()` with the computed `task_name`, `task_type`, level range, Mora cost, and formatted items array, persisting the task either to Supabase (authenticated) or `localStorage` (guest).

---

### 2. ⭐ Cloud-Synced Wish Counter (`/wish-counter` & `/wish-analytics`)

**Files:** [`src/views/wish_counter.vue`](src/views/wish_counter.vue), [`src/views/wish_analytics.vue`](src/views/wish_analytics.vue), [`src/views/goal_planner.vue`](src/views/goal_planner.vue)  
**Store:** [`src/gacha_store.js`](src/gacha_store.js)

The Wish Counter tracks pull history across three independent banner types: `limited_character`, `limited_weapon`, and `standard`. Each banner maintains its own:

- `*_lifetime_pulls` — the full ordered array of pull records, hydrated from the `wishes` table in Supabase.
- `*_five_star_pity` — current 5-star pity counter (0–89), persisted to the `profiles` table.
- `*_four_star_pity` — current 4-star pity counter (0–9), persisted to the `profiles` table.
- `*_five_star_gauaranteed` — boolean flag for the 50/50 guarantee rule, persisted to the `profiles` table.

**Data Flow on Login:**
1. `gacha_store.loadData()` is called. It queries the `wishes` table and maps each row to a local pull object `{ id, type (banner_type), name (item_name), rarity, pity, timestamp, time }`.
2. Pulls are filtered and sorted into the three `*_lifetime_pulls` arrays.
3. A second query fetches the eight pity metadata columns from `profiles` for the current user.

**Adding a Pull (`add_pull`):**  
Each new pull is pushed optimistically to the local array, pity counters are updated in memory, and then a row is inserted into `wishes` in Supabase. `saveData()` is called immediately after to persist the updated pity integers to `profiles`.

**Force-Set Pity (`force_update_pity`):**  
Used by the AI assistant when the user says "My pity is at X". The method calculates the delta between the requested and current values, inserts that many `Unknown (Historical)` placeholder rows into `wishes`, updates the local arrays, and calls `saveData()`. This ensures the pity counter and lifetime pull count always stay mathematically consistent.

**Wish Analytics (`/wish-analytics`):**  
Provides computed getters built directly on the Pinia state:
- `allPullsWithCosts` — attaches a Primogem cost (160 per pull, weighted by pity distance) to every recorded pull.
- `monthlySpendingTrend` — groups pull costs by `YYYY-MM` for a spending trend chart.
- `costPerFiveStar` — calculates the Primogem cost for each 5-star pull individually.
- `mostExpensiveBanner` — returns the single most expensive 5-star pull.
- `spendingCategories` — breaks total spending into percentages by banner type.

**Goal Planner (`/planner`):**  
Backed by `goal_store.js` and the `goals` Supabase table. Goals are authenticated-only and store `goal_name`, `target_week` (ISO week string like `2026-W40`), `pull_type`, and `needed_wishes`. A getter `getPityForPullType` cross-references the gacha store to calculate how many more pulls are still needed.

---

### 3. ✅ Reactive Todo List (`/todo-list`)

**File:** [`src/views/todo_list.vue`](src/views/todo_list.vue)  
**Store:** [`src/data/todo_store.js`](src/data/todo_store.js)

The Todo List is a farming checklist that stores structured task records. Each task object carries:

| Field | DB Column | Description |
|---|---|---|
| `id` | `id` (UUID) | Primary key generated with `crypto.randomUUID()` |
| `task_name` | `task_name` | Sanitised character or weapon name |
| `task_type` | `task_type` | `"character"` or `"weapon"` |
| `status` | `status` | `"pending"` or `"completed"` |
| `currentLevel` | `current_level` | Starting level |
| `targetLevel` | `target_level` | Target level |
| `mora` | `mora` | Mora cost from the calculator |
| `items` | `items` (JSONB) | Array of `{ name, label, count }` resource objects |

**Hybrid Persistence:**

- **Guest mode** — `loadData()` reads from `localStorage` key `"todos"`. All mutations (`addTodo`, `removeTodo`, `completeTodo`, `reorderTodos`) write back to `localStorage` immediately.
- **Authenticated mode** — `loadData()` first calls `migrateLocalTodos()`, which reads any existing guest tasks from `localStorage`, inserts them into Supabase, and then clears the local key. After migration, all tasks are fetched fresh from the `todos` table with a full `SELECT *`. All mutations write to Supabase.

**Input Sanitisation:**  
`addTodo` runs every `task_name` through `sanitizeString()` from `src/services/sanitize.js`, which strips HTML tags. If malicious content is detected, a toast warning fires via `authStore.showToast()`.

**Race-Condition Lock:**  
A `pendingWrites` array acts as a lightweight mutex. Before any insert, the store generates a unique key `${task_name}_${task_type}_${currentLevel}_${targetLevel}` and checks whether it is already in-flight. Duplicate submissions within the same tick are silently dropped.

**Drag-and-Drop Reorder:**  
The view implements native HTML5 drag-and-drop via `dragstart`, `dragenter`, `dragover`, `drop`, and `dragend` event handlers. Reordering calls `todoStore.reorderTodos(oldIndex, newIndex)` which performs a `splice` on the local array and syncs `localStorage` for guest sessions.

**Anime.js Transitions:**  
The `<transition-group>` component uses JavaScript hooks (`@enter`, `@leave`) powered by `anime.js`. Entering tasks pop in with an elastic scale animation; removed tasks slide out with a fade-and-translate effect.

---

## 🤖 Agentic AI Assistant — Paimon

**File:** [`src/components/ai_assistant_widget.vue`](src/components/ai_assistant_widget.vue)  
**AI Service:** [`src/services/ai_summarizer.js`](src/services/ai_summarizer.js)

The Paimon AI widget is a globally mounted, floating chat interface rendered in `App.vue`. It operates as a full **agentic tool-calling system** — it does not use keyword matching. Instead, the user's natural-language message is sent to an LLM with a formal set of tool schemas. The model decides which tool to call and returns structured JSON arguments. The frontend then dispatches those arguments to the appropriate Pinia store actions.

### Architecture

```
User Input  →  handleMessageSubmit()
            →  callUnifiedAI({ messages, tools, storeCtx, systemPrompt })
            ←  { type: "tool_call", tool, args }  |  { type: "text", text }
            →  executeTool(toolName, args)
            →  Pinia Store Actions (gachaStore / todoStore / goalStore / router)
```

### Tool Schema Registry (6 Tools)

| Tool Name | Trigger Intent | Action |
|---|---|---|
| `log_gacha_pull` | "I got Neuvillette at 57 pity" | Backfills `(pity - 1)` placeholder 3★ entries, then commits the named pull via `gachaStore.add_pull()` |
| `configure_pity_counters` | "My character banner pity is 50" | Calls `gachaStore.force_update_pity()` to overwrite pity counters without logging a new pull |
| `manage_todo_task` | "Add Furina farming" / "Remove task" | Dispatches `todoStore.addTodo()`, `completeTodo()`, or `removeTodo()` |
| `manage_planner_goal` | "Save 180 pulls for Mavuika by week 40" | Dispatches `goalStore.addGoal()`, `updateGoal()`, or `removeGoal()` |
| `Maps_application` | "Take me to the calculator" | Calls `router.push(target_route)`; redirects unauthenticated users to `/login` |
| `setup_calculator` | "Calculate resources for Chasca" | Writes `{ item_name, current_level, target_level }` to `gachaStore.calculatorTarget`, navigates to `/calculator`, and the view's `watch()` auto-computes results |

### System Prompt Injection

Every LLM request is prefixed with a rich system prompt (`getSystemPrompt()`) that includes:
- The current user's login state and username.
- The full list of recognised characters and weapons (from `gachaStore.character_list` and `weapon_list`).
- Strict disambiguation rules to differentiate pity state reports from pull events.
- Indirect action resolution rules for implicit intent.
- Multi-intent handling for compound queries.
- Navigation guards (unauthenticated users attempting to access protected routes are routed to `/login`).

### Store Context Snapshot

Before every API call, `buildStoreContext()` serialises a live JSON snapshot of the Pinia stores into the system prompt:
```json
{
  "gacha": { "limited_character_5star_pity": 57, ... },
  "todos": [{ "id": "uuid", "name": "Furina", "done": false }],
  "goals": [{ "id": "uuid", "goalName": "Mavuika fund", "neededWishes": 180 }]
}
```
This lets the LLM perform real arithmetic (e.g. `180 − 57 = 123 more pulls needed`) rather than guessing.

### AI Provider & Key Rotation

`callUnifiedAI()` resolves keys in priority order:

1. `VITE_GEMINI_API_KEY` → Gemini 2.5 Flash (primary)
2. `VITE_GEMINI_KEY_2` through `VITE_GEMINI_KEY_5` → Gemini fallback slots
3. `VITE_OPENROUTER_KEY` → OpenRouter (google/gemini-2.5-flash model via OpenAI-compatible API)

If a key fails with an HTTP error, the engine logs a warning and tries the next slot automatically. All slots failing throws an error that is caught in the widget and displayed as a friendly retry message.

### Character Summary (Google Search Grounding)

The `getCharacterSummary()` function in `ai_summarizer.js` is used by `char_detail.vue`. It sends a structured prompt with `googleSearch: true` to enable Gemini's grounded search capability, fetching real-time meta information about a character and returning it as parsed JSON `{ character_name, description, strengths, important_details, worth_pulling }`.

---

## 🗂️ State Management & Hybrid Persistence

The application uses four Pinia stores, all defined with the Options API style (`defineStore`):

| Store | File | Guest Fallback | Auth Behaviour |
|---|---|---|---|
| `auth` | `src/data/auth_store.js` | `sessionStorage` key `genshin_current_user` | Queries/writes `profiles` table |
| `todo` | `src/data/todo_store.js` | `localStorage` key `"todos"` | Reads/writes `todos` table; migrates on login |
| `gacha` | `src/gacha_store.js` | Resets to empty (`resetData()`) | Reads `wishes` + `profiles` tables |
| `goal` | `src/data/goal_store.js` | Empty array (goals are auth-only) | Reads/writes `goals` table |

### Application Bootstrap Sequence (`App.vue`)

On `onMounted`:
1. `authStore.loadData()` — fetches all profiles and restores session from `sessionStorage`.
2. `Promise.all([todoStore.loadData(), gachaStore.loadData(), goalStore.loadData()])` — parallel hydration of all data stores.
3. `Lenis` smooth scrolling is initialised and its `raf` loop is started with `requestAnimationFrame`.

On route change, `window.lenis.scrollTo(0, { immediate: true })` resets the scroll position.

### Login Flow

When `authStore.loginUser()` succeeds, it:
1. Sets `this.currentUser` and writes to `sessionStorage`.
2. Calls `authStore.loadData()` to refresh the user list.
3. Calls all three store `loadData()` methods again — `todoStore` will detect the now-set `currentUser` and run `migrateLocalTodos()` before fetching from Supabase.

### Logout Flow

`authStore.logout()` clears `currentUser` and `sessionStorage`, then calls `loadData()` on all stores. Each store detects the absence of a `currentUser` and falls back to its guest strategy (`localStorage` read or `resetData()`).

### Cascading Username Update

When a user renames their account via `updateProfile()`, the store manually issues concurrent Supabase `UPDATE` queries on `todos`, `goals`, and `wishes` tables to rewrite the `username` foreign key before updating `profiles` — ensuring referential integrity without a database-level cascade.

---

## 🗄️ Supabase Database Schema

The application connects to a Supabase PostgreSQL project via `src/services/supabase.js` using the `@supabase/supabase-js` v2 client. The client is initialised once and exported as a singleton `supabase`. All tables use the authenticated user's `username` string as a logical foreign key (Row-Level Security configuration is handled in the Supabase dashboard).

### Table: `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Auto-generated primary key |
| `username` | `text` | Unique login handle |
| `password` | `text` | SHA-256 hex hash via `crypto-js` |
| `display_name` | `text` | Optional display name |
| `date_of_birth` | `date` | Optional, nullable |
| `limited_character_four_star_pity` | `int4` | Pity counter |
| `limited_character_five_star_pity` | `int4` | Pity counter |
| `limited_character_five_star_gauaranteed` | `bool` | 50/50 guarantee flag |
| `limited_weapon_four_star_pity` | `int4` | Pity counter |
| `limited_weapon_five_star_pity` | `int4` | Pity counter |
| `limited_weapon_five_star_gauaranteed` | `bool` | 50/50 guarantee flag |
| `standard_four_star_pity` | `int4` | Pity counter |
| `standard_five_star_pity` | `int4` | Pity counter |

### Table: `todos`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | `crypto.randomUUID()` primary key |
| `username` | `text` | Owner reference |
| `task_name` | `text` | Sanitised character/weapon name |
| `task_type` | `text` | `"character"` or `"weapon"` |
| `status` | `text` | `"pending"` or `"completed"` |
| `current_level` | `int4` | Starting level |
| `target_level` | `int4` | Target level |
| `mora` | `int8` | Mora cost |
| `items` | `jsonb` | Array of `{ name, label, count }` |

### Table: `wishes`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | `crypto.randomUUID()` primary key |
| `username` | `text` | Owner reference |
| `banner_type` | `text` | `"limited_character"`, `"limited_weapon"`, or `"standard"` |
| `item_name` | `text` | Name of pulled character or weapon |
| `rarity` | `int4` | `3`, `4`, or `5` |
| `pity` | `int4` | Pity counter at time of pull |
| `created_at` | `timestamptz` | ISO 8601 timestamp of the pull |

### Table: `goals`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | `crypto.randomUUID()` primary key |
| `username` | `text` | Owner reference |
| `goal_name` | `text` | Descriptive label |
| `target_week` | `text` | ISO week string, e.g. `"2026-W40"` |
| `pull_type` | `text` | Banner type for this savings goal |
| `needed_wishes` | `int4` | Target pull count |

---

## 📄 Application Views & Routing

**Router file:** `src/router/`

| Route | View File | Auth Required | Description |
|---|---|---|---|
| `/` | `homepage.vue` | No | Landing page with scroll-animated banner showcase, active redeem codes table, and CTA section |
| `/calculator` | `calculator.vue` | No | Character / Weapon / Resin calculator with AI injection support |
| `/wish-counter` | `wish_counter.vue` | No | Banner pity overview cards and full pull history table |
| `/wish-analytics` | `wish_analytics.vue` | No | Spending charts: monthly trend, cost-per-5★, banner breakdown |
| `/todo-list` | `todo_list.vue` | No | Drag-and-drop farming checklist with Anime.js transitions |
| `/planner` | `goal_planner.vue` | Yes | Savings goal manager cross-referencing live pity data |
| `/character` | `char_detail.vue` | No | Character detail page with AI-powered Gemini Google Search summary |
| `/about` | `about.vue` | No | About page with tech stack info |
| `/login` | `login.vue` | No | Login form |
| `/registration` | `registration.vue` | No | Registration form |
| `/account_setting` | `account_setting.vue` | Yes | Profile management, password change, and account deletion |

**Global Components (rendered in `App.vue`):**

- `nav_bar.vue` — Top navigation bar with auth state awareness.
- `footer.vue` — Site footer.
- `ai_assistant_widget.vue` — Floating Paimon AI chat widget, always mounted.
- Global Toast — A validation alert `div` driven by `authStore.toastMessage`, appearing when invalid input or sanitised payload events fire.

---

## 🛠️ Tech Stack Breakdown

| Layer | Technology | Version | Role |
|---|---|---|---|
| **UI Framework** | Vue 3 (Composition API `<script setup>`) | `^3.5.30` | Reactive component system, `<transition-group>` animations |
| **State Management** | Pinia | `^3.0.4` | Global stores with hybrid Supabase/localStorage persistence |
| **Routing** | Vue Router | `^5.0.3` | SPA client-side routing with route guards |
| **BaaS / Database** | Supabase (PostgreSQL) | `^2.106.2` | Auth-free PostgreSQL queries via `@supabase/supabase-js` |
| **AI Service** | Google Gemini 2.5 Flash | `@google/generative-ai ^0.24.1` | Agentic tool-call chat, Google Search grounding for character summaries |
| **AI Fallback** | OpenRouter (Gemini 2.5 Flash) | REST | Secondary provider via OpenAI-compatible `/chat/completions` endpoint |
| **CSS Framework** | Bootstrap 5 | `^5.3.8` | Responsive grid, utility classes |
| **Icons** | Bootstrap Icons | `^1.13.1` | Icon font via `bi-*` classes |
| **Smooth Scrolling** | Lenis (`@studio-freight/lenis`) | `@1.0.42` (CDN) | Physics-based smooth scroll, `raf` loop integrated in `App.vue` |
| **Animations** | Anime.js | `^3.2.2` | Todo list enter/leave transitions, homepage stagger animations |
| **Password Hashing** | CryptoJS (SHA-256) | `^4.2.0` | Client-side SHA-256 before Supabase write |
| **Build Tool** | Vite | `^7.3.3` | Dev server with HMR, `import.meta.env` for secrets |
| **Code Formatter** | Prettier | `3.8.1` | Consistent code style across all `.vue` and `.js` files |
| **Node Requirement** | Node.js | `^20.19.0 \|\| >=22.12.0` | Minimum runtime for Vite |

---

## 🚀 Local Installation & Setup

### Prerequisites

- Node.js `v20.19.0` or `v22.12.0+`
- A Supabase project with the four tables (`profiles`, `todos`, `wishes`, `goals`) created as per the schema above.
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### Step 1 — Clone the Repository

```sh
git clone https://github.com/YOUR_USERNAME/COS30043-Interface-Design.git
cd COS30043-Interface-Design
```

### Step 2 — Install Dependencies

```sh
npm install
```

This installs all packages defined in `package.json`, including Vue 3, Pinia, Supabase JS client, Bootstrap, Anime.js, CryptoJS, and the Google Generative AI SDK.

### Step 3 — Configure Environment Variables

Create a `.env` file in the project root (it is already in `.gitignore`):

```sh
# .env

# ── Supabase ──────────────────────────────────────────────────────────
# Found in your Supabase project dashboard → Settings → API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# ── Google Gemini (Primary AI key) ───────────────────────────────────
# Generate at https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your-gemini-api-key

# ── Gemini Fallback Slots (optional, for key rotation) ───────────────
VITE_GEMINI_KEY_2=your-second-gemini-key
VITE_GEMINI_KEY_3=your-third-gemini-key
VITE_GEMINI_KEY_4=your-fourth-gemini-key
VITE_GEMINI_KEY_5=your-fifth-gemini-key

# ── OpenRouter Fallback (optional) ───────────────────────────────────
# Generate at https://openrouter.ai/keys
VITE_OPENROUTER_KEY=your-openrouter-key
```

> **Important:** Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY` are required for core functionality. All other keys are optional fallback slots for the AI rotation engine.

### Step 4 — Start the Development Server

```sh
npm run dev
```

Vite will start a local dev server at `http://localhost:5173` with Hot Module Replacement (HMR) enabled.

### Optional — Build for Production

```sh
npm run build
```

The production bundle is output to the `dist/` directory, ready for static hosting (e.g. Netlify, Vercel, GitHub Pages).

---

## 🔐 Environment Variables Reference

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project REST endpoint |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase public anon key for client-side queries |
| `VITE_GEMINI_API_KEY` | ✅ Yes | Primary Google Gemini 2.5 Flash API key |
| `VITE_GEMINI_KEY_2` | ⬜ Optional | Gemini fallback slot 2 |
| `VITE_GEMINI_KEY_3` | ⬜ Optional | Gemini fallback slot 3 |
| `VITE_GEMINI_KEY_4` | ⬜ Optional | Gemini fallback slot 4 |
| `VITE_GEMINI_KEY_5` | ⬜ Optional | Gemini fallback slot 5 |
| `VITE_OPENROUTER_KEY` | ⬜ Optional | OpenRouter API key (last-resort AI fallback) |

> All `VITE_*` prefixed variables are exposed to the browser bundle at build time via Vite's `import.meta.env`. Never store server-side secrets using `VITE_` prefix in production.

---

## 💻 Recommended IDE & Browser Setup

### IDE

- **[Visual Studio Code](https://code.visualstudio.com/)** with the **[Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)** extension (Volar). Disable the legacy Vetur extension if installed.

### Browser

**Chromium-based (Chrome, Edge, Brave):**
- [Vue.js DevTools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) — inspect Pinia store state in real time.
- [Enable Custom Object Formatters](http://bit.ly/object-formatters) in Chrome DevTools for cleaner Vue reactive object logging.

**Firefox:**
- [Vue.js DevTools (Firefox)](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Enable Custom Object Formatters](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

---

## 📁 Project Structure

```
COS30043-Interface-Design/
├── public/
│   └── data/
│       ├── characters.json     # Character list with rarity data
│       ├── weaponList.json     # Weapon list with rarity data
│       └── codes.json          # Active Genshin redeem codes
├── src/
│   ├── assets/                 # Global CSS (index.css) and image assets
│   ├── components/
│   │   ├── ai_assistant_widget.vue   # 🤖 Agentic Paimon AI chat widget
│   │   ├── nav_bar.vue               # Top navigation bar
│   │   ├── footer.vue                # Site footer
│   │   ├── pity_progress_bar.vue     # Animated pity progress indicator
│   │   └── pull_status_card.vue      # Banner pity summary card
│   ├── data/
│   │   ├── auth_store.js        # Authentication Pinia store
│   │   ├── todo_store.js        # Todo list Pinia store (hybrid persistence)
│   │   ├── goal_store.js        # Goal planner Pinia store
│   │   ├── character_exp.js     # Character EXP threshold lookup table
│   │   └── weapon_exp.js        # Weapon EXP curve lookup tables (by rarity)
│   ├── services/
│   │   ├── supabase.js          # Supabase singleton client
│   │   ├── ai_summarizer.js     # Unified AI engine with key rotation
│   │   └── sanitize.js          # HTML sanitisation utility
│   ├── views/
│   │   ├── homepage.vue         # Landing page with scroll-animated banners
│   │   ├── calculator.vue       # Material & Resin calculator
│   │   ├── wish_counter.vue     # Pity overview + pull history
│   │   ├── wish_analytics.vue   # Spending analytics & charts
│   │   ├── todo_list.vue        # Drag-and-drop farming checklist
│   │   ├── goal_planner.vue     # Savings goal manager
│   │   ├── char_detail.vue      # AI-powered character detail page
│   │   ├── about.vue            # About page
│   │   ├── login.vue            # Login form
│   │   ├── registration.vue     # Registration form
│   │   └── account_setting.vue  # Profile & account management
│   ├── router/                  # Vue Router configuration
│   ├── gacha_store.js           # Gacha / Wish Counter Pinia store
│   ├── App.vue                  # Root component — layout, store hydration, Lenis
│   └── main.js                  # App entry point — Pinia, Router, Bootstrap
├── .env                         # Environment secrets (gitignored)
├── .gitignore
├── index.html                   # Vite HTML entry point
├── package.json
├── vite.config.js
└── README.md
```

---

*Built for COS30043 Interface Design — Swinburne University of Technology.*
