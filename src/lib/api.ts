import type { PersonalityTraits, QuizQuestion } from '../types/quiz'
import type { AnsweredQuestion } from './analysis'
import { analyzeTextResponses } from './analysis'
import { clientWantsGeminiDebugLogs } from './debugGeminiClient'
import { normalizeTraits } from './traits'

interface AnalyzeApiSuccess {
  traits: PersonalityTraits
  explanation?: string
  _geminiDebug?: { route: 'analyze'; raw: string }
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
  const payload: {
    answers: string[]
    questions: { id: string; primaryTraits: string[] }[]
    debugGemini?: boolean
  } = {
    answers,
    questions: questions.map(({ id, primaryTraits }) => ({ id, primaryTraits })),
  }
  if (clientWantsGeminiDebugLogs) {
    payload.debugGemini = true
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

    if (clientWantsGeminiDebugLogs && data._geminiDebug?.raw !== undefined) {
      console.info('[Gemini raw] POST /api/analyze', data._geminiDebug.raw)
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
