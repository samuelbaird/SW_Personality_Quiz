import type { PersonalityTraits, QuizQuestion } from '../types/quiz'
import type { AnsweredQuestion } from './analysis'
import { analyzeTextResponses } from './analysis'
import { normalizeTraits } from './traits'

interface AnalyzeApiSuccess {
  traits: PersonalityTraits
}

function isAnalyzeApiSuccess(data: unknown): data is AnalyzeApiSuccess {
  if (!data || typeof data !== 'object') return false
  const traits = (data as { traits?: unknown }).traits
  return typeof traits === 'object' && traits !== null
}

function buildAnsweredQuestions(answers: string[], questions: QuizQuestion[]): AnsweredQuestion[] {
  return answers.map((answer, i) => ({
    answer,
    primaryTraits: questions[i]?.primaryTraits ?? [],
  }))
}

/**
 * Analyze a list of free-text answers via the backend, falling back to the
 * local deterministic analyzer when the API is unreachable (for example,
 * during a plain `vite dev` session without the Vercel runtime).
 */
export async function analyzeAnswers(
  answers: string[],
  questions: QuizQuestion[],
): Promise<PersonalityTraits> {
  const payload = {
    answers,
    questions: questions.map(({ id, primaryTraits }) => ({ id, primaryTraits })),
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      if (response.status === 404) {
        const pairs = buildAnsweredQuestions(answers, questions)
        return normalizeTraits(analyzeTextResponses(pairs))
      }
      const body = await response.json().catch(() => ({ error: 'Unknown API error' }))
      throw new Error(body?.error ?? 'Failed to analyze answers')
    }

    const data: unknown = await response.json()
    if (!isAnalyzeApiSuccess(data)) {
      throw new Error('Received invalid trait payload from server')
    }

    return normalizeTraits(data.traits)
  } catch (error) {
    if (error instanceof TypeError) {
      const pairs = buildAnsweredQuestions(answers, questions)
      return normalizeTraits(analyzeTextResponses(pairs))
    }
    throw error
  }
}
