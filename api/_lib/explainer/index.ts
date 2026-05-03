import type { ExplainRequestPayload } from '../../../src/lib/explainPayload.js'
import { geminiDebugAllowed } from '../debugGemini.js'
import { callGemini } from '../gemini.js'
import {
  EXPLAIN_RESPONSE_SCHEMA,
  EXPLAIN_SYSTEM_INSTRUCTION,
  buildExplainUserPrompt,
} from '../explainPrompt.js'
import { safeParseExplanationResponse } from '../validation.js'

export type ExplainerGenerateResult =
  | { ok: true; explanation: string; geminiRaw?: string }
  | { ok: false; reason: string; geminiRaw?: string }

export interface ExplainerProvider {
  generate(payload: ExplainRequestPayload): Promise<ExplainerGenerateResult>
}

function getExplainModel(): string {
  return process.env.GEMINI_EXPLAIN_MODEL || 'gemini-2.5-flash'
}

export const geminiExplainer: ExplainerProvider = {
  async generate(payload) {
    const wantRaw = geminiDebugAllowed() && payload.debugGemini === true
    const apiKey = process.env.GEMINI_API_KEY
    const result = await callGemini({
      apiKey: apiKey ?? '',
      model: getExplainModel(),
      timeoutMs: 5000,
      systemInstruction: EXPLAIN_SYSTEM_INSTRUCTION,
      userPrompt: buildExplainUserPrompt(payload),
      responseSchema: EXPLAIN_RESPONSE_SCHEMA,
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 512,
      },
    })

    if (!result.ok) {
      console.warn('[explain] Gemini call failed', { reason: result.reason })
      return { ok: false, reason: result.reason }
    }

    const parsed = safeParseExplanationResponse(result.raw)
    if (!parsed) {
      console.warn('[explain] Gemini response failed validation')
      return {
        ok: false,
        reason: 'invalid_payload',
        geminiRaw: wantRaw ? result.raw : undefined,
      }
    }

    return {
      ok: true,
      explanation: parsed.explanation,
      geminiRaw: wantRaw ? result.raw : undefined,
    }
  },
}

export function getExplainerProvider(): ExplainerProvider {
  const selected = process.env.EXPLAIN_PROVIDER
  if (!selected || selected === 'gemini') {
    return geminiExplainer
  }
  return geminiExplainer
}
