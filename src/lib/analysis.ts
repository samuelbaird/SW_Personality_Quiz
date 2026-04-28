import type { PersonalityTraits, TraitKey } from '../types/quiz'
import { clamp01, neutralTraits, normalize, TRAIT_KEYS } from './traits'

export interface AnsweredQuestion {
  /** IDs of traits this question primarily targets. Used for weighted scoring. */
  primaryTraits: string[]
  answer: string
}

/**
 * Deterministic, question-aware trait analyzer.
 *
 * Each answer is weighted by the traits its question was designed to probe.
 * Cognitive traits use a per-answer weighted blend (primary questions score 2×).
 * Expression traits use a holistic analysis of the full concatenated text, since
 * writing style is best captured across the whole response set.
 *
 * The heuristics are intentionally simple, deterministic, and free of
 * randomness so the same input always produces the same output.
 */
export function analyzeTextResponses(answeredQuestions: AnsweredQuestion[]): PersonalityTraits {
  const validPairs = answeredQuestions.filter((aq) => aq.answer.trim().length > 0)
  if (validPairs.length === 0) {
    return neutralTraits()
  }

  // Per-answer feature extraction and traits
  const perAnswer = validPairs.map((aq) => ({
    traits: featuresToTraits(extractTextFeatures(aq.answer)),
    primaryTraits: new Set(aq.primaryTraits),
  }))

  // Cognitive traits: weighted average, 2× weight when in question's primaryTraits
  const result = {} as PersonalityTraits
  for (const key of TRAIT_KEYS) {
    let totalWeight = 0
    let weightedSum = 0
    for (const { traits, primaryTraits } of perAnswer) {
      const weight = primaryTraits.has(key) ? 2 : 1
      totalWeight += weight
      weightedSum += traits[key] * weight
    }
    result[key] = totalWeight === 0 ? 0.5 : clamp01(weightedSum / totalWeight)
  }

  // Expression traits: holistic analysis captures writing style better
  const allText = validPairs.map((aq) => aq.answer).join('\n')
  const holisticTraits = featuresToTraits(extractTextFeatures(allText))
  const EXPRESSION_TRAITS: TraitKey[] = [
    'eloquence', 'emotionalTone', 'confidence', 'complexity',
    'narrativeStyle', 'formality', 'verbalDominance',
  ]
  for (const key of EXPRESSION_TRAITS) {
    // 70% holistic (stable style signal) + 30% weighted per-answer
    result[key] = clamp01(holisticTraits[key] * 0.7 + result[key] * 0.3)
  }

  return result
}

// ---------------------------------------------------------------------------
// Text feature extraction
// ---------------------------------------------------------------------------

interface TextFeatures {
  wordCount: number
  uniqueRatio: number
  avgWordLength: number
  avgSentenceLength: number
  exclamationRate: number
  questionRate: number
  contractionRate: number

  hedgingDensity: number
  assertiveDensity: number

  lightDensity: number
  darkDensity: number

  warmDensity: number
  coldDensity: number

  serviceDensity: number
  controlDensity: number

  proactiveDensity: number
  reactiveDensity: number

  collectiveDensity: number
  individualDensity: number

  longTermDensity: number
  tacticalDensity: number

  rigidDensity: number
  flexibleDensity: number

  boldDensity: number
  cautiousDensity: number

  formalDensity: number
  storyDensity: number

  impulsiveDensity: number
  controlledDensity: number
}

const SENTENCE_SPLIT = /[.!?]+/
const WORD_SPLIT = /\s+/

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(WORD_SPLIT)
    .filter(Boolean)
}

function countPhraseMatches(text: string, phrases: readonly string[]): number {
  const lower = text.toLowerCase()
  let total = 0
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\b${escaped}\\b`, 'g')
    const matches = lower.match(pattern)
    if (matches) total += matches.length
  }
  return total
}

function density(matches: number, wordCount: number): number {
  if (wordCount === 0) return 0
  return matches / wordCount
}

function extractTextFeatures(text: string): TextFeatures {
  const words = tokenizeWords(text)
  const wordCount = Math.max(1, words.length)

  const uniqueWords = new Set(words)
  const uniqueRatio = uniqueWords.size / wordCount

  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / wordCount

  const sentences = text.split(SENTENCE_SPLIT).map((s) => s.trim()).filter(Boolean)
  const avgSentenceLength = sentences.length === 0
    ? wordCount
    : wordCount / sentences.length

  const exclamationCount = (text.match(/!/g) ?? []).length
  const questionCount = (text.match(/\?/g) ?? []).length
  const contractionCount = (text.match(/\b\w+'\w+\b/g) ?? []).length

  return {
    wordCount,
    uniqueRatio,
    avgWordLength,
    avgSentenceLength,
    exclamationRate: exclamationCount / wordCount,
    questionRate: questionCount / wordCount,
    contractionRate: contractionCount / wordCount,

    hedgingDensity: density(countPhraseMatches(text, HEDGING_WORDS), wordCount),
    assertiveDensity: density(countPhraseMatches(text, ASSERTIVE_WORDS), wordCount),

    lightDensity: density(countPhraseMatches(text, LIGHT_WORDS), wordCount),
    darkDensity: density(countPhraseMatches(text, DARK_WORDS), wordCount),

    warmDensity: density(countPhraseMatches(text, WARM_WORDS), wordCount),
    coldDensity: density(countPhraseMatches(text, COLD_WORDS), wordCount),

    serviceDensity: density(countPhraseMatches(text, SERVICE_WORDS), wordCount),
    controlDensity: density(countPhraseMatches(text, CONTROL_WORDS), wordCount),

    proactiveDensity: density(countPhraseMatches(text, PROACTIVE_WORDS), wordCount),
    reactiveDensity: density(countPhraseMatches(text, REACTIVE_WORDS), wordCount),

    collectiveDensity: density(countPhraseMatches(text, COLLECTIVE_WORDS), wordCount),
    individualDensity: density(countPhraseMatches(text, INDIVIDUAL_WORDS), wordCount),

    longTermDensity: density(countPhraseMatches(text, LONG_TERM_WORDS), wordCount),
    tacticalDensity: density(countPhraseMatches(text, TACTICAL_WORDS), wordCount),

    rigidDensity: density(countPhraseMatches(text, RIGID_WORDS), wordCount),
    flexibleDensity: density(countPhraseMatches(text, FLEXIBLE_WORDS), wordCount),

    boldDensity: density(countPhraseMatches(text, BOLD_WORDS), wordCount),
    cautiousDensity: density(countPhraseMatches(text, CAUTIOUS_WORDS), wordCount),

    formalDensity: density(countPhraseMatches(text, FORMAL_WORDS), wordCount),
    storyDensity: density(countPhraseMatches(text, STORY_WORDS), wordCount),

    impulsiveDensity: density(countPhraseMatches(text, IMPULSIVE_WORDS), wordCount),
    controlledDensity: density(countPhraseMatches(text, CONTROLLED_WORDS), wordCount),
  }
}

// ---------------------------------------------------------------------------
// Heuristic combiner
// ---------------------------------------------------------------------------

/**
 * Compress a "low vs high" pair of densities into a 0..1 axis. The result is
 * 0.5 when both are absent, leaning toward whichever side has more signal.
 */
function polarize(low: number, high: number): number {
  const total = low + high
  if (total === 0) return 0.5
  return clamp01(high / total)
}

/**
 * Combine a polar density signal with a smaller adjustment, keeping the
 * default 0.5 baseline so quiet text stays neutral instead of drifting.
 */
function biasedAxis(low: number, high: number, adjustment = 0): number {
  const polar = polarize(low, high)
  const intensity = clamp01((low + high) * 30) // saturates around ~3% density
  const blended = 0.5 + (polar - 0.5) * intensity
  return clamp01(blended + adjustment)
}

function featuresToTraits(f: TextFeatures): PersonalityTraits {
  // Cognitive --------------------------------------------------------------
  const morality = biasedAxis(f.darkDensity, f.lightDensity)

  const agency = biasedAxis(f.reactiveDensity, f.proactiveDensity)

  const powerOrientation = biasedAxis(f.serviceDensity, f.controlDensity)

  // Higher controlled language and lower exclamation rate -> more regulated.
  const regulationLow = f.impulsiveDensity + f.exclamationRate * 0.5
  const regulationHigh = f.controlledDensity + clamp01(f.avgSentenceLength / 30) * 0.01
  const emotionalRegulation = biasedAxis(regulationLow, regulationHigh)

  const socialOrientation = biasedAxis(f.individualDensity, f.collectiveDensity)

  const strategicThinking = biasedAxis(f.tacticalDensity, f.longTermDensity)

  const conviction = biasedAxis(f.flexibleDensity, f.rigidDensity + f.assertiveDensity * 0.5)

  const riskTolerance = biasedAxis(f.cautiousDensity, f.boldDensity)

  // Expression -------------------------------------------------------------
  // Eloquence rewards vocabulary variation and average word length.
  const eloquence = clamp01(
    normalize(f.uniqueRatio, 0.35, 0.85) * 0.6 +
      normalize(f.avgWordLength, 3.5, 6.5) * 0.4,
  )

  const emotionalTone = biasedAxis(f.coldDensity, f.warmDensity)

  // Confidence rises with assertive language, falls with hedging/questions.
  const confidence = clamp01(
    0.5 +
      f.assertiveDensity * 4 -
      f.hedgingDensity * 5 -
      f.questionRate * 2 +
      f.exclamationRate * 1,
  )

  // Complexity reflects sentence length, with a small lift from vocabulary.
  const complexity = clamp01(
    normalize(f.avgSentenceLength, 6, 28) * 0.7 +
      normalize(f.uniqueRatio, 0.3, 0.85) * 0.3,
  )

  const narrativeStyle = biasedAxis(0, f.storyDensity)

  // Formality: contractions push casual; formal connectors push formal.
  const formality = clamp01(
    0.5 + f.formalDensity * 6 - f.contractionRate * 3,
  )

  // Verbal dominance combines assertive phrasing, exclamations, and
  // first-person agency, dampened by hedging and questions.
  const verbalDominance = clamp01(
    0.5 +
      f.assertiveDensity * 3 +
      f.exclamationRate * 1.5 +
      f.proactiveDensity * 1 -
      f.hedgingDensity * 4 -
      f.questionRate * 2,
  )

  return {
    morality,
    agency,
    powerOrientation,
    emotionalRegulation,
    socialOrientation,
    strategicThinking,
    conviction,
    riskTolerance,

    eloquence,
    emotionalTone,
    confidence,
    complexity,
    narrativeStyle,
    formality,
    verbalDominance,
  }
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

const HEDGING_WORDS = [
  'maybe', 'perhaps', 'possibly', 'probably', 'kinda', 'sorta',
  'i think', 'i guess', 'i suppose', 'i feel like', 'i believe',
  'kind of', 'sort of', 'somewhat', 'might', 'could be', 'not sure',
  "i'm not sure", "i don't know", 'it depends', 'arguably',
] as const

const ASSERTIVE_WORDS = [
  'definitely', 'certainly', 'absolutely', 'always', 'never',
  'must', 'will', 'shall', 'undoubtedly', 'clearly', 'obviously',
  'of course', 'indeed', 'no question', 'without question',
] as const

const LIGHT_WORDS = [
  'help', 'helping', 'protect', 'protecting', 'save', 'saving',
  'compassion', 'kindness', 'kind', 'hope', 'honor', 'honest',
  'justice', 'fair', 'fairness', 'truth', 'good', 'right',
  'selfless', 'love', 'trust', 'peace', 'mercy', 'forgive',
  'serve', 'support', 'gentle', 'integrity',
] as const

const DARK_WORDS = [
  'power', 'control', 'fear', 'anger', 'rage', 'destroy', 'revenge',
  'selfish', 'hate', 'hatred', 'ruthless', 'manipulate', 'manipulation',
  'dominate', 'betray', 'betrayal', 'crush', 'eliminate', 'punish',
  'enemy', 'enemies', 'cruel', 'merciless',
] as const

const WARM_WORDS = [
  'love', 'care', 'caring', 'happy', 'joy', 'joyful', 'warm', 'feel',
  'feeling', 'passion', 'passionate', 'compassion', 'trust', 'kind',
  'tender', 'gentle', 'embrace', 'heart', 'family', 'friend', 'friends',
] as const

const COLD_WORDS = [
  'logic', 'logical', 'calculate', 'calculated', 'efficient', 'rational',
  'objective', 'detached', 'cold', 'analyze', 'analysis', 'data',
  'metric', 'metrics', 'system', 'process',
] as const

const SERVICE_WORDS = [
  'serve', 'service', 'support', 'assist', 'help', 'follow', 'duty',
  'give', 'contribute', 'mentor', 'guide', 'protect', 'defend',
] as const

const CONTROL_WORDS = [
  'control', 'command', 'lead', 'dominate', 'rule', 'authority',
  'in charge', 'power', 'enforce', 'order', 'direct',
] as const

const PROACTIVE_WORDS = [
  'i act', 'i lead', 'i decide', 'i take', 'i plan', 'i build',
  'i initiate', 'i create', 'i drive', 'i pursue', 'i tackle',
  'i organize', 'i start', 'i fight', 'i pushed', 'i make',
  'i did', 'i will', 'i moved', 'step up',
] as const

const REACTIVE_WORDS = [
  'respond', 'react', 'wait', 'let', 'happen', 'given', 'i waited',
  'i listened', 'i observed', 'i deferred', 'i hesitated', 'i paused',
  'see what happens',
] as const

const COLLECTIVE_WORDS = [
  'we', 'us', 'our', 'ours', 'team', 'together', 'community', 'group',
  'people', 'everyone', 'collective', 'family', 'allies',
] as const

const INDIVIDUAL_WORDS = [
  'i', 'me', 'my', 'mine', 'myself', 'alone', 'on my own', 'solo',
] as const

const LONG_TERM_WORDS = [
  'plan', 'planned', 'planning', 'future', 'strategy', 'strategic',
  'long term', 'long-term', 'vision', 'eventually', 'goal', 'goals',
  'ahead', 'build', 'building', 'years', 'legacy', 'foundation',
] as const

const TACTICAL_WORDS = [
  'immediately', 'now', 'quickly', 'react', 'instinct', 'instinctively',
  'snap', 'fast', 'urgent', 'right away', 'on the spot', 'in the moment',
] as const

const RIGID_WORDS = [
  'must', 'never', 'always', 'principle', 'principles', 'core belief',
  'i believe', 'i know', 'no compromise', 'absolute', 'no matter what',
] as const

const FLEXIBLE_WORDS = [
  'depends', 'context', 'sometimes', 'it varies', 'open to',
  'flexible', 'adapt', 'adapting', 'reconsider', 'change my mind',
  'situational',
] as const

const BOLD_WORDS = [
  'risk', 'dare', 'leap', 'bold', 'fight', 'challenge', 'courage',
  'courageous', 'brave', 'go for it', 'take a chance', 'fearless',
] as const

const CAUTIOUS_WORDS = [
  'careful', 'carefully', 'cautious', 'caution', 'safe', 'safer',
  'wait', 'hesitate', 'hesitant', 'avoid', 'measured', 'reserved',
] as const

const FORMAL_WORDS = [
  'therefore', 'thus', 'however', 'regarding', 'furthermore',
  'consequently', 'nevertheless', 'moreover', 'in addition',
  'one must', 'in conclusion', 'with respect to',
] as const

const STORY_WORDS = [
  'once', 'when i', 'i remember', 'the time', 'one day', 'years ago',
  'recently', 'as a kid', 'i recall', 'back when', 'there was a time',
  'i had a', 'this reminds me',
] as const

const IMPULSIVE_WORDS = [
  'immediately', 'snap', 'lash', 'lashed', 'explode', 'exploded',
  'blurt', 'instinct', 'gut', 'reaction', 'lose it',
] as const

const CONTROLLED_WORDS = [
  'calmly', 'calm', 'patient', 'patience', 'measured', 'consider',
  'considered', 'think it through', 'pause', 'reflect', 'reflected',
  'composed', 'breathe',
] as const
