import type { CharacterScore, TraitKey } from '../../types/quiz'

export interface MatchExplanation {
  /** Traits with the smallest weighted distance — the best-aligned dimensions. */
  topTraits: TraitKey[]
  /** Traits with the largest weighted distance — where the user diverges most. */
  weakTraits: TraitKey[]
  /** Traits where both user and character exceeded the strong-alignment threshold. */
  strongMatches: TraitKey[]
  /**
   * Human-readable summary of the match.
   * Empty string until replaced by the Gemini explanation generator.
   */
  summary: string
}

/**
 * Derive a structured explanation from a scored character result.
 *
 * The function is intentionally pure — it only reads from `score` and returns
 * data. No string templates, no UI logic.  The summary field is a placeholder
 * until the Gemini API integration replaces this layer.
 *
 * TODO: replace summary generation with Gemini API call.
 */
export function explainMatch(score: CharacterScore): MatchExplanation {
  const sorted = [...score.contributions].sort((a, b) => a.distance - b.distance)

  return {
    topTraits: sorted.slice(0, 3).map((c) => c.trait),
    weakTraits: [...sorted].reverse().slice(0, 3).map((c) => c.trait),
    strongMatches: score.strongMatches,
    summary: '',
  }
}
