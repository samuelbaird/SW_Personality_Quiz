export type TraitKey = 'leadership' | 'morality' | 'impulsiveness' | 'independence'

export interface TraitScores {
  leadership: number
  morality: number
  impulsiveness: number
  independence: number
}

export interface CharacterProfile {
  name: string
  description: string
  alignmentScore: number
  signature: string
}

export interface QuizResult {
  traits: TraitScores
  character: CharacterProfile
}
