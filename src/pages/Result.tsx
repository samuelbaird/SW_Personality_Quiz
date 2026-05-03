import { motion } from 'framer-motion'
import { useState } from 'react'
import { AnalysisSummary } from '../components/AnalysisSummary'
import { ResultCard } from '../components/ResultCard'
import { ShareModal } from '../components/ShareModal'
import { TraitBreakdown } from '../components/TraitBreakdown'
import type { CharacterTheme } from '../lib/characterThemes'
import { buildShareImage } from '../lib/shareImage'
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

const APP_URL = 'https://swquiz.vercel.app/'

export function Result({ result, theme, onTryAgain, onRegenerateExplanation }: ResultProps) {
  const [isPreparingShare, setIsPreparingShare] = useState(false)
  const [shareBlob, setShareBlob] = useState<Blob | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  async function openShareModal() {
    setShareError(null)
    setIsPreparingShare(true)
    try {
      const blob = await buildShareImage(result, theme)
      setShareBlob(blob)
    } catch {
      setShareError('Unable to prepare the share image right now. Please try again.')
    } finally {
      setIsPreparingShare(false)
    }
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
            void openShareModal()
          }}
          disabled={isPreparingShare}
          className="rounded-lg px-5 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ backgroundColor: theme.accent }}
        >
          {isPreparingShare ? 'Preparing image...' : 'Share Result'}
        </button>
      </motion.div>
      {shareError ? (
        <motion.p variants={sectionVariants} className="text-center text-xs text-slate-300">
          {shareError}
        </motion.p>
      ) : null}
      <ShareModal
        isOpen={shareBlob !== null}
        blob={shareBlob}
        result={result}
        theme={theme}
        appUrl={APP_URL}
        onClose={() => setShareBlob(null)}
      />
    </motion.section>
  )
}
