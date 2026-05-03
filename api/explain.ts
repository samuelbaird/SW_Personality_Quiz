import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getExplainCache, setExplainCache, checkRateLimit } from './_lib/cache.js'
import { geminiDebugAllowed } from './_lib/debugGemini.js'
import { getExplainerProvider } from './_lib/explainer/index.js'
import { getJsonBody } from './_lib/parseJsonBody.js'
import type { ExplainRequestPayload, ExplainTraitSignal } from '../src/lib/explainPayload.js'
import { EXPLAIN_PAYLOAD_VERSION, quantizeTraitValue } from '../src/lib/explainPayload.js'
import { TRAIT_KEYS } from '../src/lib/traits.js'
import type { TraitKey } from '../src/types/quiz.js'

interface ExplainResponseBody {
  explanation: string
  source: 'gemini' | 'cache' | 'fallback'
  version: number
  _geminiDebug?: { route: 'explain'; raw: string }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSignalList(value: unknown): value is ExplainTraitSignal[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.trait === 'string' &&
      typeof entry.label === 'string' &&
      typeof entry.value === 'number' &&
      typeof entry.pole === 'string' &&
      typeof entry.poleLabel === 'string',
  )
}

function isExplainRequestBody(value: unknown): value is ExplainRequestPayload {
  if (!isRecord(value)) return false
  if (value.version !== EXPLAIN_PAYLOAD_VERSION) return false
  if (value.locale !== 'en') return false
  if (!isRecord(value.character)) return false
  if (typeof value.character.id !== 'string' || typeof value.character.name !== 'string') return false
  if (!isRecord(value.traits)) return false
  if (!isSignalList(value.aligned) || !isSignalList(value.divergent)) return false
  if (!Array.isArray(value.strongMatches)) return false

  for (const key of TRAIT_KEYS) {
    if (typeof value.traits[key] !== 'number') return false
  }

  if (
    'debugGemini' in value &&
    value.debugGemini !== undefined &&
    typeof value.debugGemini !== 'boolean'
  ) {
    return false
  }

  return true
}

function buildCacheKey(payload: ExplainRequestPayload): string {
  const traitHash = TRAIT_KEYS.map((key: TraitKey) => Math.round(quantizeTraitValue(payload.traits[key]) * 20)).join('-')
  const aligned = payload.aligned.map((entry) => entry.trait).join(',')
  const divergent = payload.divergent.map((entry) => entry.trait).join(',')
  return `explain:v${payload.version}:${payload.character.id}:${traitHash}:${aligned}:${divergent}:${payload.locale}`
}

function readIp(req: VercelRequest): string {
  const header = req.headers['x-forwarded-for']
  if (typeof header === 'string' && header.length > 0) {
    return header.split(',')[0].trim()
  }
  return req.socket?.remoteAddress ?? 'unknown'
}

function fallback(version: number): ExplainResponseBody {
  return { explanation: '', source: 'fallback', version }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startedAt = Date.now()
  const noCache = req.query?.nocache === '1'

  try {
    if (process.env.EXPLAIN_DISABLED === '1') {
      return res.status(200).json(fallback(EXPLAIN_PAYLOAD_VERSION))
    }

    const maxPerMinute = Number(process.env.EXPLAIN_RATE_LIMIT_PER_MINUTE || 0)
    if (maxPerMinute > 0) {
      const allowed = await checkRateLimit(readIp(req), maxPerMinute)
      if (!allowed) {
        return res.status(200).json(fallback(EXPLAIN_PAYLOAD_VERSION))
      }
    }

    const payload = getJsonBody(req)
    if (!isExplainRequestBody(payload)) {
      return res.status(400).json({ error: 'Invalid payload for /api/explain' })
    }

    const wantGeminiDebug = geminiDebugAllowed() && payload.debugGemini === true

    const cacheKey = buildCacheKey(payload)
    if (!noCache) {
      const cached = await getExplainCache(cacheKey)
      if (cached.value) {
        const body: ExplainResponseBody = {
          explanation: cached.value,
          source: 'cache',
          version: payload.version,
        }
        console.info('[explain]', { source: 'cache', layer: cached.layer, latencyMs: Date.now() - startedAt })
        return res.status(200).json(body)
      }
    }

    const provider = getExplainerProvider()
    const generated = await provider.generate(payload)
    if (!generated.ok) {
      console.warn('[explain] provider failed', { ...generated, latencyMs: Date.now() - startedAt })
      return res.status(200).json({
        ...fallback(payload.version),
        ...(wantGeminiDebug && generated.geminiRaw
          ? { _geminiDebug: { route: 'explain' as const, raw: generated.geminiRaw } }
          : {}),
      })
    }

    const explanation = generated.explanation.slice(0, 600)
    if (!noCache) {
      await setExplainCache(cacheKey, explanation)
    }

    console.info('[explain]', { source: 'gemini', latencyMs: Date.now() - startedAt })
    return res.status(200).json({
      explanation,
      source: 'gemini',
      version: payload.version,
      ...(wantGeminiDebug && generated.geminiRaw
        ? { _geminiDebug: { route: 'explain' as const, raw: generated.geminiRaw } }
        : {}),
    } satisfies ExplainResponseBody)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    console.warn('[explain] unexpected error', { message, latencyMs: Date.now() - startedAt })
    return res.status(200).json(fallback(EXPLAIN_PAYLOAD_VERSION))
  }
}
