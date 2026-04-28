import { useMemo, useState } from 'react'
import { analyzeAnswers } from '../lib/api'
import { mapTraitsToCharacter } from '../lib/characterMapping'
import { QUIZ_QUESTIONS } from '../lib/questions'
import type { QuizResult } from '../types/quiz'

export type AppScreen = 'home' | 'quiz' | 'loading' | 'result'

function buildEmptyAnswers() {
  return Array.from({ length: QUIZ_QUESTIONS.length }, () => '')
}

export function useQuiz() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [answers, setAnswers] = useState<string[]>(buildEmptyAnswers)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const progress = useMemo(
    () => (activeQuestion / QUIZ_QUESTIONS.length) * 100,
    [activeQuestion],
  )

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
    if (activeQuestion < QUIZ_QUESTIONS.length - 1) {
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
      const traits = await analyzeAnswers(answers)
      const character = mapTraitsToCharacter(traits)
      setResult({ traits, character })
      setScreen('result')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unexpected error'
      setError(message)
      setScreen('quiz')
    }
  }

  function tryAgain() {
    setAnswers(buildEmptyAnswers())
    setResult(null)
    setActiveQuestion(0)
    setError(null)
    setScreen('home')
  }

  return {
    screen,
    questions: QUIZ_QUESTIONS,
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
    tryAgain,
  }
}
