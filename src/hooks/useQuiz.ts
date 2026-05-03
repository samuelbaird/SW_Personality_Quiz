import { useRef, useState } from 'react'
import { analyzeAnswers } from '../lib/api'
import { mapTraitsToCharacterDetailed } from '../lib/characterMapping'
import { fetchExplanation } from '../lib/explainApi'
import { buildExplainPayload } from '../lib/explainPayload'
import { buildSessionQuestions } from '../lib/questions'
import { pickDominantTraits } from '../lib/traits'
import type { QuizQuestion, QuizResult, TraitKey } from '../types/quiz'

export type AppScreen = 'home' | 'quiz' | 'loading' | 'result'

export function useQuiz() {
  // Built once per session; does not re-shuffle on re-render.
  const [questions] = useState<QuizQuestion[]>(() => buildSessionQuestions())

  const [screen, setScreen] = useState<AppScreen>('home')
  const [answers, setAnswers] = useState<string[]>(() => Array.from({ length: questions.length }, () => ''))
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const explanationRequestId = useRef(0)
  // Trait keys with no signal in the user's answers; the matcher excludes
  // these so it doesn't reward characters profiled near 0.5 on those traits.
  const lastMissingTraits = useRef<readonly TraitKey[]>([])

  const progress = (activeQuestion / questions.length) * 100

  const canSubmit = answers.every((answer) => answer.trim().length >= 12)

  function startQuiz() {
    setError(null)
    setScreen('quiz')
  }

  function updateAnswer(index: number, text: string) {
    setAnswers((current) => {
      const next = [...current]
      next[index] = text
      return next
    })
  }

  function goNext() {
    if (activeQuestion < questions.length - 1) {
      setActiveQuestion((q) => q + 1)
    }
  }

  function goBack() {
    if (activeQuestion > 0) {
      setActiveQuestion((q) => q - 1)
    }
  }

  async function submitQuiz() {
    if (!canSubmit) {
      setError('Please provide at least a sentence for each question before analyzing.')
      return
    }

    setError(null)
    setScreen('loading')

    try {
      const { traits, missingTraits } = await analyzeAnswers(answers, questions)
      lastMissingTraits.current = missingTraits
      const match = mapTraitsToCharacterDetailed(traits, missingTraits)
      const requestId = explanationRequestId.current + 1
      explanationRequestId.current = requestId

      setResult({
        traits,
        character: match.profile,
        matchScore: match.similarity,
        alignmentScore: traits.morality,
        explanation: '',
        explanationSource: 'pending',
        dominantTraits: pickDominantTraits(traits, 3, missingTraits),
      })
      setScreen('result')

      const payload = buildExplainPayload(traits, match.profile, match.score)
      void fetchExplanation(payload).then((explainResult) => {
        if (explanationRequestId.current !== requestId) {
          return
        }

        setResult((current) => {
          if (!current) return current
          return {
            ...current,
            explanation: explainResult.explanation,
            explanationSource: explainResult.source,
          }
        })
      })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unexpected error'
      setError(message)
      setScreen('quiz')
    }
  }

  function regenerateExplanation() {
    if (!result) return

    const requestId = explanationRequestId.current + 1
    explanationRequestId.current = requestId
    const match = mapTraitsToCharacterDetailed(result.traits, lastMissingTraits.current)
    const payload = buildExplainPayload(result.traits, match.profile, match.score)

    setResult((current) => {
      if (!current) return current
      return {
        ...current,
        explanationSource: 'pending',
      }
    })

    void fetchExplanation(payload, { noCache: true }).then((explainResult) => {
      if (explanationRequestId.current !== requestId) {
        return
      }

      setResult((current) => {
        if (!current) return current
        return {
          ...current,
          explanation: explainResult.explanation,
          explanationSource: explainResult.source,
        }
      })
    })
  }

  function tryAgain() {
    explanationRequestId.current += 1
    setAnswers(Array.from({ length: questions.length }, () => ''))
    setResult(null)
    setActiveQuestion(0)
    setError(null)
    setScreen('home')
  }

  return {
    screen,
    questions,
    answers,
    activeQuestion,
    progress,
    result,
    error,
    canSubmit,
    startQuiz,
    updateAnswer,
    goNext,
    goBack,
    submitQuiz,
    regenerateExplanation,
    tryAgain,
  }
}
