<script setup>
// =====================================================
// Agentic AI Chat Assistant Widget
// src/components/ai_assistant_widget.vue
//
// Architecture:
//   UI  →  callChatAI() [ai_summarizer.js]  →  LLM
//       ←  { type: "tool_call", tool, args }  ←
//       →  executeTool()  →  Pinia stores
//
// Zero inline styles — all CSS is in src/assets/index.css
//   under the /* Agentic AI Assistant */ section block.
// =====================================================

import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { callUnifiedAI } from "../services/ai_summarizer.js";
import { useAuthStore } from "../data/auth_store.js";
import { useGachaStore } from "../gacha_store.js";
import { useTodoStore }  from "../data/todo_store.js";
import { useGoalStore }  from "../data/goal_store.js";

const router = useRouter();
const authStore = useAuthStore();
const gachaStore = useGachaStore();
const todoStore  = useTodoStore();
const goalStore  = useGoalStore();

// ─── UI State ─────────────────────────────────────────
const isOpen       = ref(false);
const isLoading    = ref(false);
const inputMessage = ref("");
const chatBody     = ref(null);

const chatHistory = ref([
  {
    role: "assistant",
    text: "Hey, it's Paimon! ✨ Paimon can log wishes, fix your pity counters, manage your farming checklist, and create savings goals — just ask naturally!",
    time: ts()
  }
]);

// =====================================================
// TOOL SCHEMAS
// These are passed verbatim to the LLM so it can
// decide — through intent analysis — which tool to
// call and what arguments to return.  The frontend
// never pattern-matches user text itself.
// =====================================================
const TOOLS = [
  // ── Tool 1: Log a gacha pull ───────────────────────
  {
    name: "log_gacha_pull",
    description:
      "Logs a single gacha wish record into the user's wish history for a specific banner. " +
      "Call this when the user mentions pulling a character or weapon, e.g. " +
      "'Add Neuvillette to my character banner at 57 pity' or " +
      "'I got Fischl on the weapon banner at rarity 4'.",
    parameters: {
      type: "object",
      properties: {
        banner_type: {
          type: "string",
          enum: ["limited_character", "limited_weapon", "standard"],
          description: "Which banner the pull belongs to"
        },
        character_or_weapon_name: {
          type: "string",
          description: "Exact name of the pulled character or weapon (capitalised)"
        },
        rarity: {
          type: "number",
          description: "Star rarity: 3, 4, or 5"
        },
        pity: {
          type: "number",
          description: "The pull number (pity counter value) at which the item was obtained"
        }
      },
      required: ["character_or_weapon_name", "pity"]
    }
  },

  // ── Tool 2: Force-set pity counters ────────────────
  {
    name: "configure_pity_counters",
    description:
      "Directly overwrites the pity counter values for a specific banner. " +
      "Use this when the user asks to correct or set their current pity, e.g. " +
      "'Set my standard banner 5-star pity to 50' or " +
      "'Update my character banner 4-star pity to 8'.",
    parameters: {
      type: "object",
      properties: {
        banner_type: {
          type: "string",
          enum: ["limited_character", "limited_weapon", "standard"],
          description: "Which banner's pity counters to update"
        },
        five_star_pity: {
          type: "number",
          description: "New 5-star pity counter value (0 to 89)"
        },
        four_star_pity: {
          type: "number",
          description: "New 4-star pity counter value (0 to 9)"
        }
      },
      required: ["banner_type", "five_star_pity", "four_star_pity"]
    }
  },

  // Tool 3: Manage a todo farming task 
  {
    name: "manage_todo_task",
    description:
      "Creates, marks complete, or removes a farming todo task. " +
      "Use 'add' when the user wants to track farming materials for a character or weapon. " +
      "Use 'complete' to mark an existing task done (requires task_id from context). " +
      "Use 'remove' to delete a task (requires task_id from context). " +
      "Examples: 'Add Furina farming task', 'Mark my Neuvillette task as done', 'Remove the Diluc task'.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["add", "complete", "remove"],
          description: "Operation to perform on the todo list"
        },
        task_name: {
          type: "string",
          description: "Name of the character or weapon being farmed"
        },
        task_type: {
          type: "string",
          enum: ["character", "weapon"],
          description: "Whether this is a character or weapon farming task"
        },
        task_id: {
          type: "number",
          description: "Unique numeric ID of the task — required for 'complete' and 'remove' actions. Obtain from the data context."
        }
      },
      required: ["action"]
    }
  },

  // Tool 4: Manage a savings goal 
  {
    name: "manage_planner_goal",
    description:
      "Creates, updates, or deletes a savings goal in the Goal Planner. " +
      "Use 'create' for new goals (e.g. 'Save for Mavuika by week 40 needing 180 pulls'). " +
      "Use 'update' to patch fields of an existing goal (requires goal_id from context). " +
      "Use 'delete' to remove a goal (requires goal_id from context).",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "update", "delete"],
          description: "Operation to perform on the planner"
        },
        goal_name: {
          type: "string",
          description: "Descriptive name for the saving goal (e.g. 'Mavuika fund')"
        },
        target_week: {
          type: "string",
          description: "ISO week string like '2026-W34' representing the deadline week"
        },
        pull_type: {
          type: "string",
          enum: ["limited_character", "limited_weapon", "standard"],
          description: "Which banner the saved pulls are for"
        },
        needed_wishes: {
          type: "number",
          description: "How many wishes to save up for this goal"
        },
        goal_id: {
          type: "number",
          description: "Unique numeric ID of the goal — required for 'update' and 'delete'. Obtain from the data context."
        }
      },
      required: ["action"]
    }
  },
  {
    name: "Maps_application",
    description: "Navigates the user to a different view or page in the application. Use this when the user asks to go to, visit, open, or view a page like the calculator, wish counter, analytics, checklist, planner, account, or settings. Examples: 'Take me to the calculator', 'Bring me to my account settings', 'Go to the planner'.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          enum: ["home", "calculator", "wish_counter", "analytics", "todo_list", "planner", "login", "registration", "about", "account_setting"],
          description: "The strict target route name to navigate the user to."
        }
      },
      required: ["destination"]
    }
  },
  {
    name: "setup_calculator",
    description: "Selects a character or weapon in the calculator view and displays required materials. Use this when the user wants to calculate resources, levels, or materials for a specific character or weapon. Examples: 'Calculate resources for Nahida', 'Add calculation for Chasca', 'Check materials for Staff of Homa'.",
    parameters: {
      type: "object",
      properties: {
        item_name: {
          type: "string",
          description: "Exact name of the character or weapon to set up in the calculator."
        },
        current_level: {
          type: "number",
          description: "Optional current level of the character or weapon."
        },
        target_level: {
          type: "number",
          description: "Optional target level of the character or weapon."
        }
      },
      required: ["item_name"]
    }
  }
];

// =====================================================
// SYSTEM PROMPT
// Injected as the first message in every LLM request.
// Contains strict disambiguation rules so the LLM
// selects the correct tool for every intent.
// =====================================================
const getSystemPrompt = () => {
  const characterList = (gachaStore.character_list || []).map(c => c.name);
  const weaponList = (gachaStore.weapon_list || []).map(w => w.name);

  return [
    "You are Paimon, a helpful, deeply knowledgeable Genshin Impact companion. Always act as an interactive, immersive wiki. Keep your tone friendly and supportive, but slightly hyperactive/enthusiastic.",
    "Always reply in plain sentences — no markdown asterisks, bullet dashes, or code fences.",
    "When the user asks about a character, lore, or gameplay mechanics, DO NOT give brief one-sentence answers and DO NOT reject the question. You must elaborate comprehensively in multiple sentences, giving rich descriptions and details.",
    `User Logged In: ${authStore.currentUser ? 'Yes (' + authStore.currentUser + ')' : 'No'}.`,
    `Context: The recognized characters in the database are: ${characterList.join(', ')}. The recognized weapons are: ${weaponList.join(', ')}.`,
    "Use the provided lists of recognized characters and weapons to validate user requests. If a user asks about an entity not on these lists, inform them it is not currently tracked in the database.",
    "You have six tools: log_gacha_pull, configure_pity_counters, manage_todo_task, manage_planner_goal, Maps_application, setup_calculator.",
    "Always prefer calling a tool over a text reply when an action is clearly requested.",
    "CRITICAL TOOL RULE: If the user requests an action (like logging a wish or calculating resources) but fails to provide REQUIRED parameters (like rarity, banner type, or character name), YOU MUST NOT attempt to call the JSON tool. Instead, respond with standard text. Explicitly state which specific pieces of information you are missing and ask the user to provide them.",
    
    "ROUTING RULE: You must navigate users strictly using the provided route name enums. Never guess or hallucinate a destination path or URL. If the user asks for the registration view, dispatch 'registration'. If they ask for account settings, dispatch 'account_setting'. If they ask for checklist or todo list, dispatch 'todo_list'. If they ask for analytics or wish counter details, dispatch 'analytics' or 'wish_counter' respectively. HUMAN INDECISION RULE: If the user exhibits extreme indecision (e.g. 'take me to the planner, wait no, calculator, actually nevermind, show my wish analytics'), you must evaluate their final request and dispatch the tool call matching their final settled choice (e.g., 'analytics'), while conversational text replies politely acknowledge their correction. PROTECTED ROUTE RULE: If the user is NOT logged in and asks to navigate to a protected route (like 'planner' or 'account_setting'), you MUST call Maps_application with the target destination enum (e.g., 'planner' or 'account_setting'). Do not redirect them to 'login' yourself. The application will intercept this and explain the access restriction.",
    
    // ── Tool execution rule ──────────────────────────
    "TOOL SELECTION RULE — NAVIGATION & CALCULATOR:",
    "  - If the user wants to navigate or open a page (e.g. calculator, planner, checklist, account settings), call Maps_application with the target destination enum.",
    "  - If the user wants to calculate level or ascension resources for a character or weapon, call setup_calculator with the name.",

    // ── Tool 1 & 2 pity rule ──────────────────────────
    "TOOL SELECTION RULE — PITY STATE vs PULL EVENT:",
    "  (A) If the user describes their CURRENT pity (e.g. 'I am at 57 pity', 'my pity is 57', 'I haven't gotten a 5-star and I'm at 57') — call configure_pity_counters. Do NOT call log_gacha_pull. The user did not obtain an item; they are reporting their counter.",
    "  (B) If the user describes a COMPLETED pull (e.g. 'I got Neuvillette at 57 pity', 'I pulled Furina', 'add Chasca to my banner at 43 pity') — call log_gacha_pull.",

    // ── CRITICAL: Math calculation guidance ────────────
    "MATH RULE — REMAINING WISHES:",
    "  When a user asks 'how many wishes do I need' for a character/banner:",
    "  1. Look up their active goal in the goals array (find goal by goalName or pullType).",
    "  2. Look up current 5-star pity from the gacha context for the matching banner.",
    "  3. Calculate: remaining = goal.neededWishes - current_pity.",
    "  4. Reply with the exact arithmetic: e.g. '180 − 57 = 123 more wishes to guarantee Neuvillette!'",
    "  Never guess. Always derive the number from the data context provided.",

    // ── Phase 2 Adversarial Stress Rules ────────────
    "INDIRECT ACTION RESOLUTION:",
    "  - If the user expresses an indirect desire (e.g. 'I really want to max out Furina's level this week, can you prep my dashboard checklist for her?'), map this to manage_todo_task with action='add', task_name='Furina', task_type='character'.",
    "  - If the user says 'My Chasca is currently stuck at level 1 and it's frustrating', map this to setup_calculator with item_name='Chasca', current_level=1, target_level=90.",
    "MULTI-INTENT DISAMBIGUATION:",
    "  - If the user sends a multi-intent query with context poisoning (e.g. 'Tell me who the Hydro Archon is, then take me to the place where I calculate materials, but actually wait, can you just check if Zhongli is in the database first?'), you must fulfill all parts: reply with detailed text explaining who the Hydro Archon is (Focalors/Furina) and verifying that Zhongli is indeed in the database context, AND simultaneously trigger a tool call to Maps_application with destination='calculator'. Do not ignore any of the intents.",
    "MULTIPLE SEQUENTIAL EXECUTIONS:",
    "  - If the user asks to add multiple characters to their checklist at once (e.g., 'Add Furina, Neuvillette, Chasca, Linnea, and Bennett to my checklist from level 1 to 90 all at once.'), you are encouraged to output multiple tool calls (e.g. five separate manage_todo_task calls, each with action='add', task_name=character, task_type='character') in a single turn."
  ].join(" ");
};

// =====================================================
// STORE CONTEXT SNAPSHOT
// Serialised into every system prompt so the LLM
// can see current pity values, task IDs, and goal IDs.
// =====================================================
const buildStoreContext = () =>
  JSON.stringify({
    gacha: {
      limited_character_5star_pity: gachaStore.limited_character_five_star_pity ?? 0,
      limited_character_4star_pity: gachaStore.limited_character_four_star_pity ?? 0,
      limited_weapon_5star_pity:    gachaStore.limited_weapon_five_star_pity    ?? 0,
      limited_weapon_4star_pity:    gachaStore.limited_weapon_four_star_pity    ?? 0,
      standard_5star_pity:          gachaStore.standard_five_star_pity          ?? 0,
      standard_4star_pity:          gachaStore.standard_four_star_pity          ?? 0,
      limited_character_total_pulls: gachaStore.limited_character_lifetime_pulls?.length ?? 0,
      limited_weapon_total_pulls:    gachaStore.limited_weapon_lifetime_pulls?.length    ?? 0,
      standard_total_pulls:          gachaStore.standard_lifetime_pulls?.length          ?? 0
    },
    todos: todoStore.todos.map(t => ({
      id:          t.id,
      name:        t.name,
      type:        t.type,
      targetLevel: t.targetLevel,
      done:        t.done ?? false
    })),
    goals: goalStore.goals.map(g => ({
      id:           g.id,
      goalName:     g.goalName,
      targetWeek:   g.targetWeek,
      pullType:     g.pullType,
      neededWishes: g.neededWishes
    }))
  }, null, 2);

// =====================================================
// TOOL EXECUTORS
// Each branch receives the args object that the LLM
// decided on. The frontend only dispatches — it never
// re-interprets the user's text.
// =====================================================
// ─── Local helper: build a timezone-correct ISO datetime string ──
function localISOStr(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
}

const executeTool = async (toolName, args) => {
  // ── Tool 1: Log a gacha pull ───────────────────────
  //
  // BACKFILL FIX: If the LLM says the pull happened at pity = N,
  // that means N-1 non-5-star pulls happened before it. Without
  // backfilling, we'd only add 1 pull to the lifetime array and
  // the pity counter would be mathematically wrong.
  //
  // Solution: insert (pity - 1) placeholder 3★ entries first,
  // each stamped 1 second earlier so the timeline stays ordered,
  // then commit the actual named item as the final entry.
  if (toolName === "log_gacha_pull") {
    const now         = new Date();
    let bannerType  = args.banner_type;
    let rarity      = Number(args.rarity);
    const pityCount   = Math.max(1, Number(args.pity) || 1);
    const itemName    = args.character_or_weapon_name;

    // Smart fallback/lookup from character/weapon list
    if (!rarity || !bannerType) {
      const charFound = gachaStore.character_list.find(c => c.name.toLowerCase() === itemName.toLowerCase());
      if (charFound) {
        if (!rarity) rarity = charFound.rarity || 5;
        if (!bannerType) {
          const standardChars = ["jean", "diluc", "mona", "keqing", "qiqi", "tighnari", "dehya"];
          bannerType = standardChars.includes(itemName.toLowerCase()) ? "standard" : "limited_character";
        }
      } else {
        const weaponFound = gachaStore.weapon_list.find(w => w.name.toLowerCase() === itemName.toLowerCase());
        if (weaponFound) {
          if (!rarity) rarity = weaponFound.rarity || 5;
          if (!bannerType) {
            const standardWeapons = ["amos' bow", "skyward harp", "lost prayer to the sacred winds", "primordial jade winged-spear", "wolf's gravestone", "aquila favonia", "skyward blade", "skyward pride", "skyward spine", "skyward atlas"];
            bannerType = standardWeapons.includes(itemName.toLowerCase()) ? "standard" : "limited_weapon";
          }
        }
      }
    }

    // Ultimate fallback if still undefined:
    if (!rarity) rarity = 5;
    if (!bannerType) bannerType = "limited_character";

    // Step 1 — Backfill (pityCount - 1) placeholder 3-star pulls
    for (let i = 0; i < pityCount - 1; i++) {
      const entryDate = new Date(now.getTime() - (pityCount - i) * 1000);
      gachaStore.add_pull({
        name:      "Unknown",
        type:      bannerType,
        rarity:    3,
        pity:      null,          // placeholder — no named pity milestone
        timestamp: entryDate.getTime(),
        time:      localISOStr(entryDate)
      });
    }

    // Step 2 — Commit the actual named pull at the declared pity position
    gachaStore.add_pull({
      name:      itemName,
      type:      bannerType,
      rarity,
      pity:      pityCount,
      timestamp: now.getTime(),
      time:      localISOStr(now)
    });

    const bannerLabel = {
      limited_character: "Character Banner",
      limited_weapon:    "Weapon Banner",
      standard:          "Standard Banner"
    }[bannerType] ?? bannerType;

    pushAssistant(
      `Alright Traveler! Paimon backfilled ${pityCount - 1} placeholder pulls and logged ` +
      `${itemName} (${rarity}★) to your ${bannerLabel} at pull #${pityCount}. ` +
      `Your lifetime counter and pity tracker are now accurate!`
    );

  // ── Tool 2: Force-set pity counters ────────────────
  } else if (toolName === "configure_pity_counters") {
    gachaStore.force_update_pity({
      type:     args.banner_type,
      fivePity: Number(args.five_star_pity),
      fourPity: Number(args.four_star_pity)
    });

    const bannerLabel = {
      limited_character: "Character Banner",
      limited_weapon:    "Weapon Banner",
      standard:          "Standard Banner"
    }[args.banner_type] ?? args.banner_type;

    pushAssistant(
      `Done! Paimon updated your ${bannerLabel} pity counters — ` +
      `5★ pity is now ${args.five_star_pity}, 4★ pity is now ${args.four_star_pity}.`
    );

  // ── Tool 3: Manage todo tasks ───────────────────────
  } else if (toolName === "manage_todo_task") {
    const { action, task_name, task_type, task_id } = args;

    if (action === "add") {
      todoStore.addTodo({
        type:         task_type ?? "character",
        name:         task_name ?? "Unknown",
        currentLevel: 1,
        targetLevel:  90,
        mora:         2_000_000,
        items: [
          { name: "talent_book",  label: "Talent Book",             count: 9  },
          { name: "asc_gem",      label: "Elemental Ascension Gem", count: 6  },
          { name: "boss_mat",     label: "Boss Drop Material",      count: 46 }
        ]
      });
      pushAssistant(
        `Got it! Paimon added a ${task_type ?? "character"} farming checklist for ${task_name ?? "the item"} ` +
        `(Level 1 → 90) to your Todo List. Head there to see the full material breakdown!`
      );

    } else if (action === "complete") {
      if (task_id) {
        todoStore.completeTodo(Number(task_id));
        pushAssistant(
          `Paimon marked the task for ${task_name ?? "that item"} as complete. Great work, Traveler!`
        );
      } else {
        pushAssistant(
          `Paimon needs the task ID to mark it as complete. ` +
          `Tell Paimon which task by saying something like "complete task ID 12345".`
        );
      }

    } else if (action === "remove") {
      if (task_id) {
        todoStore.removeTodo(Number(task_id));
        pushAssistant(`Done! Paimon removed the farming task for ${task_name ?? "that item"}.`);
      } else {
        pushAssistant(
          `Paimon needs the task ID to remove it. ` +
          `Say something like "remove task ID 12345".`
        );
      }
    }

  // ── Tool 4: Manage planner goals ───────────────────
  } else if (toolName === "manage_planner_goal") {
    const { action, goal_name, target_week, pull_type, needed_wishes, goal_id } = args;

    if (action === "create") {
      goalStore.addGoal({
        goalName:     goal_name     ?? "New Goal",
        targetWeek:   target_week   ?? "",
        pullType:     pull_type     ?? "limited_character",
        neededWishes: Number(needed_wishes ?? 0)
      });
      pushAssistant(
        `Paimon created a new savings goal: "${goal_name}" targeting ${needed_wishes} pulls ` +
        `by ${target_week}. The Goal Planner dashboard has been updated!`
      );

    } else if (action === "update") {
      if (goal_id) {
        const patch = {};
        if (goal_name)     patch.goalName     = goal_name;
        if (target_week)   patch.targetWeek   = target_week;
        if (pull_type)     patch.pullType     = pull_type;
        if (needed_wishes) patch.neededWishes = Number(needed_wishes);

        goalStore.updateGoal(Number(goal_id), patch);
        pushAssistant(`Paimon updated your "${goal_name ?? "goal"}" in the Planner. Changes saved!`);
      } else {
        pushAssistant(`Paimon needs the goal ID to update it. Check your Planner for the existing goal IDs.`);
      }

    } else if (action === "delete") {
      if (goal_id) {
        goalStore.removeGoal(Number(goal_id));
        pushAssistant(`Done! Paimon deleted the goal "${goal_name ?? ""}" from your Planner.`);
      } else {
        pushAssistant(`Paimon needs the goal ID to delete it. Try saying "delete goal ID 12345".`);
      }
    }
  } else if (toolName === "Maps_application") {
    const destination = args.destination;
    const routeMap = {
      home: "/",
      calculator: "/calculator",
      wish_counter: "/wish-counter",
      analytics: "/wish-analytics",
      todo_list: "/todo-list",
      planner: "/planner",
      login: "/login",
      registration: "/registration",
      about: "/about",
      account_setting: "/account_setting"
    };
    const route = routeMap[destination];
    if (!route) {
      pushAssistant(`Paimon couldn't find the page for "${destination}".`);
      return;
    }
    
    if ((destination === "account_setting" || destination === "planner") && !authStore.currentUser) {
      pushAssistant(
        "Paimon tried to open your Planner page, but it looks like you aren't signed in yet! " +
        "Please use the Sign In box on your screen to log in so your farming checklists can sync to the database."
      );
      return;
    } else {
      try {
        await router.push(route);
        const pageName = {
          "/": "Homepage",
          "/calculator": "Calculator",
          "/wish-counter": "Wish Counter",
          "/wish-analytics": "Wish Analytics",
          "/todo-list": "Todo List",
          "/planner": "Planner",
          "/account_setting": "Account Settings",
          "/login": "Login Page",
          "/registration": "Registration Page",
          "/character": "Character Details"
        }[route] || route;
        pushAssistant(`Paimon has routed you to the ${pageName}!`);
      } catch (err) {
        console.error("Router navigation failed:", err);
        pushAssistant("Paimon encountered an error trying to navigate to that page.");
      }
    }
  } else if (toolName === "setup_calculator") {
    const itemName = args.item_name;
    const currentLevel = args.current_level;
    const targetLevel = args.target_level;

    gachaStore.calculatorTarget = {
      item_name: itemName,
      current_level: currentLevel,
      target_level: targetLevel
    };

    try {
      await router.push("/calculator");
      pushAssistant(`Paimon has set up the calculator for ${itemName}!`);
    } catch (err) {
      console.error("Router navigation to calculator failed:", err);
      pushAssistant("Paimon encountered an error trying to navigate to the calculator.");
    }
  }
};

// =====================================================
// CORE SUBMIT FLOW
// =====================================================
const handleMessageSubmit = async (messageText) => {
  if (!messageText.trim()) return;

  chatHistory.value.push({ role: "user", text: messageText, time: ts() });
  isLoading.value = true;
  await scrollToBottom();

  // Build message array: system prompt + conversation history + new user turn
  const messages = [
    { role: "system", content: getSystemPrompt() },
    ...chatHistory.value
        .slice(0, -1)  // exclude the message we just pushed
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
    { role: "user", content: messageText }
  ];

  let result = null;
  try {
    result = await callUnifiedAI({
      messages,
      tools:    TOOLS,
      storeCtx: buildStoreContext(),
      systemPrompt: getSystemPrompt()
    });
  } catch (err) {
    console.error("[AI Service] callUnifiedAI error:", err);
    pushAssistant("I ran into an issue processing that. Could you clarify the exact details (like banner, rarity, or level)?");
    isLoading.value = false;
    await scrollToBottom();
    return;
  }

  isLoading.value = false;

  if (result === null) {
    pushAssistant("I ran into an issue processing that. Could you clarify the exact details (like banner, rarity, or level)?");
  } else if (result.type === "tool_call") {
    try {
      await executeTool(result.tool, result.args);
    } catch (toolErr) {
      console.error("[AI Service] executeTool failed:", toolErr);
      pushAssistant("I ran into an issue processing that. Could you clarify the exact details (like banner, rarity, or level)?");
    }
  } else if (result.type === "tool_calls") {
    try {
      for (const call of result.calls) {
        await executeTool(call.tool, call.args);
      }
    } catch (toolErr) {
      console.error("[AI Service] executeTool (bulk) failed:", toolErr);
      pushAssistant("I ran into an issue processing that. Could you clarify the exact details (like banner, rarity, or level)?");
    }
  } else {
    pushAssistant(result.text || "I ran into an issue processing that. Could you clarify the exact details (like banner, rarity, or level)?");
  }

  await scrollToBottom();
};

const submitMessage = () => {
  const msg = inputMessage.value.trim();
  if (!msg) return;
  inputMessage.value = "";
  handleMessageSubmit(msg);
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) scrollToBottom();
};

// Helpers
function ts() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function pushAssistant(text) {
  chatHistory.value.push({ role: "assistant", text, time: ts() });
}
const scrollToBottom = async () => {
  await nextTick();
  if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight;
};
</script>

<template>
  <div class="ai_assistant_container">

    <!-- FAB Toggle -->
    <button
      class="ai_assistant_fab"
      :class="{ 'ai_assistant_fab--open': isOpen }"
      @click="toggleChat"
      :title="isOpen ? 'Close Paimon AI' : 'Open Paimon AI'"
      aria-label="Toggle AI assistant"
    >
      <span aria-hidden="true">{{ isOpen ? '✕' : '💬' }}</span>
    </button>

    <!-- Chat Panel -->
    <Transition name="ai_assistant_slide">
      <div v-if="isOpen" class="ai_assistant_panel" role="dialog" aria-label="Paimon AI Assistant">

        <!-- Header -->
        <div class="ai_assistant_header">
          <span class="ai_assistant_header__title">✨ Paimon AI</span>
          <button class="ai_assistant_header__close" @click="toggleChat" aria-label="Close">✕</button>
        </div>

        <!-- Scrollable Message List -->
        <div class="ai_assistant_body" ref="chatBody" data-lenis-prevent>
          <div
            v-for="(msg, i) in chatHistory"
            :key="i"
            :class="[
              'ai_assistant_row',
              msg.role === 'user' ? 'ai_assistant_row--user' : 'ai_assistant_row--assistant'
            ]"
          >
            <div class="ai_assistant_bubble"
                 :class="msg.role === 'user' ? 'ai_assistant_bubble--user' : 'ai_assistant_bubble--assistant'">
              <div class="ai_assistant_bubble__text">{{ msg.text }}</div>
              <div class="ai_assistant_bubble__time">{{ msg.time }}</div>
            </div>
          </div>

          <!-- Animated typing dots -->
          <div v-if="isLoading" class="ai_assistant_typing" aria-live="polite" aria-label="Paimon is thinking">
            <span class="ai_assistant_typing__dot"></span>
            <span class="ai_assistant_typing__dot"></span>
            <span class="ai_assistant_typing__dot"></span>
          </div>
        </div>

        <!-- Quick Action Chips -->
        <div class="ai_assistant_chips">
          <button class="ai_assistant_chip"
            @click="handleMessageSubmit('Summarize my wishing stats and pity counters')">
            📊 Wish stats
          </button>
          <button class="ai_assistant_chip"
            @click="handleMessageSubmit('Add Furina farming to my checklist')">
            🍀 Farm Furina
          </button>
          <button class="ai_assistant_chip"
            @click="handleMessageSubmit('Create a savings goal for Mavuika by week 2026-W40 needing 180 pulls on the character banner')">
            🎯 New goal
          </button>
          <button class="ai_assistant_chip"
            @click="handleMessageSubmit('Set my limited character banner 5-star pity to 50 and 4-star pity to 3')">
            ⚙️ Fix pity
          </button>
        </div>

        <!-- Input Footer -->
        <form class="ai_assistant_footer" @submit.prevent="submitMessage">
          <input
            class="ai_assistant_input"
            type="text"
            v-model="inputMessage"
            placeholder="Ask Paimon anything..."
            :disabled="isLoading"
            autocomplete="off"
          />
          <button
            class="ai_assistant_send"
            type="submit"
            :disabled="isLoading || !inputMessage.trim()"
          >
            Send
          </button>
        </form>

      </div>
    </Transition>

  </div>
</template>
