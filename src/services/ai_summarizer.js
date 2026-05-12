import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }] 
});

// Helper to safely extract JSON and ignore extra text
function extractJSON(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    } else {
        throw new Error("AI did not return a valid JSON object.");
    }
}

export async function getCharacterSummary(characterName) {
    if (!apiKey) throw new Error("Gemini API key is missing.");

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
    const result = await model.generateContent(prompt);
    // return extractJSON(result.response.text());

    const rawText = result.response.text();
    
    // Output the raw text to the browser console for debugging
    console.log(`[DEBUG] Raw AI Response for ${characterName}:`, rawText); 
    
    return extractJSON(rawText);
}