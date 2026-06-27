import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts'
import { AlertTriangle, Activity, Shield, Filter, Target, Users, Settings, X, Check, ChevronDown, Save } from 'lucide-react'

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
const TARGETS_KEY = 'wadjet-cro-targets'

const IMPACT_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Critical']
const LIKELIHOOD_LABELS = ['Almost\nCertain', 'Likely', 'Possible', 'Unlikely', 'Rare']
const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']
const SEV_COLORS = { Critical: CRIMSON, High: AMBER, Medium: GOLD, Low: EMERALD }

const DEFAULT_TARGETS = {
  criticalThreshold: 5,
  highThreshold: 15,
  targetScore: 2.5,
  appetiteLimit: 3,
  minScore: 1.0,
  reviewFrequency: 'monthly',
  riskCategoryLimits: {},
}

const LOWERCASE = SEV_ORDER.map(s => s.toLowerCase())

function loadTargets() {
  try {
    const saved = localStorage.getItem(TARGETS_KEY)
    return saved ? { ...DEFAULT_TARGETS, ...JSON.parse(saved) } : DEFAULT_TARGETS
  } catch {
    return DEFAULT_TARGETS
  }
}

function saveTargets(t) {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(t))
}

function CellStyle(count, row, col) {
  const raw = row + col
  if (count === 0) return { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.04)', text: 'transparent', glow: 'transparent' }
  if (raw >= 7) {
    if (count >= 4) return { bg: 'rgba(220,53,69,0.50)', border: 'rgba(220,53,69,0.70)', text: '#dc3545', glow: 'rgba(220,53,69,0.4)' }
    if (count >= 2) return { bg: 'rgba(220,53,69,0.30)', border: 'rgba(220,53,69,0.40)', text: '#dc3545', glow: 'rgba(220,53,69,0.3)' }
    return { bg: 'rgba(220,53,69,0.18)', border: 'rgba(220,53,69,0.25)', text: '#dc3545', glow: 'rgba(220,53,69,0.2)' }
  }
  if (raw >= 4) {
    if (count >= 5) return { bg: 'rgba(253,126,20,0.40)', border: 'rgba(253,126,20,0.55)', text: '#fd7e14', glow: 'rgba(253,126,20,0.35)' }
    if (count >= 3) return { bg: 'rgba(212,168,50,0.30)', border: 'rgba(212,168,50,0.40)', text: '#d4a832', glow: 'rgba(212,168,50,0.3)' }
    return { bg: 'rgba(212,168,50,0.15)', border: 'rgba(212,168,50,0.20)', text: '#d4a832', glow: 'rgba(212,168,50,0.15)' }
  }
  if (count >= 6) return { bg: 'rgba(32,201,151,0.30)', border: 'rgba(32,201,151,0.40)', text: '#20c997', glow: 'rgba(32,201,151,0.25)' }
  if (count >= 3) return { bg: 'rgba(32,201,151,0.18)', border: 'rgba(32,201,151,0.25)', text: '#20c997', glow: 'rgba(32,201,151,0.15)' }
  return { bg: 'rgba(32,201,151,0.08)', border: 'rgba(32,201,151,0.12)', text: '#20c997', glow: 'rgba(32,201,151,0.08)' }
}

function ZoneLabel(raw) {
  if (raw >= 7) return { label: 'Critical Zone', color: CRIMSON }
  if (raw >= 4) return { label: 'High Zone', color: AMBER }
  return { label: 'Low Zone', color: EMERALD }
}

function SevBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 10, padding: '10px 14px', fontSize: 11 }}>
      <div style={{ color: WHITE, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill || GOLD }} />
          <span style={{ color: SILVER }}>{p.name}:</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function TargetStatus({ actual, target, higherIsBetter, label }) {
  const ratio = target > 0 ? actual / target : 0
  const ok = higherIsBetter ? actual <= target : actual >= target
  const color = higherIsBetter
    ? ratio <= 1 ? EMERALD : ratio <= 1.25 ? AMBER : CRIMSON
    : ratio >= 1 ? EMERALD : ratio >= 0.75 ? AMBER : CRIMSON
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}50` }} />
      <span className="text-[10px]" style={{ color: SILVER }}>{label}</span>
      <span className="text-[10px] font-mono" style={{ color: WHITE }}>{actual}</span>
      <span className="text-[9px]" style={{ color: GOLD }}>/ {target}</span>
    </div>
  )
}

function MeterBar({ value, max, target, label, color, suffix }) {
  const pct = Math.min(value / max * 100, 100)
  const targetPct = Math.min(target / max * 100, 100)
  const overTarget = value > target
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color: SILVER }}>{label}</span>
        <span style={{ color: overTarget ? CRIMSON : WHITE }}>
          {value}{suffix}
          <span style={{ color: GOLD }}> / {target}{suffix}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: overTarget ? CRIMSON : color }} />
        <div className="absolute top-0 w-0.5 h-full rounded-full transition-all duration-500" style={{ left: `${targetPct}%`, background: GOLD, boxShadow: '0 0 6px rgba(212,168,50,0.6)' }} />
      </div>
    </div>
  )
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
    { key: 'targetScore', label: 'Target Avg Risk Score', desc: 'Desired average risk score across all risks', min: 0, max: 5, step: 0.1, suffix: '', color: GOLD },
    { key: 'appetiteLimit', label: 'Max Appetite Breaches', desc: 'Max number of risks exceeding risk appetite', min: 0, max: 50, step: 1, suffix: '', color: CRIMSON },
    { key: 'minScore', label: 'Minimum Acceptable Score', desc: 'Lowest acceptable individual risk score', min: 0, max: 5, step: 0.1, suffix: '', color: GOLD },
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
              <h2 className="text-sm font-bold" style={{ color: WHITE }}>CEO Target Settings</h2>
              <p className="text-[10px]" style={{ color: GOLD }}>Configure risk appetite thresholds & KPIs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: SILVER }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
          {fields.map(f => {
            const val = draft[f.key] ?? 0
            const pct = f.suffix === '%' ? val : (val / (f.key === 'targetScore' ? 5 : f.key === 'minScore' ? 5 : 50)) * 100
            return (
              <div key={f.key} className="p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,168,50,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: f.color }}>{f.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={val}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      onChange={e => setDraft({ ...draft, [f.key]: parseFloat(e.target.value) || 0 })}
                      className="w-16 text-right text-xs font-mono rounded-md px-2 py-1 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,168,50,0.15)', color: WHITE }}
                    />
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
            style={{ color: '#000', background: GOLD }}
            onMouseOver={e => e.currentTarget.style.background = '#e0b842'}
            onMouseOut={e => e.currentTarget.style.background = GOLD}
          ><Save size={12} /> Save Targets</button>
        </div>
      </div>
    </div>
  )
}

export default function CRODashboard() {
  const [risks, setRisks] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [showTargets, setShowTargets] = useState(false)

  useEffect(() => {
    setTargets(loadTargets())
    fetch('/api/risks').then(r => r.json()).then(d => setRisks(d.risks || [])).catch(() => {})
  }, [])

  const handleSaveTargets = (t) => {
    setTargets(t)
    saveTargets(t)
  }

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

  const { bySev, byCat, byDeptSev, appetiteCount, deptBar, totalScore } = useMemo(() => {
    const bySev = {}
    const byCat = {}
    const byDeptSev = {}
    let app = { red: 0, amber: 0, green: 0 }
    let totalScore = 0
    risks.forEach(r => {
      const s = r.severity || 'Medium'
      bySev[s] = (bySev[s] || 0) + 1
      const cat = r.riskCategory || 'Uncategorized'
      if (!byCat[cat]) byCat[cat] = 0
      byCat[cat]++
      const team = r.ownerTeam || 'Unknown'
      if (!byDeptSev[team]) byDeptSev[team] = { Critical: 0, High: 0, Medium: 0, Low: 0 }
      byDeptSev[team][s] = (byDeptSev[team][s] || 0) + 1
      totalScore += r.overallScore || 3
    })
    app.red = bySev['Critical'] || 0
    app.amber = bySev['High'] || 0
    app.green = (bySev['Medium'] || 0) + (bySev['Low'] || 0)
    const deptBar = Object.entries(byDeptSev)
      .map(([department, sevs]) => ({
        department: department.length > 14 ? department.slice(0, 12) + '..' : department,
        Critical: sevs.Critical || 0,
        High: sevs.High || 0,
        Medium: sevs.Medium || 0,
        Low: sevs.Low || 0,
      }))
      .sort((a, b) => (b.Critical + b.High) - (a.Critical + a.High))
      .slice(0, 8)
    return { bySev, byCat, byDeptSev, appetiteCount: app, deptBar, totalScore }
  }, [risks])

  const avgScore = risks.length ? (totalScore / risks.length) : 0
  const avgScoreStr = avgScore ? avgScore.toFixed(1) : '—'
  const criticalPct = risks.length ? Math.round(((bySev['Critical'] || 0)) / risks.length * 100) : 0
  const highPct = risks.length ? Math.round(((bySev['High'] || 0)) / risks.length * 100) : 0
  const highCriticalPct = criticalPct + highPct
  const appetiteBreaches = appetiteCount.red + appetiteCount.amber

  const targetsMet = {
    critical: criticalPct <= targets.criticalThreshold,
    high: highPct <= targets.highThreshold,
    score: avgScore <= targets.targetScore,
    appetite: appetiteBreaches <= targets.appetiteLimit,
  }
  const allMet = Object.values(targetsMet).every(Boolean)
  const metCount = Object.values(targetsMet).filter(Boolean).length

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      {/* Target Settings Modal */}
      <TargetSettingsModal
        open={showTargets}
        targets={targets}
        onSave={handleSaveTargets}
        onClose={() => setShowTargets(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: GRAD, border: BORDER }}>
            <Activity size={18} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>CRO Dashboard</h1>
            <p className="text-xs" style={{ color: GOLD }}>Enterprise Risk Overview · CEO Target-Driven Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: allMet ? EMERALD : CRIMSON, boxShadow: allMet ? '0 0 6px rgba(32,201,151,0.5)' : '0 0 6px rgba(220,53,69,0.5)' }} />
              <span className="text-xs" style={{ color: allMet ? EMERALD : CRIMSON }}>
                {metCount}/4 Targets Met
              </span>
            </div>
          </div>
          <button onClick={() => setShowTargets(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
            style={{ background: GRAD, border: BORDER, color: GOLD }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(212,168,50,0.15)'}
            onMouseOut={e => e.currentTarget.style.background = GRAD}
          >
            <Settings size={13} />
            Set Targets
          </button>
        </div>
      </div>

      {/* CEO Target Status Bar */}
      <div className="p-4 rounded-xl" style={{ background: BG, border: BORDER }}>
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} style={{ color: GOLD }} />
          <span className="text-xs font-semibold" style={{ color: WHITE }}>CEO Target Dashboard</span>
          <span className="text-[9px] ml-auto" style={{ color: GOLD }}>Configure your targets via the <strong>Set Targets</strong> button</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Critical Risk %', actual: criticalPct, target: targets.criticalThreshold, max: 100, suffix: '%', color: CRIMSON, met: targetsMet.critical },
            { label: 'High Risk %', actual: highPct, target: targets.highThreshold, max: 100, suffix: '%', color: AMBER, met: targetsMet.high },
            { label: 'Avg Risk Score', actual: avgScore, target: targets.targetScore, max: 5, suffix: '', color: GOLD, met: targetsMet.score },
            { label: 'Appetite Breaches', actual: appetiteBreaches, target: targets.appetiteLimit, max: 20, suffix: '', color: CRIMSON, met: targetsMet.appetite },
          ].map((m, i) => {
            const pct = Math.min(m.actual / m.max * 100, 100)
            const tPct = Math.min(m.target / m.max * 100, 100)
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,168,50,0.06)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px]" style={{ color: SILVER }}>{m.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono" style={{ color: m.met ? EMERALD : CRIMSON }}>{m.actual}{m.suffix}</span>
                    <span className="text-[9px]" style={{ color: GOLD }}>/ {m.target}{m.suffix}</span>
                    {m.met ? (
                      <Check size={11} style={{ color: EMERALD }} />
                    ) : (
                      <AlertTriangle size={11} style={{ color: CRIMSON }} />
                    )}
                  </div>
                </div>
                <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.met ? EMERALD : CRIMSON }} />
                  <div className="absolute top-0 w-0.5 h-full bg-white rounded-full transition-all duration-500"
                    style={{ left: `${tPct}%`, background: GOLD, boxShadow: '0 0 8px rgba(212,168,50,0.8)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* Left: Heat Map + Details */}
        <div className="col-span-8 space-y-5">

          {/* 5x5 Risk Heat Map */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>5×5 Risk Heat Map</h2>
              <div className="flex items-center gap-3 text-[10px]">
                <span style={{ color: SILVER }}>Impact →</span>
                <div className="flex gap-2">
                  {IMPACT_LABELS.map((l, i) => (
                    <span key={i} style={{ color: SEV_COLORS[l] || SILVER }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex mb-1.5" style={{ paddingLeft: '100px' }}>
              {LIKELIHOOD_LABELS.map((l, i) => (
                <div key={i} className="flex-1 text-center" style={{ color: SILVER }}>
                  <span className="text-[9px] leading-tight block">{l.replace('\n', ' ')}</span>
                </div>
              ))}
            </div>

            <div className="flex">
              <div className="flex flex-col justify-around mr-2" style={{ width: '90px', minWidth: '90px' }}>
                {IMPACT_LABELS.map((l, i) => (
                  <div key={i} className="flex items-center justify-end h-16 pr-3 text-[10px] font-medium" style={{ color: SEV_COLORS[l] || SILVER }}>
                    {l}
                  </div>
                ))}
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
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
                          className="relative flex items-center justify-center cursor-pointer transition-all duration-200 rounded-lg"
                          style={{
                            background: sel ? 'rgba(212,168,50,0.22)' : hov ? style.bg : style.bg,
                            border: sel ? '2px solid #d4a832' : hov ? `2px solid ${zone.color}` : style.border,
                            boxShadow: hov ? `0 0 16px ${style.glow}` : 'none',
                            minHeight: '64px',
                            transform: hov ? 'scale(1.06)' : 'scale(1)',
                            zIndex: hov ? 10 : 1,
                          }}>
                          {cell.length > 0 && (
                            <div className="text-center">
                              <div className="text-xl font-bold" style={{ color: style.text }}>{cell.length}</div>
                              <div className="text-[8px] font-medium uppercase tracking-wider" style={{ color: style.text + '99' }}>risks</div>
                            </div>
                          )}
                          {cell.length === 0 && (
                            <div className="text-[9px]" style={{ color: 'rgba(206,212,218,0.06)' }}>—</div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
                            style={{ background: zone.color, opacity: cell.length > 0 ? 0.6 : 0 }} />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex mt-1.5" style={{ paddingLeft: '100px' }}>
              {LIKELIHOOD_LABELS.map((l, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[8px]" style={{ color: SILVER }}>{l.split('\n')[0]}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
              <span className="text-[9px]" style={{ color: SILVER }}>Density:</span>
              {[
                { bg: 'rgba(32,201,151,0.25)', label: 'Low' },
                { bg: 'rgba(212,168,50,0.25)', label: 'Medium' },
                { bg: 'rgba(253,126,20,0.25)', label: 'High' },
                { bg: 'rgba(220,53,69,0.25)', label: 'Critical' },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: d.bg, border: '1px solid' + d.bg.replace('0.25', '0.4') }} />
                  <span className="text-[9px]" style={{ color: SILVER }}>{d.label}</span>
                </div>
              ))}
              <span className="ml-auto text-[9px]" style={{ color: GOLD }}>
                Click a cell to view risks
              </span>
            </div>

            {filtered.length > 0 && (
              <div className="mt-4 rounded-xl overflow-hidden" style={{ border: BORDER }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'rgba(212,168,50,0.05)' }}>
                  <Filter size={12} style={{ color: GOLD }} />
                  <span className="text-xs font-medium" style={{ color: GOLD }}>
                    {IMPACT_LABELS[selectedCell.row]} Impact / {LIKELIHOOD_LABELS[selectedCell.col].split('\n')[0]} Likelihood
                  </span>
                  <span className="text-xs ml-auto" style={{ color: SILVER }}>{filtered.length} risk{filtered.length !== 1 ? 's' : ''} in this cell</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th className="text-left py-2 px-3 font-medium" style={{ color: GOLD }}>Risk ID</th>
                        <th className="text-left py-2 px-3 font-medium" style={{ color: GOLD }}>Title</th>
                        <th className="text-left py-2 px-3 font-medium" style={{ color: GOLD }}>Category</th>
                        <th className="text-center py-2 px-3 font-medium" style={{ color: GOLD }}>Impact</th>
                        <th className="text-center py-2 px-3 font-medium" style={{ color: GOLD }}>Likelihood</th>
                        <th className="text-center py-2 px-3 font-medium" style={{ color: GOLD }}>Score</th>
                        <th className="text-center py-2 px-3 font-medium" style={{ color: GOLD }}>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={i}
                          style={{ borderTop: '1px solid rgba(212,168,50,0.06)', transition: 'background 0.15s' }}
                          className="hover:bg-white/[0.02]"
                        >
                          <td className="py-2 px-3 font-mono text-[10px]" style={{ color: GOLD }}>{r.riskId}</td>
                          <td className="py-2 px-3" style={{ color: WHITE }}>{r.riskTitle?.slice(0, 55) || '—'}</td>
                          <td className="py-2 px-3" style={{ color: SILVER }}>{r.riskCategory || '—'}</td>
                          <td className="py-2 px-3 text-center font-mono" style={{ color: WHITE }}>{r.overallImpact || '—'}</td>
                          <td className="py-2 px-3 text-center font-mono" style={{ color: WHITE }}>{r.likelihood || '—'}</td>
                          <td className="py-2 px-3 text-center font-mono" style={{ color: WHITE }}>{r.overallScore || '—'}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                              style={{ background: `${SEV_COLORS[r.severity] || SILVER}20`, color: SEV_COLORS[r.severity] || SILVER }}>
                              {r.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Severity by Department with Target Overlay */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>Severity by Department</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBar} layout="vertical" margin={{ left: 90, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: SILVER, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="department" tick={{ fill: SILVER, fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<SevBarTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: SILVER }} iconType="circle" />
                  <Bar dataKey="Critical" name="Critical" stackId="a" fill={CRIMSON} barSize={20} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="High" name="High" stackId="a" fill={AMBER} />
                  <Bar dataKey="Medium" name="Medium" stackId="a" fill={GOLD} />
                  <Bar dataKey="Low" name="Low" stackId="a" fill={EMERALD} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-4 space-y-5">

          {/* Risk Appetite Status with CEO Targets */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Appetite vs Targets</h2>
              <span className="text-[9px]" style={{ color: GOLD }}>CEO-set thresholds</span>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(32,201,151,0.06)', border: '1px solid rgba(32,201,151,0.12)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: EMERALD, boxShadow: '0 0 8px rgba(32,201,151,0.5)' }} />
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: EMERALD }}>Within Appetite</div>
                    <div className="text-[9px]" style={{ color: EMERALD + '99' }}>Low / Medium Risk</div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: EMERALD }}>{appetiteCount.green}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(253,126,20,0.06)', border: '1px solid rgba(253,126,20,0.12)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: AMBER, boxShadow: '0 0 8px rgba(253,126,20,0.5)' }} />
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: AMBER }}>Tolerable</div>
                    <div className="text-[9px]" style={{ color: AMBER + '99' }}>High Risk — Needs Monitoring</div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: AMBER }}>{appetiteCount.amber}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.12)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CRIMSON, boxShadow: '0 0 8px rgba(220,53,69,0.5)' }} />
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: CRIMSON }}>Exceeded</div>
                    <div className="text-[9px]" style={{ color: CRIMSON + '99' }}>Critical — Immediate Action</div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: CRIMSON }}>{appetiteCount.red}</span>
                </div>
              </div>
            </div>

            {/* Appetite target meter */}
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
              <MeterBar
                value={appetiteBreaches}
                max={Math.max(targets.appetiteLimit * 2, appetiteBreaches + 3)}
                target={targets.appetiteLimit}
                label="Total breaches (amber+red)"
                color={AMBER}
                suffix=""
              />
            </div>

            <div className="mt-3 pt-3 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
              <span style={{ color: SILVER }}>Total covered: <strong style={{ color: WHITE }}>{risks.length}</strong> risks</span>
              <span style={{ color: GOLD }}>Register as of today</span>
            </div>
          </div>

          {/* Severity Distribution with Target Lines */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>Severity Distribution</h2>
            <div className="space-y-3">
              {SEV_ORDER.map(s => {
                const count = bySev[s] || 0
                const pct = risks.length ? Math.round((count / risks.length) * 100) : 0
                const color = SEV_COLORS[s] || SILVER
                const isCritical = s === 'Critical'
                const isHigh = s === 'High'
                const target = isCritical ? targets.criticalThreshold : isHigh ? targets.highThreshold : null
                const overTarget = target !== null ? pct > target : false
                const lower = s.toLowerCase()
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span style={{ color }}>{s}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: WHITE }}>{count}</span>
                        <span className="text-[9px]" style={{ color: SILVER }}>({pct}%)</span>
                        {overTarget && <AlertTriangle size={10} style={{ color: CRIMSON }} />}
                      </div>
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: overTarget ? CRIMSON : color }} />
                      {target !== null && (
                        <div className="absolute top-0 w-0.5 h-full transition-all duration-500"
                          style={{ left: `${Math.min(target, 100)}%`, background: GOLD, boxShadow: '0 0 8px rgba(212,168,50,0.8)' }} />
                      )}
                    </div>
                    {target !== null && (
                      <div className="flex justify-end text-[8px] mt-0.5" style={{ color: GOLD }}>
                        CEO target: {target}%
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} style={{ color: GOLD }} />
              <span className="text-xs font-semibold" style={{ color: WHITE }}>Risk Category Breakdown</span>
            </div>
            <div className="space-y-1 text-xs max-h-48 overflow-y-auto scrollbar-thin">
              {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const pct = risks.length ? Math.round(count / risks.length * 100) : 0
                const limit = targets.riskCategoryLimits?.[cat]
                const overLimit = limit ? count > limit : false
                return (
                  <div key={cat} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <span style={{ color: SILVER }}>{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: overLimit ? CRIMSON : GOLD }} />
                      </div>
                      <span className="font-mono text-[10px]" style={{ color: overLimit ? CRIMSON : GOLD }}>{count}</span>
                      {overLimit && <AlertTriangle size={9} style={{ color: CRIMSON }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}