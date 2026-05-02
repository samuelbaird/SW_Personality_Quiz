import type {
  CharacterProfile,
  CharacterScore,
  PersonalityTraits,
  TraitCategory,
  TraitContribution,
  TraitKey,
} from '../types/quiz'
import { clamp01 } from './traits'

// ---------------------------------------------------------------------------
// Scoring constants
// ---------------------------------------------------------------------------

/** Threshold above which a matching user+target pair is a "strong alignment". */
const STRONG_ALIGNMENT_THRESHOLD = 0.8

/** Bonus added per unit of weight when both sides clear the strong-alignment bar. */
const ALIGNMENT_BONUS_RATE = 0.20

/**
 * Coverage blends into the final score as:
 *   finalScore = similarity × (COVERAGE_BASE + COVERAGE_SCALE × coverage) + bonus
 * This keeps sparse profiles slightly penalized while preserving their relative order.
 */
const COVERAGE_BASE = 0.75
const COVERAGE_SCALE = 0.25

// ---------------------------------------------------------------------------
// Default trait weights
// ---------------------------------------------------------------------------

const DEFAULT_TRAIT_WEIGHTS: Record<TraitKey, number> = {
  // Core identity traits.
  morality: 1.5,
  agency: 2.0,
  emotionalRegulation: 2.0,

  // Structural orientation traits.
  powerOrientation: 1.5,
  socialOrientation: 1.5,
  strategicThinking: 1.5,
  conviction: 1.5,
  riskTolerance: 1.5,
  authorityOrientation: 2.0,
  authorityRigidity: 1.8,
  evaluationBasis: 1.8,
  competenceSensitivity: 1.6,

  // Expression style traits.
  eloquence: 1.3,
  formality: 1.3,
  verbalDominance: 1.3,

  emotionalTone: 1.0,
  complexity: 1.0,
  narrativeStyle: 1.0,
  confidence: 1.0,
}

const ALL_TRAIT_KEYS = Object.keys(DEFAULT_TRAIT_WEIGHTS) as TraitKey[]
const MAX_POSSIBLE_WEIGHT = ALL_TRAIT_KEYS.reduce(
  (sum, key) => sum + DEFAULT_TRAIT_WEIGHTS[key],
  0,
)

// ---------------------------------------------------------------------------
// Trait category taxonomy (scoring layer)
// ---------------------------------------------------------------------------

/**
 * Maps each trait to a scoring category.
 * Used for weight-cap normalization and explanation grouping.
 * This is distinct from the UI group taxonomy (cognitive/expression).
 */
export const TRAIT_CATEGORIES: Record<TraitKey, TraitCategory> = {
  morality: 'core',
  agency: 'core',
  emotionalRegulation: 'core',

  powerOrientation: 'structural',
  socialOrientation: 'structural',
  strategicThinking: 'structural',
  conviction: 'structural',
  riskTolerance: 'structural',
  authorityOrientation: 'structural',
  authorityRigidity: 'structural',
  evaluationBasis: 'structural',
  competenceSensitivity: 'structural',

  eloquence: 'expression',
  formality: 'expression',
  verbalDominance: 'expression',
  emotionalTone: 'expression',
  complexity: 'expression',
  narrativeStyle: 'expression',
  confidence: 'expression',
}

/**
 * Maximum total weight allowed per category.
 * When a character profile concentrates traits in one category, these caps
 * prevent that category from dominating the score. Weights within the category
 * are scaled proportionally so relative importance is preserved.
 *
 * Baseline uncapped maximums (all traits present, default weights):
 *   core: 6.0   structural: 12.7   expression: 7.9
 */
const CATEGORY_CAPS: Record<TraitCategory, number> = {
  core: 6,
  structural: 9,
  expression: 4,
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getTraitWeight(
  key: TraitKey,
  weights: Partial<Record<TraitKey, number>>,
): number {
  return weights[key] ?? DEFAULT_TRAIT_WEIGHTS[key]
}

function computeCoverage(rawWeight: number): number {
  return clamp01(rawWeight / MAX_POSSIBLE_WEIGHT)
}

/**
 * Resolve per-trait weights and apply soft category caps.
 *
 * Returns two maps:
 * - `capped`: weights after category normalization (used for distance math).
 * - `raw`: weights before capping (used for coverage computation).
 *
 * Capping never removes a trait — it only scales a category proportionally
 * when its total weight exceeds the cap.
 */
function resolveCappedWeights(
  entries: ReadonlyArray<[TraitKey, number]>,
  overrides: Partial<Record<TraitKey, number>>,
): { capped: Map<TraitKey, number>; raw: Map<TraitKey, number> } {
  const raw = new Map<TraitKey, number>()
  const categoryTotals: Record<TraitCategory, number> = { core: 0, structural: 0, expression: 0 }

  for (const [key] of entries) {
    const w = getTraitWeight(key, overrides)
    raw.set(key, w)
    categoryTotals[TRAIT_CATEGORIES[key]] += w
  }

  // Pre-compute scale factor per category (1.0 when under cap).
  const scaleFor: Record<TraitCategory, number> = {
    core: 1,
    structural: 1,
    expression: 1,
  }
  for (const cat of Object.keys(CATEGORY_CAPS) as TraitCategory[]) {
    const total = categoryTotals[cat]
    if (total > CATEGORY_CAPS[cat]) {
      scaleFor[cat] = CATEGORY_CAPS[cat] / total
    }
  }

  const capped = new Map<TraitKey, number>()
  for (const [key, w] of raw) {
    capped.set(key, w * scaleFor[TRAIT_CATEGORIES[key]])
  }

  return { capped, raw }
}

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

/**
 * Score one character against the user's trait profile, returning a fully
 * structured result with per-trait contributions, coverage, and strong matches.
 *
 * This is the authoritative scoring function. All other scoring helpers
 * delegate here so the math stays in one place.
 */
export function scoreCharacter(
  user: PersonalityTraits,
  character: CharacterProfile,
  weights: Partial<Record<TraitKey, number>> = {},
  options: { useSquaredDistance?: boolean } = {},
): CharacterScore {
  const entries = Object.entries(character.traits) as Array<[TraitKey, number]>

  if (entries.length === 0) {
    return {
      characterId: character.id,
      finalScore: 0.5,
      contributions: [],
      coverage: 0,
      confidence: 0,
      bonus: 0,
      strongMatches: [],
    }
  }

  const useSquaredDistance = options.useSquaredDistance ?? true
  const { capped, raw } = resolveCappedWeights(entries, weights)

  let totalCappedWeight = 0
  let totalRawWeight = 0
  let weightedDistance = 0
  let alignmentBonus = 0

  const contributions: TraitContribution[] = []
  const strongMatches: TraitKey[] = []

  for (const [key, target] of entries) {
    if (typeof target !== 'number') continue

    const userValue = clamp01(user[key])
    const targetValue = clamp01(target)
    const cappedWeight = capped.get(key)!
    const rawWeight = raw.get(key)!
    const diff = userValue - targetValue
    const distance = useSquaredDistance ? diff * diff : Math.abs(diff)
    const contribution = distance * cappedWeight

    weightedDistance += contribution
    totalCappedWeight += cappedWeight
    totalRawWeight += rawWeight

    contributions.push({
      trait: key,
      userValue,
      targetValue,
      weight: cappedWeight,
      distance,
      contribution,
      category: TRAIT_CATEGORIES[key],
    })

    if (userValue > STRONG_ALIGNMENT_THRESHOLD && targetValue > STRONG_ALIGNMENT_THRESHOLD) {
      strongMatches.push(key)
      alignmentBonus += ALIGNMENT_BONUS_RATE * cappedWeight
    }
  }

  if (totalCappedWeight === 0) {
    return {
      characterId: character.id,
      finalScore: 0.5,
      contributions,
      coverage: 0,
      confidence: 0,
      bonus: 0,
      strongMatches,
    }
  }

  const coverage = computeCoverage(totalRawWeight)
  const meanDistance = weightedDistance / totalCappedWeight
  const similarity = 1 - meanDistance
  const coverageFactor = COVERAGE_BASE + COVERAGE_SCALE * coverage
  const normalizedBonus = alignmentBonus / MAX_POSSIBLE_WEIGHT
  const finalScore = clamp01(similarity * coverageFactor + normalizedBonus)

  return {
    characterId: character.id,
    finalScore,
    contributions,
    coverage,
    confidence: coverage,
    bonus: normalizedBonus,
    strongMatches,
  }
}

/**
 * Weighted-distance similarity between a user's traits and a character's
 * declared trait targets. Only the traits the character explicitly defines
 * contribute to the score, so partial profiles are well-formed.
 *
 * The result is in [0, 1]:
 *   1.0 - perfect match across the character's defined traits
 *   0.5 - average distance of 0.5 per trait
 *   0.0 - maximum possible distance (every trait is opposite)
 *
 * @see scoreCharacter for the full structured result.
 */
export function calculateSimilarity(
  user: PersonalityTraits,
  character: CharacterProfile,
  weights: Partial<Record<TraitKey, number>> = {},
  options: { useSquaredDistance?: boolean } = {},
): number {
  return scoreCharacter(user, character, weights, options).finalScore
}

/**
 * Pick the best-matching character profile from a roster, returning the
 * winner alongside its similarity score. Ties are broken by roster order.
 */
export function pickBestCharacter(
  user: PersonalityTraits,
  roster: readonly CharacterProfile[],
  weights: Partial<Record<TraitKey, number>> = {},
): { profile: CharacterProfile; similarity: number } {
  const detailed = pickBestCharacterDetailed(user, roster, weights)
  return { profile: detailed.profile, similarity: detailed.similarity }
}

export function pickBestCharacterDetailed(
  user: PersonalityTraits,
  roster: readonly CharacterProfile[],
  weights: Partial<Record<TraitKey, number>> = {},
): { profile: CharacterProfile; similarity: number; score: CharacterScore } {
  if (roster.length === 0) {
    throw new Error('Cannot pick a character from an empty roster')
  }

  let bestProfile = roster[0]
  let bestScore = scoreCharacter(user, bestProfile, weights)

  for (let i = 1; i < roster.length; i++) {
    const candidate = roster[i]
    const score = scoreCharacter(user, candidate, weights)
    if (score.finalScore > bestScore.finalScore) {
      bestScore = score
      bestProfile = candidate
    }
  }

  return { profile: bestProfile, similarity: bestScore.finalScore, score: bestScore }
}
