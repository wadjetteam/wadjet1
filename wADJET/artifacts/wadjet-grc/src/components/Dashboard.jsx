import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts'
import {
  AlertTriangle, Shield, Target, Activity, BarChart3, CheckCircle, AlertCircle,
  Clock, Users, TrendingUp, Eye, Download, Filter
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

const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']
const SEV_COLORS = { Critical: CRIMSON, High: AMBER, Medium: GOLD, Low: EMERALD }
const IMPACT_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Critical']
const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']

const HEAT_COLORS = [
  { bg: 'rgba(32,201,151,0.06)', border: 'rgba(32,201,151,0.10)', text: '#20c997', glow: 'rgba(32,201,151,0.06)', zone: 'low' },
  { bg: 'rgba(32,201,151,0.15)', border: 'rgba(32,201,151,0.20)', text: '#20c997', glow: 'rgba(32,201,151,0.12)', zone: 'low' },
  { bg: 'rgba(212,168,50,0.12)', border: 'rgba(212,168,50,0.18)', text: '#d4a832', glow: 'rgba(212,168,50,0.12)', zone: 'med' },
  { bg: 'rgba(212,168,50,0.25)', border: 'rgba(212,168,50,0.35)', text: '#d4a832', glow: 'rgba(212,168,50,0.2)', zone: 'med' },
  { bg: 'rgba(253,126,20,0.20)', border: 'rgba(253,126,20,0.30)', text: '#fd7e14', glow: 'rgba(253,126,20,0.2)', zone: 'high' },
  { bg: 'rgba(253,126,20,0.35)', border: 'rgba(253,126,20,0.50)', text: '#fd7e14', glow: 'rgba(253,126,20,0.3)', zone: 'high' },
  { bg: 'rgba(220,53,69,0.15)', border: 'rgba(220,53,69,0.22)', text: '#dc3545', glow: 'rgba(220,53,69,0.15)', zone: 'crit' },
  { bg: 'rgba(220,53,69,0.30)', border: 'rgba(220,53,69,0.40)', text: '#dc3545', glow: 'rgba(220,53,69,0.3)', zone: 'crit' },
  { bg: 'rgba(220,53,69,0.50)', border: 'rgba(220,53,69,0.65)', text: '#dc3545', glow: 'rgba(220,53,69,0.4)', zone: 'crit' },
]

function getHeatStyle(count, row, col) {
  if (count === 0) return HEAT_COLORS[0]
  const raw = row + col
  if (raw >= 7) return count >= 4 ? HEAT_COLORS[8] : count >= 2 ? HEAT_COLORS[7] : HEAT_COLORS[6]
  if (raw >= 4) return count >= 5 ? HEAT_COLORS[5] : count >= 3 ? HEAT_COLORS[4] : HEAT_COLORS[3]
  return count >= 6 ? HEAT_COLORS[2] : count >= 3 ? HEAT_COLORS[1] : HEAT_COLORS[1]
}

const SevTooltip = ({ active, payload, label }) => {
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

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 10, padding: '8px 12px', fontSize: 11 }}>
      <span style={{ color: payload[0].payload.color || WHITE, fontWeight: 700 }}>{payload[0].name}: </span>
      <span style={{ color: WHITE }}>{payload[0].value} risks</span>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color, gauge }) {
  const r = 16, cx = 24, cy = 24, circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(Math.max(gauge ?? 0, 0), 1))
  return (
    <div className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]" style={{ background: BG, border: BORDER }}>
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}12`} strokeWidth={3} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={3}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 4px ${color}50)`, transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
      </div>
      <div className="text-2xl font-bold" style={{ color: WHITE }}>{value}</div>
      <div className="text-[10px] mt-0.5 font-semibold uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.35)' }}>{label}</div>
      {sub && <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{sub}</div>}
    </div>
  )
}

export default function Dashboard({ auditorMode }) {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetch('/api/risks').then(r => r.json()).then(d => {
      setRisks(d.risks || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const stats = useMemo(() => {
    const total = risks.length
    const bySev = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    const byCat = {}
    const byTeam = {}
    let open = 0, closed = 0
    risks.forEach(r => {
      const sev = r.severity || 'Medium'
      bySev[sev] = (bySev[sev] || 0) + 1
      const cat = r.riskCategory || 'Other'
      byCat[cat] = (byCat[cat] || 0) + 1
      const team = r.ownerTeam || 'Unknown'
      byTeam[team] = (byTeam[team] || 0) + 1
      if (r.status === 'Open') open++
      else closed++
    })
    const heatRows = Array.from({ length: 5 }).map((_, row) =>
      Array.from({ length: 5 }).map((_, col) =>
        risks.filter(r => {
          const impact = Math.min(Math.max(Math.ceil((r.overallScore || 3) / 2), 1), 5)
          const likelihood = Math.min(Math.max(r.likelihood || 3, 1), 5)
          return impact === row + 1 && likelihood === col + 1
        }).length
      )
    )
    const topCritical = risks.filter(r => r.severity === 'Critical' || r.severity === 'High').slice(0, 5)
      .map(r => ({ riskId: r.riskId, title: r.riskTitle || r.riskDescription?.slice(0, 60) || '', category: r.riskCategory || '', severity: r.severity || '', score: r.overallScore || 0 }))
    return { total, bySev, byCat, byTeam, open, closed, heatRows, topCritical }
  }, [risks])

  const catChart = useMemo(() =>
    Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({
      name: name.length > 16 ? name.slice(0, 14) + '..' : name, value,
      color: [EMERALD, GOLD, AMBER, CRIMSON, '#6f42c1', '#20c997'][i % 6],
    })), [stats.byCat])

  const sevChart = useMemo(() =>
    SEV_ORDER.filter(s => (stats.bySev[s] || 0) > 0).map(s => ({
      name: s, value: stats.bySev[s] || 0, color: SEV_COLORS[s] || SILVER,
    })), [stats.bySev])

  const topTeamEntries = useMemo(() =>
    Object.entries(stats.byTeam).sort((a, b) => b[1] - a[1]).slice(0, 8), [stats.byTeam])

  const resolvedPct = stats.total ? Math.round((stats.closed / stats.total) * 100) : 0
  const criticalPct = stats.total ? Math.round((stats.bySev['Critical'] || 0) / stats.total * 100) : 0
  const highPct = stats.total ? Math.round((stats.bySev['High'] || 0) / stats.total * 100) : 0

  const totalScore = risks.reduce((a, r) => a + (r.overallScore || 3), 0)
  const avgScore = stats.total ? (totalScore / stats.total).toFixed(1) : '—'

  const getCellRisk = (row, col) => risks.filter(r => {
    const impact = Math.min(Math.max(Math.ceil((r.overallScore || 3) / 2), 1), 5)
    const lh = Math.min(Math.max(r.likelihood || 3, 1), 5)
    return impact === row + 1 && lh === col + 1
  })
  const filtered = selectedCell ? getCellRisk(selectedCell.row, selectedCell.col) : []

  const refLines = [
    { sev: 'Critical', pct: criticalPct, target: 10 },
    { sev: 'High', pct: highPct, target: 20 },
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
          <p className="text-xs" style={{ color: SILVER }}>Loading bank-grade dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">

      {/* Bank-Style Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: GRAD, border: BORDER }}>
              <BarChart3 size={20} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Executive Dashboard</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px]" style={{ color: GOLD }}>Risk Profile · {stats.total} Risks</span>
                <span className="text-[8px]" style={{ color: 'rgba(206,212,218,0.25)' }}>|</span>
                <span className="text-[9px]" style={{ color: SILVER }}>
                  <Clock size={9} className="inline mr-1" />{dateStr} · {timeStr}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {auditorMode && (
            <div className="px-3 py-1.5 rounded-lg text-[10px]" style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: CRIMSON }}>
              <Eye size={11} className="inline mr-1" />Auditor Mode — Read Only
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: EMERALD, boxShadow: '0 0 6px rgba(32,201,151,0.5)' }} />
            <span className="text-[10px]" style={{ color: SILVER }}>Live</span>
          </div>
        </div>
      </div>

      {/* KPI Strip — Bank Style */}
      <div className="grid grid-cols-5 gap-3 animate-fade-in" style={{ animationDelay: '0.06s' }}>
        <KpiCard label="Total Risks" value={stats.total} sub={`${stats.bySev['Critical'] || 0} Crit · ${stats.bySev['High'] || 0} High`} icon={AlertTriangle} color={stats.bySev['Critical'] > 0 ? CRIMSON : GOLD} gauge={Math.min(stats.total / 60, 1)} />
        <KpiCard label="Open" value={stats.open} sub={`${stats.closed} Resolved`} icon={AlertCircle} color={AMBER} gauge={stats.total ? stats.open / stats.total : 0} />
        <KpiCard label="Resolution Rate" value={`${resolvedPct}%`} sub={`${stats.closed}/${stats.total} closed`} icon={CheckCircle} color={EMERALD} gauge={resolvedPct / 100} />
        <KpiCard label="Avg Score" value={avgScore} sub="/ 5.0" icon={Activity} color={parseFloat(avgScore) > 3 ? AMBER : GOLD} gauge={parseFloat(avgScore) / 5} />
        <KpiCard label="Departments" value={topTeamEntries.length} sub={`${Object.keys(stats.byTeam).length} total`} icon={Users} color={GOLD} gauge={Math.min(topTeamEntries.length / 12, 1)} />
      </div>

      {/* Middle Row — Charts */}
      <div className="grid grid-cols-5 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>

        {/* Severity Distribution — Horizontal Bank Style */}
        <div className="col-span-3 p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} style={{ color: GOLD }} />
              <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Severity Distribution</h3>
            </div>
            <span className="text-[9px]" style={{ color: SILVER }}>Count by severity level</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevChart} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: SILVER, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: SILVER, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<SevTooltip />} />
                <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]} barSize={28}>
                  {sevChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 pt-2" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
            {sevChart.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-[9px]">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span style={{ color: SILVER }}>{s.name}</span>
                <span className="font-mono" style={{ color: WHITE }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution — Professional Donut */}
        <div className="col-span-2 p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} style={{ color: GOLD }} />
            <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Category Distribution</h3>
          </div>
          <div className="relative flex items-center justify-center mb-3">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={catChart} innerRadius={50} outerRadius={78} paddingAngle={2} dataKey="value" stroke="#000" strokeWidth={2}>
                  {catChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<PieTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold" style={{ color: WHITE }}>{stats.total}</span>
              <span className="text-[8px] uppercase tracking-widest" style={{ color: SILVER }}>Total</span>
            </div>
          </div>
          <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin">
            {catChart.slice(0, 6).map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                <span className="text-[9px] truncate" style={{ color: SILVER }}>{c.name}</span>
                <span className="ml-auto text-[9px] font-mono" style={{ color: WHITE }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row — 3 Columns */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.14s' }}>

        {/* Bank-Grade Heat Map */}
        <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: GOLD }} />
              <h3 className="text-sm font-semibold" style={{ color: WHITE }}>5×5 Risk Heat Map</h3>
            </div>
            <span className="text-[7px] uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.3)' }}>Impact × Likelihood</span>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col justify-around" style={{ width: '72px', minWidth: '72px' }}>
              {IMPACT_LABELS.map((l, i) => (
                <div key={i} className="flex items-center justify-end h-11 pr-2">
                  <span className="text-[6px] font-bold uppercase tracking-widest leading-tight text-right" style={{ color: SEV_COLORS[l] || 'rgba(206,212,218,0.2)' }}>{l}</span>
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-[2px]">
                {stats.heatRows.map((row, ri) =>
                  row.map((count, ci) => {
                    const s = getHeatStyle(count, ri, ci)
                    const sel = selectedCell?.row === ri && selectedCell?.col === ci
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        onClick={() => {
                          if (count === 0) return
                          if (sel) setSelectedCell(null)
                          else setSelectedCell({ row: ri, col: ci })
                        }}
                        className="aspect-square rounded-[5px] flex items-center justify-center text-[8px] font-bold transition-all duration-150 cursor-pointer"
                        style={{
                          background: sel ? 'rgba(212,168,50,0.18)' : s.bg,
                          border: sel ? '1.5px solid #d4a832' : `1px solid ${s.border}`,
                          color: s.text,
                          boxShadow: sel ? '0 0 12px rgba(212,168,50,0.3)' : count > 0 ? `0 0 6px ${s.glow}` : 'none',
                          transform: sel ? 'scale(1.08)' : 'scale(1)',
                        }}>
                        {count > 0 ? count : <span style={{ color: 'rgba(206,212,218,0.03)' }}>·</span>}
                      </div>
                    )
                  })
                )}
              </div>
              <div className="flex mt-0.5">
                {LIKELIHOOD_LABELS.map((l, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[5px] uppercase tracking-widest" style={{ color: 'rgba(206,212,218,0.15)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Density & selected cell */}
          <div className="flex items-center gap-2 mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
            <div className="flex items-center gap-1">
              {[
                { bg: 'rgba(32,201,151,0.25)', border: 'rgba(32,201,151,0.25)', label: 'Low' },
                { bg: 'rgba(212,168,50,0.25)', border: 'rgba(212,168,50,0.25)', label: 'Med' },
                { bg: 'rgba(253,126,20,0.25)', border: 'rgba(253,126,20,0.25)', label: 'High' },
                { bg: 'rgba(220,53,69,0.25)', border: 'rgba(220,53,69,0.25)', label: 'Crit' },
              ].map(({ bg: bgC, border: bC, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: bgC, border: `1px solid ${bC}` }} />
                  <span className="text-[7px]" style={{ color: SILVER }}>{label}</span>
                </div>
              ))}
            </div>
            {selectedCell && (
              <div className="ml-auto text-[7px]" style={{ color: GOLD }}>
                <Filter size={8} className="inline mr-1" />
                {IMPACT_LABELS[selectedCell.row]} / {LIKELIHOOD_LABELS[selectedCell.col]}
                <span className="ml-1" style={{ color: SILVER }}>({filtered.length})</span>
              </div>
            )}
          </div>

          {/* Filtered table */}
          {filtered.length > 0 && (
            <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(212,168,50,0.08)' }}>
              <div className="max-h-28 overflow-y-auto">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: GOLD }}>ID</th>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: GOLD }}>Title</th>
                      <th className="text-center py-1.5 px-2 font-semibold" style={{ color: GOLD }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 4).map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(212,168,50,0.04)' }}>
                        <td className="py-1 px-2 font-mono" style={{ color: GOLD }}>{r.riskId}</td>
                        <td className="py-1 px-2 truncate max-w-[100px]" style={{ color: WHITE }}>{r.riskTitle || '—'}</td>
                        <td className="py-1 px-2 text-center font-mono" style={{ color: WHITE }}>{r.overallScore || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Critical & High Risks — Bank Table */}
        <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: CRIMSON }} />
              <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Critical & High Risks</h3>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,53,69,0.1)', color: CRIMSON }}>
              {stats.topCritical.length}
            </span>
          </div>
          {stats.topCritical.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={28} className="mx-auto mb-2" style={{ color: EMERALD }} />
              <p className="text-xs" style={{ color: SILVER }}>All risks within tolerance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.topCritical.map((r, i) => (
                <div key={i} className="p-2.5 rounded-xl transition-all duration-150 hover:bg-white/[0.02]" style={{ background: 'rgba(212,168,50,0.02)', border: '1px solid rgba(212,168,50,0.06)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-medium truncate" style={{ color: WHITE }}>{r.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-mono" style={{ color: GOLD }}>{r.riskId}</span>
                        <span className="text-[8px]" style={{ color: SILVER }}>{r.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: `${SEV_COLORS[r.severity] || SILVER}20`, color: SEV_COLORS[r.severity] || SILVER }}>
                        {r.severity}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: WHITE }}>{r.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-2 flex items-center gap-2 text-[9px]" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
            <Target size={11} style={{ color: GOLD }} />
            <span style={{ color: SILVER }}>Target: Critical {'<'}10% · High {'<'}20%</span>
            <span className="ml-auto" style={{ color: criticalPct > 10 ? CRIMSON : EMERALD }}>
              Crit: {criticalPct}%
            </span>
          </div>
        </div>

        {/* Departments + Summary — Bank Style */}
        <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} style={{ color: GOLD }} />
            <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Departments</h3>
            <span className="text-[9px] ml-auto" style={{ color: SILVER }}>{Object.keys(stats.byTeam).length} teams</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
            {topTeamEntries.map(([team, count]) => {
              const pct = stats.total ? Math.round(count / stats.total * 100) : 0
              return (
                <div key={team} className="flex items-center gap-2 py-0.5">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                    <span className="text-[10px] truncate" style={{ color: SILVER }}>{team}</span>
                  </div>
                  <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: GOLD }} />
                  </div>
                  <span className="text-[9px] font-mono w-5 text-right" style={{ color: WHITE }}>{count}</span>
                </div>
              )
            })}
          </div>

          {/* Summary Strip */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={12} style={{ color: GOLD }} />
              <span className="text-[10px] font-semibold" style={{ color: WHITE }}>Portfolio Summary</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Open', value: stats.open, color: AMBER },
                { label: 'Closed', value: stats.closed, color: EMERALD },
                { label: 'Crit+High', value: (stats.bySev['Critical'] || 0) + (stats.bySev['High'] || 0), color: CRIMSON },
                { label: 'Categories', value: catChart.length, color: GOLD },
              ].map((s, i) => (
                <div key={i} className="text-center p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="text-[11px] font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[7px] uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.3)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Footer — Bank Audit Trail */}
      <div className="flex items-center justify-between text-[8px] px-1" style={{ color: 'rgba(206,212,218,0.2)' }}>
        <span>Data sourced from enterprise risk register · 48 seeded risks</span>
        <span>Last refreshed: {dateStr} {timeStr} · {auditorMode ? 'Audit view' : 'Standard view'}</span>
      </div>

    </div>
  )
}