import { AnimatePresence, motion } from 'framer-motion'
import { ProgressBar } from '../components/ProgressBar'
import { QuestionCard } from '../components/QuestionCard'

interface QuizProps {
  questions: string[]
  answers: string[]
  activeQuestion: number
  progress: number
  error: string | null
  onAnswerChange: (index: number, value: string) => void
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

export function Quiz({
  questions,
  answers,
  activeQuestion,
  progress,
  error,
  onAnswerChange,
  onBack,
  onNext,
  onSubmit,
}: QuizProps) {
  const isLast = activeQuestion === questions.length - 1

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto w-full max-w-4xl space-y-5"
    >
      <ProgressBar progress={progress + 100 / questions.length} />

      <AnimatePresence mode="wait">
        <QuestionCard
          key={activeQuestion}
          questionNumber={activeQuestion}
          totalQuestions={questions.length}
          question={questions[activeQuestion]}
          answer={answers[activeQuestion]}
          onAnswerChange={(value) => onAnswerChange(activeQuestion, value)}
        />
      </AnimatePresence>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={activeQuestion === 0}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            Reveal My Character
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Next Question
          </button>
        )}
      </div>
    </motion.section>
  )
}
