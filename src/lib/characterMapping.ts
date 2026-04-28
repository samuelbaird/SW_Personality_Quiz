import type { CharacterProfile, TraitScores } from '../types/quiz'
import { clamp01 } from './traits'

interface CharacterRule {
  profile: Omit<CharacterProfile, 'alignmentScore'>
  score: (traits: TraitScores) => number
}

const characterRules: CharacterRule[] = [
  {
    profile: {
      name: 'Luke Skywalker',
      description: 'Idealistic, resilient, and driven to protect others even when tempted by darkness.',
      signature: 'Hopeful Strategist',
    },
    score: (t) =>
      (1 - Math.abs(t.morality - 0.88)) * 0.42 +
      (1 - Math.abs(t.leadership - 0.65)) * 0.26 +
      (1 - Math.abs(t.impulsiveness - 0.55)) * 0.16 +
      (1 - Math.abs(t.independence - 0.6)) * 0.16,
  },
  {
    profile: {
      name: 'Darth Vader',
      description: 'Commanding and forceful, shaped by conflict, loyalty, and emotional intensity.',
      signature: 'Fallen Enforcer',
    },
    score: (t) =>
      (1 - Math.abs(t.morality - 0.16)) * 0.42 +
      (1 - Math.abs(t.leadership - 0.9)) * 0.25 +
      (1 - Math.abs(t.impulsiveness - 0.6)) * 0.18 +
      (1 - Math.abs(t.independence - 0.5)) * 0.15,
  },
  {
    profile: {
      name: 'Obi-Wan Kenobi',
      description: 'Disciplined, compassionate, and principled with a calm, mentor-like leadership style.',
      signature: 'Balanced Guardian',
    },
    score: (t) =>
      (1 - Math.abs(t.morality - 0.92)) * 0.36 +
      (1 - Math.abs(t.leadership - 0.76)) * 0.24 +
      (1 - Math.abs(t.impulsiveness - 0.2)) * 0.22 +
      (1 - Math.abs(t.independence - 0.7)) * 0.18,
  },
  {
    profile: {
      name: 'Emperor Palpatine',
      description: 'Calculating, manipulative, and power-oriented with long-range strategic control.',
      signature: 'Master Manipulator',
    },
    score: (t) =>
      (1 - Math.abs(t.morality - 0.06)) * 0.46 +
      (1 - Math.abs(t.leadership - 0.86)) * 0.2 +
      (1 - Math.abs(t.impulsiveness - 0.3)) * 0.12 +
      (1 - Math.abs(t.independence - 0.95)) * 0.22,
  },
]

export function mapTraitsToCharacter(traits: TraitScores): CharacterProfile {
  const winner = characterRules.reduce(
    (best, rule) => {
      const candidateScore = rule.score(traits)
      if (candidateScore > best.score) {
        return { score: candidateScore, profile: rule.profile }
      }
      return best
    },
    { score: Number.NEGATIVE_INFINITY, profile: characterRules[0].profile },
  )

  return {
    ...winner.profile,
    alignmentScore: clamp01(traits.morality),
  }
}
