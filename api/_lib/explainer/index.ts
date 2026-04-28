import type { ExplainRequestPayload } from '../../../src/lib/explainPayload'
import { callGemini } from '../gemini'
import {
  EXPLAIN_RESPONSE_SCHEMA,
  EXPLAIN_SYSTEM_INSTRUCTION,
  buildExplainUserPrompt,
} from '../explainPrompt'
import { safeParseExplanationResponse } from '../validation'

export interface ExplainerProvider {
  generate(payload: ExplainRequestPayload): Promise<{ ok: true; explanation: string } | { ok: false; reason: string }>
}

function getExplainModel(): string {
  return process.env.GEMINI_EXPLAIN_MODEL || 'gemini-2.5-flash'
}

export const geminiExplainer: ExplainerProvider = {
  async generate(payload) {
    const apiKey = process.env.GEMINI_API_KEY
    const result = await callGemini({
      apiKey: apiKey ?? '',
      model: getExplainModel(),
      timeoutMs: 1200,
      systemInstruction: EXPLAIN_SYSTEM_INSTRUCTION,
      userPrompt: buildExplainUserPrompt(payload),
      responseSchema: EXPLAIN_RESPONSE_SCHEMA,
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 180,
      },
    })

    if (!result.ok) {
      return { ok: false, reason: result.reason }
    }

    const parsed = safeParseExplanationResponse(result.raw)
    if (!parsed) {
      return { ok: false, reason: 'invalid_payload' }
    }

    return { ok: true, explanation: parsed.explanation }
  },
}

export function getExplainerProvider(): ExplainerProvider {
  const selected = process.env.EXPLAIN_PROVIDER
  if (!selected || selected === 'gemini') {
    return geminiExplainer
  }
  return geminiExplainer
}
