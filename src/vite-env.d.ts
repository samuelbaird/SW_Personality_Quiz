/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string
  /** When "true", client sends debugGemini and logs `_geminiDebug` from APIs (requires DEBUG_GEMINI_RAW on server). */
  readonly VITE_DEBUG_GEMINI_RAW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
