/**
 * A single quiz question with trait metadata used to weight the analysis.
 *
 * - `fixed` questions appear in every session (conflict, risk, communication).
 * - Rotating questions are sampled randomly to fill the remaining slots.
 */
export interface QuizQuestion {
  id: string
  text: string
  /** Traits this question is specifically designed to elicit. */
  primaryTraits: TraitKey[]
  fixed: boolean
}

/**
 * Two-layer personality model.
 *
 * - Cognitive traits describe what a person is like (motivation, values, drive).
 * - Expression traits describe how they communicate (style, tone, posture).
 *
 * All values are normalized between 0 and 1.
 */
export interface PersonalityTraits {
  morality: number
  agency: number
  powerOrientation: number
  emotionalRegulation: number
  socialOrientation: number
  strategicThinking: number
  conviction: number
  riskTolerance: number

  eloquence: number
  emotionalTone: number
  confidence: number
  complexity: number
  narrativeStyle: number
  formality: number
  verbalDominance: number
}

export type TraitKey = keyof PersonalityTraits

export type TraitGroup = 'cognitive' | 'expression'

/** Scoring-layer taxonomy used for weight normalization and explanation grouping. */
export type TraitCategory = 'core' | 'structural' | 'expression'

/** Per-trait breakdown of how much each comparison contributed to the final score. */
export interface TraitContribution {
  trait: TraitKey
  userValue: number
  targetValue: number
  /** Effective weight after category-cap normalization. */
  weight: number
  /** Raw squared (or absolute) distance between user and target values. */
  distance: number
  /** Weighted distance impact: distance × weight. */
  contribution: number
  category: TraitCategory
}

/**
 * Structured result of scoring one character against the user's traits.
 * Carries all data needed to render explanations without re-running the math.
 */
export interface CharacterScore {
  characterId: string
  finalScore: number
  contributions: TraitContribution[]
  /** Fraction of trait-space covered by this character's profile (0..1). */
  coverage: number
  /** Synonym for coverage; used by explanation layer as a quality signal. */
  confidence: number
  /** Normalized alignment bonus added to finalScore. */
  bonus: number
  /** Traits where both user and target exceeded the strong-alignment threshold. */
  strongMatches: TraitKey[]
}

export interface TraitDescriptor {
  key: TraitKey
  label: string
  group: TraitGroup
  /** Short label for the low/high ends, used in UI tooltips. */
  poles: { low: string; high: string }
}

export interface CharacterProfile {
  id: string
  name: string
  description: string
  traits: Partial<PersonalityTraits>
  /** Optional flavor tagline, surfaced in the result UI. */
  signature?: string
}

export interface CharacterMatch {
  profile: CharacterProfile
  /** Similarity score against the user, 0..1 (1 = perfect match). */
  similarity: number
}

export type ExplanationSource = 'pending' | 'gemini' | 'cache' | 'fallback'

export interface QuizResult {
  traits: PersonalityTraits
  character: CharacterProfile
  /** Cosine-style similarity of the user's traits to the matched character. */
  matchScore: number
  /** Convenience surface for the alignment meter (mirrors traits.morality). */
  alignmentScore: number
  /** Deterministic, human-readable summary of the trait profile. */
  explanation: string
  /** Indicates how the explanation was produced. */
  explanationSource: ExplanationSource
  /** Top dominant traits (highest values) for highlight tiles. */
  dominantTraits: TraitKey[]
}
