import { motion } from 'framer-motion'

interface AnalysisSummaryProps {
  explanation: string
}

export function AnalysisSummary({ explanation }: AnalysisSummaryProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)] md:p-8"
    >
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Holocron Reading</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-100 md:text-2xl">Analysis Summary</h3>

      <p className="mt-4 text-sm leading-relaxed text-slate-200 md:text-base">{explanation}</p>

      <p className="mt-3 text-[11px] uppercase tracking-widest text-slate-500">
        Deterministic mock analysis — heuristic, not LLM-derived.
      </p>
    </motion.section>
  )
}
