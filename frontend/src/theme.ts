export const GOLD = '#d4a832'
export const GOLD_LIGHT = '#e6b800'
export const GOLD_DARK = '#c9a82e'
export const SILVER = '#ced4da'
export const WHITE = '#f8f9fa'
export const CRIMSON = '#dc3545'
export const AMBER = '#fd7e14'
export const EMERALD = '#20c997'

export const BG = 'rgba(5,5,5,0.85)'
export const BG2 = 'rgba(8,8,12,0.95)'
export const BG_DARK = 'rgba(10,10,10,0.85)'
export const BG_DEEPER = '#070f1a'
export const BG_MAIN = '#060d15'
export const BG_DROPDOWN = '#0a0a0a'

export const BORDER = '1px solid rgba(212,168,50,0.12)'
export const BORDER_GOLD = '1px solid rgba(212,168,50,0.20)'
export const GRAD = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'
export const GRAD_STRONG = 'linear-gradient(135deg, rgba(212,168,50,0.20), rgba(212,168,50,0.08))'

export const TEXT_MUTED = 'rgba(206,212,218,0.50)'
export const TEXT_DIM = 'rgba(206,212,218,0.60)'
export const TEXT_BODY = '#ced4da'
export const TEXT_BRIGHT = '#f8f9fa'

export const INPUT_BG = 'rgba(255,255,255,0.04)'
export const INPUT_BORDER = '1px solid rgba(212,168,50,0.12)'

export const SEV_COLORS = { Critical: CRIMSON, High: AMBER, Medium: GOLD, Low: EMERALD }

export const CHART_PALETTE = [EMERALD, GOLD, AMBER, CRIMSON, GOLD_LIGHT, '#20c997', '#fd7e14', '#dc3545']

export const HEAT_STEPS = [
  { bg: `linear-gradient(135deg, rgba(32,201,151,0.06), rgba(32,201,151,0.01))`, border: 'rgba(32,201,151,0.08)', text: EMERALD, glow: 'rgba(32,201,151,0.06)', label: 'Low' },
  { bg: `linear-gradient(135deg, rgba(32,201,151,0.18), rgba(32,201,151,0.06))`, border: 'rgba(32,201,151,0.22)', text: EMERALD, glow: 'rgba(32,201,151,0.12)', label: 'Low' },
  { bg: `linear-gradient(135deg, rgba(32,201,151,0.35), rgba(32,201,151,0.12))`, border: 'rgba(32,201,151,0.40)', text: EMERALD, glow: 'rgba(32,201,151,0.25)', label: 'Low' },
  { bg: `linear-gradient(135deg, rgba(253,126,20,0.10), rgba(253,126,20,0.03))`, border: 'rgba(253,126,20,0.15)', text: AMBER, glow: 'rgba(253,126,20,0.10)', label: 'Medium' },
  { bg: `linear-gradient(135deg, rgba(253,126,20,0.25), rgba(253,126,20,0.08))`, border: 'rgba(253,126,20,0.32)', text: AMBER, glow: 'rgba(253,126,20,0.20)', label: 'Medium' },
  { bg: `linear-gradient(135deg, rgba(253,126,20,0.45), rgba(253,126,20,0.15))`, border: 'rgba(253,126,20,0.55)', text: AMBER, glow: 'rgba(253,126,20,0.35)', label: 'Medium' },
  { bg: `linear-gradient(135deg, rgba(220,53,69,0.12), rgba(220,53,69,0.04))`, border: 'rgba(220,53,69,0.18)', text: CRIMSON, glow: 'rgba(220,53,69,0.12)', label: 'High' },
  { bg: `linear-gradient(135deg, rgba(220,53,69,0.32), rgba(220,53,69,0.12))`, border: 'rgba(220,53,69,0.42)', text: CRIMSON, glow: 'rgba(220,53,69,0.30)', label: 'High' },
  { bg: `linear-gradient(135deg, rgba(220,53,69,0.55), rgba(180,20,30,0.20))`, border: 'rgba(220,53,69,0.70)', text: '#ff6b6b', glow: 'rgba(220,53,69,0.45)', label: 'High' },
]
