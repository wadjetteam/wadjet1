import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, Download, RefreshCw, Clock, CheckCircle, XCircle, TrendingUp, Users, Calendar, ChevronDown, ChevronUp, Printer } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CATEGORY_COLORS = {
  Cybersecurity: { bar: '#fd7e14', bg: 'rgba(253,126,20,0.08)', border: 'rgba(253,126,20,0.2)' },
  Compliance: { bar: '#20c997', bg: 'rgba(32,201,151,0.08)', border: 'rgba(32,201,151,0.2)' },
  'Information Security': { bar: '#339af0', bg: 'rgba(51,154,240,0.08)', border: 'rgba(51,154,240,0.2)' },
  'Third Party Risk': { bar: '#b197fc', bg: 'rgba(177,151,252,0.08)', border: 'rgba(177,151,252,0.2)' },
  Operational: { bar: '#f06595', bg: 'rgba(240,101,149,0.08)', border: 'rgba(240,101,149,0.2)' },
  Financial: { bar: '#d4a832', bg: 'rgba(212,168,50,0.08)', border: 'rgba(212,168,50,0.2)' },
  Reputational: { bar: '#868e96', bg: 'rgba(134,142,150,0.08)', border: 'rgba(134,142,150,0.2)' },
  Legal: { bar: '#e599f7', bg: 'rgba(229,153,247,0.08)', border: 'rgba(229,153,247,0.2)' },
  Strategic: { bar: '#ff922b', bg: 'rgba(255,146,43,0.08)', border: 'rgba(255,146,43,0.2)' },
}

function GaugeCard({ label, value, max, sub, color }) {
  const pct = Math.min(100, (value / max) * 100)
  const isDanger = pct >= 80
  const isWarning = pct >= 60 && pct < 80
  const gaugeColor = isDanger ? '#dc3545' : isWarning ? '#ffb068' : color

  return (
    <div className="pharaoh-card p-4 flex flex-col items-center text-center">
      <div className="relative w-20 h-20 mb-2">
        <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
          <circle cx="40" cy="40" r="32" fill="none" stroke={gaugeColor} strokeWidth="6"
            strokeDasharray={`${(pct / 100) * 201} 201`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease-in-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold font-mono" style={{ color: gaugeColor }}>{value}</span>
        </div>
      </div>
      <p className="text-[10px] text-pharaoh-400/70 font-medium">{label}</p>
      <p className="text-[9px] text-pharaoh-500/40 mt-0.5">{sub || `${Math.round(pct)}% of ${max}`}</p>
    </div>
  )
}

function ComplianceBar({ category, green, amber, red, total, outsidePct }) {
  const cc = CATEGORY_COLORS[category] || { bar: '#868e96', bg: 'rgba(134,142,150,0.08)', border: 'rgba(134,142,150,0.2)' }
  const gPct = total > 0 ? (green / total) * 100 : 0
  const aPct = total > 0 ? (amber / total) * 100 : 0
  const rPct = total > 0 ? (red / total) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: cc.bg, border: `1px solid ${cc.border}` }}>
      <div className="w-28 shrink-0">
        <p className="text-[10px] font-semibold text-pharaoh-200 truncate">{category}</p>
        <p className="text-[8px] text-pharaoh-500/40">{total} KRI{total !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 h-4 rounded-full bg-pharaoh-900/40 overflow-hidden flex">
        {gPct > 0 && <div style={{ width: `${gPct}%`, background: '#20c997', minWidth: gPct > 0 ? 4 : 0 }} title={`${green} Green`} />}
        {aPct > 0 && <div style={{ width: `${aPct}%`, background: '#ffb068', minWidth: aPct > 0 ? 4 : 0 }} title={`${amber} Amber`} />}
        {rPct > 0 && <div style={{ width: `${rPct}%`, background: '#dc3545', minWidth: rPct > 0 ? 4 : 0 }} title={`${red} Red`} />}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1 text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-[#20c997]" />{green}</span>
        <span className="flex items-center gap-1 text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-[#ffb068]" />{amber}</span>
        <span className="flex items-center gap-1 text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-[#dc3545]" />{red}</span>
      </div>
      <div className="w-16 text-right shrink-0">
        <span className="text-[10px] font-bold font-mono" style={{ color: outsidePct > 20 ? '#dc3545' : outsidePct > 10 ? '#ffb068' : '#20c997' }}>
          {outsidePct}%
        </span>
        <p className="text-[7px] text-pharaoh-500/40">outside</p>
      </div>
    </div>
  )
}

function OverdueTable({ tasks }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-1.5">
      {tasks.map(t => {
        const overdueDays = Math.round(t.overdueHours / 24)
        const isCritical = overdueDays > 30
        const isHigh = overdueDays > 14
        const isExpanded = expanded === t.taskId
        return (
          <div key={t.taskId} className="rounded-lg overflow-hidden"
            style={{ border: isCritical ? '1px solid rgba(220,53,69,0.25)' : '1px solid rgba(212,168,50,0.12)' }}>
            <div className="flex items-center px-3 py-2 cursor-pointer hover:bg-pharaoh-800/30 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : t.taskId)}
              style={{ background: isCritical ? 'rgba(220,53,69,0.04)' : 'rgba(212,168,50,0.03)' }}>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isCritical ? 'bg-[#dc3545] animate-pulse' : isHigh ? 'bg-[#ffb068]' : 'bg-[#d4a832]'}`} />
                <span className="text-[10px] font-mono text-pharaoh-400/70 w-20 shrink-0">{t.taskId.slice(-8)}</span>
                <p className="text-[11px] text-pharaoh-200 truncate">{t.title}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className={`text-[11px] font-bold font-mono ${isCritical ? 'text-[#dc3545]' : isHigh ? 'text-[#ffb068]' : 'text-pharaoh-400'}`}>
                  {overdueDays}d
                </span>
                <span className="text-[9px] text-pharaoh-500/40 w-20 truncate">{t.owner}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                  t.escalationLevel === 'Level2_CRO_CEO' ? 'bg-red-950/30 text-red-400 border border-red-500/20' :
                  t.escalationLevel === 'Level1_DeptHead' ? 'bg-amber-950/30 text-amber-400 border border-amber-500/20' :
                  'bg-pharaoh-800/30 text-pharaoh-400 border border-pharaoh-500/15'
                }`}>{t.escalationLevel === 'Level2_CRO_CEO' ? 'L2-CRO' : t.escalationLevel === 'Level1_DeptHead' ? 'L1-HOD' : 'L0-Owner'}</span>
                {isExpanded ? <ChevronUp size={12} className="text-pharaoh-500/40" /> : <ChevronDown size={12} className="text-pharaoh-500/40" />}
              </div>
            </div>
            {isExpanded && (
              <div className="px-3 py-2 border-t border-pharaoh-500/8 space-y-1.5 animate-fade-in"
                style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-pharaoh-500/40">Due by</span>
                  <span className="text-pharaoh-300 font-mono">{new Date(t.dueBy).toLocaleString('en-US')}</span>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-pharaoh-500/40">Overdue (hours)</span>
                  <span className="font-mono font-bold" style={{ color: isCritical ? '#dc3545' : '#ffb068' }}>{t.overdueHours}h</span>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-pharaoh-500/40">Status</span>
                  <span className="text-pharaoh-300">{t.status}</span>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-pharaoh-500/40">KRI Catalog ID</span>
                  <span className="text-pharaoh-300 font-mono">{t.kriCatalogId || '—'}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptyBreachState() {
  return (
    <div className="pharaoh-card p-10 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(32,201,151,0.08)', border: '2px solid rgba(32,201,151,0.2)' }}>
        <CheckCircle size={32} className="text-[#20c997]" />
      </div>
      <h3 className="text-base font-bold text-pharaoh-200 mb-1">Zero Overdue Breaches</h3>
      <p className="text-xs text-pharaoh-400/60 max-w-md mx-auto leading-relaxed">
        All remediation tasks are on schedule. This represents a major compliance milestone — 
        no breaches have exceeded their remediation deadline. 
        The bank's risk posture is within board-approved appetite limits.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-pharaoh-500/40">
        <TrendingUp size={12} className="text-[#20c997]" />
        <span>Full regulatory compliance maintained</span>
      </div>
    </div>
  )
}

export default function RegulatoryReporting() {
  const reportRef = useRef(null)
  const [appetite, setAppetite] = useState(null)
  const [breaches, setBreaches] = useState(null)
  const [loading, setLoading] = useState(true)
  const [breachLoading, setBreachLoading] = useState(true)
  const [error, setError] = useState(null)
  const [breachError, setBreachError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setBreachLoading(true)
    setError(null)
    setBreachError(null)
    try {
      const [aRes, bRes] = await Promise.all([
        fetch('/api/regulatory/appetite-compliance'),
        fetch('/api/regulatory/overdue-breaches'),
      ])
      if (!aRes.ok) throw new Error('Failed to load appetite report')
      const aData = await aRes.json()
      setAppetite(aData)
      setLoading(false)
      if (!bRes.ok) throw new Error('Failed to load breaches')
      const bData = await bRes.json()
      setBreaches(bData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setBreachLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 14

    doc.setFontSize(16)
    doc.text('Regulatory Reporting Dashboard', margin, 20)
    doc.setFontSize(9)
    doc.text(`WADJET GRC — CBE Compliance Report · ${new Date().toLocaleDateString('en-GB')}`, margin, 26)
    doc.setFontSize(8)
    doc.text('CONFIDENTIAL — For internal regulatory use only — Unauthorised disclosure is prohibited', margin, 31)

    if (appetite) {
      doc.setFontSize(11)
      doc.text('Risk Appetite Compliance', margin, 40)
      autoTable(doc, {
        startY: 43,
        head: [['Category', 'Total KRIs', 'Green', 'Amber', 'Red', 'Outside Appetite %']],
        body: appetite.byCategory.map(c => [c.riskCategory, c.totalKris, c.greenCount, c.amberCount, c.redCount, `${c.outsideAppetitePercent}%`]),
        foot: [['Overall', appetite.totalKris, '', '', '', `${100 - appetite.overallComplianceRate}% outside`]],
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [7, 15, 26] },
      })
    }

    if (breaches && breaches.tasks.length > 0) {
      const y = doc.lastAutoTable?.finalY || 43
      doc.setFontSize(11)
      doc.text('Overdue Breach Tasks', margin, y + 10)
      autoTable(doc, {
        startY: y + 13,
        head: [['Task ID', 'Title', 'Owner', 'Overdue (h)', 'Escalation', 'Status']],
        body: breaches.tasks.map(t => [t.taskId.slice(-8), t.title, t.owner, `${t.overdueHours}`, t.escalationLevel, t.status]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [7, 15, 26] },
      })
    } else if (breaches) {
      const y = doc.lastAutoTable?.finalY || 43
      doc.setFontSize(10)
      doc.text('✓ Zero overdue breaches — Full compliance maintained', margin, y + 10)
    }

    doc.save(`CBE-Regulatory-Report-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const overallPct = appetite ? appetite.overallComplianceRate : 0
  const outsidePct = appetite ? Math.round((100 - overallPct) * 100) / 100 : 0
  const complianceColor = overallPct >= 95 ? '#20c997' : overallPct >= 85 ? '#ffb068' : '#dc3545'

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin" ref={reportRef}>
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(32,201,151,0.08)', border: '1px solid rgba(32,201,151,0.15)' }}>
            <TrendingUp size={16} style={{ color: '#20c997' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>Regulatory Reporting Dashboard</h1>
            <p className="text-xs text-pharaoh-400/60 mt-0.5">CBE Risk Appetite Compliance & Overdue Breach Summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 text-xs font-medium hover:bg-pharaoh-500/15 transition-all">
            <Download size={12} /> Export PDF
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 text-xs font-medium hover:bg-pharaoh-500/15 transition-all">
            <Printer size={12} /> Print
          </button>
          <button onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pharaoh-500/20 text-pharaoh-400 text-xs font-medium hover:border-pharaoh-500/40 transition-all"
            disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Executive Metrics — Risk Appetite */}
      <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-pharaoh-500/50" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-pharaoh-500/50">Risk Appetite Compliance</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pharaoh-card p-4 space-y-3 animate-pulse">
                <div className="w-20 h-20 mx-auto rounded-full bg-pharaoh-800/40" />
                <div className="h-2 w-2/3 mx-auto rounded bg-pharaoh-800/30" />
                <div className="h-2 w-1/2 mx-auto rounded bg-pharaoh-800/20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="pharaoh-card p-6 text-center">
            <AlertTriangle size={20} className="mx-auto text-egyptian-red mb-2" />
            <p className="text-sm text-egyptian-red/80">{error}</p>
            <button onClick={fetchData} className="mt-2 text-[10px] text-pharaoh-400 underline">Retry</button>
          </div>
        ) : appetite ? (
          <>
            {/* Metric Gauges */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <GaugeCard label="Overall Compliance" value={overallPct} max={100} sub={`${overallPct}% compliant`} color="#20c997" />
              <GaugeCard label="Total KRIs Tracked" value={appetite.totalKris} max={Math.max(appetite.totalKris, 1)} sub="Active indicators" color="#339af0" />
              <GaugeCard label="Outside Appetite" value={outsidePct} max={100} sub={`${outsidePct}% breached`} color="#dc3545" />
              <GaugeCard label="Categories" value={appetite.byCategory.length} max={Math.max(appetite.byCategory.length, 1)} sub="Risk categories" color="#b197fc" />
            </div>

            {/* Category Compliance Bars */}
            <div className="space-y-1.5">
              {appetite.byCategory.map(c => (
                <ComplianceBar key={c.riskCategory} {...c} />
              ))}
            </div>

            {/* Summary row */}
            <div className="mt-3 pharaoh-card px-4 py-3 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-4">
                <span className="text-pharaoh-500/40">Report generated</span>
                <span className="text-pharaoh-300 font-mono">{new Date(appetite.reportDate).toLocaleString('en-GB')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pharaoh-500/40">Board-approved appetite target:</span>
                <span className="font-bold font-mono" style={{ color: complianceColor }}>{overallPct}%</span>
                <span className="text-pharaoh-500/40">/ 95%</span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Auditor's Hitlist — Overdue Breaches */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-pharaoh-500/50" />
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-pharaoh-500/50">Auditor's Hitlist — Overdue Breaches</h2>
          </div>
          {breaches && !breachLoading && (
            <div className="flex items-center gap-3 text-[10px]">
              {breaches.level1Escalated > 0 && (
                <span className="flex items-center gap-1 text-amber-400/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> L1: {breaches.level1Escalated}
                </span>
              )}
              {breaches.level2Escalated > 0 && (
                <span className="flex items-center gap-1 text-red-400/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> L2: {breaches.level2Escalated}
                </span>
              )}
              <span className="text-pharaoh-500/40">Total: {breaches.totalOverdueTasks}</span>
            </div>
          )}
        </div>

        {breachLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pharaoh-card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-pharaoh-800/40" />
                  <div className="h-3 w-1/3 rounded bg-pharaoh-800/30" />
                  <div className="flex-1" />
                  <div className="h-3 w-12 rounded bg-pharaoh-800/30" />
                </div>
              </div>
            ))}
          </div>
        ) : breachError ? (
          <div className="pharaoh-card p-6 text-center">
            <AlertTriangle size={20} className="mx-auto text-egyptian-red mb-2" />
            <p className="text-sm text-egyptian-red/80">{breachError}</p>
          </div>
        ) : breaches && breaches.tasks.length === 0 ? (
          <EmptyBreachState />
        ) : breaches ? (
          <OverdueTable tasks={breaches.tasks} />
        ) : null}
      </div>

      <div className="ankh-divider" />

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .pharaoh-card { border: 1px solid #ddd !important; background: white !important; box-shadow: none !important; }
          button, .ankh-divider, [class*="scrollbar"] { display: none !important; }
          .h-full { overflow: visible !important; height: auto !important; }
          .fixed, .z-50 { display: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  )
}
