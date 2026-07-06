import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area, ReferenceLine, Sector
} from 'recharts'
import {
  AlertTriangle, Shield, Target, Activity, BarChart3, CheckCircle, AlertCircle,
  Clock, Users, TrendingUp, Eye, Filter
} from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const BG = 'rgba(5,5,5,0.85)'
const BG2 = 'rgba(8,8,12,0.95)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRAD = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']
const SEV_COLORS = { Critical: CRIMSON, High: AMBER, Medium: GOLD, Low: EMERALD }
const IMPACT_LABELS = ['Low', 'Medium', 'High', 'Critical', 'Critical+']
const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']

const GREEN = '#20c997'
const ORANGE = '#fd7e14'
const RED = '#dc3545'

const HEAT_STEPS = [
  { bg: 'linear-gradient(135deg, rgba(32,201,151,0.06), rgba(32,201,151,0.01))', border: 'rgba(32,201,151,0.08)', text: GREEN, glow: 'rgba(32,201,151,0.06)', label: 'Low' },
  { bg: 'linear-gradient(135deg, rgba(32,201,151,0.18), rgba(32,201,151,0.06))', border: 'rgba(32,201,151,0.22)', text: GREEN, glow: 'rgba(32,201,151,0.12)', label: 'Low' },
  { bg: 'linear-gradient(135deg, rgba(32,201,151,0.35), rgba(32,201,151,0.12))', border: 'rgba(32,201,151,0.40)', text: GREEN, glow: 'rgba(32,201,151,0.25)', label: 'Low' },
  { bg: 'linear-gradient(135deg, rgba(253,125,20,0.10), rgba(253,125,20,0.03))', border: 'rgba(253,125,20,0.15)', text: ORANGE, glow: 'rgba(253,125,20,0.10)', label: 'Medium' },
  { bg: 'linear-gradient(135deg, rgba(253,125,20,0.25), rgba(253,125,20,0.08))', border: 'rgba(253,125,20,0.32)', text: ORANGE, glow: 'rgba(253,125,20,0.20)', label: 'Medium' },
  { bg: 'linear-gradient(135deg, rgba(253,125,20,0.45), rgba(253,125,20,0.15))', border: 'rgba(253,125,20,0.55)', text: ORANGE, glow: 'rgba(253,125,20,0.35)', label: 'Medium' },
  { bg: 'linear-gradient(135deg, rgba(220,53,69,0.12), rgba(220,53,69,0.04))', border: 'rgba(220,53,69,0.18)', text: RED, glow: 'rgba(220,53,69,0.12)', label: 'High' },
  { bg: 'linear-gradient(135deg, rgba(220,53,69,0.32), rgba(220,53,69,0.12))', border: 'rgba(220,53,69,0.42)', text: RED, glow: 'rgba(220,53,69,0.30)', label: 'High' },
  { bg: 'linear-gradient(135deg, rgba(220,53,69,0.55), rgba(220,53,69,0.20))', border: 'rgba(220,53,69,0.70)', text: CRIMSON, glow: 'rgba(220,53,69,0.45)', label: 'High' },
]

function getHeatStyle(count, row, col) {
  if (count === 0) return HEAT_STEPS[0]
  const raw = row + col
  if (raw >= 7) return count >= 4 ? HEAT_STEPS[8] : count >= 2 ? HEAT_STEPS[7] : HEAT_STEPS[6]
  if (raw >= 4) return count >= 5 ? HEAT_STEPS[5] : count >= 3 ? HEAT_STEPS[4] : HEAT_STEPS[3]
  return count >= 6 ? HEAT_STEPS[2] : count >= 3 ? HEAT_STEPS[1] : HEAT_STEPS[1]
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 10, padding: '10px 14px', fontSize: 11, backdropFilter: 'blur(12px)' }}>
      <div style={{ color: WHITE, fontWeight: 600, marginBottom: 6, fontSize: 12 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill || p.color || GOLD }} />
          <span style={{ color: 'rgba(206,212,218,0.6)' }}>{p.name}:</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  )
}

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const total = d.payload?.total || 1
  const pct = ((d.value / total) * 100).toFixed(1)
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 10, padding: '8px 12px', fontSize: 11, backdropFilter: 'blur(12px)' }}>
      <div style={{ color: d.payload.color || WHITE, fontWeight: 700 }}>{d.name}</div>
      <div style={{ color: WHITE, marginTop: 2 }}>{d.value} risk{d.value !== 1 ? 's' : ''}</div>
      <div style={{ color: d.payload.color || SILVER, fontSize: 10 }}>{pct}% of total</div>
    </div>
  )
}



function ScoreDistChart({ risks }) {
  const LOW_C = '#20c997', MED_C = '#d4a832', HIGH_C = '#fd7e14', CRIT_C = '#dc3545'
  const BY = { Critical: CRIT_C, High: HIGH_C, Medium: MED_C, Low: LOW_C }
  const bins = useMemo(() => {
    const dist = [
      { range: 'Low (1‑4)', min: 0, max: 4, count: 0, color: LOW_C, zone: 'Low' },
      { range: 'Medium (5‑9)', min: 5, max: 9, count: 0, color: MED_C, zone: 'Medium' },
      { range: 'High (10‑14)', min: 10, max: 14, count: 0, color: HIGH_C, zone: 'High' },
      { range: 'Critical (15‑25)', min: 15, max: 25, count: 0, color: CRIT_C, zone: 'Critical' },
    ]
    risks.forEach(r => {
      const s = r.overallScore || 3
      const bin = dist.find(b => s >= b.min && s <= b.max)
      if (bin) bin.count++
    })
    const maxCount = Math.max(...dist.map(d => d.count), 1)
    const total = risks.length
    return dist.map(d => ({
      ...d,
      pct: maxCount > 0 ? Math.round(d.count / maxCount * 100) : 0,
      share: total > 0 ? (d.count / total * 100).toFixed(1) : '0.0',
    }))
  }, [risks])
  const avgScore = useMemo(() => {
    if (!risks.length) return 0
    return (risks.reduce((s, r) => s + (r.overallScore || 3), 0) / risks.length).toFixed(1)
  }, [risks])
  const zoneBands = [
    { start: -0.5, end: 3.5, color: 'rgba(32,201,151,0.06)' },
    { start: 3.5, end: 7.5, color: 'rgba(212,168,50,0.06)' },
    { start: 7.5, end: 11.5, color: 'rgba(253,125,20,0.06)' },
    { start: 11.5, end: 15.5, color: 'rgba(220,53,69,0.06)' },
  ]
  return (
    <div className="h-[220px] relative">
      {/* Zone background references */}
      <div className="absolute inset-0 flex pointer-events-none" style={{ margin: '5px 10px 0 -20px' }}>
        {zoneBands.map((z, i) => (
          <div key={i} className="h-full" style={{
            flex: z.end - z.start, background: z.color,
            borderLeft: i > 0 ? '1px dashed rgba(255,255,255,0.03)' : 'none',
          }} />
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={bins} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {['Low','Med','High','Crit'].map((id, i) => (
              <linearGradient key={id} id={`barGrad${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={[LOW_C, MED_C, HIGH_C, CRIT_C][i]} stopOpacity={0.5} />
                <stop offset="100%" stopColor={[LOW_C, MED_C, HIGH_C, CRIT_C][i]} stopOpacity={0.08} />
              </linearGradient>
            ))}
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MED_C} stopOpacity={0.2} />
              <stop offset="100%" stopColor={MED_C} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.04)" />
          <XAxis dataKey="range" tick={{ fill: SILVER, fontSize: 9 }} axisLine={false} tickLine={false}
            label={{ value: 'Risk Score', position: 'insideBottom', offset: -5, fill: SILVER, fontSize: 8 }} />
          <YAxis tick={{ fill: SILVER, fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ScoreTooltip />} />
          {/* Reference line for average */}
          {avgScore > 0 && (
            <ReferenceLine x={avgScore} stroke={MED_C} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: `Avg ${avgScore}`, fill: MED_C, fontSize: 8, position: 'top' }} />
          )}
          {/* Bars per score */}
          <Bar dataKey="count" name="Risks" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {bins.map((d, i) => (
              <Cell key={i} fill={`url(#barGrad${['Low','Med','High','Crit'][i]}`} stroke={d.color} strokeWidth={0.5} />
            ))}
          </Bar>
          {/* Area overlay */}
          <Area type="monotone" dataKey="count" stroke={GOLD} strokeWidth={1.5} fill="url(#scoreGrad)" dot={false} activeDot={{ r: 3, fill: GOLD, stroke: '#000', strokeWidth: 1.5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.15} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="#000" strokeWidth={2} />
      <text x={cx} y={cy - 18} textAnchor="middle" fill={fill} fontSize={10} fontWeight={700}>{payload.name}</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill={WHITE} fontSize={14} fontWeight={700}>{payload.value}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="rgba(206,212,218,0.4)" fontSize={8}>{(percent * 100).toFixed(1)}%</text>
    </g>
  )
}

function ScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 8, padding: '8px 12px', fontSize: 10 }}>
      <div style={{ fontWeight: 700, color: WHITE, marginBottom: 4 }}>Score <strong style={{ color: '#d4a832' }}>{d.range}</strong></div>
      <div style={{ color: SILVER }}>Count: <strong style={{ color: WHITE }}>{d.count}</strong></div>
      <div style={{ color: SILVER }}>Share: <strong style={{ color: d.color }}>{d.share}%</strong></div>
      <div style={{ color: SILVER, fontSize: 9, marginTop: 2 }}>Zone: <span style={{ color: d.color, fontWeight: 600 }}>{d.zone}</span></div>
    </div>
  )
}

export default function Dashboard({ auditorMode }) {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState(null)
  const [activeCat, setActiveCat] = useState(null)
  const [now, setNow] = useState(new Date())

  const scoreToLevel = (s) => s >= 15 ? 'Critical' : s >= 10 ? 'High' : s >= 5 ? 'Medium' : 'Low'

  const loadRisks = () => {
    fetch('/api/risks').then(r => r.json()).then(d => {
      setRisks((d.risks || []).map(r => ({ ...r, severity: scoreToLevel(r.overallScore || 0), inherentLevel: scoreToLevel(r.overallScore || 0) })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadRisks() }, [])

  useEffect(() => {
    const t = setInterval(() => { loadRisks(); setNow(new Date()) }, 15000)
    window.addEventListener('focus', loadRisks)
    window.addEventListener('risks-updated', loadRisks)
    return () => { clearInterval(t); window.removeEventListener('focus', loadRisks); window.removeEventListener('risks-updated', loadRisks) }
  }, [])

  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const stats = useMemo(() => {
    const total = risks.length
    const bySev = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    const byCat = {}
    const byTeam = {}
    const byTeamSev = {}
    let open = 0, closed = 0, totalScore = 0
    risks.forEach(r => {
      const sev = scoreToLevel(r.overallScore || 3)
      bySev[sev] = (bySev[sev] || 0) + 1
      const cat = r.riskCategory || 'Other'
      byCat[cat] = (byCat[cat] || 0) + 1
      const team = r.ownerTeam || 'Unknown'
      byTeam[team] = (byTeam[team] || 0) + 1
      if (!byTeamSev[team]) byTeamSev[team] = { Critical: 0, High: 0, Medium: 0, Low: 0 }
      byTeamSev[team][sev] = (byTeamSev[team][sev] || 0) + 1
      totalScore += r.overallScore || 3
      if (r.status === 'Open') open++
      else closed++
    })
    const heatRows = Array.from({ length: 5 }).map((_, row) =>
      Array.from({ length: 5 }).map((_, col) =>
        risks.filter(r => {
          const s = r.overallScore || 3
          const scoreRow = s <= 4 ? 1 : s <= 9 ? 2 : s <= 14 ? 3 : s <= 20 ? 4 : 5
          const likelihood = Math.min(Math.max(Math.round(r.likelihood || 3), 1), 5)
          return scoreRow === row + 1 && likelihood === col + 1
        }).length
      )
    )
    const topCritical = risks
      .map(r => ({ ...r, computedSev: scoreToLevel(r.overallScore || 3) }))
      .filter(r => r.computedSev === 'Critical' || r.computedSev === 'High')
      .slice(0, 5)
      .map(r => ({ riskId: r.riskId, title: r.riskTitle || r.riskDescription?.slice(0, 60) || '', category: r.riskCategory || '', severity: r.computedSev, score: r.overallScore || 0 }))
    return { total, bySev, byCat, byTeam, byTeamSev, open, closed, totalScore, avgScore: total ? (totalScore / total).toFixed(1) : '—', heatRows, topCritical }
  }, [risks])

  const CAT_COLORS = [
    '#20c997','#d4a832','#fd7e14','#dc3545','#e6b800','#c9a82e','#20c997','#fd7e14',
    '#d4a832','#dc3545','#20c997','#fd7e14','#d4a832','#dc3545','#20c997','#fd7e14',
    '#d4a832','#dc3545','#20c997','#fd7e14','#d4a832','#dc3545','#20c997','#fd7e14',
    '#d4a832','#dc3545',
  ]

  const catChart = useMemo(() => {
    const total = stats.total || 1
    return Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({
      name: name.length > 16 ? name.slice(0, 14) + '..' : name, value,
      color: CAT_COLORS[i % CAT_COLORS.length],
      pct: ((value / total) * 100).toFixed(1), total,
    }))
  }, [stats.byCat])

  const sevChart = useMemo(() =>
    SEV_ORDER.filter(s => (stats.bySev[s] || 0) > 0).map(s => ({
      name: s, value: stats.bySev[s] || 0, color: SEV_COLORS[s] || SILVER,
    })), [stats.bySev])

  const topTeamEntries = useMemo(() =>
    Object.entries(stats.byTeam).sort((a, b) => b[1] - a[1]), [stats.byTeam])

  const resolvedPct = stats.total ? Math.round((stats.closed / stats.total) * 100) : 0
  const criticalPct = stats.total ? Math.round((stats.bySev['Critical'] || 0) / stats.total * 100) : 0
  const highPct = stats.total ? Math.round((stats.bySev['High'] || 0) / stats.total * 100) : 0

  const getCellRisk = (row, col) => risks.filter(r => {
    const s = r.overallScore || 3
    const scoreRow = s <= 4 ? 1 : s <= 9 ? 2 : s <= 14 ? 3 : s <= 20 ? 4 : 5
    const lh = Math.min(Math.max(Math.round(r.likelihood || 3), 1), 5)
    return scoreRow === row + 1 && lh === col + 1
  })
  const filtered = selectedCell ? getCellRisk(selectedCell.row, selectedCell.col) : []

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

      {/* Header */}
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
                <span className="text-[8px]" style={{ color: 'rgba(206,212,218,0.40)' }}>|</span>
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
              <Eye size={11} className="inline mr-1" />Auditor Mode
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: EMERALD, boxShadow: '0 0 6px rgba(32,201,151,0.5)' }} />
            <span className="text-[10px]" style={{ color: SILVER }}>Live</span>
          </div>
        </div>
      </div>

      {/* Risk Metric Cards */}
      <div className="grid grid-cols-5 gap-3 animate-fade-in" style={{ animationDelay: '0.06s' }}>
        {[
          { label: 'Total Risks', value: stats.total, sub: `${stats.bySev['Critical'] || 0} Crit · ${stats.bySev['High'] || 0} High`, color: stats.bySev['Critical'] > 0 ? CRIMSON : GOLD },
          { label: 'Open', value: stats.open, sub: `${stats.closed} Resolved`, color: AMBER },
          { label: 'Resolution Rate', value: `${resolvedPct}%`, sub: `${stats.closed}/${stats.total} closed`, color: EMERALD },
          { label: 'Avg Score', value: stats.avgScore, sub: '/ 10', color: parseFloat(stats.avgScore) > 5 ? CRIMSON : parseFloat(stats.avgScore) > 3 ? AMBER : GOLD },
          { label: 'Departments', value: topTeamEntries.length, sub: `${Object.keys(stats.byTeam).length} total · ${Object.values(stats.byTeamSev).reduce((s, t) => s + t.Critical + t.High, 0)} Crit+High`, color: CRIMSON },
        ].map((k, i) => (
          <div key={i} className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5" style={{ background: BG, border: BORDER }}>
            <div className="text-2xl font-bold" style={{ color: WHITE }}>{k.value}</div>
            <div className="text-[10px] mt-0.5 font-semibold uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.55)' }}>{k.label}</div>
            {k.sub && <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color: k.color }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: k.color }} />{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-12 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>

        {/* Severity Bar Chart */}
        <div className="col-span-3 p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} style={{ color: GOLD }} />
              <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Severity</h3>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevChart} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: SILVER, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: SILVER, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]} barSize={28}>
                  {sevChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-3 mt-2 pt-2 flex-wrap" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
            {sevChart.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-[9px]">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span style={{ color: SILVER }}>{s.name}</span>
                <span className="font-mono" style={{ color: WHITE }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Score Distribution — Area Chart */}
        <div className="col-span-5 p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: GOLD }} />
            <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Score Distribution</h3>
            <span className="text-[9px] ml-auto" style={{ color: SILVER }}>{stats.total} risks · Score 1-25</span>
          </div>
          <ScoreDistChart risks={risks} />
          <div className="flex items-center justify-between text-[8px] mt-1 px-1">
            <span style={{ color: 'rgba(32,201,151,0.6)' }}>Low Risk</span>
            <span style={{ color: 'rgba(212,168,50,0.6)' }}>Medium</span>
            <span style={{ color: 'rgba(253,125,20,0.6)' }}>High</span>
            <span style={{ color: 'rgba(220,53,69,0.6)' }}>Critical</span>
          </div>
        </div>

        {/* Risk Categories */}
        <div className="col-span-4 p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} style={{ color: GOLD }} />
            <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Categories</h3>
            <span className="text-[9px] ml-auto" style={{ color: SILVER }}>{catChart.length} categories</span>
          </div>
          <div className="relative flex items-center justify-center mb-2">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={catChart} innerRadius={46} outerRadius={78} paddingAngle={2} dataKey="value" stroke="#000" strokeWidth={2}
                  activeIndex={activeCat} activeShape={renderActiveShape} onMouseEnter={(_, i) => setActiveCat(i)} onMouseLeave={() => setActiveCat(null)}>
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
            {catChart.slice(0, 7).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                <span className="text-[9px] truncate flex-1" style={{ color: activeCat === i ? GOLD : SILVER, fontWeight: activeCat === i ? 600 : 400 }}>{c.name}</span>
                <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div className="h-full rounded-full" style={{ width: c.pct + '%', background: c.color, transition: 'width 0.3s' }} />
                </div>
                <span className="text-[9px] font-mono" style={{ color: WHITE, minWidth: 28, textAlign: 'right' }}>{c.value}</span>
                <span className="text-[8px] font-mono" style={{ color: 'rgba(206,212,218,0.55)', minWidth: 32, textAlign: 'right' }}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.14s' }}>

        {/* Heat Map */}
        <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: GOLD }} />
              <h3 className="text-sm font-semibold" style={{ color: WHITE }}>5×5 Risk Heat Map</h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.3)' }}>Impact × Likelihood</span>
              <div className="flex gap-[1px] ml-2">
                {['#20c997','#20c997','#20c997','#fd7e14','#fd7e14','#dc3545','#dc3545','#dc3545'].map((c, i) => (
                  <div key={i} className="w-2 h-2 rounded-sm" style={{ background: c, opacity: 0.2 + i * 0.09 }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-around" style={{ width: '72px', minWidth: '72px' }}>
              {IMPACT_LABELS.map((l, i) => (
                <div key={i} className="flex items-center justify-end h-11 pr-2">
                  <span className="text-[6px] font-bold uppercase tracking-widest leading-tight text-right"
                    style={{ color: ['#20c997','#fd7e14','#dc3545','#dc3545','#dc3545'][i] }}>{l}</span>
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-[2px]">
                {stats.heatRows.map((row, ri) =>
                  row.map((count, ci) => {
                    const s = getHeatStyle(count, ri, ci)
                    const sel = selectedCell?.row === ri && selectedCell?.col === ci
                    const zone = ['L','M','H','C','C+'][ri]
                    return (
                      <div key={`${ri}-${ci}`}
                        onClick={() => { if (count === 0) return; if (sel) setSelectedCell(null); else setSelectedCell({ row: ri, col: ci }) }}
                        className="aspect-square rounded-[5px] flex items-center justify-center text-[8px] font-bold transition-all duration-150 cursor-pointer"
                        style={{
                          background: sel ? 'linear-gradient(135deg, rgba(212,168,50,0.3), rgba(212,168,50,0.1))' : s.bg,
                          border: sel ? '1.5px solid #d4a832' : `1px solid ${s.border}`,
                          color: s.text,
                          boxShadow: sel ? '0 0 14px rgba(212,168,50,0.35)' : count > 0 ? `0 0 6px ${s.glow}` : 'none',
                          transform: sel ? 'scale(1.08)' : 'scale(1)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                        {count > 0 ? <><span className="relative z-10">{count}</span><span className="absolute bottom-0 right-0.5 text-[4px] opacity-30 font-mono" style={{ color: s.text }}>{zone}</span></> : <span style={{ color: 'rgba(206,212,218,0.03)' }}>·</span>}
                      </div>
                    )
                  })
                )}
              </div>
              <div className="flex mt-0.5">
                {LIKELIHOOD_LABELS.map((l, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[5px] uppercase tracking-widest" style={{ color: 'rgba(206,212,218,0.2)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {[
                  { bg: '#20c997', label: 'Low' },
                  { bg: '#fd7e14', label: 'Med' },
                  { bg: '#dc3545', label: 'High' },
                  { bg: '#dc3545', label: 'Crit' },
                ].map(({ bg: bgC, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: bgC }} />
                    <span className="text-[7px]" style={{ color: SILVER }}>{label}</span>
                  </div>
                ))}
              </div>
              {/* Color spectrum bar */}
              <div className="flex rounded-sm overflow-hidden" style={{ height: 6, width: 54 }}>
                {['#20c997','#20c997','#20c997','#fd7e14','#fd7e14','#dc3545','#dc3545','#dc3545'].map((c, i) => (
                  <div key={i} className="flex-1" style={{ background: c, opacity: 0.2 + i * 0.09 }} />
                ))}
              </div>
            </div>
            {selectedCell && (
              <div className="text-[7px]" style={{ color: GOLD }}>
                <Filter size={8} className="inline mr-1" />
                {IMPACT_LABELS[selectedCell.row]} / {LIKELIHOOD_LABELS[selectedCell.col]}
                <span className="ml-1" style={{ color: SILVER }}>({filtered.length})</span>
              </div>
            )}
          </div>
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

        {/* Critical & High Risks */}
        <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: CRIMSON }} />
              <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Critical & High Risks</h3>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: CRIMSON }}>
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
              {stats.topCritical.slice(0, 5).map((r, i) => (
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
            <span style={{ color: SILVER }}>Target: Crit {'<'}10% · High {'<'}20%</span>
            <span className="ml-auto font-mono" style={{ color: criticalPct > 10 ? CRIMSON : EMERALD }}>
              Crit: {criticalPct}%
            </span>
            <span className="font-mono" style={{ color: highPct > 20 ? AMBER : EMERALD }}>
              High: {highPct}%
            </span>
          </div>
        </div>

        {/* Departments */}
        <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: GOLD }} />
              <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Departments</h3>
            </div>
            <span className="text-[9px]" style={{ color: SILVER }}>{Object.keys(stats.byTeam).length} teams</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
            {topTeamEntries.map(([team, count]) => {
              const sev = stats.byTeamSev[team] || { Critical: 0, High: 0, Medium: 0, Low: 0 }
              const critHigh = sev.Critical + sev.High
              const critHighPct = count ? Math.round(critHigh / count * 100) : 0
              return (
                <div key={team} className="p-2 rounded-xl transition-all duration-150 hover:bg-white/[0.02]" style={{ border: '1px solid rgba(212,168,50,0.06)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: critHigh > 0 ? CRIMSON : EMERALD }} />
                    <span className="text-[10px] font-medium truncate flex-1" style={{ color: WHITE }}>{team}</span>
                    <span className="text-[9px] font-mono" style={{ color: SILVER }}>{count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {[
                        { key: 'Critical', color: CRIMSON },
                        { key: 'High', color: AMBER },
                        { key: 'Medium', color: GOLD },
                        { key: 'Low', color: EMERALD },
                      ].map(s => sev[s.key] > 0 ? (
                        <div key={s.key} style={{ width: `${(sev[s.key] / count) * 100}%`, background: s.key === 'Critical' ? '#dc3545' : s.key === 'High' ? '#fd7e14' : s.key === 'Medium' ? '#d4a832' : '#20c997', opacity: s.key === 'Critical' ? 0.85 : 0.5 }} />
                      ) : null)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {sev.Critical > 0 && <span className="text-[8px] font-bold" style={{ color: CRIMSON }}>{sev.Critical}C</span>}
                      {sev.High > 0 && <span className="text-[8px] font-bold" style={{ color: AMBER }}>{sev.High}H</span>}
                    </div>
                  </div>
                  {critHigh > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(220,53,69,0.08)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${critHighPct}%`, background: critHighPct > 50 ? CRIMSON : critHighPct > 25 ? AMBER : GOLD }} />
                      </div>
                      <span className="text-[7px] font-mono" style={{ color: critHighPct > 50 ? CRIMSON : critHighPct > 25 ? AMBER : 'rgba(206,212,218,0.4)' }}>{critHighPct}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212,168,50,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={12} style={{ color: CRIMSON }} />
              <span className="text-[10px] font-semibold" style={{ color: WHITE }}>Critical & High by Department</span>
            </div>
            <div className="flex items-center gap-2 text-[8px]">
              {[
                { label: 'Crit', color: CRIMSON },
                { label: 'High', color: AMBER },
                { label: 'Medium', color: GOLD },
                { label: 'Low', color: EMERALD },
              ].map(s => (
                <span key={s.label} style={{ color: s.color }}>
                  ■ {s.label}: {stats.bySev[s.label] || 0}
                </span>
              ))}
              <span className="ml-auto font-mono" style={{ color: CRIMSON }}>
                {(stats.bySev['Critical'] || 0) + (stats.bySev['High'] || 0)} high-severity
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[8px] px-1" style={{ color: 'rgba(206,212,218,0.2)' }}>
        <span>Data sourced from enterprise risk register · {stats.total} seeded risks</span>
        <span>Last refreshed: {dateStr} {timeStr} · {auditorMode ? 'Audit view' : 'Standard view'}</span>
      </div>

    </div>
  )
}
