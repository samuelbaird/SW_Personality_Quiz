import type { CharacterMatch, CharacterProfile, CharacterScore, PersonalityTraits, TraitKey } from '../types/quiz'
import { pickBestCharacter, pickBestCharacterDetailed } from './similarity'

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
      strategicThinking: 0.35,
      authorityOrientation: 0.70,
      authorityRigidity: 0.6,
      evaluationBasis: 0.60,
      competenceSensitivity: 0.75,
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
    id: 'qui_gon_jinn',
    name: 'Qui-Gon Jinn',
    signature: 'Principled Dissenter',
    description:
      'Deeply principled and quietly independent — you follow your convictions over institutional rules, and trust the long view even when it costs you the structure around you.',
    traits: {
      morality: 0.95,
      agency: 0.65,
      emotionalRegulation: 0.90,
      conviction: 0.90,
      socialOrientation: 0.35,
      authorityOrientation: 0.55,
      authorityRigidity: 0.70,
      evaluationBasis: 0.85,
      emotionalTone: 0.65,
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
      agency: 0.6,
      emotionalRegulation: 0.85,
      socialOrientation: 0.9,
      powerOrientation: 0.2,
      eloquence: 0.95,
      formality: 0.95,
      authorityOrientation: 0.80,
      authorityRigidity: 0.75,
      evaluationBasis: 0.85,
      competenceSensitivity: 0.85,
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
      agency: 0.95,
      emotionalRegulation: 0.7,
      verbalDominance: 0.8,
      confidence: 0.9,
      socialOrientation: 0.8,
      authorityOrientation: 0.85,
      authorityRigidity: 0.8,
      evaluationBasis: 0.65,
      competenceSensitivity: 0.8,
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
      authorityOrientation: 0.35,
      authorityRigidity: 0.2,
      evaluationBasis: 0.2,
      competenceSensitivity: 0.4,
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
      socialOrientation: 0.85,
      powerOrientation: 0.6,
      formality: 0.6,
      authorityOrientation: 0.50,
      authorityRigidity: 0.5,
      evaluationBasis: 0.55,
      competenceSensitivity: 0.6,
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
      socialOrientation: 0.55,
      authorityOrientation: 0.60,
      authorityRigidity: 0.65,
      evaluationBasis: 0.8,
      competenceSensitivity: 0.85,
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
      authorityOrientation: 0.95,
      authorityRigidity: 0.9,
      evaluationBasis: 0.25,
      competenceSensitivity: 0.65,
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
      authorityOrientation: 0.98,
      authorityRigidity: 0.95,
      evaluationBasis: 0.65,
      competenceSensitivity: 0.85,
    },
  },
  {
    id: 'count_dooku',
    name: 'Count Dooku',
    signature: 'Elegant Ideologue',
    description:
      'Aristocratic and persuasive, you pursue power through conviction and eloquence — your disillusionment with broken systems became the justification for something far darker.',
    traits: {
      morality: 0.15,
      agency: 0.85,
      emotionalRegulation: 0.90,
      socialOrientation: 0.70,
      eloquence: 0.95,
      formality: 0.95,
      confidence: 0.90,
      powerOrientation: 0.80,
      authorityOrientation: 0.90,
      authorityRigidity: 0.90,
      evaluationBasis: 0.75,
      competenceSensitivity: 0.80,
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
      authorityOrientation: 0.75,
      authorityRigidity: 0.6,
      evaluationBasis: 0.4,
      competenceSensitivity: 0.5,
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
      authorityOrientation: 0.90,
      authorityRigidity: 0.95,
      evaluationBasis: 0.90,
      competenceSensitivity: 0.95,
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
      authorityOrientation: 0.25,
      authorityRigidity: 0.2,
      evaluationBasis: 0.3,
      competenceSensitivity: 0.5,
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
      authorityOrientation: 0.30,
      authorityRigidity: 0.3,
      evaluationBasis: 0.5,
      competenceSensitivity: 0.7,
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
      authorityOrientation: 0.20,
      authorityRigidity: 0.1,
      evaluationBasis: 0.9,
      competenceSensitivity: 0.6,
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
      authorityOrientation: 0.55,
      evaluationBasis: 0.25,
      emotionalTone: 0.25,
      competenceSensitivity: 0.90,
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
      conviction: 0.70,
      riskTolerance: 0.75,
      authorityOrientation: 0.20,
    },
  },
  {
    id: 'anakin_skywalker',
    name: 'Anakin Skywalker',
    signature: 'Raw Power',
    description:
      'Passion and ability eclipse patience — you chase mastery and control because anything less feels like losing what matters most.',
    traits: {
      morality: 0.50,
      agency: 0.95,
      emotionalRegulation: 0.20,
      powerOrientation: 0.85,
      riskTolerance: 0.95,
      conviction: 0.90,
      authorityOrientation: 0.95,
      authorityRigidity: 0.80,
      evaluationBasis: 0.35,
      competenceSensitivity: 0.70,
      emotionalTone: 0.85,
    },
  },
  {
    id: 'padme_amidala',
    name: 'Padmé Amidala',
    signature: 'Duty and Heart',
    description:
      'Principled and connector-driven — you lead with ideals but never forget the people standing beside you.',
    traits: {
      morality: 0.95,
      agency: 0.70,
      emotionalRegulation: 0.85,
      socialOrientation: 0.95,
      authorityOrientation: 0.80,
      evaluationBasis: 0.80,
      competenceSensitivity: 0.85,
      emotionalTone: 0.80,
      eloquence: 0.90,
      formality: 0.85,
    },
  },
  {
    id: 'rey',
    name: 'Rey',
    signature: 'Emergent Guardian',
    description:
      'Resilient and searching — you grow into conviction and skill because the moment demands it, not because you waited for permission.',
    traits: {
      morality: 0.90,
      agency: 0.85,
      emotionalRegulation: 0.75,
      strategicThinking: 0.65,
      conviction: 0.80,
      authorityOrientation: 0.70,
      evaluationBasis: 0.75,
      competenceSensitivity: 0.80,
      riskTolerance: 0.75,
    },
  },
  {
    id: 'finn',
    name: 'Finn',
    signature: 'Defector with Backbone',
    description:
      'Once a follower of orders, now choosing sides — you care about people first, and courage means acting when the path is unclear.',
    traits: {
      morality: 0.85,
      agency: 0.80,
      emotionalRegulation: 0.60,
      socialOrientation: 0.85,
      riskTolerance: 0.85,
      authorityOrientation: 0.40,
      conviction: 0.65,
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
  authorityOrientation: 2.0,
  authorityRigidity: 1.8,
  evaluationBasis: 1.8,
  competenceSensitivity: 1.6,

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

export function mapTraitsToCharacterDetailed(
  traits: PersonalityTraits,
): CharacterMatch & { score: CharacterScore } {
  return pickBestCharacterDetailed(traits, CHARACTER_ROSTER, DEFAULT_WEIGHTS)
}
