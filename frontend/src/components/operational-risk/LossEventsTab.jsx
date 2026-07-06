import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Database, Plus, Filter, X, Loader, CheckCircle, AlertCircle, ChevronDown, ChevronRight, FlaskConical, Link2 } from 'lucide-react'

async function safeFetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}${text ? ': ' + text.slice(0, 120) : ''}`)
  }
  return res.json()
}

const FALLBACK_CONFIG = { eventTypes: ['Internal Fraud', 'External Fraud', 'Employment Practices & Workplace Safety', 'Clients, Products & Business Practices', 'Damage to Physical Assets', 'Business Disruption & System Failures', 'Execution, Delivery & Process Management'], businessLines: ['Retail', 'Corporate', 'Treasury', 'SME', 'Wealth'], statuses: ['open', 'closed', 'remediated'] }

const ET_TO_CODE = {
  'Internal Fraud': 'IF', 'External Fraud': 'EF',
  'Employment Practices & Workplace Safety': 'EPWS',
  'Clients, Products & Business Practices': 'CPBP',
  'Damage to Physical Assets': 'DPA',
  'Business Disruption & System Failures': 'BDSF',
  'Execution, Delivery & Process Management': 'EDPM',
}

const PALETTE = ['#dc3545','#d4a832','#d4a832','#ced4da','#20c997','#d4a832','#d4a832','#fd7e14','#ced4da','#20c997']
const SEV_PALETTE = { critical: '#dc3545', high: '#d4a832', medium: '#d4a832', low: '#20c997' }
const STAT_PALETTE = { open: '#dc3545', remediated: '#20c997', closed: '#ced4da' }

function fmt(num) {
  if (num === undefined || num === null || isNaN(num)) return '0 EGP'
  return `${Number(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP`
}

function fmtM(num) {
  if (num === undefined || num === null || isNaN(num)) return '0 EGP'
  return `${Number(num / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M EGP`
}

function sanitize(str) {
  return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c] || c)
}

function SkeletonBar({ w }) { return <div className="h-3 rounded animate-pulse" style={{ width: w || '100%', background: 'rgba(212,168,50,0.08)' }} /> }

function MetricSkeleton() {
  return (
    <div className="pharaoh-card p-4 space-y-2">
      <SkeletonBar w="60%" /><SkeletonBar w="80%" /><SkeletonBar w="40%" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="pharaoh-card p-5 space-y-4">
      <SkeletonBar w="40%" />
      <div className="flex items-end gap-2 h-[180px] pt-4">
        {[75, 45, 90, 30, 60, 85, 40, 70].map((h, i) => (
          <div key={i} className="flex-1 rounded-t animate-pulse" style={{ height: `${h}%`, background: 'rgba(212,168,50,0.06)' }} />
        ))}
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="pharaoh-card p-5 space-y-3">
      <div className="flex gap-4 pb-2" style={{ borderBottom: '1px solid rgba(212,168,50,0.08)' }}>
        {[12, 30, 10, 14, 12, 14, 10].map((w, i) => <SkeletonBar key={i} w={`${w}%`} />)}
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4">
          {[12, 30, 10, 14, 12, 14, 10].map((w, j) => <SkeletonBar key={j} w={`${w}%`} />)}
        </div>
      ))}
    </div>
  )
}

function EmptyLedger() {
  return (
    <div className="pharaoh-card p-12 text-center">
      <Database size={36} className="mx-auto mb-4 text-pharaoh-500/20" />
      <p className="text-sm font-semibold text-pharaoh-400/60 mb-1" style={{ fontFamily: "'Cairo', serif" }}>
        No operational loss events recorded
      </p>
      <p className="text-xs text-pharaoh-400/30 max-w-md mx-auto leading-relaxed">
        Banking ledger is fully secure and intact. All monitored business lines and Basel event categories are operating within normal thresholds. Log a new event to begin tracking.
      </p>
    </div>
  )
}

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

function CascadeMeta({ event }) {
  const hasAutoLink = event.autoLinkedRiskIds && event.autoLinkedRiskIds !== ''
  const linkedIds = hasAutoLink ? event.autoLinkedRiskIds.split(',').filter(Boolean) : []
  const hasRemediation = event.remediationTaskId && event.remediationTaskId !== ''
  const amount = event.grossLoss || event.amount || 0
  const belowThreshold = amount <= 500000

  return (
    <div className="grid grid-cols-2 gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(212,168,50,0.08)' }}>
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[9px] uppercase tracking-widest text-pharaoh-400/40 font-semibold">Risk Register (Auto-Linked)</p>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-400/80 border border-amber-500/20">Basel Taxonomy</span>
        </div>
        {hasAutoLink && linkedIds.length > 0 ? (
          <div className="space-y-1">
            {linkedIds.map((rid, i) => (
              <p key={i} className="text-xs text-pharaoh-300 font-mono">{rid}</p>
            ))}
            <p className="text-[10px] text-pharaoh-400/40">{linkedIds.length} risk{linkedIds.length > 1 ? 's' : ''} updated</p>
          </div>
        ) : (
          <p className="text-xs text-pharaoh-400/30 italic">No matching risks via taxonomy</p>
        )}
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-widest text-pharaoh-400/40 mb-1 font-semibold">Remediation Task</p>
        {hasRemediation ? (
          <p className="text-xs" style={{ color: '#d4a832' }}>
            <span className="font-mono">{event.remediationTaskId?.slice(0, 12)}...</span>
            <span className="ml-1">· Auto-triggered</span>
          </p>
        ) : belowThreshold ? (
          <p className="text-xs text-pharaoh-400/30 italic">N/A — Below Regulatory Threshold</p>
        ) : (
          <p className="text-xs text-pharaoh-400/30 italic">Not triggered</p>
        )}
      </div>
    </div>
  )
}

export default function LossEventsTab() {
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [lossCategories, setLossCategories] = useState([])
  const [lossEvents, setLossEvents] = useState([])
  const [monthlyLoss, setMonthlyLoss] = useState([])
  const [schemaConfig, setSchemaConfig] = useState(FALLBACK_CONFIG)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState({
    title: '', eventType: '', businessLine: '',
    grossLoss: '', netLoss: '', dateOccurred: '', dateDetected: '',
    status: '',
  })

  const toastTimer = useRef(null)
  const submitLock = useRef(false)

  const showToast = useCallback((type, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }, [])

  const silentRefresh = useCallback(() => {
    Promise.all([
      safeFetchJson('/api/operational-loss/categories'),
      safeFetchJson('/api/operational-loss/events'),
      safeFetchJson('/api/operational-loss/monthly'),
    ]).then(([cats, events, monthly]) => {
      setLossCategories(cats.items || [])
      setLossEvents(events.items || [])
      setMonthlyLoss(monthly.items || [])
    }).catch(err => console.error('Silent refresh failed:', err))
  }, [])

  const loadData = useCallback(() => {
    setLoading(true)
    const cfg = FALLBACK_CONFIG
    Promise.all([
      safeFetchJson('/api/operational-loss/categories').catch(() => ({ items: [] })),
      safeFetchJson('/api/operational-loss/events').catch(() => ({ items: [] })),
      safeFetchJson('/api/operational-loss/monthly').catch(() => ({ items: [] })),
      safeFetchJson('/api/operational-loss/config').catch(() => cfg),
    ]).then(([cats, events, monthly, config]) => {
      const merged = { ...cfg, ...config }
      setLossCategories(cats.items || [])
      setLossEvents(events.items || [])
      setMonthlyLoss(monthly.items || [])
      setSchemaConfig(merged)
      const hasCats = cats.items?.length
      const hasConf = merged.eventTypes?.length
      setForm(f => ({
        ...f,
        eventType: f.eventType || (hasConf ? merged.eventTypes[0] : FALLBACK_CONFIG.eventTypes[0]),
        businessLine: f.businessLine || (hasConf ? merged.businessLines[0] : 'Retail'),
        status: f.status || (hasConf ? merged.statuses[0] : 'open'),
      }))
      if (!config.eventTypes) console.warn('Config endpoint returned incomplete data — using fallback defaults')
    }).catch(err => console.error('Failed to fetch loss data:', err))
    .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalGross = useMemo(() =>
    lossEvents.filter(e => !e.nearMiss).reduce((s, e) => s + (e.grossLoss || e.amount || 0), 0),
  [lossEvents])

  const totalNet = useMemo(() =>
    lossEvents.filter(e => !e.nearMiss).reduce((s, e) => s + ((e.netLoss ?? (e.amount - e.recovered)) || 0), 0),
  [lossEvents])

  const recoveryRate = useMemo(() => {
    if (!totalGross) return 0
    return ((totalGross - totalNet) / totalGross) * 100
  }, [totalGross, totalNet])

  const unresolvedCount = useMemo(() =>
    lossEvents.filter(e => e.status === 'open').length,
  [lossEvents])

  const byCategory = useMemo(() =>
    lossCategories.map((cat, i) => ({
      name: cat.name.split(' ')[0],
      fullName: cat.name,
      value: lossEvents.filter(e => e.category === cat.id && !e.nearMiss).reduce((s, e) => s + (e.grossLoss || e.amount || 0), 0) / 1000000,
      color: PALETTE[i % PALETTE.length],
      count: lossEvents.filter(e => e.category === cat.id).length,
    })).filter(c => c.value > 0),
  [lossCategories, lossEvents])

  const filtered = useMemo(() =>
    lossEvents.filter(e =>
      (filterCategory === 'all' || e.category === filterCategory) &&
      (filterSeverity === 'all' || e.severity === filterSeverity)
    ),
  [lossEvents, filterCategory, filterSeverity])

  const adjustForm = (field, value) => {
    setFieldErrors(f => { const n = { ...f }; delete n[field]; return n })
    setForm(f => ({ ...f, [field]: value }))
  }

  const validateForm = () => {
    const errs = {}
    const sanitizedTitle = sanitize(form.title.trim())
    if (!sanitizedTitle) errs.title = 'Event title is required'
    const gross = parseFloat(form.grossLoss)
    if (isNaN(gross) || gross <= 0) errs.grossLoss = 'Must be a positive number'
    if (gross < 0) errs.grossLoss = 'Negative values not allowed'
    const net = parseFloat(form.netLoss)
    if (isNaN(net) || net < 0) errs.netLoss = 'Must be zero or a positive number'
    if (net > gross) errs.netLoss = 'Net loss cannot exceed gross loss'
    if (!form.dateOccurred) errs.dateOccurred = 'Required'
    if (!form.dateDetected) errs.dateDetected = 'Required'
    setFieldErrors(errs)
    return { valid: Object.keys(errs).length === 0, sanitizedTitle, gross, net }
  }

  const handleSubmit = async () => {
    if (submitLock.current) return
    const { valid, sanitizedTitle, gross, net } = validateForm()
    if (!valid) return

    submitLock.current = true
    setSubmitting(true)
    const id = `LE-${Date.now().toString(36).toUpperCase()}-${String(lossEvents.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString().split('T')[0]

    try {
      const payload = {
        id, date: now,
        category: ET_TO_CODE[form.eventType] || form.eventType.slice(0, 4).toUpperCase(),
        title: sanitizedTitle,
        amount: gross,
        recovered: Math.max(0, gross - net),
        netLoss: net,
        status: form.status,
        severity: gross >= 1000000 ? 'critical' : gross >= 500000 ? 'high' : gross >= 100000 ? 'medium' : 'low',
        eventType: form.eventType,
        businessLine: form.businessLine,
        rootCause: 'Logged via Loss Events form',
        nearMiss: false,
        dateOccurred: form.dateOccurred,
        dateDetected: form.dateDetected,
        grossLoss: gross,
        riskId: '',
      }
      const res = await fetch('/api/operational-loss/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        showToast('error', `Submission failed (HTTP ${res.status}${text ? ': ' + text.slice(0, 80) : ''})`)
        return
      }
      let data
      try {
        data = await res.json()
      } catch {
        showToast('error', 'Server returned non-JSON response — possibly HTML error page')
        return
      }
      let msg = `Loss event ${id} saved successfully`
      if (data.cascades) {
        const parts = []
        if (data.cascades.autoLinkedCount > 0) parts.push(`${data.cascades.autoLinkedCount} risks auto-linked via taxonomy`)
        if (data.cascades.capitalDeducted) parts.push('Basel CAR adjusted')
        if (data.cascades.remediationCreated) parts.push('Urgent task triggered (> EGP 500K)')
        if (parts.length) msg += ` · ${parts.join(' · ')}`
      }
      showToast('success', msg)
      setShowForm(false)
      setFieldErrors({})
      setForm({
        title: '', eventType: schemaConfig.eventTypes[0] || '', businessLine: schemaConfig.businessLines[0] || '',
        grossLoss: '', netLoss: '', dateOccurred: '', dateDetected: '',
        status: schemaConfig.statuses[0] || '',
      })
      silentRefresh()
    } catch (err) {
      showToast('error', `Network error: ${err.message}`)
    } finally {
      setSubmitting(false)
      submitLock.current = false
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <div className="flex items-center justify-between">
          <div className="space-y-2"><SkeletonBar w="180px" /><SkeletonBar w="280px" /></div>
          <SkeletonBar w="140px" />
        </div>
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <MetricSkeleton key={i} />)}</div>
        <div className="grid grid-cols-2 gap-4"><ChartSkeleton /><ChartSkeleton /></div>
        <TableSkeleton />
      </div>
    )
  }

  const isEmpty = lossEvents.length === 0 && !loading

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in ${toast.type === 'success' ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30' : 'bg-red-900/80 text-red-300 border border-red-500/30'}`}
          style={{ backdropFilter: 'blur(8px)' }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-pharaoh-500" />
            <h1 className="page-title">Loss Events Database</h1>
          </div>
          <p className="page-subtitle">CBE-regulated · Basel III Pillar 1 OpRisk · Automated Taxonomy Cascade Engine</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-105">
          <Plus size={15} /> Log New Loss Event
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 animate-fade-in">
        <div className="pharaoh-card p-4">
          <p className="text-[10px] text-pharaoh-400/60 mb-1">Total Gross Losses</p>
          <p className="text-xl font-bold" style={{ color: '#dc3545' }}>{fmtM(totalGross)}</p>
          <p className="text-[10px] text-pharaoh-400/50 mt-1">{lossEvents.filter(e => !e.nearMiss).length} incidents logged</p>
        </div>
        <div className="pharaoh-card p-4">
          <p className="text-[10px] text-pharaoh-400/60 mb-1">Total Net Losses</p>
          <p className="text-xl font-bold" style={{ color: '#fd7e14' }}>{fmtM(totalNet)}</p>
          <p className="text-[10px] text-pharaoh-400/50 mt-1">Exposure affecting Basel CET1 Capital</p>
        </div>
        <div className="pharaoh-card p-4">
          <p className="text-[10px] text-pharaoh-400/60 mb-1">Insurance Recovery Rate</p>
          <p className="text-xl font-bold" style={{ color: recoveryRate >= 10 ? '#20c997' : '#d4a832' }}>{recoveryRate.toFixed(1)}%</p>
          <p className="text-[10px] text-pharaoh-400/50 mt-1">{fmt(totalGross - totalNet)} recovered via insurance</p>
        </div>
        <div className="pharaoh-card p-4">
          <p className="text-[10px] text-pharaoh-400/60 mb-1">Unresolved Incidents</p>
          <p className="text-xl font-bold" style={{ color: unresolvedCount > 0 ? '#dc3545' : '#20c997' }}>{unresolvedCount}</p>
          <p className="text-[10px] text-pharaoh-400/50 mt-1">{unresolvedCount > 0 ? 'Awaiting closure or remediation' : 'All incidents resolved'}</p>
        </div>
      </div>

      {isEmpty ? <EmptyLedger /> : (
        <>
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div className="pharaoh-card p-5">
              <h3 className="text-sm font-semibold text-pharaoh-300 mb-4">Monthly Exposure Trend (EGP Millions)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyLoss}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(212,168,50,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(212,168,50,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="actual" name="Gross Loss (M EGP)" stroke="#dc3545" strokeWidth={2} dot={{ fill: '#dc3545', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="pharaoh-card p-5">
              <h3 className="text-sm font-semibold text-pharaoh-300 mb-4">Loss Distribution by Basel Category (M EGP)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                    {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(212,168,50,0.6)' }} />
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
                  style={filterCategory !== cat ? { background: 'rgba(212,168,50,0.05)', border: '1px solid rgba(212,168,50,0.1)' } : {}}>
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {['all', 'critical', 'high', 'medium'].map(s => (
                <button key={s} onClick={() => setFilterSeverity(s)}
                  className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${filterSeverity === s ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
                  style={filterSeverity !== s ? { background: 'rgba(212,168,50,0.05)', border: '1px solid rgba(212,168,50,0.1)' } : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pharaoh-card overflow-hidden animate-fade-in">
            <div className="grid grid-cols-[100px_1fr_90px_100px_120px_110px_90px] gap-2 px-4 py-2.5 text-[9px] uppercase tracking-widest text-pharaoh-400/40 font-semibold"
              style={{ borderBottom: '1px solid rgba(212,168,50,0.08)' }}>
              <span>Event Code</span><span>Title</span><span>Basel Type</span><span>Business Line</span><span>Net Loss</span><span>Date Detected</span><span>Status</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(212,168,50,0.06)' }}>
              {filtered.map(event => {
                const cat = lossCategories.find(c => c.id === event.category)
                const catIdx = lossCategories.findIndex(c => c.id === event.category)
                const color = PALETTE[catIdx >= 0 ? catIdx % PALETTE.length : 0]
                const isExpanded = expandedRow === event.id
                const netVal = event.netLoss ?? (event.amount - event.recovered) ?? 0
                const hasAutoLink = event.autoLinkedRiskIds && event.autoLinkedRiskIds !== ''
                return (
                  <div key={event.id}>
                    <button onClick={() => setExpandedRow(isExpanded ? null : event.id)}
                      className="w-full grid grid-cols-[100px_1fr_90px_100px_120px_110px_90px] gap-2 px-4 py-3 items-center text-left hover:bg-white/[0.02] transition-colors">
                      <span className="text-[10px] font-mono text-pharaoh-500">{event.id}</span>
                      <span className="text-xs text-pharaoh-200 truncate pr-2 flex items-center gap-1">
                        {sanitize(event.title || '')}
                        {hasAutoLink && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded bg-amber-900/25 text-amber-400/70 border border-amber-500/15 flex-shrink-0">
                            <Link2 size={8} /> Auto-Linked
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-center" style={{ background: `${color}18`, color }}>{cat?.id || event.category}</span>
                      <span className="text-[10px] text-pharaoh-400/70">{event.businessLine || '—'}</span>
                      <span className="text-xs font-medium text-pharaoh-300">{fmt(netVal)}</span>
                      <span className="text-[10px] text-pharaoh-400/70">{event.dateDetected || event.date || '—'}</span>
                      <div className="flex items-center gap-1.5">
                        {event.status === 'open' ? (
                          <span className="relative flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: `${STAT_PALETTE.open}20`, color: STAT_PALETTE.open }}>
                            <span className="absolute w-1.5 h-1.5 rounded-full bg-[#dc3545] animate-ping opacity-75" />
                            <span className="relative">Open</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: `${STAT_PALETTE[event.status] || STAT_PALETTE.closed}18`, color: STAT_PALETTE[event.status] || STAT_PALETTE.closed }}>
                            {event.status === 'remediated' ? 'Remediated' : event.status}
                          </span>
                        )}
                        <div className="ml-auto">
                          {isExpanded ? <ChevronDown size={12} className="text-pharaoh-400/40" /> : <ChevronRight size={12} className="text-pharaoh-400/40" />}
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <CascadeMeta event={event} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {filtered.length === 0 && !isEmpty && (
              <div className="p-8 text-center text-pharaoh-400/30 text-xs">No loss events match the current filters</div>
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="pharaoh-card w-full max-w-xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>Log New Loss Event</h2>
                <p className="text-[10px] text-pharaoh-400/50">Basel category drives automated taxonomy matching</p>
              </div>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-pharaoh-400/60 hover:text-pharaoh-300" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Event Title *</label>
                <input type="text" value={form.title} onChange={e => adjustForm('title', e.target.value)}
                  placeholder="Brief description of the loss event..."
                  className={`w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none focus:ring-1 ${fieldErrors.title ? 'ring-1 ring-red-500/50' : 'focus:ring-pharaoh-500/40'}`}
                  style={{ background: 'rgba(212,168,50,0.05)', border: `1px solid ${fieldErrors.title ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,50,0.15)'}` }} />
                {fieldErrors.title && <p className="text-[10px] text-red-400 mt-1">{fieldErrors.title}</p>}
              </div>

              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Basel Event Category *</label>
                <select value={form.eventType} onChange={e => adjustForm('eventType', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none"
                  style={{ background: 'rgba(6,13,21,0.95)', border: '1px solid rgba(212,168,50,0.15)' }}>
                  {(schemaConfig?.eventTypes || FALLBACK_CONFIG.eventTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Business Line *</label>
                <select value={form.businessLine} onChange={e => adjustForm('businessLine', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none"
                  style={{ background: 'rgba(6,13,21,0.95)', border: '1px solid rgba(212,168,50,0.15)' }}>
                  {schemaConfig.businessLines.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Gross Loss Amount (EGP) *</label>
                <input type="number" value={form.grossLoss} onChange={e => adjustForm('grossLoss', e.target.value)}
                  placeholder="0.00" min="0" step="0.01"
                  className={`w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none focus:ring-1 ${fieldErrors.grossLoss ? 'ring-1 ring-red-500/50' : 'focus:ring-pharaoh-500/40'}`}
                  style={{ background: 'rgba(212,168,50,0.05)', border: `1px solid ${fieldErrors.grossLoss ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,50,0.15)'}` }} />
                {fieldErrors.grossLoss && <p className="text-[10px] text-red-400 mt-1">{fieldErrors.grossLoss}</p>}
              </div>

              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Net Loss (After Insurance) (EGP)</label>
                <input type="number" value={form.netLoss} onChange={e => adjustForm('netLoss', e.target.value)}
                  placeholder="0.00" min="0" step="0.01"
                  className={`w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none focus:ring-1 ${fieldErrors.netLoss ? 'ring-1 ring-red-500/50' : 'focus:ring-pharaoh-500/40'}`}
                  style={{ background: 'rgba(212,168,50,0.05)', border: `1px solid ${fieldErrors.netLoss ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,50,0.15)'}` }} />
                {fieldErrors.netLoss && <p className="text-[10px] text-red-400 mt-1">{fieldErrors.netLoss}</p>}
              </div>

              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Date of Occurrence *</label>
                <input type="date" value={form.dateOccurred} onChange={e => adjustForm('dateOccurred', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none focus:ring-1 ${fieldErrors.dateOccurred ? 'ring-1 ring-red-500/50' : 'focus:ring-pharaoh-500/40'}`}
                  style={{ background: 'rgba(212,168,50,0.05)', border: `1px solid ${fieldErrors.dateOccurred ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,50,0.15)'}` }} />
                {fieldErrors.dateOccurred && <p className="text-[10px] text-red-400 mt-1">{fieldErrors.dateOccurred}</p>}
              </div>

              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Date of Detection *</label>
                <input type="date" value={form.dateDetected} onChange={e => adjustForm('dateDetected', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none focus:ring-1 ${fieldErrors.dateDetected ? 'ring-1 ring-red-500/50' : 'focus:ring-pharaoh-500/40'}`}
                  style={{ background: 'rgba(212,168,50,0.05)', border: `1px solid ${fieldErrors.dateDetected ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,50,0.15)'}` }} />
                {fieldErrors.dateDetected && <p className="text-[10px] text-red-400 mt-1">{fieldErrors.dateDetected}</p>}
              </div>

              <div>
                <label className="text-xs text-pharaoh-300/70 mb-1 block">Status</label>
                <select value={form.status} onChange={e => adjustForm('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-pharaoh-200 outline-none"
                  style={{ background: 'rgba(6,13,21,0.95)', border: '1px solid rgba(212,168,50,0.15)' }}>
                  {schemaConfig.statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(212,168,50,0.04)', border: '1px solid rgba(212,168,50,0.1)' }}>
                  <FlaskConical size={14} className="text-pharaoh-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-pharaoh-400/50 leading-relaxed">
                    The selected <span className="text-pharaoh-300 font-semibold">Basel Event Category</span> drives automated Risk Register taxonomy matching, Basel CET1 Capital deduction, and remediation escalation for events &gt; EGP 500,000
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(212,168,50,0.1)' }}>
              <button onClick={() => { setShowForm(false); setFieldErrors({}) }} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm text-pharaoh-400/60 hover:text-pharaoh-300 transition-all disabled:opacity-50"
                style={{ border: '1px solid rgba(212,168,50,0.15)' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2">
                {submitting ? <><Loader size={14} className="animate-spin" /> Submitting...</> : 'Submit Event'}
              </button>
            </div>

            {submitting && (
              <div className="mt-3 text-[10px] text-pharaoh-400/40 text-center flex items-center justify-center gap-1.5">
                <Loader size={10} className="animate-spin" /> Cascading: Auto-match Risks → Basel CAR → Remediation Engine
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}