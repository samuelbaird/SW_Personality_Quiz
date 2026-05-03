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

/**
 * Thresholds above/below which a user+target pair counts as a "strong alignment".
 * The mechanic is symmetric: matching at the dark/low end is just as
 * informative as matching at the light/high end, so both earn the bonus.
 */
const STRONG_ALIGNMENT_THRESHOLD = 0.8
const LOW_ALIGNMENT_THRESHOLD = 0.2

/** Bonus added per unit of weight when both sides clear the alignment bar. */
const ALIGNMENT_BONUS_RATE = 0.20

/**
 * Coverage blends into the final score as:
 *   finalScore = similarity × (COVERAGE_BASE + COVERAGE_SCALE × coverage) + bonus
 *
 * The factor is intentionally flat. Earlier versions used 0.75 + 0.25×coverage,
 * which gave broad profiles (~12 declared traits) up to a 9-percentage-point
 * lift over sparse ones (~5 traits). That magnified small mean-distance
 * differences and made roster-wide breadth, not actual trait fit, the dominant
 * tiebreaker. The current curve still rewards coverage but caps the lift at
 * about 3 percentage points end-to-end.
 */
const COVERAGE_BASE = 0.90
const COVERAGE_SCALE = 0.10

// ---------------------------------------------------------------------------
// Default trait weights
// ---------------------------------------------------------------------------

/**
 * Canonical per-trait weights used by the matching engine.
 *
 * Calibration goals:
 * - Core identity traits (morality, agency, emotionalRegulation) carry the most
 *   weight because they anchor every profile.
 * - Authority / evaluation traits sit a step below core. They're moderately
 *   weighted because they're real differentiators when present, but the
 *   vocabulary that drives them is narrow enough that a lot of honest answers
 *   produce no signal at all (in which case the matcher excludes them entirely
 *   via `missingTraits` rather than defaulting to 0.5).
 * - Expression-style traits weigh less because writing-style cues are noisier
 *   than direct behavioral signals.
 *
 * This is the single source of truth: callers no longer pass overrides.
 */
export const DEFAULT_TRAIT_WEIGHTS: Record<TraitKey, number> = {
  // Core identity traits.
  morality: 1.5,
  agency: 1.3,
  emotionalRegulation: 1.2,

  // Structural orientation traits.
  powerOrientation: 1.3,
  socialOrientation: 1.0,
  strategicThinking: 1.0,
  conviction: 1.0,
  riskTolerance: 1.0,
  authorityOrientation: 1.5,
  authorityRigidity: 1.3,
  evaluationBasis: 1.3,
  competenceSensitivity: 1.2,

  // Expression style traits.
  eloquence: 0.7,
  formality: 0.7,
  verbalDominance: 0.8,
  emotionalTone: 0.7,
  complexity: 0.7,
  narrativeStyle: 0.6,
  confidence: 0.7,
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
): { capped: Map<TraitKey, number>; raw: Map<TraitKey, number> } {
  const raw = new Map<TraitKey, number>()
  const categoryTotals: Record<TraitCategory, number> = { core: 0, structural: 0, expression: 0 }

  for (const [key] of entries) {
    const w = DEFAULT_TRAIT_WEIGHTS[key]
    raw.set(key, w)
    categoryTotals[TRAIT_CATEGORIES[key]] += w
  }

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

export interface ScoreOptions {
  /** Use squared distance (default) or absolute difference. */
  useSquaredDistance?: boolean
  /**
   * Trait keys where the user's answers produced no signal at all. These
   * are excluded from the per-character distance computation rather than
   * defaulted to 0.5 — preventing characters profiled near 0.5 on a trait
   * from acting as "neutral attractors" for low-signal users.
   */
  missingTraits?: readonly TraitKey[]
}

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
  options: ScoreOptions = {},
): CharacterScore {
  const allEntries = Object.entries(character.traits) as Array<[TraitKey, number]>
  const missingSet = new Set(options.missingTraits ?? [])

  // Drop traits the character defines but the user has no signal on. These
  // contribute neither to distance nor to coverage so the character is judged
  // only on traits we actually measured.
  const entries = allEntries.filter(([key]) => !missingSet.has(key))

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
  const { capped, raw } = resolveCappedWeights(entries)

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

    const bothHigh = userValue > STRONG_ALIGNMENT_THRESHOLD && targetValue > STRONG_ALIGNMENT_THRESHOLD
    const bothLow = userValue < LOW_ALIGNMENT_THRESHOLD && targetValue < LOW_ALIGNMENT_THRESHOLD
    if (bothHigh || bothLow) {
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
 * (and that the user produced signal on) contribute to the score, so partial
 * profiles are well-formed.
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
  options: ScoreOptions = {},
): number {
  return scoreCharacter(user, character, options).finalScore
}

/**
 * Pick the best-matching character profile from a roster, returning the
 * winner alongside its similarity score. Ties are broken by roster order.
 */
export function pickBestCharacter(
  user: PersonalityTraits,
  roster: readonly CharacterProfile[],
  missingTraits?: readonly TraitKey[],
): { profile: CharacterProfile; similarity: number } {
  const detailed = pickBestCharacterDetailed(user, roster, missingTraits)
  return { profile: detailed.profile, similarity: detailed.similarity }
}

export function pickBestCharacterDetailed(
  user: PersonalityTraits,
  roster: readonly CharacterProfile[],
  missingTraits?: readonly TraitKey[],
): { profile: CharacterProfile; similarity: number; score: CharacterScore } {
  if (roster.length === 0) {
    throw new Error('Cannot pick a character from an empty roster')
  }

  const options: ScoreOptions = { missingTraits }
  let bestProfile = roster[0]
  let bestScore = scoreCharacter(user, bestProfile, options)

  for (let i = 1; i < roster.length; i++) {
    const candidate = roster[i]
    const score = scoreCharacter(user, candidate, options)
    if (score.finalScore > bestScore.finalScore) {
      bestScore = score
      bestProfile = candidate
    }
  }

  return { profile: bestProfile, similarity: bestScore.finalScore, score: bestScore }
}
