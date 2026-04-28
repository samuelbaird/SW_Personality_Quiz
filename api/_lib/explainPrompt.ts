import type { ExplainRequestPayload } from '../../src/lib/explainPayload'

export const EXPLAIN_SYSTEM_INSTRUCTION = `You are an in-universe archivist writing concise personality readings.

OUTPUT RULES:
1. Return one JSON object: { "explanation": string }.
2. Write 2-3 sentences, 50-70 words total.
3. Tone is calm, analytical, and subtly Star Wars flavored.
4. Mention the character by name and ground your claims in supplied traits only.
5. Reference at least two aligned traits and one divergence.
6. Never invent lore, events, quotes, or traits.
7. If a trait value is between 0.4 and 0.6, treat it as balanced/neutral.
8. No markdown, no bullet lists, no preamble.`

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
