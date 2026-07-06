import { useState, useEffect, useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import {
  TrendingUp, CheckCircle, AlertTriangle, Shield, Activity, Target,
  Settings, X, Save, Filter, Users, Eye, Download
} from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const BG = 'rgba(5,5,5,0.85)'
const BG2 = 'rgba(8,8,12,0.92)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRAD = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'
const TARGETS_KEY = 'wadjet-board-targets'

const IMPACT_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Critical']
const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']
const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']
const SEV_COLORS = { Critical: CRIMSON, High: AMBER, Medium: GOLD, Low: EMERALD }

const DEFAULT_TARGETS = {
  criticalThreshold: 5,
  highThreshold: 15,
  targetScore: 2.5,
  appetiteLimit: 3,
  resolutionTarget: 70,
  nonCriticalTarget: 60,
  minScore: 1.0,
  reviewFrequency: 'monthly',
  riskCategoryLimits: {},
}

function loadTargets() {
  try {
    const saved = localStorage.getItem(TARGETS_KEY)
    return saved ? { ...DEFAULT_TARGETS, ...JSON.parse(saved) } : DEFAULT_TARGETS
  } catch { return DEFAULT_TARGETS }
}

function saveTargets(t) {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(t))
}

function CellStyle(count, row, col) {
  const raw = row + col
  if (count === 0) return { bg: 'rgba(255,255,255,0.015)', border: 'rgba(255,255,255,0.03)', text: 'transparent', glow: 'transparent' }
  if (raw >= 7) {
    if (count >= 4) return { bg: 'rgba(220,53,69,0.45)', border: 'rgba(220,53,69,0.65)', text: '#dc3545', glow: 'rgba(220,53,69,0.4)' }
    if (count >= 2) return { bg: 'rgba(220,53,69,0.25)', border: 'rgba(220,53,69,0.35)', text: '#dc3545', glow: 'rgba(220,53,69,0.25)' }
    return { bg: 'rgba(220,53,69,0.15)', border: 'rgba(220,53,69,0.20)', text: '#dc3545', glow: 'rgba(220,53,69,0.15)' }
  }
  if (raw >= 4) {
    if (count >= 5) return { bg: 'rgba(253,126,20,0.35)', border: 'rgba(253,126,20,0.50)', text: '#fd7e14', glow: 'rgba(253,126,20,0.3)' }
    if (count >= 3) return { bg: 'rgba(212,168,50,0.25)', border: 'rgba(212,168,50,0.35)', text: '#d4a832', glow: 'rgba(212,168,50,0.25)' }
    return { bg: 'rgba(212,168,50,0.12)', border: 'rgba(212,168,50,0.18)', text: '#d4a832', glow: 'rgba(212,168,50,0.12)' }
  }
  if (count >= 6) return { bg: 'rgba(32,201,151,0.25)', border: 'rgba(32,201,151,0.35)', text: '#20c997', glow: 'rgba(32,201,151,0.2)' }
  if (count >= 3) return { bg: 'rgba(32,201,151,0.15)', border: 'rgba(32,201,151,0.20)', text: '#20c997', glow: 'rgba(32,201,151,0.12)' }
  return { bg: 'rgba(32,201,151,0.06)', border: 'rgba(32,201,151,0.10)', text: '#20c997', glow: 'rgba(32,201,151,0.06)' }
}

function ZoneLabel(raw) {
  if (raw >= 7) return { label: 'Critical Zone', color: CRIMSON }
  if (raw >= 4) return { label: 'High Zone', color: AMBER }
  return { label: 'Low Zone', color: EMERALD }
}

function TargetSettingsModal({ open, targets, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...targets })

  useEffect(() => {
    if (open) setDraft({ ...targets })
  }, [open, targets])

  if (!open) return null

  const fields = [
    { key: 'criticalThreshold', label: 'Critical Risk Threshold', desc: 'Max % of risks at Critical severity', min: 0, max: 100, step: 1, suffix: '%', color: CRIMSON },
    { key: 'highThreshold', label: 'High Risk Threshold', desc: 'Max % of risks at High severity', min: 0, max: 100, step: 1, suffix: '%', color: AMBER },
    { key: 'targetScore', label: 'Target Avg Risk Score', desc: 'Desired average risk score (1–5)', min: 0, max: 5, step: 0.1, suffix: '', color: GOLD },
    { key: 'appetiteLimit', label: 'Max Appetite Breaches', desc: 'Max number of risks exceeding risk appetite', min: 0, max: 50, step: 1, suffix: '', color: CRIMSON },
    { key: 'resolutionTarget', label: 'Resolution Rate Target', desc: 'Target % of resolved risks', min: 0, max: 100, step: 1, suffix: '%', color: EMERALD },
    { key: 'nonCriticalTarget', label: 'Non-Critical Share Target', desc: 'Target % of Low/Medium risks', min: 0, max: 100, step: 1, suffix: '%', color: EMERALD },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in" style={{ background: BG2, border: BORDER, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: BORDER }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: GRAD, border: BORDER }}>
              <Target size={16} style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: WHITE }}>Board Target Settings</h2>
              <p className="text-[10px]" style={{ color: GOLD }}>Configure board-level risk appetite & board targets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: SILVER }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          ><X size={16} /></button>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
          {fields.map(f => {
            const val = draft[f.key] ?? 0
            const pct = f.suffix === '%' ? val : (val / (f.key.includes('Score') ? 5 : f.key.includes('Limit') ? 50 : 5)) * 100
            return (
              <div key={f.key} className="p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,168,50,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: f.color }}>{f.label}</span>
                  <div className="flex items-center gap-2">
                    <input type="number" value={val} min={f.min} max={f.max} step={f.step}
                      onChange={e => setDraft({ ...draft, [f.key]: parseFloat(e.target.value) || 0 })}
                      className="w-16 text-right text-xs font-mono rounded-md px-2 py-1 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,168,50,0.15)', color: WHITE }} />
                    {f.suffix && <span className="text-[10px]" style={{ color: SILVER }}>{f.suffix}</span>}
                  </div>
                </div>
                <p className="text-[9px] mb-2" style={{ color: SILVER }}>{f.desc}</p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: f.color }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: BORDER }}>
          <button onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg cursor-pointer transition-colors"
            style={{ color: SILVER, background: 'rgba(255,255,255,0.04)' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >Cancel</button>
          <button onClick={() => { onSave(draft); onClose() }}
            className="px-4 py-2 text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            style={{ color: '#060d15', background: GOLD }}
            onMouseOver={e => e.currentTarget.style.background = '#c9a82e'}
            onMouseOut={e => e.currentTarget.style.background = GOLD}
          ><Save size={12} /> Save Targets</button>
        </div>
      </div>
    </div>
  )
}

function BoardGauge({ value, label, target, size = 140 }) {
  const pct = Math.min(value / target, 1)
  const r = 50, cx = size / 2, cy = size / 2 + 8
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const met = value >= target
  const color = met ? EMERALD : value >= target * 0.85 ? GOLD : AMBER
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.58} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,168,50,0.06)" strokeWidth={7} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)`, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="text-center -mt-5">
        <div className="text-2xl font-bold" style={{ color: WHITE }}>{value}%</div>
        <div className="text-[10px]" style={{ color: SILVER }}>{label}</div>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span className="text-[9px]" style={{ color: GOLD }}>Target: {target}%</span>
          {met ? <CheckCircle size={10} style={{ color: EMERALD }} /> : <AlertTriangle size={10} style={{ color: CRIMSON }} />}
        </div>
      </div>
    </div>
  )
}

export default function ExecutiveDashboard() {
  const [risks, setRisks] = useState([])
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [showTargets, setShowTargets] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)

  useEffect(() => {
    setTargets(loadTargets())
    fetch('/api/risks').then(r => r.json()).then(d => setRisks(d.risks || [])).catch(() => {})
  }, [])

  const handleSaveTargets = (t) => { setTargets(t); saveTargets(t) }

  const riskMap = useMemo(() => {
    const map = {}
    risks.forEach(r => {
      const impact = Math.min(Math.max(Math.ceil((r.overallScore || 3) / 2), 1), 5)
      const likelihood = Math.min(Math.max(r.likelihood || 3, 1), 5)
      const key = `${impact}-${likelihood}`
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return map
  }, [risks])

  const getCellRisk = (row, col) => riskMap[`${row + 1}-${col + 1}`] || []
  const handleCellClick = ({ row, col }) => {
    const cell = getCellRisk(row, col)
    if (cell.length === 0) return
    if (selectedCell?.row === row && selectedCell?.col === col) setSelectedCell(null)
    else setSelectedCell({ row, col })
  }
  const filtered = selectedCell ? getCellRisk(selectedCell.row, selectedCell.col) : []

  const stats = useMemo(() => {
    const total = risks.length
    const closed = risks.filter(r => r.status === 'Closed' || r.status === 'Resolved').length
    const open = total - closed
    const bySev = {}
    const byCat = {}
    const byTeam = {}
    risks.forEach(r => {
      const s = r.severity || 'Medium'
      bySev[s] = (bySev[s] || 0) + 1
      const cat = r.riskCategory || 'Uncategorized'
      byCat[cat] = (byCat[cat] || 0) + 1
      const team = r.ownerTeam || 'Unknown'
      byTeam[team] = (byTeam[team] || 0) + 1
    })
    const critical = bySev['Critical'] || 0
    const high = bySev['High'] || 0
    const resolvedPct = total ? Math.round((closed / total) * 100) : 0
    const criticalHighPct = total ? Math.round(((critical + high) / total) * 100) : 0
    const nonCriticalPct = 100 - criticalHighPct
    const appetiteBreaches = critical + high
    const topViolations = risks
      .filter(r => r.severity === 'Critical' || r.severity === 'High')
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
      .slice(0, 5)
      .map(r => ({ riskId: r.riskId, title: r.riskTitle, category: r.riskCategory, severity: r.severity, score: r.overallScore }))
    const catPie = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, value], i) => {
        const colors = [EMERALD, GOLD, AMBER, CRIMSON, '#d4a832', '#20c997']
        return { name: name.length > 16 ? name.slice(0, 14) + '..' : name, value, fill: colors[i % colors.length] }
      })
    const sevPie = SEV_ORDER.filter(s => bySev[s]).map(s => ({
      name: s, value: bySev[s], fill: SEV_COLORS[s] || SILVER
    }))
    return { total, closed, open, critical, high, resolvedPct, criticalHighPct, nonCriticalPct, appetiteBreaches, topViolations, catPie, sevPie, bySev, byCat, byTeam }
  }, [risks])

  const targetsMet = {
    critical: (stats.bySev['Critical'] || 0) <= Math.ceil(stats.total * targets.criticalThreshold / 100),
    high: (stats.bySev['High'] || 0) <= Math.ceil(stats.total * targets.highThreshold / 100),
    score: stats.total > 0 ? (risks.reduce((a, r) => a + (r.overallScore || 3), 0) / stats.total) <= targets.targetScore : true,
    appetite: stats.appetiteBreaches <= targets.appetiteLimit,
    resolution: stats.resolvedPct >= targets.resolutionTarget,
    nonCritical: stats.nonCriticalPct >= targets.nonCriticalTarget,
  }
  const metCount = Object.values(targetsMet).filter(Boolean).length
  const allMet = metCount === Object.keys(targetsMet).length

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      <TargetSettingsModal open={showTargets} targets={targets} onSave={handleSaveTargets} onClose={() => setShowTargets(false)} />

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: GRAD, border: BORDER }}>
            <TrendingUp size={18} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Executive Board Dashboard</h1>
            <p className="text-xs" style={{ color: GOLD }}>Board-Level Risk Profile · Board Targets</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
            <div className="w-2 h-2 rounded-full" style={{ background: allMet ? EMERALD : CRIMSON, boxShadow: allMet ? '0 0 6px rgba(32,201,151,0.5)' : '0 0 6px rgba(220,53,69,0.5)' }} />
            <span className="text-xs" style={{ color: allMet ? EMERALD : CRIMSON }}>{metCount}/6 Targets Met</span>
          </div>
          <button onClick={() => setShowTargets(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
            style={{ background: GRAD, border: BORDER, color: GOLD }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(212,168,50,0.15)'}
            onMouseOut={e => e.currentTarget.style.background = GRAD}
          ><Settings size={13} /> Set Board Targets</button>
        </div>
      </div>

      {/* Target Bar */}
      <div className="p-4 rounded-xl" style={{ background: BG, border: BORDER }}>
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} style={{ color: GOLD }} />
          <span className="text-xs font-semibold" style={{ color: WHITE }}>Board Target Dashboard</span>
          <span className="text-[9px] ml-auto" style={{ color: GOLD }}>Configure via <strong>Set Board Targets</strong></span>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Critical %', actual: stats.total ? Math.round((stats.critical / stats.total) * 100) : 0, target: targets.criticalThreshold, suffix: '%', color: CRIMSON, met: targetsMet.critical },
            { label: 'High %', actual: stats.total ? Math.round((stats.high / stats.total) * 100) : 0, target: targets.highThreshold, suffix: '%', color: AMBER, met: targetsMet.high },
            { label: 'Resolution Rate', actual: stats.resolvedPct, target: targets.resolutionTarget, suffix: '%', color: EMERALD, met: targetsMet.resolution },
            { label: 'Non-Critical %', actual: stats.nonCriticalPct, target: targets.nonCriticalTarget, suffix: '%', color: EMERALD, met: targetsMet.nonCritical },
            { label: 'Appetite Breaches', actual: stats.appetiteBreaches, target: targets.appetiteLimit, suffix: '', color: CRIMSON, met: targetsMet.appetite },
            { label: 'Avg Score', actual: stats.total ? (risks.reduce((a, r) => a + (r.overallScore || 3), 0) / stats.total).toFixed(1) : '—', target: targets.targetScore, suffix: '', color: GOLD, met: targetsMet.score },
          ].map((m, i) => {
            const isPct = m.suffix === '%'
            const val = typeof m.actual === 'number' ? m.actual : 0
            const max = isPct ? 100 : Math.max(m.target * 2, val + 5)
            const pct = Math.min(val / max * 100, 100)
            const tPct = Math.min(m.target / max * 100, 100)
            return (
              <div key={i} className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,168,50,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px]" style={{ color: SILVER }}>{m.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold font-mono" style={{ color: m.met ? EMERALD : CRIMSON }}>{m.actual}{m.suffix}</span>
                    {m.met ? <CheckCircle size={9} style={{ color: EMERALD }} /> : <AlertTriangle size={9} style={{ color: CRIMSON }} />}
                  </div>
                </div>
                <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.met ? EMERALD : CRIMSON }} />
                  <div className="absolute top-0 w-0.5 h-full transition-all duration-500"
                    style={{ left: `${tPct}%`, background: GOLD, boxShadow: '0 0 8px rgba(212,168,50,0.8)' }} />
                </div>
                <div className="text-[8px] mt-0.5" style={{ color: GOLD }}>Target: {m.target}{m.suffix}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* Left column */}
        <div className="col-span-8 space-y-5">

          {/* Premium Bank-Grade 5x5 Heat Map */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: GOLD }} />
                <h2 className="text-sm font-semibold" style={{ color: WHITE }}>5×5 Risk Heat Map</h2>
              </div>
              <span className="text-[9px] px-2 py-1 rounded-full" style={{ background: 'rgba(212,168,50,0.08)', color: GOLD, border: BORDER }}>
                {stats.total} risks analyzed
              </span>
            </div>

            {/* Column headers */}
            <div className="flex mb-1" style={{ paddingLeft: '110px' }}>
              {LIKELIHOOD_LABELS.map((l, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.55)' }}>{l}</span>
                </div>
              ))}
            </div>

            <div className="flex">
              <div className="flex flex-col justify-around mr-3" style={{ width: '100px', minWidth: '100px' }}>
                {IMPACT_LABELS.map((l, i) => (
                  <div key={i} className="flex items-center justify-end h-[60px] pr-3">
                    <div className="text-right">
                      <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: SEV_COLORS[l] || SILVER }}>{l}</div>
                      <div className="text-[7px]" style={{ color: 'rgba(206,212,218,0.2)' }}>Impact</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-5 gap-[3px]">
                  {Array.from({ length: 5 }).map((_, row) =>
                    Array.from({ length: 5 }).map((_, col) => {
                      const cell = getCellRisk(row, col)
                      const sel = selectedCell?.row === row && selectedCell?.col === col
                      const hov = hoveredCell?.row === row && hoveredCell?.col === col
                      const style = CellStyle(cell.length, row, col)
                      const zone = ZoneLabel(row + col)
                      return (
                        <div
                          key={`${row}-${col}`}
                          onClick={() => handleCellClick({ row, col })}
                          onMouseEnter={() => setHoveredCell({ row, col })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className="relative flex items-center justify-center cursor-pointer transition-all duration-200 rounded-[10px]"
                          style={{
                            background: sel ? 'rgba(212,168,50,0.20)' : hov ? style.bg : style.bg,
                            border: sel ? '2px solid #d4a832' : hov ? `2px solid ${zone.color}` : style.border,
                            boxShadow: hov ? `0 0 20px ${style.glow}, inset 0 0 20px ${style.glow}` : 'none',
                            minHeight: '56px',
                            transform: hov ? 'scale(1.08)' : 'scale(1)',
                            zIndex: hov ? 10 : 1,
                          }}>
                          {cell.length > 0 && (
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: style.text, textShadow: hov ? `0 0 12px ${style.text}60` : 'none' }}>{cell.length}</div>
                              <div className="text-[7px] font-semibold uppercase tracking-widest" style={{ color: style.text + '80' }}>RISKS</div>
                            </div>
                          )}
                          {cell.length === 0 && (
                            <div className="text-[8px]" style={{ color: 'rgba(206,212,218,0.04)' }}>∅</div>
                          )}
                          <div className="absolute bottom-0 left-1 right-1 h-[3px] rounded-full"
                            style={{ background: zone.color, opacity: cell.length > 0 ? 0.7 : 0, boxShadow: `0 0 8px ${zone.color}60` }} />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Likelihood label bottom */}
            <div className="flex mt-1" style={{ paddingLeft: '110px' }}>
              {LIKELIHOOD_LABELS.map((l, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[7px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.2)' }}>{l} →</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
              <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.3)' }}>Risk Density</span>
              <div className="flex items-center gap-1">
                {[
                  { bg: 'rgba(32,201,151,0.35)', border: 'rgba(32,201,151,0.3)', label: 'Low', text: EMERALD },
                  { bg: 'rgba(212,168,50,0.30)', border: 'rgba(212,168,50,0.3)', label: 'Med', text: GOLD },
                  { bg: 'rgba(253,126,20,0.30)', border: 'rgba(253,126,20,0.3)', label: 'High', text: AMBER },
                  { bg: 'rgba(220,53,69,0.30)', border: 'rgba(220,53,69,0.3)', label: 'Crit', text: CRIMSON },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: d.bg + '15' }}>
                    <div className="w-2.5 h-2.5 rounded" style={{ background: d.bg, border: `1px solid ${d.border}` }} />
                    <span className="text-[8px]" style={{ color: d.text }}>{d.label}</span>
                  </div>
                ))}
              </div>
              <span className="ml-auto text-[8px]" style={{ color: 'rgba(212,168,50,0.4)' }}>
                Click any cell to inspect risks
              </span>
            </div>

            {/* Filtered risk table */}
            {filtered.length > 0 && (
              <div className="mt-4 rounded-xl overflow-hidden" style={{ border: BORDER }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'rgba(212,168,50,0.05)' }}>
                  <Filter size={11} style={{ color: GOLD }} />
                  <span className="text-[10px] font-medium" style={{ color: GOLD }}>
                    {IMPACT_LABELS[selectedCell.row]} Impact × {LIKELIHOOD_LABELS[selectedCell.col]} Likelihood
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: SILVER }}>{filtered.length} risk{filtered.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th className="text-left py-2 px-3 font-semibold" style={{ color: GOLD }}>ID</th>
                        <th className="text-left py-2 px-3 font-semibold" style={{ color: GOLD }}>Title</th>
                        <th className="text-center py-2 px-3 font-semibold" style={{ color: GOLD }}>Sev</th>
                        <th className="text-center py-2 px-3 font-semibold" style={{ color: GOLD }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={i} style={{ borderTop: BORDER }} className="hover:bg-white/[0.015]">
                          <td className="py-2 px-3 font-mono" style={{ color: GOLD }}>{r.riskId}</td>
                          <td className="py-2 px-3" style={{ color: WHITE }}>{r.riskTitle?.slice(0, 50) || '—'}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-semibold"
                              style={{ background: `${SEV_COLORS[r.severity] || SILVER}20`, color: SEV_COLORS[r.severity] || SILVER }}>
                              {r.severity}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono" style={{ color: WHITE }}>{r.overallScore || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Top Violations */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: CRIMSON }} />
                <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Top Critical & High Risks</h2>
              </div>
              <span className="text-[10px]" style={{ color: GOLD }}>{stats.topViolations.length} items</span>
            </div>
            {stats.topViolations.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle size={24} className="mx-auto mb-2" style={{ color: EMERALD }} />
                <p className="text-xs" style={{ color: SILVER }}>No critical or high risks</p>
              </div>
            ) : (
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ borderBottom: BORDER }}>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: GOLD }}>Risk ID</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: GOLD }}>Title</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: GOLD }}>Category</th>
                    <th className="text-center py-2 px-2 font-medium" style={{ color: GOLD }}>Severity</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: GOLD }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topViolations.map((v, i) => (
                    <tr key={i} className="hover:opacity-80" style={{ borderBottom: '1px solid rgba(212,168,50,0.06)' }}>
                      <td className="py-2 px-2 font-mono" style={{ color: GOLD }}>{v.riskId}</td>
                      <td className="py-2 px-2" style={{ color: WHITE }}>{v.title}</td>
                      <td className="py-2 px-2" style={{ color: SILVER }}>{v.category}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: `${SEV_COLORS[v.severity] || SILVER}20`, color: SEV_COLORS[v.severity] || SILVER }}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono" style={{ color: WHITE }}>{v.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Category Distribution - upgraded */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: GOLD }} />
                <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Distribution by Category</h2>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.catPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={2}>
                    {stats.catPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const d = payload[0]
                    return (
                      <div style={{ background: 'rgba(2,2,4,0.97)', border: BORDER, borderRadius: 10, padding: '8px 12px', fontSize: 11 }}>
                        <div style={{ color: WHITE, fontWeight: 600 }}>{d.name}</div>
                        <div style={{ color: SILVER }}>{d.value} risks ({stats.total ? Math.round(d.value / stats.total * 100) : 0}%)</div>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.catPie.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.fill }} />
                  <span style={{ color: SILVER }}>{c.name}</span>
                  <span className="font-mono" style={{ color: WHITE }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-4 space-y-5">

          {/* Board Gauges with targets */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: WHITE }}>Performance vs Board Targets</h2>
            <div className="grid grid-cols-2 gap-4">
              <BoardGauge value={stats.resolvedPct} label="Resolution Rate" target={targets.resolutionTarget} size={130} />
              <BoardGauge value={stats.nonCriticalPct} label="Non-Critical Share" target={targets.nonCriticalTarget} size={130} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(212,168,50,0.04)', border: BORDER }}>
                <div className="text-[10px]" style={{ color: SILVER }}>Total Risks</div>
                <div className="text-xl font-bold mt-1" style={{ color: WHITE }}>{stats.total}</div>
                <div className="flex gap-2 mt-1 text-[9px]">
                  <span style={{ color: CRIMSON }}>{stats.critical} Critical</span>
                  <span style={{ color: AMBER }}>{stats.high} High</span>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(212,168,50,0.04)', border: BORDER }}>
                <div className="text-[10px]" style={{ color: SILVER }}>Open vs Resolved</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl font-bold" style={{ color: AMBER }}>{stats.open}</span>
                  <span className="text-[10px]" style={{ color: SILVER }}>Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold" style={{ color: EMERALD }}>{stats.closed}</span>
                  <span className="text-[10px]" style={{ color: SILVER }}>Resolved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>Risk Severity Breakdown</h2>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.sevPie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {stats.sevPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    return (
                      <div style={{ background: 'rgba(2,2,4,0.97)', border: BORDER, borderRadius: 10, padding: '8px 12px', fontSize: 11 }}>
                        <div style={{ color: WHITE, fontWeight: 600 }}>{payload[0].name}</div>
                        <div style={{ color: SILVER }}>{payload[0].value} risks</div>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {stats.sevPie.map(s => {
                const isOver = (s.name === 'Critical' && (stats.critical / Math.max(stats.total, 1)) * 100 > targets.criticalThreshold) ||
                  (s.name === 'High' && (stats.high / Math.max(stats.total, 1)) * 100 > targets.highThreshold)
                return (
                  <div key={s.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.fill }} />
                    <span style={{ color: SILVER }}>{s.name}</span>
                    {isOver && <AlertTriangle size={9} style={{ color: CRIMSON }} />}
                    <span className="ml-auto font-mono" style={{ color: isOver ? CRIMSON : WHITE }}>{s.value}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Departments */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} style={{ color: GOLD }} />
              <span className="text-xs font-semibold" style={{ color: WHITE }}>Departments</span>
            </div>
            <div className="space-y-2 text-xs max-h-56 overflow-y-auto scrollbar-thin">
              {Object.entries(stats.byTeam).sort((a, b) => b[1] - a[1]).map(([team, count]) => {
                const pct = stats.total ? Math.round(count / stats.total * 100) : 0
                return (
                  <div key={team} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <span style={{ color: SILVER }}>{team}</span>
                    </div>
                    <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: GOLD }} />
                    </div>
                    <span className="font-mono text-[10px] w-5 text-right" style={{ color: GOLD }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Board Summary with targets */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} style={{ color: GOLD }} />
              <span className="text-xs font-semibold" style={{ color: WHITE }}>Board Summary vs Targets</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between py-1">
                <span style={{ color: SILVER }}>Total Risks</span>
                <span style={{ color: WHITE }}>{stats.total}</span>
              </div>
              <div className="h-px" style={{ background: 'rgba(212,168,50,0.08)' }} />
              <div className="flex justify-between py-1">
                <span style={{ color: CRIMSON }}>Critical</span>
                <span style={{ color: targetsMet.critical ? EMERALD : CRIMSON }}>{stats.critical} ({stats.total ? Math.round(stats.critical / stats.total * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: AMBER }}>High</span>
                <span style={{ color: targetsMet.high ? EMERALD : CRIMSON }}>{stats.high} ({stats.total ? Math.round(stats.high / stats.total * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: GOLD }}>Medium</span>
                <span style={{ color: GOLD }}>{stats.bySev['Medium'] || 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: EMERALD }}>Low</span>
                <span style={{ color: EMERALD }}>{stats.bySev['Low'] || 0}</span>
              </div>
              <div className="h-px" style={{ background: 'rgba(212,168,50,0.08)' }} />
              <div className="flex justify-between py-1">
                <span style={{ color: EMERALD }}>Resolution Rate</span>
                <span style={{ color: targetsMet.resolution ? EMERALD : CRIMSON }}>{stats.resolvedPct}% / {targets.resolutionTarget}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: EMERALD }}>Non-Critical Share</span>
                <span style={{ color: targetsMet.nonCritical ? EMERALD : CRIMSON }}>{stats.nonCriticalPct}% / {targets.nonCriticalTarget}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}