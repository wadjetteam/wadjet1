import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell, BarChart, Bar
} from 'recharts'
import { AlertTriangle, Activity, TrendingUp, Target, Shield, Filter, ChevronDown, BarChart3 } from 'lucide-react'

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

const HEAT_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Critical']
const SEV_COLORS = { Critical: CRIMSON, High: AMBER, Medium: GOLD, Low: EMERALD }

const HEAT_COLORS = [
  'rgba(32,201,151,0.30)', 'rgba(32,201,151,0.45)',
  'rgba(212,168,50,0.35)', 'rgba(212,168,50,0.50)',
  'rgba(253,126,20,0.40)', 'rgba(253,126,20,0.55)',
  'rgba(220,53,69,0.35)', 'rgba(220,53,69,0.50)', 'rgba(220,53,69,0.65)',
]

function heatColor(row, col, count) {
  if (count === 0) return 'rgba(255,255,255,0.03)'
  const idx = Math.min(row + col + Math.min(count - 1, 2), 8)
  return HEAT_COLORS[idx]
}

const TrendTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 10, padding: '10px 14px', fontSize: 11, backdropFilter: 'blur(12px)' }}>
      <div style={{ color: WHITE, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || GOLD }} />
          <span style={{ color: 'rgba(206,212,218,0.6)' }}>{p.name}:</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CRODashboard() {
  const [risks, setRisks] = useState([])
  const [kris, setKris] = useState([])
  const [kriMeasurements, setKriMeasurements] = useState([])
  const [trendData, setTrendData] = useState([])
  const [thresholds, setThresholds] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedKriId, setSelectedKriId] = useState('')
  const [showKriDropdown, setShowKriDropdown] = useState(false)
  const [appetiteCounts, setAppetiteCounts] = useState({ green: 0, amber: 0, red: 0 })
  const [kriScoreDist, setKriScoreDist] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [riskRes, kriRes, measRes] = await Promise.all([
          fetch('/api/risks').then(r => r.json()),
          fetch('/api/kri-catalog').then(r => r.json()),
          fetch('/api/kri-measurements').then(r => r.json()),
        ])
        const rData = riskRes.risks || []
        const kData = kriRes.items || []
        const mData = measRes.items || []
        setRisks(rData)
        setKris(kData)
        setKriMeasurements(mData)
        if (kData.length > 0) setSelectedKriId(kData[0]._id)
        let g = 0, a = 0, red = 0
        mData.forEach(m => {
          if (m.appetiteStatus === 'Green') g++
          else if (m.appetiteStatus === 'Red') red++
          else if (m.appetiteStatus === 'Amber') a++
        })
        setAppetiteCounts({ green: g, amber: a, red })
        const distMap = {}
        rData.forEach(r => {
          const s = r.severity || 'Medium'
          distMap[s] = (distMap[s] || 0) + 1
        })
        setKriScoreDist(Object.entries(distMap).map(([k, v]) => ({ name: k, value: v, color: SEV_COLORS[k] || GOLD })))
      } catch {}
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedKriId) return
    fetch(`/api/kri-measurements/trend/${selectedKriId}`)
      .then(r => r.json())
      .then(d => {
        setTrendData((d.measurements || []).slice(-12).map(m => ({
          period: m.period,
          value: m.currentValue ?? 0,
        })))
        setThresholds(d.thresholds)
      })
      .catch(() => {})
  }, [selectedKriId])

  const riskByCell = useMemo(() => {
    const map = {}
    risks.forEach(r => {
      const impact = Math.min(Math.max(Math.ceil((r.overallScore || 3) / 2), 1), 5)
      const likelihood = Math.min(Math.max(r.likelihood || 3, 1), 5)
      const key = `${impact - 1}-${likelihood - 1}`
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return map
  }, [risks])

  const getCellCount = (row, col) => (riskByCell[`${row}-${col}`] || []).length
  const getCellRisks = (row, col) => riskByCell[`${row}-${col}`] || []

  const filteredRisks = selectedCell ? getCellRisks(selectedCell.row, selectedCell.col) : []
  const selectedKri = kris.find(k => k._id === selectedKriId)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GRAD, border: BORDER }}>
              <Activity size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>CRO Dashboard</h1>
          </div>
          <p className="text-xs" style={{ color: GOLD }}>Risk Heat Map · KRI Trends · Appetite Status</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        <div className="col-span-8 space-y-5">

          {/* Heat Map */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={14} style={{ color: GOLD }} />
                <h2 className="text-sm font-semibold" style={{ color: WHITE }}>5×5 Risk Heat Map</h2>
              </div>
              <span className="text-[7px] uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.3)' }}>Impact × Likelihood</span>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col justify-around" style={{ width: '72px', minWidth: '72px' }}>
                {HEAT_LABELS.map((l, i) => (
                  <div key={i} className="flex items-center justify-end h-11 pr-2">
                    <span className="text-[6px] font-bold uppercase tracking-widest leading-tight text-right"
                      style={{ color: [EMERALD, GOLD, GOLD, AMBER, CRIMSON][i] || 'rgba(206,212,218,0.2)' }}>{l}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-[2px]">
                  {Array.from({ length: 5 }).map((_, row) =>
                    Array.from({ length: 5 }).map((_, col) => {
                      const count = getCellCount(row, col)
                      const sel = selectedCell?.row === row && selectedCell?.col === col
                      return (
                        <div key={`${row}-${col}`}
                          onClick={() => { if (count === 0) return; if (sel) setSelectedCell(null); else setSelectedCell({ row, col }) }}
                          className="aspect-square rounded-[5px] flex items-center justify-center text-[8px] font-bold transition-all duration-150 cursor-pointer"
                          style={{
                            background: sel ? 'rgba(212,168,50,0.18)' : heatColor(row, col, count),
                            border: sel ? '1.5px solid #d4a832' : `1px solid rgba(212,168,50,${count > 0 ? '0.15' : '0.05'})`,
                            color: count > 0 ? WHITE : 'rgba(206,212,218,0.03)',
                            boxShadow: sel ? '0 0 12px rgba(212,168,50,0.3)' : 'none',
                            transform: sel ? 'scale(1.08)' : 'scale(1)',
                          }}>
                          {count > 0 ? count : '·'}
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="flex mt-0.5">
                  {['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'].map((l, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[5px] uppercase tracking-widest" style={{ color: 'rgba(206,212,218,0.15)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {selectedCell && filteredRisks.length > 0 && (
              <div className="mt-2 p-3 rounded-xl" style={{ background: 'rgba(212,168,50,0.04)', border: BORDER }}>
                <div className="flex items-center gap-2 mb-2">
                  <Filter size={11} style={{ color: GOLD }} />
                  <span className="text-[10px] font-medium" style={{ color: GOLD }}>
                    {HEAT_LABELS[selectedCell.row]} Impact / {HEAT_LABELS[selectedCell.col]} Likelihood
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: SILVER }}>{filteredRisks.length} risks</span>
                </div>
                <div className="max-h-24 overflow-y-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr style={{ borderBottom: BORDER }}>
                        <th className="text-left py-1 px-1" style={{ color: SILVER }}>ID</th>
                        <th className="text-left py-1 px-1" style={{ color: SILVER }}>Title</th>
                        <th className="text-center py-1 px-1" style={{ color: SILVER }}>Sev</th>
                        <th className="text-center py-1 px-1" style={{ color: SILVER }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRisks.slice(0, 5).map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(212,168,50,0.04)' }}>
                          <td className="py-1 px-1 font-mono" style={{ color: GOLD }}>{r.riskId}</td>
                          <td className="py-1 px-1 truncate max-w-[120px]" style={{ color: WHITE }}>{r.riskTitle || '—'}</td>
                          <td className="py-1 px-1 text-center">
                            <span className="text-[8px] px-1 py-0.5 rounded font-medium"
                              style={{ background: `${SEV_COLORS[r.severity] || SILVER}20`, color: SEV_COLORS[r.severity] || SILVER }}>
                              {r.severity}
                            </span>
                          </td>
                          <td className="py-1 px-1 text-center font-mono" style={{ color: WHITE }}>{r.overallScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* KRI Trend */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: GOLD }} />
                <h2 className="text-sm font-semibold" style={{ color: WHITE }}>KRI Predictive Trend</h2>
              </div>
              <div className="relative">
                <button onClick={() => setShowKriDropdown(!showKriDropdown)}
                  className="flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-lg"
                  style={{ background: GRAD, border: BORDER, color: GOLD }}>
                  {selectedKri?.code || 'Select KRI'} <ChevronDown size={10} />
                </button>
                {showKriDropdown && (
                  <div className="absolute right-0 mt-1 w-64 rounded-xl z-20" style={{ background: '#0a0a0a', border: BORDER, maxHeight: '200px', overflowY: 'auto' }}>
                    {kris.map(k => (
                      <div key={k._id} onClick={() => { setSelectedKriId(k._id); setShowKriDropdown(false) }}
                        className="px-3 py-2 text-[11px] cursor-pointer hover:opacity-80"
                        style={{ color: selectedKriId === k._id ? GOLD : SILVER, borderBottom: '1px solid rgba(212,168,50,0.06)' }}>
                        {k.code} — {k.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="kriGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.05)" />
                  <XAxis dataKey="period" tick={{ fill: SILVER, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: SILVER, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TrendTip />} />
                  <Legend wrapperStyle={{ fontSize: 9, color: SILVER }} />
                  {thresholds?.amberMin != null && (
                    <ReferenceLine y={thresholds.amberMin} stroke={AMBER} strokeDasharray="6 3" strokeWidth={1.5}
                      label={{ value: 'Warning', fill: AMBER, fontSize: 9, position: 'right' }} />
                  )}
                  {thresholds?.redMin != null && (
                    <ReferenceLine y={thresholds.redMin} stroke={CRIMSON} strokeDasharray="6 3" strokeWidth={1.5}
                      label={{ value: 'Critical', fill: CRIMSON, fontSize: 9, position: 'right' }} />
                  )}
                  {thresholds?.greenMin != null && (
                    <ReferenceLine y={thresholds.greenMin} stroke={EMERALD} strokeDasharray="6 3" strokeWidth={1}
                      label={{ value: 'Target', fill: EMERALD, fontSize: 9, position: 'right' }} />
                  )}
                  <Line type="monotone" dataKey="value" name="KRI Value" stroke={GOLD} strokeWidth={2.5}
                    dot={{ fill: GOLD, r: 3 }} activeDot={{ r: 5, fill: GOLD, stroke: '#000', strokeWidth: 2 }}
                    fill="url(#kriGrad)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="col-span-4 space-y-5">

          {/* Appetite Status */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} style={{ color: GOLD }} />
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Appetite Status</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(32,201,151,0.06)', border: '1px solid rgba(32,201,151,0.15)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: EMERALD, boxShadow: '0 0 6px rgba(32,201,151,0.5)' }} />
                  <span className="text-[11px] font-medium" style={{ color: EMERALD }}>Within Appetite</span>
                  <span className="ml-auto text-lg font-bold" style={{ color: EMERALD }}>{appetiteCounts.green}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(253,126,20,0.06)', border: '1px solid rgba(253,126,20,0.15)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: AMBER, boxShadow: '0 0 6px rgba(253,126,20,0.5)' }} />
                  <span className="text-[11px] font-medium" style={{ color: AMBER }}>Tolerance</span>
                  <span className="ml-auto text-lg font-bold" style={{ color: AMBER }}>{appetiteCounts.amber}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.15)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CRIMSON, boxShadow: '0 0 6px rgba(220,53,69,0.5)' }} />
                  <span className="text-[11px] font-medium" style={{ color: CRIMSON }}>Breached</span>
                  <span className="ml-auto text-lg font-bold" style={{ color: CRIMSON }}>{appetiteCounts.red}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center text-[9px]" style={{ color: 'rgba(206,212,218,0.3)' }}>
              Based on {kriMeasurements.length} KRI measurements
            </div>
          </div>

          {/* KRI Details */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} style={{ color: GOLD }} />
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>KRI Details</h2>
            </div>
            {selectedKri ? (
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span style={{ color: SILVER }}>Code</span>
                  <span className="font-mono" style={{ color: GOLD }}>{selectedKri.code}</span>
                </div>
                <div className="h-px" style={{ background: 'rgba(212,168,50,0.06)' }} />
                <div className="flex justify-between">
                  <span style={{ color: SILVER }}>Name</span>
                  <span style={{ color: WHITE }}>{selectedKri.name}</span>
                </div>
                <div className="h-px" style={{ background: 'rgba(212,168,50,0.06)' }} />
                <div className="flex justify-between">
                  <span style={{ color: SILVER }}>Category</span>
                  <span style={{ color: WHITE }}>{selectedKri.riskCategory}</span>
                </div>
                <div className="h-px" style={{ background: 'rgba(212,168,50,0.06)' }} />
                <div className="flex justify-between">
                  <span style={{ color: SILVER }}>Frequency</span>
                  <span style={{ color: WHITE }}>{selectedKri.frequency}</span>
                </div>
                <div className="h-px" style={{ background: 'rgba(212,168,50,0.06)' }} />
                <div className="text-[11px] space-y-1.5 mt-2">
                  <div className="flex items-center gap-2" style={{ color: EMERALD }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: EMERALD }} />
                    Green: {selectedKri.greenMin ?? '∞'} — {selectedKri.greenMax ?? '∞'}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: AMBER }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: AMBER }} />
                    Amber: {selectedKri.amberMin ?? '∞'} — {selectedKri.amberMax ?? '∞'}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: CRIMSON }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: CRIMSON }} />
                    Red: {selectedKri.redMin ?? '∞'} — {selectedKri.redMax ?? '∞'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6" style={{ color: SILVER }}>
                <Shield size={24} className="mx-auto mb-2" />
                <p className="text-xs">Select a KRI</p>
              </div>
            )}
          </div>

          {/* Risk Severity Mini Chart */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: GOLD }} />
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Profile</h2>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kriScoreDist} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: SILVER, fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: SILVER, fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} width={65} />
                  <Tooltip content={<TrendTip />} />
                  <Bar dataKey="value" name="Risks" radius={[0, 4, 4, 0]} barSize={18}>
                    {kriScoreDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
