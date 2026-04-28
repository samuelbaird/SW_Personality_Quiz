import type { PersonalityTraits } from '../../src/types/quiz'
import { TRAIT_KEYS, normalizeTraits } from '../../src/lib/traits'

interface GeminiPayload {
  traits?: unknown
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

function countMissingTraits(value: unknown): number {
  if (!isRecord(value)) return TRAIT_KEYS.length
  return TRAIT_KEYS.filter((key) => typeof value[key] !== 'number').length
}

export function safeParseGeminiResponse(
  raw: string,
): { traits: PersonalityTraits; explanation: string } | null {
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
  const missingTraits = countMissingTraits(payload.traits)
  if (missingTraits > 5) {
    return null
  }

  const traits = normalizeTraits(isRecord(payload.traits) ? (payload.traits as Partial<PersonalityTraits>) : {})
  const explanation = typeof payload.explanation === 'string' ? payload.explanation.slice(0, 600) : ''

  return { traits, explanation }
}
