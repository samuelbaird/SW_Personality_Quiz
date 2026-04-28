import type { CharacterMatch, CharacterProfile, PersonalityTraits, TraitKey } from '../types/quiz'
import { pickBestCharacter } from './similarity'

/**
 * Full character roster, organized by alignment archetype.
 *
 * Every profile defines the three core traits (morality, agency,
 * emotionalRegulation) plus whichever signature traits meaningfully
 * distinguish that character. The similarity engine only scores traits
 * that are explicitly declared, so partial profiles are intentional.
 */
export const CHARACTER_ROSTER: readonly CharacterProfile[] = [

  // ── Light / Principled ──────────────────────────────────────────────────

  {
    id: 'luke_skywalker',
    name: 'Luke Skywalker',
    signature: 'Hopeful Rebel',
    description:
      'Idealistic and fearless, you act on instinct and compassion rather than strategy — driven by faith in people rather than systems.',
    traits: {
      morality: 0.95,
      agency: 0.8,
      emotionalRegulation: 0.5,
      conviction: 0.7,
      riskTolerance: 0.8,
      emotionalTone: 0.8,
    },
  },
  {
    id: 'obi_wan_kenobi',
    name: 'Obi-Wan Kenobi',
    signature: 'Measured Guardian',
    description:
      'Principled and patient, you lead through calm authority and earned trust — a mentor who speaks precisely and acts deliberately.',
    traits: {
      morality: 0.95,
      agency: 0.7,
      emotionalRegulation: 0.9,
      strategicThinking: 0.8,
      formality: 0.7,
      eloquence: 0.7,
    },
  },
  {
    id: 'yoda',
    name: 'Yoda',
    signature: 'Patient Sage',
    description:
      'Quietly powerful, you hold conviction without urgency — the deepest truths emerge not from action but from stillness and perspective.',
    traits: {
      morality: 1.0,
      agency: 0.6,
      emotionalRegulation: 1.0,
      strategicThinking: 0.9,
      complexity: 0.9,
      narrativeStyle: 0.8,
    },
  },
  {
    id: 'mon_mothma',
    name: 'Mon Mothma',
    signature: 'Principled Architect',
    description:
      'You build through consensus and moral clarity — a diplomat who understands that lasting change requires institutions, not just heroics.',
    traits: {
      morality: 0.95,
      agency: 0.7,
      emotionalRegulation: 0.85,
      socialOrientation: 0.9,
      powerOrientation: 0.2,
      eloquence: 0.95,
      formality: 0.95,
    },
  },
  {
    id: 'leia_organa',
    name: 'Leia Organa',
    signature: 'Defiant Leader',
    description:
      'Sharp, decisive, and grounded — you carry the weight of others without breaking, and rally people through sheer force of will.',
    traits: {
      morality: 0.9,
      agency: 0.9,
      emotionalRegulation: 0.7,
      verbalDominance: 0.8,
      confidence: 0.9,
      socialOrientation: 0.8,
    },
  },

  // ── Independent / Gray ──────────────────────────────────────────────────

  {
    id: 'han_solo',
    name: 'Han Solo',
    signature: 'Reluctant Hero',
    description:
      'Self-reliant and irreverent, you trust instinct over protocol — loyal to people, not causes, and always ready to improvise.',
    traits: {
      morality: 0.7,
      agency: 0.8,
      emotionalRegulation: 0.6,
      riskTolerance: 0.9,
      socialOrientation: 0.3,
      formality: 0.2,
      confidence: 0.8,
    },
  },
  {
    id: 'lando_calrissian',
    name: 'Lando Calrissian',
    signature: 'Charming Operator',
    description:
      'Smooth, adaptable, and politically savvy — you read a room better than anyone and know exactly when to charm and when to act.',
    traits: {
      morality: 0.7,
      agency: 0.75,
      emotionalRegulation: 0.7,
      eloquence: 0.8,
      confidence: 0.9,
      socialOrientation: 0.7,
      powerOrientation: 0.6,
      formality: 0.6,
    },
  },
  {
    id: 'ahsoka_tano',
    name: 'Ahsoka Tano',
    signature: 'Path of Her Own',
    description:
      'You define yourself outside the structures that shaped you — guided by personal principle, loyal to few, accountable to your own code.',
    traits: {
      morality: 0.9,
      agency: 0.8,
      emotionalRegulation: 0.7,
      conviction: 0.8,
      socialOrientation: 0.4,
    },
  },
  {
    id: 'din_djarin',
    name: 'Din Djarin',
    signature: 'Silent Protector',
    description:
      'Stoic and uncompromising, your code is your identity — you act without fanfare, and your loyalty, once given, is absolute.',
    traits: {
      morality: 0.8,
      agency: 0.7,
      emotionalRegulation: 0.9,
      conviction: 0.9,
      formality: 0.6,
      emotionalTone: 0.3,
    },
  },
  {
    id: 'cassian_andor',
    name: 'Cassian Andor',
    signature: 'Calculated Resister',
    description:
      'You make hard calls quietly — a strategist who carries the moral cost of necessary action without making it a performance.',
    traits: {
      morality: 0.7,
      agency: 0.8,
      emotionalRegulation: 0.7,
      strategicThinking: 0.8,
      powerOrientation: 0.6,
      complexity: 0.7,
      emotionalTone: 0.4,
    },
  },

  // ── Dark / Power-Oriented ───────────────────────────────────────────────

  {
    id: 'darth_vader',
    name: 'Darth Vader',
    signature: 'Fallen Enforcer',
    description:
      'Commanding and absolute — you impose order through presence alone, driven by conviction buried under layers of suppressed feeling.',
    traits: {
      morality: 0.1,
      agency: 0.85,
      emotionalRegulation: 0.6,
      powerOrientation: 0.9,
      verbalDominance: 0.9,
      emotionalTone: 0.2,
    },
  },
  {
    id: 'palpatine',
    name: 'Emperor Palpatine',
    signature: 'Master Manipulator',
    description:
      'Calculating and visionary, you operate decades ahead — power is not a goal but a instrument, and patience is your sharpest weapon.',
    traits: {
      morality: 0.0,
      agency: 0.9,
      emotionalRegulation: 0.9,
      strategicThinking: 1.0,
      powerOrientation: 1.0,
      eloquence: 0.9,
      complexity: 0.9,
    },
  },
  {
    id: 'kylo_ren',
    name: 'Kylo Ren',
    signature: 'Tormented Idealist',
    description:
      'Intensely emotional and unresolved, you pursue certainty through force because doubt is unbearable — a seeker still becoming.',
    traits: {
      morality: 0.3,
      agency: 0.85,
      emotionalRegulation: 0.2,
      conviction: 0.9,
      emotionalTone: 0.8,
      verbalDominance: 0.7,
    },
  },
  {
    id: 'thrawn',
    name: 'Grand Admiral Thrawn',
    signature: 'Analytical Strategist',
    description:
      'Cold, precise, and many steps ahead — you understand patterns in people as clearly as in art, and act only when the outcome is certain.',
    traits: {
      morality: 0.2,
      agency: 0.85,
      emotionalRegulation: 0.95,
      strategicThinking: 1.0,
      complexity: 0.95,
      emotionalTone: 0.2,
      eloquence: 0.85,
    },
  },
  {
    id: 'moff_gideon',
    name: 'Moff Gideon',
    signature: 'Imperial Architect',
    description:
      'Controlled and intimidating, you command through structure and fear — authority is your native language and you speak it fluently.',
    traits: {
      morality: 0.2,
      agency: 0.8,
      emotionalRegulation: 0.85,
      powerOrientation: 0.95,
      formality: 0.9,
      verbalDominance: 0.85,
      confidence: 0.9,
    },
  },

  // ── Contributors / Specialists ──────────────────────────────────────────

  {
    id: 'chewbacca',
    name: 'Chewbacca',
    signature: 'Loyal Companion',
    description:
      'Fiercely loyal and emotionally present, you show up for the people you love and let your actions speak louder than words ever could.',
    traits: {
      morality: 0.9,
      agency: 0.6,
      emotionalRegulation: 0.7,
      socialOrientation: 0.9,
      emotionalTone: 0.8,
    },
  },
  {
    id: 'r2d2',
    name: 'R2-D2',
    signature: 'Resourceful Problem-Solver',
    description:
      'You get things done — quietly, creatively, and without waiting for permission. The right solution matters more than who gets the credit.',
    traits: {
      morality: 0.9,
      agency: 0.8,
      emotionalRegulation: 0.8,
      strategicThinking: 0.7,
    },
  },
  {
    id: 'c3po',
    name: 'C-3PO',
    signature: 'Anxious Expert',
    description:
      'Knowledgeable and precise, you communicate with meticulous care — but the gap between what you know and what you can control drives constant anxiety.',
    traits: {
      morality: 0.85,
      agency: 0.3,
      emotionalRegulation: 0.2,
      eloquence: 0.9,
      confidence: 0.2,
      formality: 0.95,
    },
  },
  {
    id: 'boba_fett',
    name: 'Boba Fett',
    signature: 'Lone Operative',
    description:
      'Detached and efficient, you work alone by design — loyalty is earned slowly and trust even slower, but once earned it holds.',
    traits: {
      morality: 0.4,
      agency: 0.8,
      emotionalRegulation: 0.9,
      emotionalTone: 0.2,
      socialOrientation: 0.2,
    },
  },
  {
    id: 'fennec_shand',
    name: 'Fennec Shand',
    signature: 'Precision Operative',
    description:
      'Composed and methodical, you assess situations before committing — your value lies in execution, not explanation.',
    traits: {
      morality: 0.5,
      agency: 0.85,
      emotionalRegulation: 0.9,
      strategicThinking: 0.8,
    },
  },
  {
    id: 'k2so',
    name: 'K-2SO',
    signature: 'Blunt Realist',
    description:
      "Unfiltered and outcome-focused, you say what others won't — not out of cruelty but because the truth matters more than comfort.",
    traits: {
      morality: 0.8,
      agency: 0.8,
      emotionalRegulation: 0.9,
      verbalDominance: 0.8,
      confidence: 0.95,
      emotionalTone: 0.2,
    },
  },
  {
    id: 'bb8',
    name: 'BB-8',
    signature: 'Earnest Optimist',
    description:
      'Warm, energetic, and relentlessly positive — you connect with people instinctively and make them feel seen even without saying a word.',
    traits: {
      morality: 0.95,
      agency: 0.7,
      emotionalRegulation: 0.6,
      emotionalTone: 0.9,
      socialOrientation: 0.9,
    },
  },
]

/**
 * Trait weights for character matching.
 *
 * Core traits (morality, agency, emotionalRegulation) are weighted highest
 * since they anchor every profile and carry the most identity signal.
 * Signature traits act as differentiators within the same alignment band.
 */
const DEFAULT_WEIGHTS: Partial<Record<TraitKey, number>> = {
  morality: 1.5,
  agency: 1.2,
  emotionalRegulation: 1.1,

  powerOrientation: 1.3,
  strategicThinking: 1.0,
  conviction: 1.0,
  socialOrientation: 0.9,
  riskTolerance: 0.9,

  verbalDominance: 0.8,
  confidence: 0.7,
  emotionalTone: 0.7,
  eloquence: 0.6,
  complexity: 0.6,
  formality: 0.6,
  narrativeStyle: 0.5,
}

/**
 * Map a fully-resolved {@link PersonalityTraits} profile to the closest
 * character in the roster, returning both the matched profile and the
 * similarity score for downstream UI display.
 */
export function mapTraitsToCharacter(traits: PersonalityTraits): CharacterMatch {
  return pickBestCharacter(traits, CHARACTER_ROSTER, DEFAULT_WEIGHTS)
}
