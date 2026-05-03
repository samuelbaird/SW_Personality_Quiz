import type {
  CharacterProfile,
  CharacterScore,
  PersonalityTraits,
  TraitDescriptor,
  TraitKey,
} from '../types/quiz.js'
import { clientWantsGeminiDebugLogs } from './debugGeminiClient.js'
import { clamp01, getTraitDescriptors, TRAIT_KEYS } from './traits.js'

export const EXPLAIN_PAYLOAD_VERSION = 1
export const EXPLAIN_QUANTIZE_STEP = 0.05

type PoleDirection = 'low' | 'neutral' | 'high'

export interface ExplainTraitSignal {
  trait: TraitKey
  label: string
  value: number
  pole: PoleDirection
  poleLabel: string
}

export interface ExplainRequestPayload {
  version: typeof EXPLAIN_PAYLOAD_VERSION
  locale: 'en'
  character: {
    id: string
    name: string
    signature?: string
  }
  traits: PersonalityTraits
  aligned: ExplainTraitSignal[]
  divergent: ExplainTraitSignal[]
  strongMatches: TraitKey[]
  /** When true and server DEBUG_GEMINI_RAW is set, responses may include `_geminiDebug.raw`. */
  debugGemini?: boolean
}

const TRAIT_META = getTraitDescriptors().reduce(
  (acc, descriptor) => {
    acc[descriptor.key] = descriptor
    return acc
  },
  {} as Record<TraitKey, TraitDescriptor>,
)

export function quantizeTraitValue(value: number, step = EXPLAIN_QUANTIZE_STEP): number {
  const clamped = clamp01(value)
  const scaled = Math.round(clamped / step) * step
  return Number(clamp01(scaled).toFixed(2))
}

function quantizeTraits(traits: PersonalityTraits): PersonalityTraits {
  const quantized = {} as PersonalityTraits
  for (const key of TRAIT_KEYS) {
    quantized[key] = quantizeTraitValue(traits[key])
  }
  return quantized
}

function classifyPole(value: number): PoleDirection {
  if (value < 0.4) return 'low'
  if (value > 0.6) return 'high'
  return 'neutral'
}

function toSignal(trait: TraitKey, value: number): ExplainTraitSignal {
  const descriptor = TRAIT_META[trait]
  const pole = classifyPole(value)
  const poleLabel =
    pole === 'neutral' ? 'balanced' : pole === 'high' ? descriptor.poles.high : descriptor.poles.low

  return {
    trait,
    label: descriptor.label,
    value,
    pole,
    poleLabel,
  }
}

export function buildExplainPayload(
  traits: PersonalityTraits,
  character: CharacterProfile,
  score: CharacterScore,
): ExplainRequestPayload {
  const quantizedTraits = quantizeTraits(traits)
  const sorted = [...score.contributions].sort((a, b) => a.distance - b.distance)

  return {
    version: EXPLAIN_PAYLOAD_VERSION,
    locale: 'en',
    character: {
      id: character.id,
      name: character.name,
      signature: character.signature,
    },
    traits: quantizedTraits,
    aligned: sorted.slice(0, 3).map((entry) => toSignal(entry.trait, quantizedTraits[entry.trait])),
    divergent: [...sorted].reverse().slice(0, 2).map((entry) => toSignal(entry.trait, quantizedTraits[entry.trait])),
    strongMatches: score.strongMatches,
    ...(clientWantsGeminiDebugLogs ? { debugGemini: true as const } : {}),
  }
}
