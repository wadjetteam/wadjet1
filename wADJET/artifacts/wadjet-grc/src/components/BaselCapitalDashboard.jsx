import { useState, useEffect } from 'react'
import { downloadBaselPDF, downloadBaselCSV } from '../lib/downloadUtils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, Legend } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, BarChart2, Activity, Info, ChevronRight, Download } from 'lucide-react'

const statusColors = { strong: '#2d7d46', adequate: '#d4af37', review: '#b8860b', breach: '#c41e3a', low: '#4f7da6' }

function GaugeBar({ value, min, buffer, color, name }) {
  const max = Math.max(value * 1.2, min + buffer + 2)
  const pct = Math.min((value / max) * 100, 100)
  const minPct = (min / max) * 100
  const bufPct = ((min + buffer) / max) * 100
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-pharaoh-300/70">{name}</span>
        <span className="text-lg font-bold text-pharaoh-300">{value}%</span>
      </div>
      <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
        <div className="absolute inset-y-0 w-0.5 bg-red-400/60" style={{ left: `${minPct}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-amber-400/40" style={{ left: `${bufPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-pharaoh-400/50">
        <span>Min: {min}%</span>
        <span>Buffer: {buffer > 0 ? `+${buffer}%` : 'N/A'}</span>
        <span>Headroom: +{(value - min - buffer).toFixed(1)}%</span>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="pharaoh-card p-3 text-xs space-y-1 shadow-xl">
      <p className="text-pharaoh-300 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-pharaoh-400/70">{p.name}:</span>
          <span className="text-pharaoh-200 font-medium">{p.value}{typeof p.value === 'number' && p.value > 20 ? 'B EGP' : '%'}</span>
        </div>
      ))}
    </div>
  )
}

export default function BaselCapitalDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [capitalRatios, setCapitalRatios] = useState([])
  const [rwaTrend, setRwaTrend] = useState([])
  const [lcrnsfr, setLcrnsfr] = useState([])
  const [pillar2Items, setPillar2Items] = useState([])
  const [capitalTrend, setCapitalTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/capital/ratios').then(r => r.json()),
      fetch('/api/capital/rwa-trend').then(r => r.json()),
      fetch('/api/capital/liquidity').then(r => r.json()),
      fetch('/api/capital/pillar2').then(r => r.json()),
      fetch('/api/capital/trend').then(r => r.json()),
    ]).then(([ratios, rwa, liq, p2, trend]) => {
      setCapitalRatios(ratios.items || [])
      setRwaTrend(rwa.items || [])
      setLcrnsfr(liq.items || [])
      setPillar2Items(p2.items || [])
      setCapitalTrend(trend.items || [])
    }).catch(err => console.error('Failed to fetch capital data:', err))
    .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-egyptian-green/30 border-t-egyptian-green rounded-full animate-spin" />
          <p className="text-xs text-pharaoh-400/60">Loading capital data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-pharaoh-500" />
            <h1 className="page-title">Basel III/IV Capital Adequacy</h1>
          </div>
          <p className="page-subtitle">Pillar 1 · Pillar 2 · Pillar 3 · LCR/NSFR · RWA Monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadBaselCSV(capitalRatios, capitalTrend)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green hover:border-egyptian-green/30 transition-all">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={() => downloadBaselPDF(capitalRatios, capitalTrend)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300 transition-all">
            <Download size={12} /> Export PDF
          </button>
          <span className="text-[10px] px-2 py-1 rounded-md font-semibold" style={{ background: 'rgba(45,125,70,0.15)', border: '1px solid rgba(45,125,70,0.3)', color: '#2d7d46' }}>
            ICAAP Status: Adequate
          </span>
          <span className="text-[10px] px-2 py-1 rounded-md font-semibold" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
            CBE Reporting: Q2 2026
          </span>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
        {['overview', 'rwa', 'pillar2', 'liquidity'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all capitalize ${activeTab === t ? 'gold-gradient text-nile-900 shadow' : 'text-pharaoh-400/60 hover:text-pharaoh-300'}`}>
            {t === 'rwa' ? 'RWA Breakdown' : t === 'pillar2' ? 'Pillar 2 (ICAAP)' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            {capitalRatios.map((r) => (
              <div key={r.name} className="pharaoh-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-pharaoh-400/60 font-medium">{r.label}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${statusColors[r.status]}22`, border: `1px solid ${statusColors[r.status]}44`, color: statusColors[r.status] }}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
                <GaugeBar value={r.value} min={r.min} buffer={r.buffer} color={r.color} name={r.name} />
              </div>
            ))}
          </div>

          <div className="pharaoh-card p-5">
            <h3 className="text-sm font-semibold text-pharaoh-300 mb-4">Capital Ratio Trend — Last 6 Quarters</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={capitalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                <XAxis dataKey="q" tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[11, 18]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(212,175,55,0.6)' }} />
                <Line type="monotone" dataKey="cet1" name="CET1" stroke="#d4af37" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tier1" name="Tier 1" stroke="#c9a82e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total" name="Total Capital" stroke="#b8860b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'rwa' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total RWA', value: 'EGP 71.3B', sub: '+4.2% QoQ', color: '#d4af37' },
              { label: 'Credit RWA', value: 'EGP 47.3B', sub: '66.3% of Total', color: '#c9a82e' },
              { label: 'Op. Risk RWA', value: 'EGP 14.2B', sub: '19.9% of Total', color: '#b8860b' },
            ].map(k => (
              <div key={k.label} className="pharaoh-card p-4 text-center">
                <p className="text-xs text-pharaoh-400/60 mb-1">{k.label}</p>
                <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] text-pharaoh-400/50 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>
          <div className="pharaoh-card p-5">
            <h3 className="text-sm font-semibold text-pharaoh-300 mb-4">RWA by Risk Type — Quarterly Trend (EGP Billions)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={rwaTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                <XAxis dataKey="q" tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(212,175,55,0.6)' }} />
                <Bar dataKey="credit" name="Credit Risk" stackId="a" fill="#d4af37" radius={[0,0,0,0]} />
                <Bar dataKey="operational" name="Operational Risk" stackId="a" fill="#b8860b" />
                <Bar dataKey="market" name="Market Risk" stackId="a" fill="#4f7da6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'pillar2' && (
        <div className="space-y-4 animate-fade-in">
          <div className="pharaoh-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-pharaoh-300">Pillar 2 Capital Buffers (ICAAP Assessment)</h3>
              <span className="text-[10px] text-pharaoh-400/50">Last ICAAP: March 2026</span>
            </div>
            <div className="space-y-3">
              {pillar2Items.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <div className="w-1 h-10 rounded-full" style={{ background: statusColors[item.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-pharaoh-200">{item.name}</p>
                    <p className="text-[10px] text-pharaoh-400/50 mt-0.5">Last assessed: {item.last}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pharaoh-300">{item.buffer}%</p>
                    <p className="text-[10px] text-pharaoh-400/50">Add-on Buffer</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: `${statusColors[item.status]}22`, color: statusColors[item.status] }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <span className="text-xs text-pharaoh-300/70 font-medium">Total Pillar 2 Add-on Requirement</span>
              <span className="text-lg font-bold text-pharaoh-300">{pillar2Items.reduce((s, i) => s + i.buffer, 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'liquidity' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            {lcrnsfr.map(item => {
              const pct = Math.min((item.value / 200) * 100, 100)
              const minPct = (item.min / 200) * 100
              return (
                <div key={item.name} className="pharaoh-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-pharaoh-400/60">{item.name === 'LCR' ? 'Liquidity Coverage Ratio' : 'Net Stable Funding Ratio'}</p>
                      <p className="text-3xl font-bold text-pharaoh-300 mt-1">{item.value}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-pharaoh-400/50">Regulatory Min</p>
                      <p className="text-sm font-semibold text-pharaoh-400">{item.min}%</p>
                    </div>
                  </div>
                  <div className="relative h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${item.fill}66, ${item.fill})` }} />
                    <div className="absolute inset-y-0 w-0.5 bg-red-400/70" style={{ left: `${minPct}%` }} />
                  </div>
                  <p className="text-[10px] text-pharaoh-400/50 mt-2">Headroom above minimum: +{item.value - item.min}%</p>
                </div>
              )
            })}
          </div>
          <div className="pharaoh-card p-5">
            <h3 className="text-sm font-semibold text-pharaoh-300 mb-3">Liquidity Risk Indicators</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'HQLA Buffer', value: 'EGP 28.4B', trend: '+3.1%', up: true },
                { label: 'Net Cash Outflows (30d)', value: 'EGP 20.6B', trend: '-1.8%', up: false },
                { label: 'Loan-to-Deposit Ratio', value: '72.3%', trend: '-0.4%', up: false },
              ].map(k => (
                <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <p className="text-[10px] text-pharaoh-400/60 mb-1">{k.label}</p>
                  <p className="text-base font-bold text-pharaoh-200">{k.value}</p>
                  <p className={`text-[10px] mt-0.5 ${k.up ? 'text-green-400' : 'text-red-400'}`}>{k.trend} QoQ</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
