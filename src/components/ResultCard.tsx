import { motion } from 'framer-motion'
import { traitToPercent } from '../lib/traits'
import type { QuizResult, TraitKey } from '../types/quiz'

interface ResultCardProps {
  result: QuizResult
}

const traitLabels: Record<TraitKey, string> = {
  leadership: 'Leadership',
  morality: 'Morality (Light Side)',
  impulsiveness: 'Impulsiveness',
  independence: 'Independence',
}

export function ResultCard({ result }: ResultCardProps) {
  const alignmentPercent = traitToPercent(result.character.alignmentScore)
  const isLight = result.character.alignmentScore >= 0.5

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-[0_0_40px_rgba(59,130,246,0.16)] md:p-8"
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Your match</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-100 md:text-4xl">{result.character.name}</h2>
        <p className="mt-2 text-sm text-cyan-300">{result.character.signature}</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          {result.character.description}
        </p>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex justify-between text-xs uppercase tracking-widest text-slate-400">
          <span>Dark Side</span>
          <span>Alignment Meter</span>
          <span>Light Side</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className={
              isLight
                ? 'h-full bg-gradient-to-r from-blue-500 to-cyan-300'
                : 'h-full bg-gradient-to-r from-red-700 to-rose-500'
            }
            initial={{ width: 0 }}
            animate={{ width: `${alignmentPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-slate-300">Alignment: {alignmentPercent}% light</p>
      </div>

      <div className="mt-8 space-y-4">
        {(Object.keys(traitLabels) as TraitKey[]).map((key, index) => {
          const value = result.traits[key]
          const pct = traitToPercent(value)
          return (
            <div key={key}>
              <div className="mb-2 flex justify-between text-sm text-slate-300">
                <span>{traitLabels[key]}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.45, delay: 0.07 * index }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
