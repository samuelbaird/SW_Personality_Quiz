import type { QuizQuestion } from '../types/quiz'

/** Questions always included in every session. */
const FIXED_QUESTIONS: QuizQuestion[] = [
  {
    id: 'conflict',
    text: 'Describe a recent disagreement or conflict you were involved in. What was your approach, and how did it resolve?',
    primaryTraits: ['morality', 'emotionalRegulation', 'agency', 'confidence', 'narrativeStyle'],
    fixed: true,
  },
  {
    id: 'power',
    text: "When working with others, how do you typically influence outcomes or decisions?",
    primaryTraits: ['powerOrientation', 'authorityOrientation', 'authorityRigidity', 'socialOrientation', 'strategicThinking'],
    fixed: true,
  },
  {
    id: 'moral_ambiguity',
    text: "Have you ever justified a questionable decision because it led to a better outcome? Walk me through it.",
    primaryTraits: ['morality', 'evaluationBasis', 'authorityRigidity', 'conviction'],
    fixed: true,
  },
]

/**
 * Pool of rotating questions. Two are sampled randomly per session,
 * covering the remaining trait areas and providing replayability.
 */
const ROTATING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'risk',
    text: "Tell me about a time you had to make a decision without having all the information you wanted.",
    primaryTraits: ['riskTolerance', 'conviction', 'emotionalRegulation', 'complexity'],
    fixed: false,
  },
  {
    id: 'communication',
    text: "Explain something you understand well to someone who has no background in it.",
    primaryTraits: ['eloquence', 'complexity', 'narrativeStyle', 'formality'],
    fixed: false,
  },
  {
    id: 'longterm',
    text: "When you're working toward something important, how do you balance short-term needs with long-term goals?",
    primaryTraits: ['strategicThinking', 'agency', 'emotionalRegulation', 'complexity'],
    fixed: false,
  },
  {
    id: 'values',
    text: "Describe a time when doing the right thing came at a personal cost. How did you handle it?",
    primaryTraits: ['morality', 'conviction', 'emotionalTone', 'confidence'],
    fixed: false,
  },
  {
    id: 'independence',
    text: "When you're tackling a difficult problem, how do you decide whether to rely on others or handle it yourself?",
    primaryTraits: ['socialOrientation', 'agency', 'confidence'],
    fixed: false,
  },
  {
    id: 'leadership',
    text: "If a team you're part of is struggling, what role do you naturally take on?",
    primaryTraits: ['agency', 'powerOrientation', 'verbalDominance'],
    fixed: false,
  },
  {
    id: 'frustration',
    text: "What tends to frustrate you most, and how do you usually respond in the moment?",
    primaryTraits: ['emotionalRegulation', 'emotionalTone'],
    fixed: false,
  },
  {
    id: 'adaptability',
    text: "Tell me about a time you changed your mind about something important.",
    primaryTraits: ['conviction', 'complexity'],
    fixed: false,
  },
]

/** Total questions shown per session. */
export const SESSION_SIZE = 5

/**
 * Build a session's question set: all fixed questions plus a random sample
 * from the rotating pool, totalling {@link SESSION_SIZE}. The five prompts are
 * then shuffled so display order varies each session.
 *
 * Pass a numeric `seed` to get reproducible randomness (useful for tests).
 */
export function buildSessionQuestions(seed?: number): QuizQuestion[] {
  const pool = [...ROTATING_QUESTIONS]
  const rng = seed !== undefined ? seededRandom(seed) : Math.random

  shuffleInPlace(pool, rng)

  const rotating = pool.slice(0, SESSION_SIZE - FIXED_QUESTIONS.length)
  const session = [...FIXED_QUESTIONS, ...rotating]
  shuffleInPlace(session, rng)
  return session
}

function shuffleInPlace<T>(items: T[], rng: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}

/** Simple LCG seeded pseudo-random number generator, returns values in [0, 1). */
function seededRandom(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** All defined questions (fixed + rotating), for reference or testing. */
export const ALL_QUESTIONS: QuizQuestion[] = [...FIXED_QUESTIONS, ...ROTATING_QUESTIONS]
