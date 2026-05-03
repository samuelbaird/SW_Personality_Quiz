import type { PersonalityTraits, TraitKey } from '../types/quiz.js'
import { clamp01, neutralTraits, normalize, TRAIT_KEYS } from './traits.js'

export interface AnsweredQuestion {
  /** IDs of traits this question primarily targets. Used for weighted scoring. */
  primaryTraits: string[]
  answer: string
}

export interface AnalysisResult {
  /**
   * Full trait vector. Traits with no signal default to 0.5 so the UI can
   * always render a value, but those traits are also enumerated in
   * {@link missingTraits} so the matcher can ignore them.
   */
  traits: PersonalityTraits
  /**
   * Trait keys where the user's answers produced no measurable signal.
   * The matcher excludes these from per-character distance computation
   * to avoid rewarding profiles that happen to sit near 0.5.
   */
  missingTraits: TraitKey[]
}

const EXPRESSION_TRAITS: readonly TraitKey[] = [
  'eloquence', 'emotionalTone', 'confidence', 'complexity',
  'narrativeStyle', 'formality', 'verbalDominance',
] as const

/**
 * Deterministic, question-aware trait analyzer.
 *
 * Each answer is weighted by the traits its question was designed to probe.
 * Cognitive traits use a per-answer weighted blend (primary questions score 2×).
 * Expression traits use a holistic analysis of the full concatenated text, since
 * writing style is best captured across the whole response set.
 *
 * Traits whose lexicons or stylistic features fire on no answer at all are
 * reported as missing rather than collapsed to 0.5: a "no signal" answer
 * shouldn't be indistinguishable from a "balanced signal" answer in the
 * downstream matching.
 *
 * The heuristics are intentionally simple, deterministic, and free of
 * randomness so the same input always produces the same output.
 */
export function analyzeTextResponses(answeredQuestions: AnsweredQuestion[]): AnalysisResult {
  const validPairs = answeredQuestions.filter((aq) => aq.answer.trim().length > 0)
  if (validPairs.length === 0) {
    return { traits: neutralTraits(), missingTraits: [...TRAIT_KEYS] }
  }

  const perAnswer = validPairs.map((aq) => ({
    traits: featuresToTraits(extractTextFeatures(aq.answer)),
    primaryTraits: new Set(aq.primaryTraits),
  }))

  const result = neutralTraits()
  const missing: TraitKey[] = []

  // Cognitive traits: weighted average across answers that produced signal.
  // When no answer signals a trait at all, mark it missing (so it gets
  // excluded from matching) instead of letting it collapse to 0.5.
  for (const key of TRAIT_KEYS) {
    let totalWeight = 0
    let weightedSum = 0
    for (const { traits, primaryTraits } of perAnswer) {
      const value = traits[key]
      if (value === undefined) continue
      const weight = primaryTraits.has(key) ? 2 : 1
      totalWeight += weight
      weightedSum += value * weight
    }
    if (totalWeight > 0) {
      result[key] = clamp01(weightedSum / totalWeight)
    } else {
      missing.push(key)
    }
  }

  // Expression traits: holistic analysis captures writing style better. The
  // holistic blob almost always has signal when individual answers do, but
  // we still skip the blend if neither side produced a value.
  const allText = validPairs.map((aq) => aq.answer).join('\n')
  const holisticTraits = featuresToTraits(extractTextFeatures(allText))
  for (const key of EXPRESSION_TRAITS) {
    const holistic = holisticTraits[key]
    const wasMissingPerAnswer = missing.includes(key)

    if (holistic !== undefined && !wasMissingPerAnswer) {
      // 70% holistic (stable style signal) + 30% weighted per-answer.
      result[key] = clamp01(holistic * 0.7 + result[key] * 0.3)
    } else if (holistic !== undefined && wasMissingPerAnswer) {
      // Holistic-only signal: the trait isn't missing after all.
      result[key] = holistic
      missing.splice(missing.indexOf(key), 1)
    }
    // else: both missing — leave result[key] at 0.5 and keep it in `missing`.
  }

  return { traits: result, missingTraits: missing }
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
  directDensity: number

  impulsiveDensity: number
  controlledDensity: number

  outcomeDensity: number
  processDensity: number

  loyaltyDensity: number
  competenceDensity: number
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
    directDensity: density(countPhraseMatches(text, DIRECT_WORDS), wordCount),

    impulsiveDensity: density(countPhraseMatches(text, IMPULSIVE_WORDS), wordCount),
    controlledDensity: density(countPhraseMatches(text, CONTROLLED_WORDS), wordCount),

    outcomeDensity: density(countPhraseMatches(text, OUTCOME_WORDS), wordCount),
    processDensity: density(countPhraseMatches(text, PROCESS_WORDS), wordCount),

    loyaltyDensity: density(countPhraseMatches(text, LOYALTY_WORDS), wordCount),
    competenceDensity: density(countPhraseMatches(text, COMPETENCE_WORDS), wordCount),
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

/**
 * Convert raw text features into the subset of trait values that have actual
 * signal in the input. Traits whose underlying lexicons/style metrics produce
 * no measurable evidence are omitted from the result so callers can
 * distinguish "no signal" from "balanced signal at 0.5".
 */
function featuresToTraits(f: TextFeatures): Partial<PersonalityTraits> {
  const out: Partial<PersonalityTraits> = {}

  setIfBiased(out, 'morality', f.darkDensity, f.lightDensity)
  setIfBiased(out, 'agency', f.reactiveDensity, f.proactiveDensity)
  setIfBiased(out, 'powerOrientation', f.serviceDensity, f.controlDensity)
  setIfBiased(out, 'socialOrientation', f.individualDensity, f.collectiveDensity)
  setIfBiased(out, 'strategicThinking', f.tacticalDensity, f.longTermDensity)
  setIfBiased(out, 'conviction', f.flexibleDensity, f.rigidDensity + f.assertiveDensity * 0.5)
  setIfBiased(out, 'riskTolerance', f.cautiousDensity, f.boldDensity)
  setIfBiased(
    out,
    'authorityOrientation',
    f.serviceDensity + f.collectiveDensity * 0.5,
    f.controlDensity,
  )
  setIfBiased(out, 'authorityRigidity', f.flexibleDensity, f.rigidDensity)
  setIfBiased(out, 'evaluationBasis', f.outcomeDensity, f.processDensity)
  setIfBiased(out, 'competenceSensitivity', f.loyaltyDensity, f.competenceDensity)

  // Higher controlled language and lower exclamation rate -> more regulated.
  // We treat regulation as having signal whenever any of its source signals fire.
  const regulationLow = f.impulsiveDensity + f.exclamationRate * 0.5
  const regulationHigh = f.controlledDensity + clamp01(f.avgSentenceLength / 30) * 0.01
  setIfBiased(out, 'emotionalRegulation', regulationLow, regulationHigh)

  setIfBiased(out, 'emotionalTone', f.coldDensity, f.warmDensity)
  setIfBiased(out, 'narrativeStyle', f.directDensity, f.storyDensity)

  // Eloquence and complexity are derived from text-shape statistics that
  // exist for any non-empty input. They're always reported.
  out.eloquence = clamp01(
    normalize(f.uniqueRatio, 0.35, 0.85) * 0.6 +
      normalize(f.avgWordLength, 3.5, 6.5) * 0.4,
  )
  out.complexity = clamp01(
    normalize(f.avgSentenceLength, 6, 28) * 0.7 +
      normalize(f.uniqueRatio, 0.3, 0.85) * 0.3,
  )

  // Confidence and verbal dominance are 0.5-baseline traits that adjust based
  // on assertive/hedging/punctuation cues. They have signal only when one of
  // those cues actually fires.
  const confidenceAdj =
    f.assertiveDensity * 4 - f.hedgingDensity * 5 - f.questionRate * 2 + f.exclamationRate * 1
  if (confidenceAdj !== 0) {
    out.confidence = clamp01(0.5 + confidenceAdj)
  }

  const verbalAdj =
    f.assertiveDensity * 3 +
    f.exclamationRate * 1.5 +
    f.proactiveDensity * 1 -
    f.hedgingDensity * 4 -
    f.questionRate * 2
  if (verbalAdj !== 0) {
    out.verbalDominance = clamp01(0.5 + verbalAdj)
  }

  // Formality: contractions push casual; formal connectors push formal.
  const formalityAdj = f.formalDensity * 6 - f.contractionRate * 3
  if (formalityAdj !== 0) {
    out.formality = clamp01(0.5 + formalityAdj)
  }

  return out
}

/**
 * Helper for the common pattern: compute a `biasedAxis` value from low/high
 * lexicon densities, but only include the trait if at least one side fired.
 */
function setIfBiased(
  out: Partial<PersonalityTraits>,
  key: TraitKey,
  low: number,
  high: number,
): void {
  if (low + high <= 0) return
  out[key] = biasedAxis(low, high)
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
  'protect', 'protecting', 'save', 'saving',
  'compassion', 'kindness', 'kind', 'hope', 'honor', 'honest',
  'justice', 'fair', 'fairness', 'truth', 'good', 'right',
  'selfless', 'love', 'trust', 'peace', 'mercy', 'forgive',
  'serve', 'support', 'gentle', 'integrity',
] as const

const DARK_WORDS = [
  'domination', 'subjugate', 'tyranny', 'fear', 'anger', 'rage', 'destroy', 'revenge',
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
  'wait', 'hesitate', 'hesitant', 'avoid', 'reserved',
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

const DIRECT_WORDS = [
  'the answer is', 'simply put', 'in short', 'the point is', 'to be clear',
  'plainly', 'directly', 'the fact is', 'in summary', 'put simply',
  'to put it simply', 'bottom line is', 'basically',
] as const

const OUTCOME_WORDS = [
  'result', 'results', 'outcome', 'outcomes', 'impact', 'what worked',
  'whether it works', 'achieved', 'effective', 'end result', 'succeeded',
  'success', 'bottom line', 'what matters', 'end up', 'in the end',
] as const

const PROCESS_WORDS = [
  'properly', 'the right way', 'step by step', 'procedure', 'protocol',
  'according to', 'principle', 'rules', 'how it should', 'correct approach',
  'the correct', 'standard', 'guidelines', 'done correctly', 'by the book',
] as const

const LOYALTY_WORDS = [
  'loyal', 'loyalty', 'reliable', 'dependable', 'commitment', 'dedicated',
  'stood by', 'counted on', 'relationship', 'been there',
] as const

const COMPETENCE_WORDS = [
  'skill', 'skilled', 'capable', 'qualified', 'competent', 'expertise',
  'ability', 'talented', 'track record', 'best person', 'can deliver',
  'proven', 'experienced', 'proficient', 'knows what',
] as const
