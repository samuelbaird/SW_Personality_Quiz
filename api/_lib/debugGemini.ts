/** When true, /api/* may echo Gemini raw text if the client also sends `debugGemini: true`. */
export function geminiDebugAllowed(): boolean {
  const v = process.env.DEBUG_GEMINI_RAW
  return v === 'true' || v === '1'
}
