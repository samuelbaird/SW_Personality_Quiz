import type { PersonalityTraits, TraitKey } from '../types/quiz'

type TraitPhrase = { low: string; mid: string; high: string }

const COGNITIVE_PHRASES: Partial<Record<TraitKey, TraitPhrase>> = {
  morality: {
    low: 'a willingness to embrace darker means when the stakes demand it',
    mid: 'a balanced moral compass that weighs both light and shadow',
    high: 'a clearly principled, light-leaning moral compass',
  },
  agency: {
    low: 'a tendency to read the room before committing to action',
    mid: 'a measured mix of action and observation',
    high: 'a proactive instinct to step forward and shape outcomes',
  },
  powerOrientation: {
    low: 'a service-oriented posture that prioritizes others',
    mid: 'a flexible relationship with authority and influence',
    high: 'a strong gravitational pull toward control and authority',
  },
  emotionalRegulation: {
    low: 'a vivid, reactive emotional life that fuels your responses',
    mid: 'an emotional life you express without losing your footing',
    high: 'remarkably composed emotional regulation under pressure',
  },
  socialOrientation: {
    low: 'an independent streak that trusts your own judgment first',
    mid: 'a comfort moving between solo work and collective effort',
    high: 'a collective orientation that values the group above the self',
  },
  strategicThinking: {
    low: 'a sharp tactical sense that solves the problem in front of you',
    mid: 'a healthy balance between near-term tactics and longer plans',
    high: 'a long-horizon strategic awareness that thinks several moves ahead',
  },
  conviction: {
    low: 'an open mind that holds beliefs lightly when evidence shifts',
    mid: 'a grounded set of beliefs that still leaves room for nuance',
    high: 'firm convictions that rarely bend once formed',
  },
  riskTolerance: {
    low: 'a careful, risk-aware approach to consequential choices',
    mid: 'a calibrated relationship with risk',
    high: 'a bold appetite for risk when the upside is worth it',
  },
}

const EXPRESSION_PHRASES: Partial<Record<TraitKey, TraitPhrase>> = {
  eloquence: {
    low: 'a plainspoken, no-frills style',
    mid: 'a clear, even communication style',
    high: 'a notably articulate command of language',
  },
  emotionalTone: {
    low: 'a cool, analytical register',
    mid: 'an even-keeled emotional register',
    high: 'a warm, emotionally open register',
  },
  confidence: {
    low: 'a hedged, exploratory voice',
    mid: 'a measured, thoughtful voice',
    high: 'an assertive, self-assured voice',
  },
  complexity: {
    low: 'sentences that stay tight and direct',
    mid: 'a balanced rhythm between simple and layered phrasing',
    high: 'layered, nuanced sentence construction',
  },
  narrativeStyle: {
    low: 'a direct, declarative way of getting to the point',
    mid: 'a mix of direct statements and illustrative beats',
    high: 'a storytelling instinct that frames ideas through experience',
  },
  formality: {
    low: 'a casual, conversational tone',
    mid: 'a tone that shifts naturally between formal and casual',
    high: 'a formal, polished register',
  },
  verbalDominance: {
    low: 'a deferential, listening-first posture',
    mid: 'a posture that asserts when needed but holds back otherwise',
    high: 'a dominant, leading verbal presence',
  },
}

function bucket(value: number): keyof TraitPhrase {
  if (value < 0.4) return 'low'
  if (value > 0.6) return 'high'
  return 'mid'
}

/** Distance from neutral (0.5). Used to surface the most distinctive signals. */
function intensity(value: number): number {
  return Math.abs(value - 0.5)
}

function pickStrongestPhrase(
  traits: PersonalityTraits,
  catalog: Partial<Record<TraitKey, TraitPhrase>>,
  count: number,
): string[] {
  const ranked = (Object.keys(catalog) as TraitKey[])
    .map((key) => ({ key, score: intensity(traits[key]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)

  return ranked
    .map(({ key }) => {
      const phrase = catalog[key]
      if (!phrase) return null
      return phrase[bucket(traits[key])]
    })
    .filter((p): p is string => p !== null)
}

function joinWithCommas(phrases: string[]): string {
  if (phrases.length === 0) return ''
  if (phrases.length === 1) return phrases[0]
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`
  return `${phrases.slice(0, -1).join(', ')}, and ${phrases[phrases.length - 1]}`
}

/**
 * Build a deterministic, two-sentence summary that highlights the user's most
 * distinctive cognitive traits paired with their dominant communication style.
 */
export function generateExplanation(traits: PersonalityTraits): string {
  const cognitivePhrases = pickStrongestPhrase(traits, COGNITIVE_PHRASES, 2)
  const expressionPhrases = pickStrongestPhrase(traits, EXPRESSION_PHRASES, 2)

  const personality = cognitivePhrases.length > 0
    ? `Your responses suggest ${joinWithCommas(cognitivePhrases)}.`
    : 'Your responses paint a balanced cognitive profile across the board.'

  const style = expressionPhrases.length > 0
    ? `In how you communicate, you lean toward ${joinWithCommas(expressionPhrases)}.`
    : 'Your communication style is steady, with no single tone dominating the page.'

  return `${personality} ${style}`
}
