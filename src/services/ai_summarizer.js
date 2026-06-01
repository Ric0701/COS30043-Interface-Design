// =====================================================
// AI Summarizer Service  (src/services/ai_summarizer.js)
//
// Centralised AI layer used by both:
//   • Character page  → getCharacterSummary()
//   • AI Chat Widget  → callChatAI()
//
// Key resolution order (for the chatbot):
//   VITE_GEMINI_API_KEY → VITE_GEMINI_KEY_2 → VITE_GEMINI_KEY_3
//   → VITE_OPENROUTER_KEY → local simulation engine (no key needed)
// =====================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Helper: is a key real (not empty / placeholder)? ─
// Declared first so the key resolution block below can reference it.
const isActiveKey = (k) => k && k.length > 10 && !k.startsWith("YOUR_");

// =====================================================
// DEVELOPER: API KEY CONFIGURATION
// You have TWO ways to provide your API keys:
//
// Option A — Hardcode here (easiest for local dev):
//   Paste your real key as the value for each slot below.
//   Leave a slot as "YOUR_GEMINI_KEY_x" to skip it.
//
// Option B — Use .env (more secure):
//   Set VITE_GEMINI_API_KEY, VITE_GEMINI_KEY_2, etc. in .env
//   and restart the dev server. Env values override these if set.
// =====================================================
const _HARDCODED_KEYS = {
  gemini_1:   "YOUR_GEMINI_KEY_1",    // ← paste your primary Gemini key here
  gemini_2:   "YOUR_GEMINI_KEY_2",    // ← paste a second Gemini key for failover
  gemini_3:   "YOUR_GEMINI_KEY_3",    // ← paste a third Gemini key for failover
  openrouter: "YOUR_OPENROUTER_KEY"   // ← paste your OpenRouter key here
};

// Resolve a key: env var takes priority; fall back to hardcoded slot
const _resolveKey = (envValue, hardcoded) =>
  isActiveKey(envValue) ? envValue : hardcoded;

// ─── Resolved key values (used throughout this module) ─
const primaryKey     = _resolveKey(import.meta.env.VITE_GEMINI_API_KEY, _HARDCODED_KEYS.gemini_1);
const FALLBACK_KEYS  = [
  _resolveKey(import.meta.env.VITE_GEMINI_KEY_2, _HARDCODED_KEYS.gemini_2),
  _resolveKey(import.meta.env.VITE_GEMINI_KEY_3, _HARDCODED_KEYS.gemini_3)
];
const OPENROUTER_KEY = _resolveKey(import.meta.env.VITE_OPENROUTER_KEY, _HARDCODED_KEYS.openrouter);
const OPENROUTER_URL  = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_REST_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";


// ─── Helper: safely pull JSON out of a raw text response ─
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("AI did not return a valid JSON object.");
}

// =====================================================
// CHARACTER SUMMARY  (used by the Character page)
// Uses the primary Gemini key with Google Search grounding.
// =====================================================
export async function getCharacterSummary(characterName) {
  if (!isActiveKey(primaryKey)) throw new Error("Gemini API key (VITE_GEMINI_API_KEY) is missing or not configured.");

  const genAI = new GoogleGenerativeAI(primaryKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }],
  });

  const prompt = `
    Perform a web search for the latest meta info on the Genshin Impact character "${characterName}".
    Return ONLY a JSON object. Do not include markdown.
    Schema:
    {
        "character_name": "string (Just the name, no extra words)",
        "description": "string (A short 2-sentence summary of their lore and role)",
        "strengths": ["string", "string", "string"],
        "important_details": "string (Key mechanics or best team synergy)",
        "worth_pulling": "string (Yes/No/Situational with a brief reason)"
    }
  `;

  const result  = await model.generateContent(prompt);
  const rawText = result.response.text();
  console.log(`[AI Summarizer] Raw response for ${characterName}:`, rawText);
  return extractJSON(rawText);
}

// =====================================================
// CHAT AI  (used by the AI Assistant Widget)
//
// Accepts a unified messages array and tool schemas, then
// attempts each key slot in order, falling back gracefully.
//
// Parameters:
//   messages  – Array<{ role: "user"|"model"|"system", content: string }>
//   tools     – Array<UnifiedToolSchema>  (defined in the widget)
//   storeCtx  – string  (JSON snapshot of Pinia state)
//
// Returns one of:
//   { type: "tool_call", tool: string, args: object }
//   { type: "text",      text: string }
// =====================================================
export async function callChatAI({ messages, tools, storeCtx }) {
  // ── Build the ordered slot list ──────────────────────
  const slots = [
    ...(isActiveKey(primaryKey) ? [{ type: "gemini", key: primaryKey,     name: "Gemini (primary)" }] : []),
    ...FALLBACK_KEYS
        .filter(isActiveKey)
        .map((key, i) => ({ type: "gemini", key, name: `Gemini (slot ${i + 2})` })),
    ...(isActiveKey(OPENROUTER_KEY) ? [{ type: "openrouter", key: OPENROUTER_KEY, name: "OpenRouter" }] : [])
  ];

  // ── Try each slot ────────────────────────────────────
  for (const slot of slots) {
    try {
      console.log(`[AI Service] Attempting → ${slot.name}`);

      if (slot.type === "gemini") {
        return await _callGeminiRest(slot.key, messages, tools, storeCtx);
      } else {
        return await _callOpenRouter(slot.key, messages, tools, storeCtx);
      }

    } catch (err) {
      console.warn(`[AI Service] Slot failed (${slot.name}): ${err.message} — trying next…`);
    }
  }

  // ── All slots exhausted → caller handles simulation ──
  console.log("[AI Service] All slots exhausted. Returning null for simulation fallback.");
  return null;
}

// ─── Private: Gemini REST (no SDK dependency needed) ──
async function _callGeminiRest(key, messages, tools, storeCtx) {
  // Separate out the system instruction (first message with role "system")
  const systemText = messages.find(m => m.role === "system")?.content ?? "";
  const conversationMsgs = messages.filter(m => m.role !== "system");

  const systemInstruction = {
    parts: [{ text: `${systemText}\n\nCurrent user data context:\n${storeCtx}` }]
  };

  const contents = conversationMsgs.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  // Map unified tool schema → Google functionDeclarations format
  const functionDeclarations = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: "OBJECT",
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([k, v]) => [
          k,
          {
            type: v.type.toUpperCase(),
            description: v.description,
            ...(v.enum ? { enum: v.enum } : {})
          }
        ])
      ),
      required: tool.parameters.required ?? []
    }
  }));

  const response = await fetch(`${GEMINI_REST_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, contents, tools: [{ functionDeclarations }] })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.[0];

  if (part?.functionCall) {
    console.log(`[AI Service | Gemini] Tool call: ${part.functionCall.name}`, part.functionCall.args);
    return { type: "tool_call", tool: part.functionCall.name, args: part.functionCall.args };
  }
  return { type: "text", text: part?.text ?? "" };
}

// ─── Private: OpenRouter (OpenAI-compatible) ───────────
async function _callOpenRouter(key, messages, tools, storeCtx) {
  // Inject store context into the system message
  const enrichedMessages = messages.map(m =>
    m.role === "system"
      ? { ...m, content: `${m.content}\n\nCurrent user data context:\n${storeCtx}` }
      : m
  );

  const openAITools = tools.map(tool => ({
    type: "function",
    function: { name: tool.name, description: tool.description, parameters: tool.parameters }
  }));

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: enrichedMessages,
      tools: openAITools
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data    = await response.json();
  const message = data.choices?.[0]?.message;

  if (message?.tool_calls?.[0]) {
    const tc = message.tool_calls[0];
    let args = {};
    try { args = JSON.parse(tc.function.arguments); } catch { /* silent */ }
    console.log(`[AI Service | OpenRouter] Tool call: ${tc.function.name}`, args);
    return { type: "tool_call", tool: tc.function.name, args };
  }
  return { type: "text", text: message?.content ?? "" };
}
