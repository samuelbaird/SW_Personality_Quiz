import type { PersonalityTraits, TraitKey } from '../../src/types/quiz.js'
import { TRAIT_KEYS, normalizeTraits } from '../../src/lib/traits.js'

interface GeminiPayload {
  traits?: unknown
  explanation?: unknown
}

interface ExplanationPayload {
  explanation?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

export function safeParseExplanationResponse(raw: string): { explanation: string } | null {
  const cleaned = stripCodeFences(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return null
  }

  if (!isRecord(parsed)) {
    return null
  }

  const payload = parsed as ExplanationPayload
  if (typeof payload.explanation !== 'string') {
    return null
  }

  const explanation = payload.explanation.trim().slice(0, 600)
  if (!explanation) {
    return null
  }

  return { explanation }
}

/**
 * Coerce a single trait value from the Gemini payload to a number.
 * Gemini occasionally emits numeric values as quoted strings (e.g. "0.75").
 * Returns undefined when the value is neither a number nor a numeric string.
 */
function coerceTraitValue(raw: unknown): number | undefined {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const n = Number(raw)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

/**
 * Extract trait values from the Gemini payload object, coercing string numbers
 * where needed, and return a partial map of only the keys that resolved.
 */
function extractTraits(value: unknown): { partial: Partial<PersonalityTraits>; missing: TraitKey[] } {
  const partial: Partial<PersonalityTraits> = {}
  const missing: TraitKey[] = []

  if (!isRecord(value)) {
    return { partial, missing: [...TRAIT_KEYS] }
  }

  for (const key of TRAIT_KEYS) {
    const coerced = coerceTraitValue(value[key])
    if (coerced !== undefined) {
      partial[key] = coerced
    } else {
      missing.push(key)
    }
  }

  return { partial, missing }
}

export function safeParseGeminiResponse(
  raw: string,
): { traits: PersonalityTraits; explanation: string; missingTraitKeys: TraitKey[] } | null {
  const cleaned = stripCodeFences(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return null
  }

  if (!isRecord(parsed)) {
    return null
  }

  const payload = parsed as GeminiPayload
  const { partial, missing } = extractTraits(payload.traits)

  // Require at least half the traits to have a real value; the rest default to 0.5 via normalizeTraits.
  if (missing.length > TRAIT_KEYS.length / 2) {
    return null
  }

  const traits = normalizeTraits(partial)
  const explanation = typeof payload.explanation === 'string' ? payload.explanation.slice(0, 600) : ''

  return { traits, explanation, missingTraitKeys: missing }
}
