import type { TraitScores } from '../types/quiz'

export function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0.5
  return Math.min(1, Math.max(0, value))
}

export function normalizeTraits(input: Partial<TraitScores>): TraitScores {
  return {
    leadership: clamp01(input.leadership ?? 0.5),
    morality: clamp01(input.morality ?? 0.5),
    impulsiveness: clamp01(input.impulsiveness ?? 0.5),
    independence: clamp01(input.independence ?? 0.5),
  }
}

export function traitToPercent(value: number): number {
  return Math.round(clamp01(value) * 100)
}
