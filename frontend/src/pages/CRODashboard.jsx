import { useState, useEffect, useMemo } from 'react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, BarChart, Bar
} from 'recharts'
import { AlertTriangle, Activity, Target, Filter } from 'lucide-react'

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
  const [selectedCell, setSelectedCell] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const riskRes = await fetch('/api/risks').then(r => r.json())
        setRisks(riskRes.risks || [])
      } catch {}
    }
    load()
  }, [])



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

  const sevDist = useMemo(() => {
    const distMap = {}
    risks.forEach(r => {
      const s = r.severity || 'Medium'
      distMap[s] = (distMap[s] || 0) + 1
    })
    return Object.entries(distMap).map(([k, v]) => ({ name: k, value: v, color: SEV_COLORS[k] || GOLD }))
  }, [risks])

  const filteredRisks = selectedCell ? getCellRisks(selectedCell.row, selectedCell.col) : []

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
          <p className="text-xs" style={{ color: GOLD }}>Risk Heat Map · Risk Profile</p>
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
                      <span className="text-[5px] uppercase tracking-widest" style={{ color: 'rgba(206,212,218,0.25)' }}>{l}</span>
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



        </div>

        <div className="col-span-4 space-y-5">





          {/* Risk Severity Mini Chart */}
          <div className="p-5 rounded-2xl" style={{ background: BG, border: BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: GOLD }} />
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Profile</h2>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sevDist} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: SILVER, fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: SILVER, fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} width={65} />
                  <Tooltip content={<TrendTip />} />
                  <Bar dataKey="value" name="Risks" radius={[0, 4, 4, 0]} barSize={18}>
                    {sevDist.map((e, i) => <Cell key={i} fill={e.color} />)}
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
