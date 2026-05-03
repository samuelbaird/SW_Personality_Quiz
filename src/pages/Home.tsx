import { motion } from 'framer-motion'

interface HomeProps {
  onStart: () => void
}

export function Home({ onStart }: HomeProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl rounded-2xl border border-slate-700/70 bg-slate-900/80 p-8 text-center shadow-[0_0_45px_rgba(30,64,175,0.2)]"
    >
      <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Star Wars AI Personality Quiz</p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-100 md:text-5xl">Holocron Personality Analysis</h1>
      <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
        Answer five open-ended prompts. The Holocron analyzes both <em>what</em> you say —
        morality, agency, strategy, conviction — and <em>how</em> you say it — eloquence, tone,
        confidence, formality — then maps your profile to a legendary Star Wars character.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="mt-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-slate-950 transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.45)]"
      >
        Open The Holocron
      </button>
    </motion.section>
  )
}
