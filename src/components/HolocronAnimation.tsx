import { motion, useReducedMotion } from 'framer-motion'

const CORNER_OFFSET = 44
const BAR_LEN = 18
const BAR_THICK = 2
const CORE = 36
const CORE_HALF = CORE / 2

const CORNER_CYCLE_S = 8

// Phase boundaries, normalized to [0, 1] across CORNER_CYCLE_S:
//   t=0      Phase A start (contact, sitting against the core)
//   t=0.125  Phase A end / Phase B start (begin separating, 1.0s in)
//   t=0.3125 Phase B end / Phase C start (fully separated, 2.5s in)
//   t=0.6875 Phase C end / Phase D start (spin complete, 5.5s in)
//   t=0.875  Phase D end / Phase E start (returned to contact, 7.0s in)
//   t=1      Phase E end (loop, 8.0s in)
const CYCLE_TIMES = [0, 0.125, 0.3125, 0.6875, 0.875, 1]
const SPIN_KEYFRAMES = [0, 0, 0, 360, 360, 360]

type Sign = 1 | -1

const CORNER_SIGNS: Array<[Sign, Sign, Sign]> = [
  [1, 1, 1],
  [-1, 1, 1],
  [1, -1, 1],
  [-1, -1, 1],
  [1, 1, -1],
  [-1, 1, -1],
  [1, -1, -1],
  [-1, -1, -1],
]

const CORE_FACE_TRANSFORMS: string[] = [
  `translate(-50%, -50%) translateZ(${CORE_HALF}px)`,
  `translate(-50%, -50%) rotateY(180deg) translateZ(${CORE_HALF}px)`,
  `translate(-50%, -50%) rotateY(90deg) translateZ(${CORE_HALF}px)`,
  `translate(-50%, -50%) rotateY(-90deg) translateZ(${CORE_HALF}px)`,
  `translate(-50%, -50%) rotateX(90deg) translateZ(${CORE_HALF}px)`,
  `translate(-50%, -50%) rotateX(-90deg) translateZ(${CORE_HALF}px)`,
]

function CoreFace({ transform }: { transform: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: CORE,
        height: CORE,
        transform,
        background:
          'radial-gradient(circle, rgba(207, 250, 254, 0.95) 0%, rgba(34, 211, 238, 0.6) 55%, rgba(8, 145, 178, 0.3) 100%)',
        border: '1px solid rgba(165, 243, 252, 0.55)',
        boxShadow:
          'inset 0 0 10px rgba(207, 250, 254, 0.7), 0 0 6px rgba(34, 211, 238, 0.45)',
        backfaceVisibility: 'visible',
      }}
    />
  )
}

function InnerCore() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformStyle: 'preserve-3d',
      }}
    >
      {CORE_FACE_TRANSFORMS.map((transform, i) => (
        <CoreFace key={i} transform={transform} />
      ))}
    </div>
  )
}

type Axis = 'x' | 'y' | 'z'

function getBarTransform(axis: Axis, sign: Sign): string {
  const offset = -sign * (BAR_LEN / 2)
  if (axis === 'x') {
    return `translate(-50%, -50%) translate3d(${offset}px, 0, 0)`
  }
  if (axis === 'y') {
    return `translate(-50%, -50%) rotateZ(90deg) translate3d(${offset}px, 0, 0)`
  }
  return `translate(-50%, -50%) rotateY(90deg) translate3d(${-offset}px, 0, 0)`
}

function Bar({ axis, sign }: { axis: Axis; sign: Sign }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: BAR_LEN,
        height: BAR_THICK,
        transform: getBarTransform(axis, sign),
        background:
          'linear-gradient(180deg, #fde68a 0%, #f5c86e 50%, #b8843a 100%)',
        boxShadow: '0 0 4px rgba(245, 200, 110, 0.75)',
        borderRadius: 1,
        backfaceVisibility: 'visible',
      }}
    />
  )
}

type CornerProps = {
  sx: Sign
  sy: Sign
  sz: Sign
  hashIndex: number
  reducedMotion: boolean
}

function CornerLFrame({ sx, sy, sz, hashIndex, reducedMotion }: CornerProps) {
  const baseStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    transformStyle: 'preserve-3d' as const,
  }

  if (reducedMotion) {
    return (
      <div
        style={{
          ...baseStyle,
          transform: `translate3d(${sx * CORNER_OFFSET}px, ${sy * CORNER_OFFSET}px, ${sz * CORNER_OFFSET}px)`,
        }}
      >
        <Bar axis="x" sign={sx} />
        <Bar axis="y" sign={sy} />
        <Bar axis="z" sign={sz} />
      </div>
    )
  }

  const cycleX = [
    sx * CORE_HALF,
    sx * CORE_HALF,
    sx * CORNER_OFFSET,
    sx * CORNER_OFFSET,
    sx * CORE_HALF,
    sx * CORE_HALF,
  ]
  const cycleY = [
    sy * CORE_HALF,
    sy * CORE_HALF,
    sy * CORNER_OFFSET,
    sy * CORNER_OFFSET,
    sy * CORE_HALF,
    sy * CORE_HALF,
  ]
  const cycleZ = [
    sz * CORE_HALF,
    sz * CORE_HALF,
    sz * CORNER_OFFSET,
    sz * CORNER_OFFSET,
    sz * CORE_HALF,
    sz * CORE_HALF,
  ]

  return (
    <motion.div
      style={baseStyle}
      animate={{
        x: cycleX,
        y: cycleY,
        z: cycleZ,
        rotateX: SPIN_KEYFRAMES,
        rotateY: SPIN_KEYFRAMES,
      }}
      transition={{
        duration: CORNER_CYCLE_S,
        times: CYCLE_TIMES,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
        delay: hashIndex * 0.04,
      }}
    >
      <Bar axis="x" sign={sx} />
      <Bar axis="y" sign={sy} />
      <Bar axis="z" sign={sz} />
    </motion.div>
  )
}

const INNER_GLOW_TRANSFORMS = [
  'translate(-50%, -50%)',
  'translate(-50%, -50%) rotateX(90deg)',
  'translate(-50%, -50%) rotateY(90deg)',
]

function InnerGlow() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformStyle: 'preserve-3d',
        pointerEvents: 'none',
      }}
    >
      {INNER_GLOW_TRANSFORMS.map((transform, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: CORE * 1.5,
            height: CORE * 1.5,
            transform,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(165, 243, 252, 0.55) 0%, rgba(34, 211, 238, 0.15) 50%, rgba(34, 211, 238, 0) 80%)',
            filter: 'blur(4px)',
          }}
          animate={{ opacity: [0.55, 0.95, 0.55] }}
          transition={{
            duration: 2.4,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

type HolocronAnimationProps = {
  className?: string
  ariaHidden?: boolean
}

export function HolocronAnimation({
  className,
  ariaHidden = true,
}: HolocronAnimationProps) {
  const reducedMotion = useReducedMotion() ?? false

  const wrapperClass = `${className ? `${className} ` : ''}relative h-28 w-28`.trim()

  return (
    <div
      className={wrapperClass}
      style={{ perspective: '600px' }}
      aria-hidden={ariaHidden ? true : undefined}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 h-20 w-20 rounded-full bg-cyan-400/30 blur-xl"
        style={{ x: '-50%', y: '-50%' }}
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.9, 1.1, 0.9] }}
        transition={{
          duration: 2.4,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={
          reducedMotion
            ? { rotateX: -22, rotateY: 28, rotateZ: 0 }
            : { rotateX: [0, 360], rotateY: [0, 360], rotateZ: [0, 360] }
        }
        transition={
          reducedMotion
            ? undefined
            : {
                rotateX: {
                  duration: 18,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                },
                rotateY: {
                  duration: 13,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                },
                rotateZ: {
                  duration: 27,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                },
              }
        }
      >
        <InnerGlow />
        <InnerCore />
        {CORNER_SIGNS.map(([sx, sy, sz], i) => (
          <CornerLFrame
            key={`c${i}`}
            sx={sx}
            sy={sy}
            sz={sz}
            hashIndex={i}
            reducedMotion={reducedMotion}
          />
        ))}
      </motion.div>
    </div>
  )
}
