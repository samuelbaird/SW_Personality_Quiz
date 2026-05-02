import type {
  PersonalityTraits,
  TraitDescriptor,
  TraitGroup,
  TraitKey,
} from '../types/quiz'

/** Clamp a number into [min, max], returning a safe fallback for NaN/Infinity. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return (min + max) / 2
  }
  if (value < min) return min
  if (value > max) return max
  return value
}

/** Convenience wrapper around `clamp` for the canonical 0..1 trait range. */
export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

/**
 * Linearly map `value` from [min, max] into [0, 1]. Returns 0.5 when the
 * range collapses, so degenerate inputs do not poison downstream math.
 */
export function normalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0.5
  if (max === min) return 0.5
  return clamp01((value - min) / (max - min))
}

const TRAIT_DESCRIPTORS: TraitDescriptor[] = [
  { key: 'morality', label: 'Morality', group: 'cognitive', poles: { low: 'Dark', high: 'Light' } },
  { key: 'agency', label: 'Agency', group: 'cognitive', poles: { low: 'Reactive', high: 'Proactive' } },
  { key: 'powerOrientation', label: 'Power Orientation', group: 'cognitive', poles: { low: 'Service', high: 'Control' } },
  { key: 'emotionalRegulation', label: 'Emotional Regulation', group: 'cognitive', poles: { low: 'Impulsive', high: 'Controlled' } },
  { key: 'socialOrientation', label: 'Social Orientation', group: 'cognitive', poles: { low: 'Individual', high: 'Collective' } },
  { key: 'strategicThinking', label: 'Strategic Thinking', group: 'cognitive', poles: { low: 'Tactical', high: 'Long-term' } },
  { key: 'conviction', label: 'Conviction', group: 'cognitive', poles: { low: 'Flexible', high: 'Dogmatic' } },
  { key: 'riskTolerance', label: 'Risk Tolerance', group: 'cognitive', poles: { low: 'Cautious', high: 'Bold' } },
  { key: 'authorityOrientation', label: 'Authority Orientation', group: 'cognitive', poles: { low: 'Diplomatic', high: 'Directive' } },
  { key: 'authorityRigidity', label: 'Authority Rigidity', group: 'cognitive', poles: { low: 'Adaptive', high: 'Doctrinal' } },
  { key: 'evaluationBasis', label: 'Evaluation Basis', group: 'cognitive', poles: { low: 'Outcome-based', high: 'Process-based' } },
  { key: 'competenceSensitivity', label: 'Competence Sensitivity', group: 'cognitive', poles: { low: 'Loyalty/Outcome', high: 'Competence-driven' } },

  { key: 'eloquence', label: 'Eloquence', group: 'expression', poles: { low: 'Simple', high: 'Articulate' } },
  { key: 'emotionalTone', label: 'Emotional Tone', group: 'expression', poles: { low: 'Cold', high: 'Warm' } },
  { key: 'confidence', label: 'Confidence', group: 'expression', poles: { low: 'Uncertain', high: 'Assertive' } },
  { key: 'complexity', label: 'Complexity', group: 'expression', poles: { low: 'Simple', high: 'Nuanced' } },
  { key: 'narrativeStyle', label: 'Narrative Style', group: 'expression', poles: { low: 'Direct', high: 'Storytelling' } },
  { key: 'formality', label: 'Formality', group: 'expression', poles: { low: 'Casual', high: 'Formal' } },
  { key: 'verbalDominance', label: 'Verbal Dominance', group: 'expression', poles: { low: 'Passive', high: 'Dominant' } },
]

export const TRAIT_KEYS: TraitKey[] = TRAIT_DESCRIPTORS.map((d) => d.key)

export function getTraitDescriptors(): readonly TraitDescriptor[] {
  return TRAIT_DESCRIPTORS
}

export function getTraitsByGroup(group: TraitGroup): readonly TraitDescriptor[] {
  return TRAIT_DESCRIPTORS.filter((d) => d.group === group)
}

const NEUTRAL_TRAITS: PersonalityTraits = TRAIT_KEYS.reduce((acc, key) => {
  acc[key] = 0.5
  return acc
}, {} as PersonalityTraits)

/** Returns a fresh neutral baseline with every trait at 0.5. */
export function neutralTraits(): PersonalityTraits {
  return { ...NEUTRAL_TRAITS }
}

/**
 * Coerce arbitrary partial input into a fully-populated, clamped
 * `PersonalityTraits` object. Missing keys fall back to the neutral 0.5.
 */
export function normalizeTraits(input: Partial<PersonalityTraits>): PersonalityTraits {
  const result = neutralTraits()
  for (const key of TRAIT_KEYS) {
    const raw = input[key]
    if (typeof raw === 'number') {
      result[key] = clamp01(raw)
    }
  }
  return result
}

export function traitToPercent(value: number): number {
  return Math.round(clamp01(value) * 100)
}

/** Pick the `count` highest-scoring traits for highlighting in the UI. */
export function pickDominantTraits(traits: PersonalityTraits, count = 3): TraitKey[] {
  return [...TRAIT_KEYS]
    .sort((a, b) => traits[b] - traits[a])
    .slice(0, count)
}
