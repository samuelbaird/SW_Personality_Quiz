import { motion } from 'framer-motion'

interface QuestionCardProps {
  questionNumber: number
  totalQuestions: number
  question: string
  answer: string
  onAnswerChange: (value: string) => void
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  answer,
  onAnswerChange,
}: QuestionCardProps) {
  return (
    <motion.section
      key={questionNumber}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
      className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-5 shadow-[0_0_28px_rgba(56,189,248,0.08)] md:p-8"
    >
      <p className="text-xs uppercase tracking-widest text-slate-400">
        Question {questionNumber + 1} / {totalQuestions}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-slate-100 md:text-2xl">{question}</h2>

      <textarea
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        placeholder="Type your response..."
        className="mt-4 min-h-44 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-sm leading-relaxed text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
      />
      <p className="mt-2 text-xs text-slate-400">
        Minimum 12 characters. Richer answers produce better alignment.
      </p>
    </motion.section>
  )
}
