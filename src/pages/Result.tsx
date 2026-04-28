import { motion } from 'framer-motion'
import { AnalysisSummary } from '../components/AnalysisSummary'
import { ResultCard } from '../components/ResultCard'
import { TraitBreakdown } from '../components/TraitBreakdown'
import type { QuizResult } from '../types/quiz'

interface ResultProps {
  result: QuizResult
  onTryAgain: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
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
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      <motion.div variants={sectionVariants}>
        <ResultCard result={result} />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <TraitBreakdown traits={result.traits} dominantTraits={result.dominantTraits} />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <AnalysisSummary explanation={result.explanation} />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="flex flex-wrap justify-center gap-3 pt-2"
      >
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
      </motion.div>
    </motion.section>
  )
}
