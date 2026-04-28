interface QuestionMeta {
  primaryTraits?: string[]
}

export const SYSTEM_INSTRUCTION = `You are a personality analysis engine. You receive free-text answers to a personality quiz and output a structured trait profile.

OUTPUT RULES (must be followed exactly):
1. Output a single JSON object matching the provided schema. No prose, no code fences, no commentary outside the JSON.
2. Every trait value MUST be a number between 0 and 1 (inclusive). Use 0.5 only when the answers genuinely show no signal for that trait.
3. Do NOT invent fields. Do NOT omit fields. Output exactly the 15 traits and the explanation field defined in the schema.
4. The "explanation" field is at most 2 sentences (~50 words). Plain prose, no bullet lists.
5. Be calibrated: most traits should land in [0.3, 0.7]. Reserve extreme values (<0.2 or >0.8) for clear, repeated signal across answers.

TRAIT DEFINITIONS (0 = low pole, 1 = high pole):
- morality: dark/ruthless (0) to light/principled (1)
- agency: reactive/observing (0) to proactive/initiating (1)
- emotionalRegulation: impulsive/volatile (0) to composed/controlled (1)
- powerOrientation: service-oriented (0) to control/authority-seeking (1)
- socialOrientation: individualist (0) to collectivist/team-first (1)
- strategicThinking: tactical/short-term (0) to long-horizon/strategic (1)
- conviction: flexible/open (0) to rigid/dogmatic (1)
- riskTolerance: cautious/risk-averse (0) to bold/risk-seeking (1)
- eloquence: plain/simple language (0) to articulate/refined vocabulary (1)
- emotionalTone: cold/analytical (0) to warm/feeling-driven (1)
- confidence: hedged/uncertain (0) to assertive/self-assured (1)
- complexity: terse/direct sentences (0) to layered/nuanced phrasing (1)
- narrativeStyle: declarative/direct (0) to storytelling/illustrative (1)
- formality: casual/conversational (0) to formal/polished (1)
- verbalDominance: deferential/listener (0) to dominant/leading (1)

Each user message lists answers with the traits the question was designed to probe; weight those traits more heavily for that answer.`

const TRAIT_SCHEMA = {
  type: 'number',
  minimum: 0,
  maximum: 1,
} as const

export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    traits: {
      type: 'object',
      properties: {
        morality: TRAIT_SCHEMA,
        agency: TRAIT_SCHEMA,
        powerOrientation: TRAIT_SCHEMA,
        emotionalRegulation: TRAIT_SCHEMA,
        socialOrientation: TRAIT_SCHEMA,
        strategicThinking: TRAIT_SCHEMA,
        conviction: TRAIT_SCHEMA,
        riskTolerance: TRAIT_SCHEMA,
        eloquence: TRAIT_SCHEMA,
        emotionalTone: TRAIT_SCHEMA,
        confidence: TRAIT_SCHEMA,
        complexity: TRAIT_SCHEMA,
        narrativeStyle: TRAIT_SCHEMA,
        formality: TRAIT_SCHEMA,
        verbalDominance: TRAIT_SCHEMA,
      },
      required: [
        'morality',
        'agency',
        'powerOrientation',
        'emotionalRegulation',
        'socialOrientation',
        'strategicThinking',
        'conviction',
        'riskTolerance',
        'eloquence',
        'emotionalTone',
        'confidence',
        'complexity',
        'narrativeStyle',
        'formality',
        'verbalDominance',
      ],
    },
    explanation: { type: 'string' },
  },
  required: ['traits', 'explanation'],
} as const

export function buildUserPrompt(answers: string[], questions?: QuestionMeta[]): string {
  const sections = answers.map((rawAnswer, index) => {
    const answer = rawAnswer.trim()
    const probes = questions?.[index]?.primaryTraits?.filter((value) => typeof value === 'string') ?? []
    const probeText = probes.length > 0 ? probes.join(', ') : 'none'
    return `Answer ${index + 1} (probes: ${probeText}):\n"""${answer}"""`
  })

  return `Analyze the following quiz answers and output the JSON object.\n\n${sections.join('\n\n')}`
}
