import type { CharacterProfile, PersonalityTraits, TraitKey } from '../types/quiz'
import { clamp01 } from './traits'

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
): number {
  const entries = Object.entries(character.traits) as Array<[TraitKey, number]>
  if (entries.length === 0) return 0.5

  let totalWeight = 0
  let weightedDistance = 0

  for (const [key, target] of entries) {
    if (typeof target !== 'number') continue
    const userValue = user[key]
    const weight = weights[key] ?? 1
    const distance = Math.abs(clamp01(userValue) - clamp01(target))
    weightedDistance += distance * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 0.5

  const meanDistance = weightedDistance / totalWeight
  return clamp01(1 - meanDistance)
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
