import { motion } from 'framer-motion'

const rings = [0, 1, 2]

export function LoadingScreen() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 text-center">
      <div className="relative h-28 w-28">
        {rings.map((ring) => (
          <motion.div
            key={ring}
            className="absolute inset-0 rounded-full border border-cyan-400/40"
            animate={{
              scale: [0.7 + ring * 0.08, 1.24 + ring * 0.08],
              opacity: [0.8, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.9,
              delay: ring * 0.2,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.div
          className="absolute inset-5 rounded-full bg-cyan-400/25 blur-md"
          animate={{ opacity: [0.4, 0.95, 0.4] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
        />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Holocron analyzing...</h2>
        <p className="mt-2 text-sm text-slate-400">
          Calibrating your force signature against the Jedi Archives.
        </p>
      </div>
    </div>
  )
}
