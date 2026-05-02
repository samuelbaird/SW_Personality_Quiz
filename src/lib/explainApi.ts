import { generateExplanation } from './explanation'
import { clientWantsGeminiDebugLogs } from './debugGeminiClient'
import type { ExplainRequestPayload } from './explainPayload'
import type { ExplanationSource } from '../types/quiz'

export interface ExplainApiResponse {
  explanation: string
  source: Exclude<ExplanationSource, 'pending'>
  version: number
}

interface ExplainServerSuccess {
  explanation?: unknown
  source?: unknown
  version?: unknown
  _geminiDebug?: { route: 'explain'; raw: string }
}

function isExplainServerSuccess(value: unknown): value is ExplainServerSuccess {
  return typeof value === 'object' && value !== null
}

function fallbackResponse(payload: ExplainRequestPayload): ExplainApiResponse {
  return {
    explanation: generateExplanation(payload.traits),
    source: 'fallback',
    version: payload.version,
  }
}

export async function fetchExplanation(
  payload: ExplainRequestPayload,
  options: { timeoutMs?: number; noCache?: boolean } = {},
): Promise<ExplainApiResponse> {
  const timeoutMs = options.timeoutMs ?? 8000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const query = options.noCache ? '?nocache=1' : ''
    const response = await fetch(`/api/explain${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      if (import.meta.env.DEV) {
        const detail = await response.clone().text()
        console.warn('[explain] /api/explain HTTP', response.status, detail.slice(0, 1200))
      }
      return fallbackResponse(payload)
    }

    const data = (await response.json().catch(() => null)) as unknown
    if (!isExplainServerSuccess(data)) {
      return fallbackResponse(payload)
    }

    const explanation = typeof data.explanation === 'string' ? data.explanation.trim() : ''
    if (!explanation) {
      return fallbackResponse(payload)
    }

    const source =
      data.source === 'gemini' || data.source === 'cache' || data.source === 'fallback'
        ? data.source
        : 'fallback'

    if (clientWantsGeminiDebugLogs && data._geminiDebug?.raw !== undefined) {
      console.info('[Gemini raw] POST /api/explain', data._geminiDebug.raw)
    }

    return {
      explanation: explanation.slice(0, 600),
      source,
      version: typeof data.version === 'number' ? data.version : payload.version,
    }
  } catch {
    return fallbackResponse(payload)
  } finally {
    clearTimeout(timeout)
  }
}
