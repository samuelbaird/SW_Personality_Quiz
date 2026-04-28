import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { AnsweredQuestion } from '../src/lib/analysis'
import { analyzeTextResponses } from '../src/lib/analysis'
import { normalizeTraits } from '../src/lib/traits'

interface QuestionMeta {
  id: string
  primaryTraits: string[]
}

/**
 * POST /api/analyze
 *
 * Accepts:  { answers: string[], questions?: { id: string, primaryTraits: string[] }[] }
 * Returns:  { traits: PersonalityTraits }
 *
 * When `questions` is provided, the analyzer weights each answer by the traits
 * its question was designed to probe (primary traits score 2×, others 1×).
 * If omitted, all answers are treated with equal weight.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as { answers?: unknown; questions?: unknown }
    const answers = body?.answers
    const questionsMeta = body?.questions

    if (!Array.isArray(answers) || !answers.every((item) => typeof item === 'string')) {
      return res.status(400).json({ error: 'Invalid payload. Expecting { answers: string[] }' })
    }

    const trimmed = (answers as string[]).map((value) => value.trim()).filter(Boolean)
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'At least one non-empty answer is required' })
    }

    const validMeta: QuestionMeta[] | null =
      Array.isArray(questionsMeta) &&
      questionsMeta.every(
        (q) =>
          typeof q === 'object' &&
          q !== null &&
          typeof (q as QuestionMeta).id === 'string' &&
          Array.isArray((q as QuestionMeta).primaryTraits),
      )
        ? (questionsMeta as QuestionMeta[])
        : null

    const answeredQuestions: AnsweredQuestion[] = (answers as string[]).map((answer, i) => ({
      answer: answer.trim(),
      primaryTraits: validMeta?.[i]?.primaryTraits ?? [],
    }))

    const traits = normalizeTraits(analyzeTextResponses(answeredQuestions))
    return res.status(200).json({ traits })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return res.status(500).json({ error: message })
  }
}
