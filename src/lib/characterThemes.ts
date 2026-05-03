export interface CharacterTheme {
  /** Path to the character portrait image in /public */
  image: string
  /** Primary character color — used for text accents, badge highlights, borders */
  accent: string
  /** Secondary border color for card edges */
  border: string
  /** rgba string for box-shadow glow */
  glow: string
}

const CHARACTER_THEMES: Record<string, CharacterTheme> = {
  luke_skywalker: {
    image: '/luke.png',
    accent: '#2E5B8C',
    border: '#C9A44C',
    glow: 'rgba(46,91,140,0.4)',
  },
  obi_wan_kenobi: {
    image: '/kenobi.png',
    accent: '#6E7F80',
    border: '#A89F8C',
    glow: 'rgba(110,127,128,0.4)',
  },
  qui_gon_jinn: {
    image: '/qui-gon.png',
    accent: '#4A5D47',
    border: '#8C7A5B',
    glow: 'rgba(74,93,71,0.4)',
  },
  yoda: {
    image: '/yoda.png',
    accent: '#6B8E23',
    border: '#9CAF88',
    glow: 'rgba(107,142,35,0.4)',
  },
  mon_mothma: {
    image: '/mon_mothma.png',
    accent: '#7C9BA6',
    border: '#C6A85E',
    glow: 'rgba(124,155,166,0.4)',
  },
  leia_organa: {
    image: '/leia.png',
    accent: '#7C9BB2',
    border: '#6E2C3A',
    glow: 'rgba(124,155,178,0.4)',
  },
  han_solo: {
    image: '/han.png',
    accent: '#C2A36B',
    border: '#6D7A8C',
    glow: 'rgba(194,163,107,0.4)',
  },
  lando_calrissian: {
    image: '/lando.png',
    accent: '#C9A44C',
    border: '#3B1F5C',
    glow: 'rgba(201,164,76,0.4)',
  },
  ahsoka_tano: {
    image: '/ahsoka.png',
    accent: '#C7682C',
    border: '#1F3A5F',
    glow: 'rgba(199,104,44,0.4)',
  },
  din_djarin: {
    image: '/din_djarin.png',
    accent: '#8A8F94',
    border: '#2B2E30',
    glow: 'rgba(138,143,148,0.4)',
  },
  cassian_andor: {
    image: '/andor.png',
    accent: '#4A5A5E',
    border: '#6E4B3A',
    glow: 'rgba(74,90,94,0.4)',
  },
  darth_vader: {
    image: '/vader.png',
    accent: '#8A0C0C',
    border: '#5A5F66',
    glow: 'rgba(138,12,12,0.5)',
  },
  palpatine: {
    image: '/palpatine.png',
    accent: '#8C7A3C',
    border: '#3B2F4A',
    glow: 'rgba(140,122,60,0.5)',
  },
  count_dooku: {
    image: '/dooku.png',
    accent: '#7A1F1F',
    border: '#5A5A5A',
    glow: 'rgba(122,31,31,0.5)',
  },
  kylo_ren: {
    image: '/kylo.png',
    accent: '#A61E24',
    border: '#2B2B2F',
    glow: 'rgba(166,30,36,0.5)',
  },
  thrawn: {
    image: '/thrawn.png',
    accent: '#2E5B8C',
    border: '#A1121A',
    glow: 'rgba(46,91,140,0.5)',
  },
  moff_gideon: {
    image: '/gideon.png',
    accent: '#A7A9AC',
    border: '#5A0008',
    glow: 'rgba(90,0,8,0.5)',
  },
  chewbacca: {
    image: '/chewbacca.png',
    accent: '#8B5A2B',
    border: '#4A2C1D',
    glow: 'rgba(139,90,43,0.4)',
  },
  r2d2: {
    image: '/r2d2.png',
    accent: '#2B6CB0',
    border: '#F6C744',
    glow: 'rgba(43,108,176,0.5)',
  },
  c3po: {
    image: '/c3po.png',
    accent: '#D4AF37',
    border: '#CBB67B',
    glow: 'rgba(212,175,55,0.4)',
  },
  boba_fett: {
    image: '/fett.png',
    accent: '#4B6B3C',
    border: '#7A1F1F',
    glow: 'rgba(75,107,60,0.4)',
  },
  fennec_shand: {
    image: '/fennec.png',
    accent: '#B86B3D',
    border: '#7A0F14',
    glow: 'rgba(184,107,61,0.4)',
  },
  k2so: {
    image: '/k2so.png',
    accent: '#4A6FA5',
    border: '#3A3F45',
    glow: 'rgba(74,111,165,0.4)',
  },
  bb8: {
    image: '/bb8.png',
    accent: '#D96A2B',
    border: '#BFC3C7',
    glow: 'rgba(217,106,43,0.4)',
  },
  anakin_skywalker: {
    image: '/anakin.png',
    accent: '#F6C85F',
    border: '#3A3F58',
    glow: 'rgba(246,200,95,0.4)',
  },
  padme_amidala: {
    image: '/padme.png',
    accent: '#C6A75E',
    border: '#7A1F2B',
    glow: 'rgba(122,31,43,0.5)',
  },
  rey: {
    image: '/rey.png',
    accent: '#6F7D86',
    border: '#A68A64',
    glow: 'rgba(111,125,134,0.4)',
  },
  finn: {
    image: '/finn.png',
    accent: '#D9A441',
    border: '#4C7A89',
    glow: 'rgba(217,164,65,0.4)',
  },
}

const DEFAULT_THEME: CharacterTheme = {
  image: '/imperial-corridor-bg.png',
  accent: '#67e8f9',
  border: '#475569',
  glow: 'rgba(59,130,246,0.16)',
}

export function getCharacterTheme(id: string): CharacterTheme {
  return CHARACTER_THEMES[id] ?? DEFAULT_THEME
}
