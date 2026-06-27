import { useState } from 'react'
import { Calendar, Clock, CheckCircle, AlertTriangle, FileText, Upload, ChevronRight, Bell, Filter, Download } from 'lucide-react'
import { downloadRegulatoryCalendarPDF, downloadRegulatoryCalendarCSV } from '../lib/downloadUtils'

const submissions = [
  { id: 'CBE-Q2-001', title: 'CBE Capital Adequacy Report (CAR)', framework: 'CBE Circular 7/2015', frequency: 'Quarterly', due: '2026-07-15', status: 'pending', priority: 'critical', owner: 'Ahmed Abdullah', evidence: 0, desc: 'Quarterly regulatory capital adequacy submission including CET1, Tier 1, Total Capital ratios and RWA breakdown.' },
  { id: 'CBE-Q2-002', title: 'Anti-Money Laundering Activity Report', framework: 'CBE AML Directive 2022', frequency: 'Quarterly', due: '2026-07-10', status: 'in-progress', priority: 'critical', owner: 'Mona A.', evidence: 3, desc: 'Quarterly AML activity report including STR count, KYC exceptions, and high-risk customer review outcomes.' },
  { id: 'CBE-Q2-003', title: 'Liquidity Coverage Ratio (LCR) Report', framework: 'Basel III / CBE', frequency: 'Monthly', due: '2026-06-30', status: 'submitted', priority: 'high', owner: 'Karim S.', evidence: 5, desc: 'Monthly LCR disclosure to CBE showing HQLA levels and 30-day stressed net cash outflows.' },
  { id: 'CBE-Q2-004', title: 'SWIFT CSP Attestation 2026', framework: 'SWIFT Customer Security Programme', frequency: 'Annual', due: '2026-09-30', status: 'pending', priority: 'high', owner: 'Nadia H.', evidence: 1, desc: 'Annual self-attestation against SWIFT CSP mandatory controls (v2026). All 23 mandatory controls must be confirmed.' },
  { id: 'CBE-Q2-005', title: 'Operational Risk Loss Data Report', framework: 'Basel III Pillar 2', frequency: 'Quarterly', due: '2026-07-20', status: 'pending', priority: 'medium', owner: 'Tamer K.', evidence: 0, desc: 'Quarterly submission of operational loss event data to CBE including root cause analysis for material losses.' },
  { id: 'CBE-Q2-006', title: 'ICAAP Annual Submission', framework: 'Basel III Pillar 2', frequency: 'Annual', due: '2026-12-31', status: 'not-started', priority: 'high', owner: 'Ahmed Abdullah', evidence: 0, desc: 'Annual Internal Capital Adequacy Assessment Process document submitted to CBE for supervisory review (SREP).' },
  { id: 'CBE-Q2-007', title: 'PCI DSS Annual Report on Compliance', framework: 'PCI DSS v4.0', frequency: 'Annual', due: '2026-08-15', status: 'in-progress', priority: 'high', owner: 'Laila M.', evidence: 7, desc: 'Annual ROC (Report on Compliance) or SAQ from QSA covering all 12 PCI DSS v4.0 requirements for card data environment.' },
  { id: 'CBE-Q2-008', title: 'Net Stable Funding Ratio (NSFR)', framework: 'Basel III / CBE', frequency: 'Quarterly', due: '2026-07-15', status: 'pending', priority: 'medium', owner: 'Karim S.', evidence: 2, desc: 'Quarterly NSFR calculation and CBE disclosure per Basel III liquidity standards.' },
  { id: 'CBE-Q2-009', title: 'Cybersecurity Maturity Assessment', framework: 'CBE Cybersecurity Framework 2021', frequency: 'Annual', due: '2026-10-31', status: 'not-started', priority: 'medium', owner: 'Nadia H.', evidence: 0, desc: 'Annual self-assessment and independent audit against CBE Cybersecurity Framework 5 domains.' },
  { id: 'CBE-Q2-010', title: 'Large Exposures Concentration Report', framework: 'CBE Circular 4/2019', frequency: 'Monthly', due: '2026-06-25', status: 'submitted', priority: 'medium', owner: 'Ahmed R.', evidence: 4, desc: 'Monthly report of exposures exceeding 10% of eligible capital to single counterparties or groups.' },
]

const statusConfig = {
  submitted:    { label: 'Submitted',    color: '#2d7d46', bg: 'rgba(45,125,70,0.12)',   icon: CheckCircle },
  'in-progress':{ label: 'In Progress', color: '#d4af37', bg: 'rgba(212,175,55,0.12)',  icon: Clock },
  pending:      { label: 'Pending',      color: '#b8860b', bg: 'rgba(184,134,11,0.12)',  icon: Clock },
  'not-started':{ label: 'Not Started', color: '#4f7da6', bg: 'rgba(79,125,166,0.12)',  icon: FileText },
  overdue:      { label: 'Overdue',      color: '#c41e3a', bg: 'rgba(196,30,58,0.12)',   icon: AlertTriangle },
}

const priorityColors = { critical: '#c41e3a', high: '#b8860b', medium: '#d4af37', low: '#2d7d46' }

function daysUntil(dateStr) {
  const today = new Date('2026-06-09')
  const due = new Date(dateStr)
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

export default function RegulatoryCalendar() {
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const filtered = submissions.filter(s =>
    (filterStatus === 'all' || s.status === filterStatus) &&
    (filterPriority === 'all' || s.priority === filterPriority)
  )

  const stats = {
    overdue: submissions.filter(s => daysUntil(s.due) < 0 && s.status !== 'submitted').length,
    due7: submissions.filter(s => daysUntil(s.due) >= 0 && daysUntil(s.due) <= 7 && s.status !== 'submitted').length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    pending: submissions.filter(s => s.status === 'pending' || s.status === 'not-started').length,
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-pharaoh-500" />
            <h1 className="page-title">CBE Regulatory Calendar</h1>
          </div>
          <p className="page-subtitle">Submission tracker · Evidence locker · Deadline monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadRegulatoryCalendarCSV(submissions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green hover:border-egyptian-green/30 transition-all">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={() => downloadRegulatoryCalendarPDF(submissions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300 transition-all">
            <Download size={12} /> Export PDF
          </button>
          <span className="text-[10px] px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
            Reporting Period: Q2 2026
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Overdue', value: stats.overdue, color: '#c41e3a', icon: AlertTriangle },
          { label: 'Due in 7 Days', value: stats.due7, color: '#b8860b', icon: Bell },
          { label: 'Submitted', value: stats.submitted, color: '#2d7d46', icon: CheckCircle },
          { label: 'Pending / Not Started', value: stats.pending, color: '#4f7da6', icon: Clock },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="pharaoh-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${k.color}18` }}>
                <Icon size={18} style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] text-pharaoh-400/60">{k.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter size={13} className="text-pharaoh-400/50" />
          <span className="text-xs text-pharaoh-400/50">Status:</span>
          {['all', 'submitted', 'in-progress', 'pending', 'not-started'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${filterStatus === s ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
              style={filterStatus !== s ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
              {s.replace('-', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-pharaoh-400/50">Priority:</span>
          {['all', 'critical', 'high', 'medium'].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${filterPriority === p ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
              style={filterPriority !== p ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(sub => {
          const days = daysUntil(sub.due)
          const isOverdue = days < 0 && sub.status !== 'submitted'
          const effectiveStatus = isOverdue ? 'overdue' : sub.status
          const cfg = statusConfig[effectiveStatus]
          const StatusIcon = cfg.icon
          const isExpanded = selected === sub.id
          return (
            <div key={sub.id} className="pharaoh-card overflow-hidden transition-all cursor-pointer" onClick={() => setSelected(isExpanded ? null : sub.id)}>
              <div className="p-4 flex items-center gap-4">
                <div className="w-1 self-stretch rounded-full" style={{ background: priorityColors[sub.priority], minWidth: 3 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-pharaoh-400/50">{sub.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${priorityColors[sub.priority]}15`, color: priorityColors[sub.priority] }}>
                      {sub.priority}
                    </span>
                    <span className="text-[10px] text-pharaoh-400/40">{sub.frequency}</span>
                  </div>
                  <p className="text-sm font-semibold text-pharaoh-200 truncate">{sub.title}</p>
                  <p className="text-[10px] text-pharaoh-400/50 mt-0.5">{sub.framework} · Owner: {sub.owner}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: isOverdue ? '#c41e3a' : days <= 7 ? '#b8860b' : '#d4af37' }}>
                      {isOverdue ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                    </p>
                    <p className="text-[10px] text-pharaoh-400/50">{sub.due}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: cfg.bg }}>
                    <StatusIcon size={12} style={{ color: cfg.color }} />
                    <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <ChevronRight size={14} className={`text-pharaoh-400/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {isExpanded && (
                <div className="px-6 pb-5 pt-0 border-t animate-fade-in" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                  <p className="text-xs text-pharaoh-300/70 mt-3 mb-4">{sub.desc}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <FileText size={12} className="text-pharaoh-400/50" />
                      <span className="text-xs text-pharaoh-400/50">{sub.evidence} evidence file{sub.evidence !== 1 ? 's' : ''} attached</span>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
                      <Upload size={12} /> Attach Evidence
                    </button>
                    {sub.status !== 'submitted' && (
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all gold-gradient text-nile-900">
                        <CheckCircle size={12} /> Mark Submitted
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
