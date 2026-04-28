import type { CharacterProfile, PersonalityTraits, TraitKey } from '../types/quiz'
import { clamp01 } from './traits'

interface SimilarityOptions {
  /** Quadratic distance penalizes large mismatches more strongly. */
  useSquaredDistance?: boolean
}

const DEFAULT_TRAIT_WEIGHTS: Record<TraitKey, number> = {
  // Core identity traits.
  morality: 2.0,
  agency: 2.0,
  emotionalRegulation: 2.0,

  // Structural orientation traits.
  powerOrientation: 1.5,
  socialOrientation: 1.5,
  strategicThinking: 1.5,
  conviction: 1.5,
  riskTolerance: 1.5,

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

function getTraitWeight(
  key: TraitKey,
  weights: Partial<Record<TraitKey, number>>,
): number {
  return weights[key] ?? DEFAULT_TRAIT_WEIGHTS[key]
}

function computeCoverage(totalWeight: number): number {
  return clamp01(totalWeight / MAX_POSSIBLE_WEIGHT)
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
 */
export function calculateSimilarity(
  user: PersonalityTraits,
  character: CharacterProfile,
  weights: Partial<Record<TraitKey, number>> = {},
  options: SimilarityOptions = {},
): number {
  const entries = Object.entries(character.traits) as Array<[TraitKey, number]>
  if (entries.length === 0) return 0.5

  const useSquaredDistance = options.useSquaredDistance ?? true
  let totalWeight = 0
  let weightedDistance = 0
  let alignmentBonus = 0

  for (const [key, target] of entries) {
    if (typeof target !== 'number') continue
    const userValue = user[key]
    const weight = getTraitWeight(key, weights)
    const clampedUserValue = clamp01(userValue)
    const clampedTarget = clamp01(target)
    const diff = clampedUserValue - clampedTarget
    // Squared distance increases the cost of extreme mismatches.
    const distance = useSquaredDistance ? diff * diff : Math.abs(diff)
    weightedDistance += distance * weight
    totalWeight += weight

    // Strong high-high alignment should nudge similar archetypes upward.
    if (clampedUserValue > 0.8 && clampedTarget > 0.8) {
      alignmentBonus += 0.02 * weight
    }
  }

  if (totalWeight === 0) return 0.5

  const meanDistance = weightedDistance / totalWeight
  const similarity = 1 - meanDistance
  // Coverage moderates sparse profiles while preserving relative ordering.
  const coverageFactor = 0.75 + 0.25 * computeCoverage(totalWeight)
  const normalizedBonus = alignmentBonus / MAX_POSSIBLE_WEIGHT
  return clamp01(similarity * coverageFactor + normalizedBonus)
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
  if (roster.length === 0) {
    throw new Error('Cannot pick a character from an empty roster')
  }

  let bestProfile = roster[0]
  let bestScore = calculateSimilarity(user, bestProfile, weights)

  for (let i = 1; i < roster.length; i++) {
    const candidate = roster[i]
    const score = calculateSimilarity(user, candidate, weights)
    if (score > bestScore) {
      bestScore = score
      bestProfile = candidate
    }
  }

  return { profile: bestProfile, similarity: bestScore }
}
