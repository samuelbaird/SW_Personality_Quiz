/** When true, the client requests `_geminiDebug` in API responses and logs it to the console. */
const viteDebugRaw = import.meta.env?.VITE_DEBUG_GEMINI_RAW
export const clientWantsGeminiDebugLogs =
  viteDebugRaw === 'true' || viteDebugRaw === '1'
