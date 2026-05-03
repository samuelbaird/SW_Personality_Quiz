/** When true, the client requests `_geminiDebug` in API responses and logs it to the console. */
// import.meta.env is injected by Vite in browser builds; it is undefined in Node.js ESM.
// The cast keeps TypeScript happy in environments without vite/client types while
// preserving Vite's static replacement in browser builds.
const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
export const clientWantsGeminiDebugLogs =
  viteEnv?.VITE_DEBUG_GEMINI_RAW === 'true' || viteEnv?.VITE_DEBUG_GEMINI_RAW === '1'
