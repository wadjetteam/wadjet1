import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts'
import { BarChart3, Plus, Target, TrendingUp, TrendingDown, Activity, Eye, CheckCircle, AlertTriangle, Clock, ChevronDown, X, Download, Search, Filter, Save, Edit3, Trash2, RefreshCw } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

const STATUSES = ['Draft', 'Pending Review', 'Approved', 'Active', 'Archived']
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually']
const CALC_TYPES = ['Manual', 'Calculated', 'Integrated']
const CATEGORIES = ['Risk', 'Compliance', 'Audit', 'Cybersecurity', 'Operations', 'Governance']
const DEPARTMENTS = ['Internal Audit', 'Risk Management', 'Compliance', 'IT Security', 'Operations', 'Treasury']

function EmptyForm() {
  return {
    name: '', code: '', description: '', category: 'Compliance',
    businessUnit: '', department: 'Risk Management',
    ownerId: '', reviewerId: '',
    frequency: 'Monthly', calculationType: 'Manual',
    calculationFormula: '', apiEndpoint: '', apiJsonKey: '',
    targetValue: 95, warningThreshold: 85, criticalThreshold: 70,
  }
}

function GaugeChart({ value, target, warning, critical, size = 160 }) {
  const max = Math.max(target * 1.3, critical * 1.5, 100)
  const pct = Math.min(value / max, 1)
  const r = 60, cx = size / 2, cy = size / 2 + 8
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  let color = EMERALD
  if (critical != null && value >= critical) color = CRIMSON
  else if (warning != null && value >= warning) color = AMBER
  else color = EMERALD
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,168,50,0.06)" strokeWidth={8} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 10px ${color}50)`, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="text-center -mt-4">
        <div className="text-3xl font-bold" style={{ color: WHITE }}>{value}%</div>
        <div className="text-xs mt-1" style={{ color }}>Target: {target}%</div>
        {warning != null && <div className="text-[10px]" style={{ color: AMBER }}>Warning: {warning}%</div>}
        {critical != null && <div className="text-[10px]" style={{ color: CRIMSON }}>Critical: {critical}%</div>}
      </div>
    </div>
  )
}

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(2,2,4,0.97)', border: BORDER, borderRadius: 10, padding: '10px 14px', fontSize: 11 }}>
      <div style={{ color: WHITE, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: SILVER }}>{p.name}:</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

function KpiForm({ onSave, onCancel, initial }) {
  const [form, setForm] = useState(initial || EmptyForm())
  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const handleSubmit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>KPI Name *</label>
          <input value={form.name} onChange={e => handleChange('name', e.target.value)} required
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>KPI Code *</label>
          <input value={form.code} onChange={e => handleChange('code', e.target.value)} required
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium" style={{ color: GOLD }}>Description</label>
        <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2}
          className="w-full text-xs p-2.5 rounded-xl outline-none resize-none"
          style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Category</label>
          <select value={form.category} onChange={e => handleChange('category', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }}>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0a0a0a' }}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Department</label>
          <select value={form.department} onChange={e => handleChange('department', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }}>
            {DEPARTMENTS.map(d => <option key={d} value={d} style={{ background: '#0a0a0a' }}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Business Unit</label>
          <input value={form.businessUnit} onChange={e => handleChange('businessUnit', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Frequency</label>
          <select value={form.frequency} onChange={e => handleChange('frequency', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }}>
            {FREQUENCIES.map(f => <option key={f} value={f} style={{ background: '#0a0a0a' }}>{f}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Owner</label>
          <input value={form.ownerId} onChange={e => handleChange('ownerId', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Reviewer</label>
          <input value={form.reviewerId} onChange={e => handleChange('reviewerId', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
      </div>
      <div className="h-px" style={{ background: 'rgba(212,168,50,0.08)' }} />
      <div className="text-xs font-semibold" style={{ color: GOLD }}>Measurement Configuration</div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: SILVER }}>Target Value (%)</label>
          <input type="number" value={form.targetValue} onChange={e => handleChange('targetValue', Number(e.target.value))}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: AMBER }}>Warning Threshold (%)</label>
          <input type="number" value={form.warningThreshold} onChange={e => handleChange('warningThreshold', Number(e.target.value))}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: CRIMSON }}>Critical Threshold (%)</label>
          <input type="number" value={form.criticalThreshold} onChange={e => handleChange('criticalThreshold', Number(e.target.value))}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Calculation Method</label>
          <select value={form.calculationType} onChange={e => handleChange('calculationType', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }}>
            {CALC_TYPES.map(t => <option key={t} value={t} style={{ background: '#0a0a0a' }}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: GOLD }}>Data Source / Formula</label>
          <input value={form.calculationType === 'Calculated' ? form.calculationFormula : form.apiEndpoint}
            onChange={e => {
              if (form.calculationType === 'Calculated') handleChange('calculationFormula', e.target.value)
              else handleChange('apiEndpoint', e.target.value)
            }}
            placeholder={form.calculationType === 'Calculated' ? 'e.g., closed / total * 100' : 'e.g., https://api.bank.eg/...'}
            className="w-full text-xs p-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="text-xs px-4 py-2 rounded-lg" style={{ border: BORDER, color: SILVER }}>Cancel</button>
        <button type="submit"
          className="text-xs px-6 py-2 rounded-lg font-medium" style={{ background: GRADIENT, border: BORDER, color: GOLD }}>
          <Save size={12} className="inline mr-1" />Save KPI
        </button>
      </div>
    </form>
  )
}

export default function KpiDashboard() {
  const [kpis, setKpis] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedKpi, setSelectedKpi] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [relatedKris, setRelatedKris] = useState([])
  const [allKris, setAllKris] = useState([])

  const loadData = async () => {
    try {
      const [kpiRes, measRes, kriRes] = await Promise.all([
        fetch('/api/kpi-catalog'), fetch('/api/kpi-measurements'), fetch('/api/kri-catalog'),
      ])
      setKpis((await kpiRes.json()).items || [])
      setMeasurements((await measRes.json()).items || [])
      setAllKris((await kriRes.json()).items || [])
    } catch {}
    try {
      const mappings = JSON.parse(localStorage.getItem('wadjet-metric-mappings') || '[]')
      setRelatedKris(mappings)
    } catch {}
  }

  useEffect(() => { loadData() }, [])

  const latestMeasByKpi = useMemo(() => {
    const map = {}
    measurements.forEach(m => {
      const existing = map[m.catalogId]
      if (!existing || m.period > existing.period) map[m.catalogId] = m
    })
    return map
  }, [measurements])

  const kpiStatus = (kpi) => {
    const meas = latestMeasByKpi[kpi._id]
    if (!meas || meas.currentValue == null) return { label: 'No Data', color: SILVER }
    const v = meas.currentValue
    if (kpi.criticalThreshold != null && v <= kpi.criticalThreshold) return { label: 'Red', color: CRIMSON }
    if (kpi.warningThreshold != null && v <= kpi.warningThreshold) return { label: 'Amber', color: AMBER }
    return { label: 'Green', color: EMERALD }
  }

  const filteredKpis = kpis.filter(k => {
    if (searchTerm && !k.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !k.code?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterCategory !== 'All' && k.category !== filterCategory) return false
    return true
  })

  const kpiTrend = (kpiId) => {
    const meas = measurements.filter(m => m.catalogId === kpiId).sort((a, b) => a.period?.localeCompare(b.period))
    return meas.slice(-12).map((m, i) => ({
      period: m.period?.slice(-2) || `M${i + 1}`,
      value: m.currentValue ?? 0,
      target: kpis.find(k => k._id === kpiId)?.targetValue || 95,
    }))
  }

  const kpiSummary = useMemo(() => {
    let green = 0, amber = 0, red = 0, noData = 0
    kpis.forEach(k => {
      const s = kpiStatus(k)
      if (s.label === 'Green') green++
      else if (s.label === 'Amber') amber++
      else if (s.label === 'Red') red++
      else noData++
    })
    return { green, amber, red, noData, total: kpis.length }
  }, [kpis, measurements])

  const selectedKpiDetail = selectedKpi ? kpis.find(k => k._id === selectedKpi) : null

  const kriRelations = useMemo(() => {
    if (!selectedKpi) return []
    const kpi = kpis.find(k => k._id === selectedKpi)
    if (!kpi) return []
    const mappingIds = relatedKris.filter(m => m.metricType === 'KPI' && m.metricCatalogId === selectedKpi).map(m => m.metricCatalogId)
    return allKris.filter(kri => mappingIds.includes(kri._id) || kri.riskCategory === kpi.category)
  }, [selectedKpi, relatedKris, allKris, kpis])

  const handleCreateKpi = async (form) => {
    try {
      const res = await fetch('/api/kpi-catalog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setShowCreate(false); await loadData() }
    } catch {}
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
              <BarChart3 size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>KPI Intelligence Engine</h1>
          </div>
          <p className="text-xs" style={{ color: GOLD }}>KPI Catalog · Measurements · Trend Analysis · Alerts</p>
        </div>
        <button onClick={() => { setSelectedKpi(null); setShowCreate(true) }}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium"
          style={{ background: GRADIENT, border: BORDER, color: GOLD }}>
          <Plus size={14} /> Create KPI
        </button>
      </div>

      {selectedKpiDetail ? (
        <div className="space-y-5">
          <button onClick={() => setSelectedKpi(null)}
            className="text-xs flex items-center gap-1" style={{ color: GOLD }}>
            <ChevronDown size={12} className="rotate-90" /> Back to Library
          </button>
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-5 p-5 rounded-2xl" style={{ background: DARK_BG, border: BORDER }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: WHITE }}>{selectedKpiDetail.name}</h2>
              <GaugeChart
                value={latestMeasByKpi[selectedKpiDetail._id]?.currentValue ?? 0}
                target={selectedKpiDetail.targetValue}
                warning={selectedKpiDetail.warningThreshold}
                critical={selectedKpiDetail.criticalThreshold}
                size={180} />
              <div className="mt-4 space-y-2 text-xs">
                {[
                  { label: 'Current Value', value: `${latestMeasByKpi[selectedKpiDetail._id]?.currentValue ?? 'N/A'}%`, color: WHITE },
                  { label: 'Target Value', value: `${selectedKpiDetail.targetValue}%`, color: EMERALD },
                  { label: 'Warning Threshold', value: `${selectedKpiDetail.warningThreshold ?? 'N/A'}%`, color: AMBER },
                  { label: 'Critical Threshold', value: `${selectedKpiDetail.criticalThreshold ?? 'N/A'}%`, color: CRIMSON },
                  { label: 'Trend', value: latestMeasByKpi[selectedKpiDetail._id]?.trendDirection || 'Stable', color: GOLD },
                  { label: 'Owner', value: selectedKpiDetail.ownerId, color: SILVER },
                  { label: 'Last Update', value: latestMeasByKpi[selectedKpiDetail._id]?.period || 'N/A', color: SILVER },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between py-1" style={{ borderBottom: i < 6 ? '1px solid rgba(212,168,50,0.06)' : 'none' }}>
                    <span style={{ color: SILVER }}>{row.label}</span>
                    <span className="font-medium" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {latestMeasByKpi[selectedKpiDetail._id]?.comments && (
                <div className="mt-3 p-2 rounded-lg" style={{ background: 'rgba(212,168,50,0.04)' }}>
                  <div className="text-[10px]" style={{ color: SILVER }}>Comments:</div>
                  <div className="text-[11px]" style={{ color: WHITE }}>{latestMeasByKpi[selectedKpiDetail._id].comments}</div>
                </div>
              )}
            </div>
            <div className="col-span-7 space-y-5">
              <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: BORDER }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>12-Month Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpiTrend(selectedKpiDetail._id)} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.06)" />
                      <XAxis dataKey="period" tick={{ fill: SILVER, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: SILVER, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TrendTooltip />} />
                      <Area type="monotone" dataKey="value" name="KPI Value" stroke={GOLD} strokeWidth={2.5}
                        fill="url(#trendGrad)" dot={{ fill: GOLD, r: 3 }} activeDot={{ r: 5, fill: GOLD }} />
                      <Line type="monotone" dataKey="target" name="Target" stroke={EMERALD} strokeWidth={1.5}
                        strokeDasharray="6 3" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: BORDER }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} style={{ color: GOLD }} />
                  <h3 className="text-sm font-semibold" style={{ color: WHITE }}>Related KRIs</h3>
                </div>
                {kriRelations.length === 0 ? (
                  <p className="text-xs" style={{ color: SILVER }}>No KRIs linked to this KPI. Use Metric-Risk Mapper to associate.</p>
                ) : (
                  <div className="space-y-2">
                    {kriRelations.map(kri => (
                      <div key={kri._id} className="p-2.5 rounded-xl" style={{ background: 'rgba(212,168,50,0.03)', border: BORDER }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-medium" style={{ color: WHITE }}>{kri.code}</span>
                            <span className="text-[10px] ml-2" style={{ color: SILVER }}>{kri.name}</span>
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: CRIMSON }}>Threshold: {kri.redMin}–{kri.redMax}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : showCreate ? (
        <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: BORDER }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: WHITE }}>Create New KPI</h2>
          <KpiForm onSave={handleCreateKpi} onCancel={() => setShowCreate(false)} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
              <div className="text-xs" style={{ color: SILVER }}>Total KPIs</div>
              <div className="text-2xl font-bold mt-1" style={{ color: WHITE }}>{kpiSummary.total}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(32,201,151,0.06)', border: '1px solid rgba(32,201,151,0.15)' }}>
              <div className="text-xs" style={{ color: EMERALD }}>Green (On Target)</div>
              <div className="text-2xl font-bold mt-1" style={{ color: EMERALD }}>{kpiSummary.green}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(253,126,20,0.06)', border: '1px solid rgba(253,126,20,0.15)' }}>
              <div className="text-xs" style={{ color: AMBER }}>Amber (Warning)</div>
              <div className="text-2xl font-bold mt-1" style={{ color: AMBER }}>{kpiSummary.amber}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.15)' }}>
              <div className="text-xs" style={{ color: CRIMSON }}>Red (Critical)</div>
              <div className="text-2xl font-bold mt-1" style={{ color: CRIMSON }}>{kpiSummary.red}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
              <div className="text-xs" style={{ color: SILVER }}>No Data</div>
              <div className="text-2xl font-bold mt-1" style={{ color: SILVER }}>{kpiSummary.noData}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>KPI Library</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={11} style={{ color: SILVER, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                  <input placeholder="Search KPIs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-28 text-[11px] py-1.5 pl-6 pr-2 rounded-lg outline-none"
                    style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: WHITE }} />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                  className="text-[11px] py-1.5 px-2 rounded-lg outline-none"
                  style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: GOLD }}>
                  <option value="All" style={{ background: '#0a0a0a' }}>All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0a0a0a' }}>{c}</option>)}
                </select>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: BORDER }}>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: GOLD }}>Code</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: GOLD }}>Name</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: GOLD }}>Category</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: GOLD }}>Current</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: GOLD }}>Target</th>
                  <th className="text-center py-2 px-2 font-medium" style={{ color: GOLD }}>Status</th>
                  <th className="text-center py-2 px-2 font-medium" style={{ color: GOLD }}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {filteredKpis.map(k => {
                  const st = kpiStatus(k)
                  const meas = latestMeasByKpi[k._id]
                  return (
                    <tr key={k._id} onClick={() => setSelectedKpi(k._id)}
                      className="cursor-pointer hover:opacity-80" style={{ borderBottom: '1px solid rgba(212,168,50,0.06)' }}>
                      <td className="py-2.5 px-2 font-mono" style={{ color: GOLD }}>{k.code}</td>
                      <td className="py-2.5 px-2" style={{ color: WHITE }}>{k.name}</td>
                      <td className="py-2.5 px-2" style={{ color: SILVER }}>{k.category}</td>
                      <td className="py-2.5 px-2 text-right font-mono" style={{ color: meas?.currentValue != null ? WHITE : SILVER }}>
                        {meas?.currentValue != null ? `${meas.currentValue}%` : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono" style={{ color: EMERALD }}>{k.targetValue}%</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center" style={{ color: SILVER }}>{k.ownerId || '—'}</td>
                    </tr>
                  )
                })}
                {filteredKpis.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8" style={{ color: SILVER }}>No KPIs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
