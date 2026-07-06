export const LEVEL_COLOR = {
  Critical: { bg: 'bg-[rgba(220,53,69,0.12)] border-[#dc3545]/30', text: 'text-[#f08080]', dot: 'bg-[#dc3545]' },
  High:     { bg: 'bg-[rgba(253,126,20,0.10)] border-[#fd7e14]/25', text: 'text-[#ffb068]', dot: 'bg-[#fd7e14]' },
  Medium:   { bg: 'bg-[rgba(212,168,50,0.08)] border-[#d4a832]/20', text: 'text-[#d4a832]', dot: 'bg-[#d4a832]' },
  Low:      { bg: 'bg-[rgba(32,201,151,0.08)] border-[#20c997]/20', text: 'text-[#20c997]', dot: 'bg-[#20c997]' },
  Open:     { bg: 'bg-[rgba(206,212,218,0.06)] border-[#ced4da]/15', text: 'text-[#ced4da]' },
  'In Progress': { bg: 'bg-[rgba(206,212,218,0.06)] border-[#ced4da]/15', text: 'text-[#ced4da]' },
  Closed:   { bg: 'bg-[rgba(32,201,151,0.08)] border-[#20c997]/20', text: 'text-[#20c997]' },
  Accepted: { bg: 'bg-[rgba(134,142,150,0.08)] border-[#ced4da]/20', text: 'text-[#ced4da]' },
}

export const rowBg = (lvl) =>
  lvl === 'Critical' ? 'bg-[rgba(220,53,69,0.04)]' :
  lvl === 'High' ? 'bg-[rgba(253,126,20,0.03)]' :
  lvl === 'Medium' ? 'bg-[rgba(212,168,50,0.02)]' : ''

export const calcTarget = (r) => {
  const map = { 'Implemented': 1, 'Partially Implemented': 0.5, 'Planned': 0.2, 'None': 0 }
  const eff = map[r.controlStatus] || 0
  return eff >= 1 ? 'Low' : eff >= 0.5 ? 'Medium' : 'High'
}

export const ragDot = (s) => {
  if (!s && s !== 0) return '⚪'
  const n = Number(s)
  return n >= 15 ? '🔴' : n >= 10 ? '🟡' : '🟢'
}

export const levelBadge = (level) => {
  const c = LEVEL_COLOR[level] || { bg: 'bg-zinc-800/50 border-zinc-600/20', text: 'text-zinc-400' }
  return `inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${c.bg} ${c.text}`
}

export const CATEGORIES = ['All', 'Cybersecurity', 'Compliance', 'Information Security', 'Third Party Risk', 'Operational', 'Financial', 'Reputational', 'Legal', 'Strategic']
export const STATUSES = ['All', 'Open', 'In Progress', 'Closed', 'Accepted']
export const LEVELS = ['All', 'Critical', 'High', 'Medium', 'Low']
export const TREATMENTS = ['Mitigate', 'Accept', 'Transfer', 'Avoid']
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export const scoreToLevel = (s) => s >= 15 ? 'Critical' : s >= 10 ? 'High' : s >= 5 ? 'Medium' : 'Low'
export const calcMaxImpact = (f) => Math.max(
  f.impactFinance||1, f.impactRegulatory||1, f.impactReputational||1,
  f.impactSafety||1, f.impactOperational||1,
  f.impactC||1, f.impactI||1, f.impactA||1
)
export const calcScore = (f) => Math.round((f.likelihood || 1) * calcMaxImpact(f))

export const EMPTY_FORM = {
  riskId: '', process: '', subProcess: '', assetSystem: '', ownerTeam: '',
  riskCategory: 'Cybersecurity', threat: '', vulnerability: '', severity: 'High',
  riskTitle: '', riskDescription: '', riskRef: '',
  likelihood: 3, impactFinance: 3, impactRegulatory: 3, impactReputational: 3, impactSafety: 1, impactOperational: 3,
  impactC: 3, impactI: 3, impactA: 3,
  existingControls: '', residualScore: '', overallRisk: 'Medium',
  treatment: 'Mitigate', status: 'Open', mitigationActions: '', deadline: '', owner: '',
  controlStatus: 'None',
  budget: '', issuesBlockers: '', riskSource: 'Internal', reviewFreq: 'Quarterly',
  riskDate: new Date().toISOString().split('T')[0],
}

export function mapRisk(r) {
  return {
    _id: r._id,
    riskId: r.riskId,
    riskTitle: r.riskTitle,
    riskDate: r.riskDate || '',
    process: r.process,
    subProcess: r.subProcess,
    assetSystem: r.assetSystem || r.asset,
    ownerTeam: r.ownerTeam,
    riskCategory: r.riskCategory,
    threat: r.threat,
    vulnerability: r.vulnerability,
    severity: r.severity,
    riskDescription: r.riskDescription,
    riskRef: r.riskRef,
    likelihood: r.likelihood,
    impactFinance: r.impactFinance,
    impactRegulatory: r.impactRegulatory,
    impactReputational: r.impactReputational,
    impactSafety: r.impactSafety || 1,
    impactOperational: r.impactOperational,
    impactC: r.impactC ?? r.C,
    impactI: r.impactI ?? r.I,
    impactA: r.impactA ?? r.A,
    overallScore: r.overallScore ?? r.riskScore,
    riskScore: r.riskScore ?? r.overallScore,
    inherentLevel: r.inherentLevel || scoreToLevel(r.overallScore || 0),
    existingControls: r.existingControls,
    residualScore: r.residualScore,
    overallRisk: r.overallRisk,
    controlStatus: r.controlStatus || 'None',
    treatment: r.treatment,
    mitigationActions: r.mitigationActions,
    status: r.status,
    deadline: r.deadline,
    owner: r.owner,
    budget: r.budget || '—',
    issuesBlockers: r.issuesBlockers || r.dependencies || 'None',
    riskSource: r.riskSource || 'Internal',
    reviewFreq: r.reviewFreq || 'Quarterly',
    lastReview: r.lastReview || '—',
  }
}
