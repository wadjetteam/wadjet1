import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart, Pie, Legend } from 'recharts'
import { Database, AlertTriangle, TrendingUp, Plus, Filter, Eye, X, Download } from 'lucide-react'
import { downloadLossEventCSV, downloadLossEventPDF } from '../lib/downloadUtils'

const lossCategories = [
  { id: 'EF', name: 'External Fraud', color: '#c41e3a' },
  { id: 'IF', name: 'Internal Fraud', color: '#b8860b' },
  { id: 'EPWS', name: 'Employment Practices', color: '#d4af37' },
  { id: 'CPBP', name: 'Clients, Products & Business Practices', color: '#4f7da6' },
  { id: 'DPA', name: 'Damage to Physical Assets', color: '#2d7d46' },
  { id: 'BDSF', name: 'Business Disruption & System Failures', color: '#7a9fbf' },
  { id: 'EDPM', name: 'Execution, Delivery & Process Mgmt', color: '#c9a82e' },
]

const lossEvents = [
  { id: 'LOS-2026-041', date: '2026-05-28', category: 'EF', title: 'Phishing Attack — Branch Staff Credentials Compromised', amount: 2850000, recovered: 0, status: 'open', severity: 'critical', businessLine: 'Retail Banking', rootCause: 'Lack of MFA on branch workstations', nearMiss: false },
  { id: 'LOS-2026-038', date: '2026-05-14', category: 'EDPM', title: 'SWIFT Payment Misdirection — Processing Error', amount: 1200000, recovered: 1200000, status: 'closed', severity: 'high', businessLine: 'Corporate Banking', rootCause: 'Manual entry without dual-control', nearMiss: false },
  { id: 'LOS-2026-035', date: '2026-04-30', category: 'CPBP', title: 'Customer Data Privacy Breach — Legacy System', amount: 650000, recovered: 0, status: 'investigating', severity: 'high', businessLine: 'Digital Banking', rootCause: 'Unpatched middleware exposing PII', nearMiss: false },
  { id: 'LOS-2026-032', date: '2026-04-18', category: 'BDSF', title: 'Core Banking System Outage — 4.5 Hours', amount: 980000, recovered: 0, status: 'closed', severity: 'high', businessLine: 'Operations', rootCause: 'Vendor patch failure on primary cluster', nearMiss: false },
  { id: 'LOS-2026-029', date: '2026-04-02', category: 'IF', title: 'Unauthorized Transaction — Teller Fraud', amount: 340000, recovered: 280000, status: 'closed', severity: 'medium', businessLine: 'Retail Banking', rootCause: 'Insufficient transaction monitoring thresholds', nearMiss: false },
  { id: 'NM-2026-012', date: '2026-05-05', category: 'EF', title: 'Near Miss: Attempted ATM Skimming — Prevented', amount: 0, recovered: 0, status: 'closed', severity: 'medium', businessLine: 'Retail Banking', rootCause: 'Physical security patrol detected device', nearMiss: true },
  { id: 'NM-2026-010', date: '2026-04-22', category: 'BDSF', title: 'Near Miss: DR Failover Test — Partial Failure', amount: 0, recovered: 0, status: 'closed', severity: 'high', businessLine: 'IT Operations', rootCause: 'Configuration drift in secondary DC', nearMiss: true },
  { id: 'LOS-2026-025', date: '2026-03-28', category: 'EDPM', title: 'Trade Booking Error — Fixed Income Desk', amount: 420000, recovered: 420000, status: 'closed', severity: 'medium', businessLine: 'Treasury', rootCause: 'System reconciliation gap during migration', nearMiss: false },
]

const monthlyLoss = [
  { month: 'Jan', actual: 1.2, nearMiss: 3 },
  { month: 'Feb', actual: 0.8, nearMiss: 2 },
  { month: 'Mar', actual: 0.42, nearMiss: 1 },
  { month: 'Apr', actual: 1.97, nearMiss: 4 },
  { month: 'May', actual: 4.05, nearMiss: 2 },
]

const byCategory = lossCategories.map(cat => ({
  name: cat.name.split(' ')[0],
  fullName: cat.name,
  value: lossEvents.filter(e => e.category === cat.id && !e.nearMiss).reduce((s, e) => s + e.amount, 0) / 1000000,
  color: cat.color,
  count: lossEvents.filter(e => e.category === cat.id).length,
})).filter(c => c.value > 0)

const severityColors = { critical: '#c41e3a', high: '#b8860b', medium: '#d4af37', low: '#2d7d46' }
const statusColors = { open: '#c41e3a', investigating: '#b8860b', closed: '#2d7d46' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="pharaoh-card p-3 text-xs shadow-xl">
      <p className="text-pharaoh-300 font-semibold mb-1">{payload[0]?.payload?.fullName || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-pharaoh-400/70">{p.name}:</span>
          <span className="text-pharaoh-200 font-medium">{typeof p.value === 'number' ? `${p.value.toFixed(2)}M EGP` : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function LossEventDatabase() {
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [showNearMiss, setShowNearMiss] = useState(true)

  const totalLoss = lossEvents.filter(e => !e.nearMiss).reduce((s, e) => s + e.amount, 0)
  const recovered = lossEvents.reduce((s, e) => s + e.recovered, 0)
  const netLoss = totalLoss - recovered
  const openCount = lossEvents.filter(e => e.status === 'open').length

  const filtered = lossEvents.filter(e =>
    (filterCategory === 'all' || e.category === filterCategory) &&
    (filterSeverity === 'all' || e.severity === filterSeverity) &&
    (showNearMiss || !e.nearMiss)
  )

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-pharaoh-500" />
            <h1 className="page-title">Operational Loss Event Database</h1>
          </div>
          <p className="page-subtitle">Basel III Pillar 2 · 7 Basel II Event Categories · Near-Miss Tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadLossEventCSV(lossEvents)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green hover:border-egyptian-green/30 transition-all">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={() => downloadLossEventPDF(lossEvents)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300 transition-all">
            <Download size={12} /> Export PDF
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-105">
            <Plus size={15} /> Log Loss Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Gross Loss (YTD)', value: `EGP ${(totalLoss / 1000000).toFixed(2)}M`, color: '#c41e3a', sub: `${lossEvents.filter(e => !e.nearMiss).length} events` },
          { label: 'Net Loss (After Recovery)', value: `EGP ${(netLoss / 1000000).toFixed(2)}M`, color: '#b8860b', sub: `${((recovered / totalLoss) * 100).toFixed(0)}% recovery rate` },
          { label: 'Open Events', value: openCount, color: '#d4af37', sub: 'Awaiting closure' },
          { label: 'Near-Miss Events', value: lossEvents.filter(e => e.nearMiss).length, color: '#4f7da6', sub: 'YTD logged' },
        ].map(k => (
          <div key={k.label} className="pharaoh-card p-4">
            <p className="text-[10px] text-pharaoh-400/60 mb-1">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-pharaoh-400/50 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="pharaoh-card p-5">
          <h3 className="text-sm font-semibold text-pharaoh-300 mb-4">Monthly Loss Trend (EGP Millions)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyLoss}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actual" name="Gross Loss (M EGP)" fill="#c41e3a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pharaoh-card p-5">
          <h3 className="text-sm font-semibold text-pharaoh-300 mb-4">Loss by Basel Event Category (M EGP)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(212,175,55,0.6)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={13} className="text-pharaoh-400/50" />
        <div className="flex gap-1">
          {['all', ...lossCategories.map(c => c.id)].slice(0, 5).map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-all ${filterCategory === cat ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
              style={filterCategory !== cat ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'critical', 'high', 'medium'].map(s => (
            <button key={s} onClick={() => setFilterSeverity(s)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${filterSeverity === s ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
              style={filterSeverity !== s ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNearMiss(p => !p)}
          className={`text-[10px] px-2 py-1 rounded-lg transition-all ${showNearMiss ? 'bg-nile-700/50 text-pharaoh-300' : 'text-pharaoh-400/40'}`}
          style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
          Near-Miss: {showNearMiss ? 'Shown' : 'Hidden'}
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(event => {
          const cat = lossCategories.find(c => c.id === event.category)
          return (
            <div key={event.id} className="pharaoh-card p-4">
              <div className="flex items-start gap-4">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: cat?.color, minWidth: 3 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono text-pharaoh-400/50">{event.id}</span>
                    {event.nearMiss && <span className="text-[10px] px-1.5 py-0.5 rounded bg-nile-700/60 text-pharaoh-400/70 border border-pharaoh-500/15">Near-Miss</span>}
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${severityColors[event.severity]}18`, color: severityColors[event.severity] }}>{event.severity}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${cat?.color}18`, color: cat?.color }}>{cat?.name}</span>
                  </div>
                  <p className="text-sm font-semibold text-pharaoh-200">{event.title}</p>
                  <p className="text-[10px] text-pharaoh-400/50 mt-1">{event.date} · {event.businessLine} · Root cause: {event.rootCause}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  {!event.nearMiss && (
                    <div>
                      <p className="text-sm font-bold text-pharaoh-300">EGP {(event.amount / 1000000).toFixed(3)}M</p>
                      {event.recovered > 0 && <p className="text-[10px] text-green-400">+{((event.recovered / event.amount) * 100).toFixed(0)}% recovered</p>}
                    </div>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: `${statusColors[event.status]}18`, color: statusColors[event.status] }}>
                    {event.status}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="pharaoh-card w-full max-w-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>Log New Loss Event</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-pharaoh-400/60 hover:text-pharaoh-300" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Event Title', type: 'text', placeholder: 'Brief description of the loss event...' },
                { label: 'Date of Occurrence', type: 'date' },
                { label: 'Gross Loss Amount (EGP)', type: 'number', placeholder: '0.00' },
                { label: 'Business Line', type: 'text', placeholder: 'e.g. Retail Banking, Treasury...' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-pharaoh-300/70 mb-1 block">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none focus:ring-1 focus:ring-pharaoh-500/40"
                    style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }} />
                </div>
              ))}
              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Basel Event Category</label>
                <select className="w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none"
                  style={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  {lossCategories.map(c => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm text-pharaoh-400/60 hover:text-pharaoh-300 transition-all" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>Cancel</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold gold-gradient text-nile-900 shadow">Submit Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
