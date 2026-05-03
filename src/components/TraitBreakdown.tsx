import { motion } from 'framer-motion'
import type { CharacterTheme } from '../lib/characterThemes'
import { getTraitsByGroup, traitToPercent } from '../lib/traits'
import type { PersonalityTraits, TraitDescriptor, TraitKey, TraitGroup } from '../types/quiz'

interface TraitBreakdownProps {
  traits: PersonalityTraits
  dominantTraits: readonly TraitKey[]
  theme: CharacterTheme
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}

export function TraitBreakdown({ traits, dominantTraits, theme }: TraitBreakdownProps) {
  const dominantSet = new Set(dominantTraits)

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="rounded-2xl border bg-slate-900/80 p-6 md:p-8"
      style={{
        borderColor: theme.border,
        boxShadow: `0 0 40px ${theme.glow}`,
      }}
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ color: `${theme.accent}CC` }}
          >
            Holocron Scan
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-100 md:text-2xl">Trait Breakdown</h3>
        </div>
        <DominantBadges dominantTraits={dominantTraits} traits={traits} theme={theme} />
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <TraitGroupSection
          title="Personality Traits"
          subtitle="Cognitive & motivational signals"
          group="cognitive"
          traits={traits}
          dominantSet={dominantSet}
          theme={theme}
        />
        <TraitGroupSection
          title="Communication Style"
          subtitle="How you express yourself"
          group="expression"
          traits={traits}
          dominantSet={dominantSet}
          theme={theme}
        />
      </div>
    </motion.section>
  )
}

interface TraitGroupSectionProps {
  title: string
  subtitle: string
  group: TraitGroup
  traits: PersonalityTraits
  dominantSet: Set<TraitKey>
  theme: CharacterTheme
}

function TraitGroupSection({ title, subtitle, group, traits, dominantSet, theme }: TraitGroupSectionProps) {
  const descriptors = getTraitsByGroup(group)
  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-200">{title}</h4>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <ul className="space-y-3">
        {descriptors.map((descriptor) => (
          <TraitRow
            key={descriptor.key}
            descriptor={descriptor}
            value={traits[descriptor.key]}
            highlighted={dominantSet.has(descriptor.key)}
            theme={theme}
          />
        ))}
      </ul>
    </div>
  )
}

interface TraitRowProps {
  descriptor: TraitDescriptor
  value: number
  highlighted: boolean
  theme: CharacterTheme
}

function TraitRow({ descriptor, value, highlighted, theme }: TraitRowProps) {
  const pct = traitToPercent(value)

  return (
    <motion.li variants={rowVariants}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-200">
          {descriptor.label}
          {highlighted ? (
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest"
              style={{
                borderColor: `${theme.accent}80`,
                backgroundColor: `${theme.accent}1A`,
                color: theme.accent,
              }}
            >
              Dominant
            </span>
          ) : null}
        </span>
        <span className="font-mono text-xs text-slate-300">{pct}%</span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${descriptor.label}: ${descriptor.poles.low} to ${descriptor.poles.high}`}
      >
        <motion.div
          className="h-full rounded-full"
          style={
            highlighted
              ? { background: `linear-gradient(to right, ${theme.border}, ${theme.accent})` }
              : { background: 'linear-gradient(to right, #6366f1, #a855f7)' }
          }
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
        <span>{descriptor.poles.low}</span>
        <span>{descriptor.poles.high}</span>
      </div>
    </motion.li>
  )
}

interface DominantBadgesProps {
  dominantTraits: readonly TraitKey[]
  traits: PersonalityTraits
  theme: CharacterTheme
}

function DominantBadges({ dominantTraits, traits, theme }: DominantBadgesProps) {
  const descriptors = getTraitsByGroup('cognitive')
    .concat(getTraitsByGroup('expression'))
  const labelByKey = new Map(descriptors.map((d) => [d.key, d.label]))

  return (
    <div className="hidden flex-wrap gap-1.5 md:flex">
      {dominantTraits.map((key) => (
        <span
          key={key}
          className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            borderColor: `${theme.accent}66`,
            backgroundColor: `${theme.accent}0D`,
            color: theme.accent,
          }}
          title={`Dominant: ${labelByKey.get(key) ?? key} (${traitToPercent(traits[key])}%)`}
        >
          {labelByKey.get(key) ?? key}
        </span>
      ))}
    </div>
  )
}
