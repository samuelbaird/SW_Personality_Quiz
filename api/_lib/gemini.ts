export type GeminiFailReason =
  | 'timeout'
  | 'no_api_key'
  | 'http_4xx'
  | 'http_5xx'
  | 'empty_response'
  | 'network'

export interface CallGeminiArgs {
  systemInstruction: string
  userPrompt: string
  responseSchema: object
  apiKey: string
  timeoutMs?: number
  model?: string
  generationConfig?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
  }
}

type GeminiSuccess = { ok: true; raw: string }
type GeminiFailure = { ok: false; reason: GeminiFailReason; status?: number }

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

const GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_TIMEOUT_MS = 9000

function mapHttpFailure(status: number): GeminiFailure {
  if (status >= 400 && status < 500) {
    return { ok: false, reason: 'http_4xx', status }
  }
  if (status >= 500) {
    return { ok: false, reason: 'http_5xx', status }
  }
  return { ok: false, reason: 'network', status }
}

function extractResponseText(payload: GeminiApiResponse): string | null {
  const parts = payload.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts) || parts.length === 0) return null

  const text = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()

  return text.length > 0 ? text : null
}

export async function callGemini(args: CallGeminiArgs): Promise<GeminiSuccess | GeminiFailure> {
  if (!args.apiKey) {
    return { ok: false, reason: 'no_api_key' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  const model = args.model ?? GEMINI_MODEL
  const generationConfig = {
    temperature: args.generationConfig?.temperature ?? 0,
    topP: args.generationConfig?.topP ?? 0,
    topK: args.generationConfig?.topK ?? 1,
    maxOutputTokens: args.generationConfig?.maxOutputTokens ?? 1024,
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${args.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: args.systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: args.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: generationConfig.temperature,
            topP: generationConfig.topP,
            topK: generationConfig.topK,
            maxOutputTokens: generationConfig.maxOutputTokens,
            responseMimeType: 'application/json',
            responseSchema: args.responseSchema,
          },
        }),
      },
    )

    if (!response.ok) {
      return mapHttpFailure(response.status)
    }

    const payload = (await response.json()) as GeminiApiResponse
    const raw = extractResponseText(payload)
    if (!raw) {
      return { ok: false, reason: 'empty_response' }
    }

    return { ok: true, raw }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, reason: 'timeout' }
    }
    return { ok: false, reason: 'network' }
  } finally {
    clearTimeout(timeout)
  }
}
