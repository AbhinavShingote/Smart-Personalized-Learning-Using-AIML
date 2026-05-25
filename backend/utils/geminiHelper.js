// utils/geminiHelper.js

/**
 * Parses and returns all unique, non-empty Gemini API keys from the environment.
 * Supports a comma-separated list in GEMINI_API_KEY and/or numbered keys:
 * GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.
 * @returns {string[]} An array of valid API key strings.
 */
function getGeminiKeys() {
  const keys = [];
  
  // 1. Parse standard key (support comma-separated list)
  if (process.env.GEMINI_API_KEY) {
    const splitKeys = process.env.GEMINI_API_KEY.split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
    keys.push(...splitKeys);
  }
  
  // 2. Parse numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && typeof key === "string" && key.trim()) {
      const trimmed = key.trim();
      if (!keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    }
  }
  
  return [...new Set(keys)];
}

/**
 * Executes a callback function with API key rotation.
 * If the callback throws a 429 (rate-limit / quota) error, it automatically 
 * rotates to the next available API key and retries the operation.
 * @param {Function} fn Callback function taking (apiKey) as parameter.
 * @returns {Promise<any>} The result of the callback function.
 */
async function executeWithKeyRotation(fn) {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured.");
  }
  
  let lastError = null;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      // Log connection attempt with masked key for privacy/security
      const maskedKey = key.length > 8 ? `${key.slice(0, 6)}...${key.slice(-4)}` : "***";
      console.log(`🤖 [GEMINI-HELPER] Attempting LLM call using Key #${i + 1}/${keys.length} (${maskedKey})...`);
      
      return await fn(key);
    } catch (err) {
      lastError = err;
      
      if (i < keys.length - 1) {
        const errorSummary = err.message || String(err);
        console.warn(`⚠️ [GEMINI-HELPER] Key #${i + 1} failed (Error: ${errorSummary.slice(0, 100)}...). Rotating to Key #${i + 2}...`);
        continue;
      }
      
      // If we ran out of keys, throw the error
      throw err;
    }
  }
  
  throw lastError || new Error("Failed to execute Gemini request with key rotation.");
}

module.exports = {
  getGeminiKeys,
  executeWithKeyRotation
};
