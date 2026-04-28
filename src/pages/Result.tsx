import { motion } from 'framer-motion'
import { ResultCard } from '../components/ResultCard'
import type { QuizResult } from '../types/quiz'

interface ResultProps {
  result: QuizResult
  onTryAgain: () => void
}

export function Result({ result, onTryAgain }: ResultProps) {
  async function handleShare() {
    const text = `I got ${result.character.name} on the Star Wars AI Personality Quiz!`
    const shareData = {
      title: 'Star Wars AI Personality Quiz',
      text,
    }

    if (navigator.share) {
      await navigator.share(shareData)
      return
    }

    await navigator.clipboard.writeText(text)
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      <ResultCard result={result} />

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onTryAgain}
          className="rounded-lg border border-slate-600 px-5 py-2 text-sm text-slate-200 transition hover:border-slate-400"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={() => {
            void handleShare()
          }}
          className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
        >
          Share Result
        </button>
      </div>
    </motion.section>
  )
}
