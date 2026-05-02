import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { AnsweredQuestion } from '../src/lib/analysis'
import { analyzeTextResponses } from '../src/lib/analysis'
import { normalizeTraits } from '../src/lib/traits'
import { geminiDebugAllowed } from './_lib/debugGemini'
import { callGemini } from './_lib/gemini'
import { getJsonBody } from './_lib/parseJsonBody'
import { RESPONSE_SCHEMA, SYSTEM_INSTRUCTION, buildUserPrompt } from './_lib/prompt'
import { safeParseGeminiResponse } from './_lib/validation'

interface QuestionMeta {
  id: string
  primaryTraits: string[]
}

interface AnalyzeBody {
  answers?: unknown
  questions?: unknown
  debugGemini?: unknown
}

function isQuestionMetaList(value: unknown): value is QuestionMeta[] {
  return (
    Array.isArray(value) &&
    value.every(
      (q) =>
        typeof q === 'object' &&
        q !== null &&
        typeof (q as QuestionMeta).id === 'string' &&
        Array.isArray((q as QuestionMeta).primaryTraits),
    )
  )
}

function buildAnsweredQuestions(answers: string[], questions: QuestionMeta[] | null): AnsweredQuestion[] {
  return answers.map((answer, i) => ({
    answer: answer.trim(),
    primaryTraits: questions?.[i]?.primaryTraits ?? [],
  }))
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
    const body = getJsonBody(req) as AnalyzeBody
    const answers = body?.answers
    const questionsMeta = body?.questions

    if (!Array.isArray(answers) || !answers.every((item) => typeof item === 'string')) {
      return res.status(400).json({ error: 'Invalid payload. Expecting { answers: string[] }' })
    }

    const trimmed = (answers as string[]).map((value) => value.trim()).filter(Boolean)
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'At least one non-empty answer is required' })
    }

    const validMeta = isQuestionMetaList(questionsMeta) ? questionsMeta : null

    const wantGeminiDebug =
      geminiDebugAllowed() && (body as AnalyzeBody).debugGemini === true

    let analyzeFallbackRaw: string | undefined
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      const geminiResult = await callGemini({
        apiKey,
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: SYSTEM_INSTRUCTION,
        userPrompt: buildUserPrompt(trimmed, validMeta ?? undefined),
      })

      if (geminiResult.ok) {
        const parsed = safeParseGeminiResponse(geminiResult.raw)
        if (parsed) {
          if (parsed.missingTraitKeys.length > 0) {
            console.warn('[analyze] Gemini omitted traits (defaulted to 0.5)', parsed.missingTraitKeys)
          }
          return res.status(200).json({
            traits: parsed.traits,
            explanation: parsed.explanation,
            ...(wantGeminiDebug
              ? { _geminiDebug: { route: 'analyze' as const, raw: geminiResult.raw } }
              : {}),
          })
        }
        console.warn('[analyze] Gemini response failed validation (fewer than half the traits returned); falling back')
        if (wantGeminiDebug) {
          analyzeFallbackRaw = geminiResult.raw
        }
      } else {
        console.warn('[analyze] Gemini call failed; falling back', {
          reason: geminiResult.reason,
          status: geminiResult.status,
        })
      }
    }

    const answeredQuestions = buildAnsweredQuestions(trimmed, validMeta)
    const traits = normalizeTraits(analyzeTextResponses(answeredQuestions))
    return res.status(200).json({
      traits,
      explanation: '',
      ...(wantGeminiDebug && analyzeFallbackRaw
        ? { _geminiDebug: { route: 'analyze' as const, raw: analyzeFallbackRaw } }
        : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return res.status(500).json({ error: message })
  }
}
