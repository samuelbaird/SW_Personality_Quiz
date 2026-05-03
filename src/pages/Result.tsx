import { motion } from 'framer-motion'
import { AnalysisSummary } from '../components/AnalysisSummary'
import { ResultCard } from '../components/ResultCard'
import { TraitBreakdown } from '../components/TraitBreakdown'
import type { CharacterTheme } from '../lib/characterThemes'
import type { QuizResult } from '../types/quiz'

interface ResultProps {
  result: QuizResult
  theme: CharacterTheme
  onTryAgain: () => void
  onRegenerateExplanation: () => void
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

export function Result({ result, theme, onTryAgain, onRegenerateExplanation }: ResultProps) {
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
        <ResultCard result={result} theme={theme} />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <TraitBreakdown traits={result.traits} dominantTraits={result.dominantTraits} theme={theme} />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <AnalysisSummary explanation={result.explanation} source={result.explanationSource} />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="flex flex-wrap justify-center gap-3 pt-2"
      >
        <button
          type="button"
          onClick={onTryAgain}
          className="rounded-lg border px-5 py-2 text-sm text-slate-200 transition hover:brightness-125"
          style={{ borderColor: theme.border }}
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onRegenerateExplanation}
          disabled={result.explanationSource === 'pending'}
          className="rounded-lg border px-5 py-2 text-sm transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: `${theme.accent}80`, color: theme.accent }}
        >
          Regenerate Reading
        </button>
        <button
          type="button"
          onClick={() => {
            void handleShare()
          }}
          className="rounded-lg px-5 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110"
          style={{ backgroundColor: theme.accent }}
        >
          Share Result
        </button>
      </motion.div>
    </motion.section>
  )
}
