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

const _HARDCODED_KEYS = {
  gemini_1:   "YOUR_GEMINI_KEY_1",
  gemini_2:   "YOUR_GEMINI_KEY_2",
  gemini_3:   "YOUR_GEMINI_KEY_3",
  gemini_4:   "YOUR_GEMINI_KEY_4",
  gemini_5:   "YOUR_GEMINI_KEY_5",
  openrouter: "YOUR_OPENROUTER_KEY"
};

// Resolve a key: env var takes priority; fall back to hardcoded slot
const _resolveKey = (envValue, hardcoded) =>
  isActiveKey(envValue) ? envValue : hardcoded;

// ─── Resolved key values (used throughout this module) ─
const primaryKey     = _resolveKey(import.meta.env.VITE_GEMINI_API_KEY, _HARDCODED_KEYS.gemini_1);
const FALLBACK_KEYS  = [
  _resolveKey(import.meta.env.VITE_GEMINI_KEY_2, _HARDCODED_KEYS.gemini_2),
  _resolveKey(import.meta.env.VITE_GEMINI_KEY_3, _HARDCODED_KEYS.gemini_3),
  _resolveKey(import.meta.env.VITE_GEMINI_KEY_4, _HARDCODED_KEYS.gemini_4),
  _resolveKey(import.meta.env.VITE_GEMINI_KEY_5, _HARDCODED_KEYS.gemini_5)
];
const OPENROUTER_KEY = _resolveKey(import.meta.env.VITE_OPENROUTER_KEY, _HARDCODED_KEYS.openrouter);
const OPENROUTER_URL  = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_REST_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Centralised session cache for character summaries
export const characterCache = new Map();

// Helper: safely pull JSON out of a raw text response ─
export function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("AI did not return a valid JSON object.");
}

// =====================================================
// UNIFIED ROTATION ENGINE
// =====================================================
export async function callUnifiedAI({ messages, tools, storeCtx, systemPrompt, prompt, googleSearch = false }) {
  // Build active key slots in priority order
  const slots = [
    ...(isActiveKey(primaryKey) ? [{ type: "gemini", key: primaryKey, name: "Gemini (primary)" }] : []),
    ...FALLBACK_KEYS
        .filter(isActiveKey)
        .map((key, i) => ({ type: "gemini", key, name: `Gemini (slot ${i + 2})` })),
    ...(isActiveKey(OPENROUTER_KEY) ? [{ type: "openrouter", key: OPENROUTER_KEY, name: "OpenRouter" }] : [])
  ];

  if (slots.length === 0) {
    console.warn("[AI Service] No active keys configured.");
    throw new Error("No active AI provider keys configured.");
  }

  // Try each slot sequentially
  for (const slot of slots) {
    try {
      console.log(`[AI Service] Attempting → ${slot.name}`);

      if (slot.type === "gemini") {
        return await _callGeminiRestUnified({
          key: slot.key,
          messages,
          tools,
          storeCtx,
          systemPrompt,
          prompt,
          googleSearch
        });
      } else {
        return await _callOpenRouterUnified({
          key: slot.key,
          messages,
          tools,
          storeCtx,
          systemPrompt,
          prompt
        });
      }
    } catch (err) {
      console.warn(`[AI Service] Slot failed (${slot.name}): ${err.message} — trying next…`);
    }
  }

  // All slots failed
  throw new Error("All AI provider slots failed.");
}

// ─── Private: Gemini REST Unified ──
async function _callGeminiRestUnified({ key, messages, tools, storeCtx, systemPrompt, prompt, googleSearch }) {
  let systemInstruction = undefined;
  let contents = [];
  const geminiTools = [];

  if (messages) {
    // Chat mode
    const systemText = systemPrompt || (messages.find(m => m.role === "system")?.content ?? "");
    const conversationMsgs = messages.filter(m => m.role !== "system");

    systemInstruction = {
      parts: [{ text: `${systemText}\n\nCurrent user data context:\n${storeCtx}` }]
    };

    contents = conversationMsgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
  } else if (prompt) {
    // Single prompt mode (Character Summary)
    contents = [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ];
    if (systemPrompt) {
      systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }
  }

  // Handle tools
  if (googleSearch) {
    geminiTools.push({ googleSearch: {} });
  }

  if (tools && tools.length > 0) {
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
    geminiTools.push({ functionDeclarations });
  }

  const requestBody = { contents };
  if (systemInstruction) {
    requestBody.systemInstruction = systemInstruction;
  }
  if (geminiTools.length > 0) {
    requestBody.tools = geminiTools;
  }

  const response = await fetch(`${GEMINI_REST_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  
  // Extract all function calls
  const toolCalls = parts.filter(p => p.functionCall).map(p => ({
    tool: p.functionCall.name,
    args: p.functionCall.args
  }));

  if (toolCalls.length > 1) {
    console.log(`[AI Service | Gemini] Multiple tool calls:`, toolCalls);
    return { type: "tool_calls", calls: toolCalls };
  } else if (toolCalls.length === 1) {
    console.log(`[AI Service | Gemini] Single tool call: ${toolCalls[0].tool}`, toolCalls[0].args);
    return { type: "tool_call", tool: toolCalls[0].tool, args: toolCalls[0].args };
  }

  const part = parts[0];
  return { type: "text", text: part?.text ?? "" };
}

// ─── Private: OpenRouter Unified ───────────
async function _callOpenRouterUnified({ key, messages, tools, storeCtx, systemPrompt, prompt }) {
  let enrichedMessages = [];
  let openAITools = undefined;

  if (messages) {
    // Chat mode
    const systemText = systemPrompt || (messages.find(m => m.role === "system")?.content ?? "");
    const conversationMsgs = messages.filter(m => m.role !== "system");

    enrichedMessages = [
      { role: "system", content: `${systemText}\n\nCurrent user data context:\n${storeCtx}` },
      ...conversationMsgs
    ];
  } else if (prompt) {
    // Single prompt mode
    if (systemPrompt) {
      enrichedMessages.push({ role: "system", content: systemPrompt });
    }
    enrichedMessages.push({ role: "user", content: prompt });
  }

  if (tools && tools.length > 0) {
    openAITools = tools.map(tool => ({
      type: "function",
      function: { name: tool.name, description: tool.description, parameters: tool.parameters }
    }));
  }

  const body = {
    model: "google/gemini-2.5-flash",
    messages: enrichedMessages
  };
  if (openAITools) {
    body.tools = openAITools;
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data    = await response.json();
  const message = data.choices?.[0]?.message;

  if (message?.tool_calls && message.tool_calls.length > 0) {
    const toolCalls = message.tool_calls.map(tc => {
      let args = {};
      try { args = JSON.parse(tc.function.arguments); } catch { /* silent */ }
      return { tool: tc.function.name, args };
    });

    if (toolCalls.length > 1) {
      console.log(`[AI Service | OpenRouter] Multiple tool calls:`, toolCalls);
      return { type: "tool_calls", calls: toolCalls };
    } else {
      console.log(`[AI Service | OpenRouter] Single tool call: ${toolCalls[0].tool}`, toolCalls[0].args);
      return { type: "tool_call", tool: toolCalls[0].tool, args: toolCalls[0].args };
    }
  }
  return { type: "text", text: message?.content ?? "" };
}

// =====================================================
// CHARACTER SUMMARY (Wrapper for compatibility)
// =====================================================
export async function getCharacterSummary(characterName) {
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

  const result = await callUnifiedAI({
    prompt,
    googleSearch: true
  });

  console.log(`[AI Summarizer] Raw response for ${characterName}:`, result.text);
  return extractJSON(result.text);
}

// Expose callChatAI for backward compatibility/simplicity
export async function callChatAI({ messages, tools, storeCtx }) {
  try {
    return await callUnifiedAI({ messages, tools, storeCtx });
  } catch (err) {
    console.error("[AI Service] callChatAI failed:", err);
    return null;
  }
}
