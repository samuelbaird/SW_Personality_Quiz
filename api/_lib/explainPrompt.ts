import type { ExplainRequestPayload } from '../../src/lib/explainPayload.js'

export const EXPLAIN_SYSTEM_INSTRUCTION = `You are an in-universe archivist writing concise personality readings.

OUTPUT RULES:
1. Return one JSON object: { "explanation": string }.
2. Write 2-3 sentences, 50-70 words total.
3. Tone is calm, analytical, and subtly Star Wars flavored.
4. Every trait mentioned must be grounded in specific behavior, phrasing, or decisions from the user's responses.
5. When referencing a trait, briefly describe the observed behavior that supports it before naming the trait.
6. You must reference at least one concrete detail from the user's answers (e.g. a decision, framing, or approach).
7. Only use supplied traits. Never invent traits, lore, quotes, or events.
8. Treat trait values between 0.4 and 0.6 as situational; only interpret them if clearly supported by behavior.
9. Mention at least two aligned traits and one divergence, but only if supported by evidence.
10. Avoid absolute claims; use observational language (e.g. "suggests", "indicates", "is consistent with").
11. No markdown, no bullet lists, no preamble.`

export const EXPLAIN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    explanation: {
      type: 'string',
      minLength: 40,
      maxLength: 600,
    },
  },
  required: ['explanation'],
} as const

export function buildExplainUserPrompt(payload: ExplainRequestPayload): string {
  return [
    'Reading payload:',
    JSON.stringify(
      {
        character: payload.character,
        aligned: payload.aligned,
        divergent: payload.divergent,
        strongMatches: payload.strongMatches,
      },
      null,
      2,
    ),
    '',
    'Write the explanation now.',
  ].join('\n')
}
