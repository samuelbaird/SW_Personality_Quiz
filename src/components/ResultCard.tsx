import { motion } from 'framer-motion'
import type { CharacterTheme } from '../lib/characterThemes'
import { traitToPercent } from '../lib/traits'
import type { QuizResult } from '../types/quiz'

interface ResultCardProps {
  result: QuizResult
  theme: CharacterTheme
}

export function ResultCard({ result, theme }: ResultCardProps) {
  const alignmentPercent = traitToPercent(result.alignmentScore)
  const matchPercent = traitToPercent(result.matchScore)
  const isLight = result.alignmentScore >= 0.5

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border bg-slate-900/80 p-6 md:p-8"
      style={{
        borderColor: theme.border,
        boxShadow: `0 0 40px ${theme.glow}`,
      }}
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Your match</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-100 md:text-4xl">
          {result.character.name}
        </h2>
        {result.character.signature ? (
          <p className="mt-2 text-sm" style={{ color: theme.accent }}>
            {result.character.signature}
          </p>
        ) : null}
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          {result.character.description}
        </p>

        <div
          className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest"
          style={{
            borderColor: `${theme.accent}4D`,
            backgroundColor: `${theme.accent}0D`,
            color: theme.accent,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
          Match strength: {matchPercent}%
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex justify-between text-xs uppercase tracking-widest text-slate-400">
          <span>Dark Side</span>
          <span>Alignment Meter</span>
          <span>Light Side</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full"
            style={
              isLight
                ? { background: `linear-gradient(to right, ${theme.border}, ${theme.accent})` }
                : { background: 'linear-gradient(to right, #b91c1c, #f43f5e)' }
            }
            initial={{ width: 0 }}
            animate={{ width: `${alignmentPercent}%` }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-slate-300">
          Alignment: {alignmentPercent}% light
        </p>
      </div>
    </motion.section>
  )
}
