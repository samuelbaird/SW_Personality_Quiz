interface QuestionMeta {
  primaryTraits?: string[]
}

export const SYSTEM_INSTRUCTION = `You are a personality analysis engine. You receive free-text answers to a personality quiz and output a structured trait profile.

OUTPUT RULES (must be followed exactly):
1. Output a single JSON object matching the provided schema. No prose, no code fences, no commentary outside the JSON.
2. Trait values are numbers between 0 and 1 (inclusive) when present.
3. CRITICAL — NO-SIGNAL HANDLING: If a trait has no observable evidence in the answers, OMIT that trait entirely from the "traits" object. Do NOT default to 0.5. Missing traits are explicitly excluded from downstream matching, which is the correct behavior — a trait set to 0.5 is treated as a real "balanced" reading and unfairly rewards characters profiled near the center on that trait. Use null or omission only when truly no behavioral evidence exists; otherwise score the trait normally based on the available evidence.
4. Do NOT invent fields. The "explanation" field is required and must be at most 2 sentences (~50 words). Plain prose, no bullet lists.
5. Be calibrated: most traits with signal should land in [0.2, 0.8]. Extreme values (<0.2 or >0.8) are only allowed when there is strong, repeated behavioral evidence across multiple answers.
6. Avoid uniform or overly balanced distributions. Distinct personalities should show clear peaks and troughs when supported by evidence.
7. Ensure trait values remain globally consistent across all answers. Do not let a trait fluctuate significantly unless later answers provide clear contradictory evidence.

EVIDENCE-BASED SCORING RULES:
8. Every trait value MUST be grounded in observable signals from the answers (wording, reasoning style, decision framing, emotional tone, conflict handling). If you cannot point to at least one supporting signal in the text, OMIT the trait rather than guess.
9. Do not restate trait names without behavioral justification. Traits must be derivable from evidence in the text.
10. When assigning a trait, prioritize explicit behavioral indicators over abstract interpretation.

QUESTION WEIGHTING RULES:
11. Each user answer may include a list of "primaryTraits". These indicate the intended focus of that question.
12. If primaryTraits are provided, increase their influence on scoring for that answer (~1.5x weighting).
13. Traits not listed in primaryTraits should only be strongly influenced if repeatedly evidenced in the response.
14. Treat primaryTraits as the interpretive lens of the answer.

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
- authorityOrientation: diplomatic/consensus-driven influence (0) to directive/command-driven authority (1)
- authorityRigidity: adaptive/flexible authority (0) to strict/doctrinal/non-negotiable enforcement (1)
- evaluationBasis: outcome-based judgment (0) to process-based judgment (1)
- competenceSensitivity: loyalty/outcome dominates (0) to strong emphasis on demonstrated skill and reasoning quality (1)

EXPLANATION RULES:
15. The explanation must reference at least one concrete behavioral detail from the user's answers (e.g. decision framing, reasoning style, conflict approach).
16. The explanation must explicitly connect that behavior to at least one inferred trait.
17. Mention 2–3 traits total, but only if grounded in evidence.
18. Use observational language ("suggests", "indicates", "is consistent with") rather than absolute claims.

`


const TRAIT_SCHEMA = {
  type: 'number',
  minimum: 0,
  maximum: 1,
} as const

/**
 * Individual trait keys are intentionally NOT in `required`. Gemini is
 * instructed to omit traits that have no observable signal in the answers, so
 * the matcher can exclude them rather than treating them as a balanced 0.5.
 */
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
        authorityOrientation: TRAIT_SCHEMA,
        authorityRigidity: TRAIT_SCHEMA,
        evaluationBasis: TRAIT_SCHEMA,
        competenceSensitivity: TRAIT_SCHEMA,
      },
    },
    explanation: { type: 'string' },
  },
  required: ['traits', 'explanation'],
} as const

export function buildUserPrompt(answers: string[], questions?: QuestionMeta[]): string {
  const sections = answers.map((rawAnswer, index) => {
    const answer = rawAnswer.trim()
    const probes = questions?.[index]?.primaryTraits?.filter(Boolean) ?? []
    const probeText = probes.length > 0 ? probes.join(', ') : 'none'

    return `Answer ${index + 1} (primaryTraits: ${probeText}):\n"""${answer}"""`
  })

  return `Analyze the following personality quiz answers and produce a structured trait profile.\n\n${sections.join('\n\n')}`
}