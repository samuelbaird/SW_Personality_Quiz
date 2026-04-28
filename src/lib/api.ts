import type { TraitScores } from '../types/quiz'
import { normalizeTraits } from './traits'

interface AnalyzeApiResponse {
  leadership: number
  morality: number
  impulsiveness: number
  independence: number
}

function isAnalyzeResponse(data: unknown): data is AnalyzeApiResponse {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>

  return (
    typeof obj.leadership === 'number' &&
    typeof obj.morality === 'number' &&
    typeof obj.impulsiveness === 'number' &&
    typeof obj.independence === 'number'
  )
}

export async function analyzeAnswers(answers: string[]): Promise<TraitScores> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown API error' }))
    throw new Error(errorBody.error ?? 'Failed to analyze answers')
  }

  const data: unknown = await response.json()

  if (!isAnalyzeResponse(data)) {
    throw new Error('Received invalid trait payload from server')
  }

  return normalizeTraits(data)
}
