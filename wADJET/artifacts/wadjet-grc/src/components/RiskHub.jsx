import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react'
import { AlertTriangle, Search, X, Download, Plus, ChevronDown, ChevronUp, Shield, RefreshCw, Filter, Eye, Pen, Trash2, Link, Activity } from 'lucide-react'
import { downloadRiskRegisterCSV, downloadRiskRegisterXLSX, downloadRiskRegisterPDF, downloadRiskRegisterTemplateXLSX } from '../lib/downloadUtils'
import { enrichMetricMappings, saveMetricMappings } from '../lib/metricUtils'
import LinkMetricModal from './LinkMetricModal'

const LEVEL_COLOR = {
  Critical: { bg: 'bg-[rgba(220,53,69,0.12)] border-[#dc3545]/30', text: 'text-[#f08080]', dot: 'bg-[#dc3545]' },
  High:     { bg: 'bg-[rgba(253,126,20,0.10)] border-[#fd7e14]/25', text: 'text-[#ffb068]', dot: 'bg-[#fd7e14]' },
  Medium:   { bg: 'bg-[rgba(212,168,50,0.08)] border-[#d4a832]/20', text: 'text-[#d4a832]', dot: 'bg-[#d4a832]' },
  Low:      { bg: 'bg-[rgba(32,201,151,0.08)] border-[#20c997]/20', text: 'text-[#69db7c]', dot: 'bg-[#20c997]' },
  Open:     { bg: 'bg-[rgba(206,212,218,0.06)] border-[#ced4da]/15', text: 'text-[#ced4da]' },
  'In Progress': { bg: 'bg-[rgba(206,212,218,0.06)] border-[#ced4da]/15', text: 'text-[#e9ecef]' },
  Closed:   { bg: 'bg-[rgba(32,201,151,0.08)] border-[#20c997]/20', text: 'text-[#69db7c]' },
  Accepted: { bg: 'bg-[rgba(134,142,150,0.08)] border-[#868e96]/20', text: 'text-[#adb5bd]' },
}

const rowBg = (lvl) =>
  lvl === 'Critical' ? 'bg-[rgba(220,53,69,0.04)]' :
  lvl === 'High' ? 'bg-[rgba(253,126,20,0.03)]' :
  lvl === 'Medium' ? 'bg-[rgba(212,168,50,0.02)]' : ''

const calcTarget = (r) => {
  const map = { 'Implemented': 1, 'Partially Implemented': 0.5, 'Planned': 0.2, 'None': 0 }
  const eff = map[r.controlStatus] || 0
  return eff >= 1 ? 'Low' : eff >= 0.5 ? 'Medium' : 'High'
}

const ragDot = (s) => {
  if (!s && s !== 0) return '⚪'
  const n = Number(s)
  return n >= 15 ? '🔴' : n >= 10 ? '🟡' : '🟢'
}

const levelBadge = (level) => {
  const c = LEVEL_COLOR[level] || { bg: 'bg-zinc-800/50 border-zinc-600/20', text: 'text-zinc-400' }
  return `inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${c.bg} ${c.text}`
}

const CATEGORIES = ['All', 'Cybersecurity', 'Compliance', 'Information Security', 'Third Party Risk', 'Operational', 'Financial', 'Reputational', 'Legal', 'Strategic']
const STATUSES = ['All', 'Open', 'In Progress', 'Closed', 'Accepted']
const LEVELS = ['All', 'Critical', 'High', 'Medium', 'Low']
const TREATMENTS = ['Mitigate', 'Accept', 'Transfer', 'Avoid']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

const scoreToLevel = (s) => s >= 15 ? 'Critical' : s >= 10 ? 'High' : s >= 5 ? 'Medium' : 'Low'
const calcMaxImpact = (f) => Math.max(
  f.impactFinance||1, f.impactRegulatory||1, f.impactReputational||1,
  f.impactSafety||1, f.impactOperational||1,
  f.impactC||1, f.impactI||1, f.impactA||1
)
const calcScore = (f) => Math.round((f.likelihood || 1) * calcMaxImpact(f))

const EMPTY_FORM = {
  riskId: '', process: '', subProcess: '', assetSystem: '', ownerTeam: '',
  riskCategory: 'Cybersecurity', threat: '', vulnerability: '', severity: 'High',
  riskTitle: '', riskDescription: '', riskRef: '',
  likelihood: 3, impactFinance: 3, impactRegulatory: 3, impactReputational: 3, impactSafety: 1, impactOperational: 3,
  impactC: 3, impactI: 3, impactA: 3,
  existingControls: '', residualScore: '', overallRisk: 'Medium',
  treatment: 'Mitigate', status: 'Open', mitigationActions: '', deadline: '', owner: '',
  controlStatus: 'None',
  budget: '', issuesBlockers: '', riskSource: 'Internal', reviewFreq: 'Quarterly',
  riskDate: new Date().toISOString().split('T')[0],
}

function mapRisk(r) {
  return {
    _id: r._id,
    riskId: r.riskId,
    riskTitle: r.riskTitle,
    riskDate: r.riskDate || '',
    process: r.process,
    subProcess: r.subProcess,
    assetSystem: r.assetSystem || r.asset,
    ownerTeam: r.ownerTeam,
    riskCategory: r.riskCategory,
    threat: r.threat,
    vulnerability: r.vulnerability,
    severity: r.severity,
    riskDescription: r.riskDescription,
    riskRef: r.riskRef,
    likelihood: r.likelihood,
    impactFinance: r.impactFinance,
    impactRegulatory: r.impactRegulatory,
    impactReputational: r.impactReputational,
    impactSafety: r.impactSafety || 1,
    impactOperational: r.impactOperational,
    impactC: r.impactC ?? r.C,
    impactI: r.impactI ?? r.I,
    impactA: r.impactA ?? r.A,
    overallScore: r.overallScore ?? r.riskScore,
    riskScore: r.riskScore ?? r.overallScore,
    inherentLevel: r.inherentLevel || scoreToLevel(r.overallScore || 0),
    existingControls: r.existingControls,
    residualScore: r.residualScore,
    overallRisk: r.overallRisk,
    controlStatus: r.controlStatus || 'None',
    treatment: r.treatment,
    mitigationActions: r.mitigationActions,
    status: r.status,
    deadline: r.deadline,
    owner: r.owner,
    budget: r.budget || '—',
    issuesBlockers: r.issuesBlockers || r.dependencies || 'None',
    riskSource: r.riskSource || 'Internal',
    reviewFreq: r.reviewFreq || 'Quarterly',
    lastReview: r.lastReview || '—',
  }
}

function ScoreSlider({ label, value, onChange }) {
  const color = value >= 4 ? '#dc3545' : value >= 3 ? '#fd7e14' : value >= 2 ? '#d4a832' : '#20c997'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-pharaoh-400/70">{label}</span>
        <span className="text-[11px] font-bold mono" style={{ color }}>{value}</span>
      </div>
      <input type="range" min="1" max="5" value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#ced4da]" />
      <div className="flex justify-between text-[8px] text-pharaoh-500/30 mt-0.5">
        <span>1–Very Low</span><span>3–Medium</span><span>5–Critical</span>
      </div>
    </div>
  )
}

function RiskDetailPanel({ risk, onClose, onStatusChange, onEdit, onDelete, mappings, enrichedMetrics, riskControlMaps, onOpenControlBrowser, onOpenLinkMetric, suggestions, onApproveSuggestion, onRejectSuggestion, onUpdateMapping, onDeleteMapping }) {
  const levelC = LEVEL_COLOR[risk.inherentLevel] || {}
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="w-[600px] h-full bg-[#070f1a] border-l border-pharaoh-500/15 overflow-y-auto flex flex-col animate-fade-in shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-pharaoh-500/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-pharaoh-500/50">{risk.riskId}</span>
              <span className={levelBadge(risk.inherentLevel)}>{risk.inherentLevel}</span>
              <span className={levelBadge(risk.status)}>{risk.status}</span>
            </div>
            <h2 className="text-base font-bold text-pharaoh-100">{risk.riskTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(risk)}
              className="p-1.5 rounded-lg border border-pharaoh-500/20 text-pharaoh-400 hover:border-amber-500/60 hover:text-amber-400 transition-all">
              <Pen size={14} />
            </button>
            <button onClick={() => onDelete(risk)}
              className="p-1.5 rounded-lg border border-pharaoh-500/20 text-pharaoh-400 hover:border-red-500/60 hover:text-red-400 transition-all">
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5 text-xs">
          <div className="pharaoh-card p-4 grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Likelihood', value: risk.likelihood, max: 5 },
              { label: 'Risk Score', value: risk.riskScore, max: 25, highlight: true },
              { label: 'Residual', value: risk.residualScore, max: 25 },
              { label: 'CIA Max', value: Math.max(risk.impactC, risk.impactI, risk.impactA), max: 5 },
            ].map(kp => (
              <div key={kp.label}>
                <div className={`text-xl font-bold mono ${kp.highlight ? 'text-pharaoh-300' : 'text-pharaoh-200'}`}>{kp.value}</div>
                <div className="text-[9px] text-pharaoh-500/50 mt-0.5">{kp.label}</div>
                <div className="mt-1 h-1 rounded-full bg-pharaoh-800/40">
                  <div className="h-full rounded-full" style={{ width: `${(kp.value/kp.max)*100}%`, backgroundColor: levelC.dot ? undefined : '#d4af37', background: kp.highlight ? `linear-gradient(90deg,#c41e3a,#d4af37)` : `rgba(196,160,48,0.4)` }} />
                </div>
              </div>
            ))}
          </div>

          <Section title="Risk Scenario">
            <Row label="Process" value={risk.process} />
            <Row label="Sub-Process" value={risk.subProcess} />
            <Row label="Asset / System" value={risk.assetSystem} />
            <Row label="Owner Team" value={risk.ownerTeam} />
            <Row label="Risk Category" value={risk.riskCategory} />
            <Row label="Severity" value={risk.severity} badge />
            <Row label="Threat" value={risk.threat} />
            <Row label="Vulnerability" value={risk.vulnerability} />
            <Row label="Risk Ref" value={risk.riskRef} mono />
            <Row label="Risk Date" value={risk.riskDate} mono />
            <Row label="Risk Source" value={risk.riskSource} />
            <Row label="Review Frequency" value={risk.reviewFreq} />
          </Section>

          <Section title="Description">
            <p className="text-pharaoh-300/80 leading-relaxed text-[11px] bg-pharaoh-900/30 rounded-lg p-3 border border-pharaoh-500/8">{risk.riskDescription}</p>
          </Section>

          <Section title="Likelihood">
            <div className="pharaoh-card p-4 flex items-center justify-between">
              <span className="text-pharaoh-400/80 font-semibold">Likelihood Score</span>
              <span className="text-2xl font-bold mono text-pharaoh-200">{risk.likelihood} <span className="text-sm text-pharaoh-500/40">/ 5</span></span>
            </div>
          </Section>

          <Section title="Impact Dimensions">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {[
                ['Finance', risk.impactFinance],
                ['Regulatory', risk.impactRegulatory],
                ['Reputational', risk.impactReputational],
                ['Safety', risk.impactSafety],
                ['Operational', risk.impactOperational],
                ['Confidentiality (C)', risk.impactC],
                ['Integrity (I)', risk.impactI],
                ['Availability (A)', risk.impactA],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1 border-b border-pharaoh-500/5">
                  <span className="text-pharaoh-400/60">{k}</span>
                  <span className="font-mono text-pharaoh-200 font-semibold">{v} / 5</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pharaoh-card p-4 flex items-center justify-between">
              <span className="text-pharaoh-400/80 font-semibold">Overall Impact</span>
              <span className="text-lg font-bold mono text-pharaoh-200">{calcMaxImpact(risk)} <span className="text-sm text-pharaoh-500/40">/ 5</span></span>
            </div>
          </Section>

          <Section title="Risk Scoring">
            <Row label="Overall Score" value={risk.overallScore} mono />
            <Row label="Risk Score" value={risk.riskScore} mono />
            <Row label="Inherent Level" value={risk.inherentLevel} badge />
            <Row label="Residual Score" value={risk.residualScore} mono />
            <Row label="RAG Status" value={ragDot(risk.residualScore)} />
            <Row label="Overall Risk (Residual)" value={risk.overallRisk} badge />
          </Section>

          <Section title="Existing Controls">
            <Row label="Implementation Status" value={risk.controlStatus} badge />
            <p className="text-pharaoh-300/80 leading-relaxed text-[11px] bg-pharaoh-900/30 rounded-lg p-3 border border-pharaoh-500/8">{risk.existingControls || '—'}</p>
          </Section>

          <Section title="Treatment & Mitigation">
            <Row label="Treatment" value={risk.treatment} />
            <Row label="Status" value={risk.status} badge />
            <Row label="Budget ($)" value={risk.budget} mono />
            <Row label="Issues / Blockers" value={risk.issuesBlockers} />
            <Row label="Deadline" value={risk.deadline || '—'} mono />
            <Row label="Owner" value={risk.owner} />
          </Section>

          <Section title="Linked Compliance Controls (Verified)">
            {(!riskControlMaps || riskControlMaps.length === 0) ? (
              <>
                <p className="text-pharaoh-400/60 text-[11px] italic">No compliance controls linked to this risk</p>
                <button onClick={onOpenControlBrowser}
                  className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-amber-500/30 text-amber-400/80 hover:border-amber-500/60 hover:text-amber-300 transition-all">
                  + Link Control
                </button>
              </>
            ) : (
              <div className="space-y-1.5">
                {riskControlMaps.map((m, i) => (
                  <LinkedControlRow
                    key={m._id || i}
                    mapping={m}
                    onUpdateMapping={onUpdateMapping}
                    onDeleteMapping={onDeleteMapping}
                  />
                ))}
                <button onClick={onOpenControlBrowser}
                  className="mt-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-amber-500/30 text-amber-400/80 hover:border-amber-500/60 hover:text-amber-300 transition-all">
                  + Link Control
                </button>
              </div>
            )}
          </Section>

          <Section title="💡 Smart Recommendations">
            {(!suggestions || suggestions.length === 0) ? (
              <p className="text-pharaoh-400/60 text-[11px] italic">No recommendations available for this risk</p>
            ) : (
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <SuggestionRow
                    key={s.controlId + i}
                    suggestion={s}
                    riskId={risk._id}
                    onApprove={(notes) => onApproveSuggestion(risk._id, s, notes)}
                    onReject={() => onRejectSuggestion(risk._id, s.controlId)}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title="Mitigation Actions">
            <p className="text-pharaoh-300/80 leading-relaxed text-[11px] bg-pharaoh-900/30 rounded-lg p-3 border border-pharaoh-500/8">{risk.mitigationActions || '—'}</p>
          </Section>

          <Section title="Linked Metrics">
            {(!enrichedMetrics || (enrichedMetrics.kpis.length === 0 && enrichedMetrics.kris.length === 0)) ? (
              <>
                <p className="text-pharaoh-400/60 text-[11px] italic">No KPIs or KRIs linked to this risk</p>
                <button onClick={onOpenLinkMetric}
                  className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-emerald-500/30 text-emerald-400/80 hover:border-emerald-500/60 hover:text-emerald-300 transition-all">
                  + Link Metric
                </button>
              </>
            ) : (
              <div className="space-y-3">
                {enrichedMetrics.kpis.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/60 mb-1.5 flex items-center gap-1">
                      <Activity size={10} /> KPIs ({enrichedMetrics.kpis.length})
                    </p>
                    <div className="space-y-1">
                      {enrichedMetrics.kpis.map((m, i) => (
                        <MetricRow key={m._id || i} mapping={m} type="KPI" />
                      ))}
                    </div>
                  </div>
                )}
                {enrichedMetrics.kris.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500/60 mb-1.5 flex items-center gap-1">
                      <AlertTriangle size={10} /> KRIs ({enrichedMetrics.kris.length})
                    </p>
                    <div className="space-y-1">
                      {enrichedMetrics.kris.map((m, i) => (
                        <MetricRow key={m._id || i} mapping={m} type="KRI" />
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={onOpenLinkMetric}
                  className="mt-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-emerald-500/30 text-emerald-400/80 hover:border-emerald-500/60 hover:text-emerald-300 transition-all">
                  + Link Metric
                </button>
              </div>
            )}
          </Section>

          <div className="flex gap-2 flex-wrap pt-2 border-t border-pharaoh-500/10">
            {STATUSES.filter(s => s !== 'All').map(s => (
              <button key={s} onClick={() => onStatusChange(risk._id, s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${risk.status === s ? 'gold-gradient text-nile-900 border-transparent' : 'border-pharaoh-500/20 text-pharaoh-400/60 hover:border-pharaoh-500/40 hover:text-pharaoh-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ mapping, type }) {
  const status = mapping.status
  const latest = mapping.latestMeasurement
  const hasValue = latest && latest.currentValue != null
  const statusColors = { green: '#20c997', amber: '#ffb068', red: '#dc3545' }
  const statusBg = { green: 'rgba(32,201,151,0.08)', amber: 'rgba(253,126,20,0.08)', red: 'rgba(220,53,69,0.08)' }
  const statusBorder = { green: 'rgba(32,201,151,0.15)', amber: 'rgba(253,126,20,0.15)', red: 'rgba(220,53,69,0.15)' }
  const statusLabel = { green: 'On Track', amber: 'Warning', red: 'Breach' }

  return (
    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
      style={{
        background: type === 'KPI' ? 'rgba(32,201,151,0.04)' : 'rgba(253,126,20,0.04)',
        border: '1px solid',
        borderColor: status ? statusBorder[status] || (type === 'KPI' ? 'rgba(32,201,151,0.08)' : 'rgba(253,126,20,0.08)') : (type === 'KPI' ? 'rgba(32,201,151,0.08)' : 'rgba(253,126,20,0.08)'),
      }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-pharaoh-200">{mapping.metric?.code || mapping.metricCatalogId}</span>
          {status && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
              style={{ background: statusBg[status], color: statusColors[status], border: `1px solid ${statusBorder[status]}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[status] }} />
              {statusLabel[status]}
            </span>
          )}
        </div>
        <p className="text-[9px] text-pharaoh-400/60 truncate mt-0.5">{mapping.metric?.name || ''}</p>
      </div>
      <div className="flex items-center gap-2 ml-2">
        {hasValue ? (
          <>
            <span className="text-[11px] font-bold mono"
              style={{ color: status ? statusColors[status] : '#ced4da' }}>
              {latest.currentValue}
            </span>
            <span className="text-[8px] text-pharaoh-500/40">{latest.period || ''}</span>
          </>
        ) : (
          <span className="text-[9px] text-pharaoh-500/30 italic">No data</span>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value, badge, mono }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-pharaoh-500/6">
      <span className="text-[10px] text-pharaoh-400/60 flex-shrink-0 w-36">{label}</span>
      {badge ? (
        <span className={levelBadge(value)}>{value}</span>
      ) : (
        <span className={`text-[10px] text-pharaoh-200 text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
      )}
    </div>
  )
}

function ControlBrowser({ riskId, linkedControlIds, onLink, onUnlink, onClose }) {
  const [controls, setControls] = useState([])
  const [search, setSearch] = useState('')
  const [framework, setFramework] = useState('')
  const [mappingType, setMappingType] = useState('Supporting')
  const [linking, setLinking] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (framework) params.set('frameworkCode', framework)
    fetch(`/api/controls?${params}`)
      .then(r => r.json())
      .then(data => setControls(data.items || []))
      .catch(() => setControls([]))
  }, [framework])

  const filtered = controls.filter(c => {
    if (linkedControlIds.has(c._id)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (c.controlId || '').toLowerCase().includes(q)
        || (c.name || '').toLowerCase().includes(q)
        || (c.description || '').toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[680px] max-h-[80vh] bg-[#070f1a] border border-pharaoh-500/20 rounded-2xl flex flex-col shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-pharaoh-500/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-pharaoh-100">Link Compliance Control</h2>
            <p className="text-[10px] text-pharaoh-500/50">Select a control to link to this risk</p>
          </div>
          <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-pharaoh-500/8 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
            <input type="text" placeholder="Search controls..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-xs text-pharaoh-200 placeholder-pharaoh-500/30 focus:outline-none focus:border-amber-500/40" />
          </div>
          <select value={framework} onChange={e => setFramework(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-xs text-pharaoh-300 focus:outline-none focus:border-amber-500/40">
            <option value="">All Frameworks</option>
            <option value="ISO">ISO 27001</option>
            <option value="CBE">CBE</option>
            <option value="PCI">PCI DSS</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-pharaoh-500/40 text-xs italic text-center py-8">
              {controls.length === 0 ? 'Loading controls...' : 'No matching controls found'}
            </p>
          ) : filtered.slice(0, 50).map(c => (
            <div key={c._id}
              className="flex items-center justify-between py-2 px-3 rounded-lg border border-pharaoh-500/8 hover:border-amber-500/20 transition-all cursor-pointer"
              style={{ background: 'rgba(212,168,50,0.03)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-pharaoh-200">{c.controlId}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full border"
                    style={{
                      borderColor: c.frameworkCode === 'ISO' ? 'rgba(32,201,151,0.3)' : c.frameworkCode === 'CBE' ? 'rgba(253,126,20,0.3)' : 'rgba(153,102,255,0.3)',
                      color: c.frameworkCode === 'ISO' ? '#69db7c' : c.frameworkCode === 'CBE' ? '#ffb068' : '#b197fc'
                    }}>{c.frameworkCode}</span>
                </div>
                <p className="text-[10px] text-pharaoh-400/60 truncate mt-0.5">{c.name}</p>
              </div>
              <button onClick={async () => {
                setLinking(c._id)
                await onLink(c._id, c.frameworkCode, c.controlId, mappingType)
                setLinking(null)
              }} disabled={linking === c._id}
                className="ml-3 px-2.5 py-1 rounded-lg text-[9px] font-semibold border border-amber-500/30 text-amber-400/80 hover:border-amber-500/60 hover:text-amber-300 transition-all disabled:opacity-40">
                {linking === c._id ? '...' : 'Link'}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-pharaoh-500/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-pharaoh-500/40">Mapping:</span>
            <select value={mappingType} onChange={e => setMappingType(e.target.value)}
              className="px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[9px] text-pharaoh-300 focus:outline-none">
              <option value="Supporting">Supporting</option>
              <option value="Primary">Primary</option>
            </select>
          </div>
          <span className="text-[9px] text-pharaoh-500/30">{filtered.length} available · {controls.length} total</span>
        </div>
      </div>
    </div>
  )
}

function LinkedControlRow({ mapping, onUpdateMapping, onDeleteMapping }) {
  const [editing, setEditing] = useState(false)
  const [mappingType, setMappingType] = useState(mapping.mappingType)
  const [notes, setNotes] = useState(mapping.notes || '')

  const handleSave = async () => {
    await onUpdateMapping(mapping._id, { mappingType, notes })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 py-2 px-2 rounded-lg"
        style={{ background: 'rgba(212,168,50,0.06)', border: '1px solid rgba(212,168,50,0.15)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-pharaoh-200">{mapping.control?.controlId || mapping.controlRef}</span>
          <span className="text-[9px] text-pharaoh-400/60 truncate">{mapping.control?.controlName || ''}</span>
        </div>
        <select value={mappingType} onChange={e => setMappingType(e.target.value)}
          className="w-full px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[10px] text-pharaoh-300 focus:outline-none focus:border-amber-500/40">
          <option value="Supporting">Supporting</option>
          <option value="Primary">Primary</option>
        </select>
        <textarea placeholder="Audit justification..."
          value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[10px] text-pharaoh-300 resize-none focus:outline-none focus:border-amber-500/40" rows={2} />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)}
            className="px-2 py-1 rounded text-[9px] text-pharaoh-500/50 hover:text-pharaoh-400">Cancel</button>
          <button onClick={handleSave}
            className="px-2 py-1 rounded text-[9px] font-semibold text-green-400 border border-green-500/30 hover:border-green-500/60">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between py-1.5 px-2 rounded-lg group"
      style={{ background: mapping.source === 'seed' ? 'rgba(100,100,255,0.04)' : 'rgba(212,168,50,0.04)', border: '1px solid rgba(212,168,50,0.08)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-pharaoh-200">{mapping.control?.controlId || mapping.controlRef}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full border"
            style={{
              borderColor: mapping.source === 'seed' ? 'rgba(100,100,255,0.3)' : 'rgba(212,168,50,0.3)',
              color: mapping.source === 'seed' ? '#7c7cff' : '#d4a832',
            }}>
            {mapping.source === 'seed' ? 'Auto' : 'Manual'}
          </span>
        </div>
        <p className="text-[9px] text-pharaoh-400/60 truncate mt-0.5">{mapping.control?.controlName || ''}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[8px] uppercase tracking-wider"
            style={{ color: mapping.mappingType === 'Primary' ? '#69db7c' : '#ffb068' }}>{mapping.mappingType}</span>
          <span className="text-[8px] font-mono text-pharaoh-500/40">{mapping.frameworkCode || ''}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)}
          className="p-1 rounded border border-pharaoh-500/20 text-pharaoh-500/60 hover:border-amber-500/40 hover:text-amber-400 transition-all"
          title="Edit mapping">
          <Pen size={10} />
        </button>
        <button onClick={() => onDeleteMapping(mapping._id)}
          className="p-1 rounded border border-pharaoh-500/20 text-pharaoh-500/60 hover:border-red-500/40 hover:text-red-400 transition-all"
          title="Unlink control">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  )
}

function SuggestionRow({ suggestion, riskId, onApprove, onReject }) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await onApprove(notes)
    setShowNotes(false)
    setNotes('')
    setLoading(false)
  }

  const handleReject = async () => {
    setLoading(true)
    await onReject()
    setLoading(false)
  }

  const pct = suggestion.confidenceScore
  const barColor = pct >= 45 ? '#69db7c' : pct >= 30 ? '#ffb068' : '#868e96'

  return (
    <div className="py-2 px-2 rounded-lg"
      style={{ background: 'rgba(50,120,255,0.04)', border: '1px solid rgba(50,120,255,0.1)' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-pharaoh-200">{suggestion.controlRef}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full border"
              style={{
                borderColor: suggestion.frameworkCode === 'ISO27001' ? 'rgba(32,201,151,0.3)' : suggestion.frameworkCode === 'CBE_CSF' ? 'rgba(253,126,20,0.3)' : 'rgba(153,102,255,0.3)',
                color: suggestion.frameworkCode === 'ISO27001' ? '#69db7c' : suggestion.frameworkCode === 'CBE_CSF' ? '#ffb068' : '#b197fc'
              }}>{suggestion.frameworkCode}</span>
          </div>
          <p className="text-[9px] text-pharaoh-400/60 truncate mt-0.5">{suggestion.controlName}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-pharaoh-800/40 max-w-[80px]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="text-[8px] font-mono" style={{ color: barColor }}>{pct}%</span>
          </div>
          <div className="mt-1">
            {suggestion.reasoning?.slice(0, 1).map((r, i) => (
              <p key={i} className="text-[8px] text-pharaoh-500/40 italic">↳ {r}</p>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {showNotes ? (
            <div className="flex flex-col gap-1 items-end">
              <textarea placeholder="Audit justification (required)..."
                value={notes} onChange={e => setNotes(e.target.value)}
                className="w-[160px] px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[9px] text-pharaoh-300 resize-none focus:outline-none focus:border-green-500/40" rows={2} />
              <div className="flex gap-1">
                <button onClick={() => { setShowNotes(false); setNotes('') }}
                  className="px-1.5 py-0.5 rounded text-[8px] text-pharaoh-500/50">Cancel</button>
                <button onClick={handleApprove} disabled={loading || !notes.trim()}
                  className="px-1.5 py-0.5 rounded text-[8px] font-semibold text-green-400 border border-green-500/30 hover:border-green-500/60 disabled:opacity-40">
                  {loading ? '...' : 'Confirm'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => setShowNotes(true)}
                className="p-1 rounded border border-green-500/30 text-green-400/80 hover:border-green-500/60 hover:text-green-300 transition-all"
                title="Approve">
                ✓
              </button>
              <button onClick={handleReject} disabled={loading}
                className="p-1 rounded border border-red-500/30 text-red-400/80 hover:border-red-500/60 hover:text-red-300 transition-all disabled:opacity-40"
                title="Reject">
                ✗
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AddRiskModal({ onClose, onSave, existingIds, editRisk }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...editRisk })
  const [section, setSection] = useState(0)
  const [saving, setSaving] = useState(false)

  const score = calcScore(form)
  const effectiveness = { 'Implemented': 1, 'Partially Implemented': 0.5, 'Planned': 0.2, 'None': 0 }[form.controlStatus] || 0
  const autoResidual = Math.max(1, Math.round(score * (1 - effectiveness)))
  const level = scoreToLevel(score)
  const residualLevel = scoreToLevel(Number(form.residualScore) || autoResidual)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    setForm(f => ({ ...f, severity: level }))
  }, [score])

  const handleSave = async () => {
    if (!form.riskId || !form.riskTitle) return
    setSaving(true)
    await onSave({
      ...form,
      riskRef: form.riskRef || form.riskId,
      overallRisk: residualLevel,
      likelihood: Number(form.likelihood),
      impactFinance: Number(form.impactFinance),
      impactRegulatory: Number(form.impactRegulatory),
      impactReputational: Number(form.impactReputational),
      impactSafety: Number(form.impactSafety),
      impactOperational: Number(form.impactOperational),
      impactC: Number(form.impactC),
      impactI: Number(form.impactI),
      impactA: Number(form.impactA),
      residualScore: Number(form.residualScore) || autoResidual,
    })
    setSaving(false)
  }

  const sections = [
    'Risk Identification',
    'Likelihood & Impact',
    'Controls & Scoring',
    'Treatment & Mitigation',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[700px] max-h-[88vh] bg-[#070f1a] border border-pharaoh-500/20 rounded-2xl flex flex-col shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-pharaoh-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20">
              <Plus size={15} className="text-pharaoh-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-pharaoh-100">{editRisk ? 'Edit Risk' : 'Add New Risk'}</h2>
              <p className="text-[10px] text-pharaoh-500/50">{editRisk ? 'Update the fields below to modify this risk' : 'Complete all sections to register a new risk'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300"><X size={18} /></button>
        </div>

        <div className="px-6 py-3 border-b border-pharaoh-500/8 flex items-center gap-4">
          <span className="text-[10px] text-pharaoh-400/60">Live Risk Score:</span>
          <span className="text-lg font-bold mono text-pharaoh-200">{score} / 25</span>
          <span className={levelBadge(level)}>{level}</span>
          <div className="flex-1 h-1.5 rounded-full bg-pharaoh-800/40 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(score/25)*100}%`, background: score >= 15 ? '#c41e3a' : score >= 10 ? '#c9a82e' : score >= 5 ? '#b8860b' : '#2d7d46' }} />
          </div>
        </div>

        <div className="flex border-b border-pharaoh-500/10">
          {sections.map((s, i) => (
            <button key={s} onClick={() => setSection(i)}
              className={`flex-1 py-2.5 text-[10px] font-semibold transition-all ${section === i ? 'text-pharaoh-300 border-b-2 border-pharaoh-400' : 'text-pharaoh-500/40 hover:text-pharaoh-400'}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
          {section === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Risk ID *" required>
                  <input value={form.riskId} onChange={e => set('riskId', e.target.value)}
                    placeholder={`R-0${String(existingIds.length + 1).padStart(2,'0')}`}
                    className="form-input" />
                </Field>
                <Field label="Risk Ref">
                  <input value={form.riskRef} onChange={e => set('riskRef', e.target.value)}
                    placeholder="Same as Risk ID" className="form-input" />
                </Field>
              </div>
              <Field label="Risk Title *" required>
                <input value={form.riskTitle} onChange={e => set('riskTitle', e.target.value)}
                  placeholder="Short descriptive risk name" className="form-input" />
              </Field>
              <Field label="Risk Description">
                <textarea value={form.riskDescription} onChange={e => set('riskDescription', e.target.value)}
                  rows={3} placeholder="Describe the risk scenario in detail..."
                  className="form-input resize-none" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Process">
                  <input value={form.process} onChange={e => set('process', e.target.value)}
                    placeholder="e.g. Information Security Management" className="form-input" />
                </Field>
                <Field label="Sub-Process">
                  <input value={form.subProcess} onChange={e => set('subProcess', e.target.value)}
                    placeholder="e.g. Email Security" className="form-input" />
                </Field>
                <Field label="Asset / System">
                  <input value={form.assetSystem} onChange={e => set('assetSystem', e.target.value)}
                    placeholder="e.g. Microsoft Exchange" className="form-input" />
                </Field>
                <Field label="Owner Team">
                  <input value={form.ownerTeam} onChange={e => set('ownerTeam', e.target.value)}
                    placeholder="e.g. SOC Team" className="form-input" />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Risk Category">
                  <select value={form.riskCategory} onChange={e => set('riskCategory', e.target.value)} className="form-input">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Severity">
                  <select value={form.severity} onChange={e => set('severity', e.target.value)} className="form-input">
                    {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Threat">
                  <input value={form.threat} onChange={e => set('threat', e.target.value)}
                    placeholder="e.g. Phishing Attack" className="form-input" />
                </Field>
              </div>
              <Field label="Vulnerability">
                <input value={form.vulnerability} onChange={e => set('vulnerability', e.target.value)}
                  placeholder="e.g. Lack of Security Awareness" className="form-input" />
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Risk Date">
                  <input type="date" value={form.riskDate} onChange={e => set('riskDate', e.target.value)}
                    className="form-input" />
                </Field>
                <Field label="Risk Source">
                  <select value={form.riskSource} onChange={e => set('riskSource', e.target.value)} className="form-input">
                    {['Internal', 'External', 'Regulatory', 'Third Party', 'Compliance'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Review Frequency">
                  <select value={form.reviewFreq} onChange={e => set('reviewFreq', e.target.value)} className="form-input">
                    {['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {section === 1 && (
            <div className="space-y-5">
              <p className="text-[10px] text-pharaoh-400/60 italic">Rate each dimension 1 (Very Low) → 5 (Critical). Risk Score = Likelihood × Max Impact (Worst-Case).</p>
              <div className="pharaoh-card p-4">
                <ScoreSlider label="Likelihood" value={form.likelihood} onChange={v => set('likelihood', v)} />
              </div>
              <div className="border-t border-pharaoh-500/8 pt-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-3">Impact Dimensions</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <ScoreSlider label="Financial Impact" value={form.impactFinance} onChange={v => set('impactFinance', v)} />
                  <ScoreSlider label="Regulatory Impact" value={form.impactRegulatory} onChange={v => set('impactRegulatory', v)} />
                  <ScoreSlider label="Reputational Impact" value={form.impactReputational} onChange={v => set('impactReputational', v)} />
                  <ScoreSlider label="Safety Impact" value={form.impactSafety} onChange={v => set('impactSafety', v)} />
                  <ScoreSlider label="Operational Impact" value={form.impactOperational} onChange={v => set('impactOperational', v)} />
                </div>
              </div>
              <div className="border-t border-pharaoh-500/8 pt-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-3">CIA Triad Impact</p>
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <ScoreSlider label="Confidentiality (C)" value={form.impactC} onChange={v => set('impactC', v)} />
                  <ScoreSlider label="Integrity (I)" value={form.impactI} onChange={v => set('impactI', v)} />
                  <ScoreSlider label="Availability (A)" value={form.impactA} onChange={v => set('impactA', v)} />
                </div>
              </div>
              <div className="pharaoh-card p-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] text-pharaoh-500/40">Overall Impact (Max — Worst-Case)</p>
                  <p className="text-2xl font-bold mono text-pharaoh-200 mt-1">{calcMaxImpact(form)} <span className="text-sm text-pharaoh-500/40">/ 5</span></p>
                </div>
                <div>
                  <p className="text-[9px] text-pharaoh-500/40">Auto-Calculated Risk Score</p>
                  <p className="text-2xl font-bold mono text-pharaoh-200 mt-1">{score} <span className="text-sm text-pharaoh-500/40">/ 25</span></p>
                </div>
                <div>
                  <p className="text-[9px] text-pharaoh-500/40">Inherent Risk Level</p>
                  <span className={`mt-1 ${levelBadge(level)}`}>{level}</span>
                </div>
              </div>
            </div>
          )}

          {section === 2 && (
            <div className="space-y-4">
              <Field label="Existing Controls">
                <textarea value={form.existingControls} onChange={e => set('existingControls', e.target.value)}
                  rows={4} placeholder="List existing controls that address this risk..."
                  className="form-input resize-none" />
              </Field>
              <Field label="Control Implementation Status">
                <select value={form.controlStatus} onChange={e => set('controlStatus', e.target.value)}
                  className="form-input">
                  <option value="None">None (0%)</option>
                  <option value="Planned">Planned (20%)</option>
                  <option value="Partially Implemented">Partially Implemented (50%)</option>
                  <option value="Implemented">Implemented (100%)</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Residual Score (1–25)">
                  <input type="number" min="1" max="25" value={form.residualScore}
                    onChange={e => set('residualScore', e.target.value)}
                    placeholder="After controls applied" className="form-input" />
                </Field>
                <div className="flex flex-col justify-end pb-1">
                  <p className="text-[9px] text-pharaoh-500/40 mb-1">Residual Level (auto)</p>
                  <span className={levelBadge(residualLevel)}>{residualLevel}</span>
                </div>
              </div>
              <div className="pharaoh-card p-4">
                <p className="text-[10px] text-pharaoh-400/60 mb-3">Score Reference</p>
                <div className="grid grid-cols-4 gap-2">
                  {[['1–4','Low','#2d7d46'],['5–9','Medium','#b8860b'],['10–14','High','#c9a82e'],['15–25','Critical','#c41e3a']].map(([r,l,c]) => (
                    <div key={l} className="text-center p-2 rounded-lg" style={{ background: `${c}10`, border: `1px solid ${c}25` }}>
                      <div className="text-[11px] font-bold" style={{ color: c }}>{l}</div>
                      <div className="text-[9px] text-pharaoh-500/50">{r}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Treatment">
                  <select value={form.treatment} onChange={e => set('treatment', e.target.value)} className="form-input">
                    {TREATMENTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="form-input">
                    {STATUSES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Deadline">
                  <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="form-input" />
                </Field>
                <Field label="Risk Owner">
                  <input value={form.owner} onChange={e => set('owner', e.target.value)}
                    placeholder="e.g. SOC Manager" className="form-input" />
                </Field>
              </div>
              <Field label="Mitigation Actions">
                <textarea value={form.mitigationActions} onChange={e => set('mitigationActions', e.target.value)}
                  rows={5} placeholder="Describe the specific mitigation actions and timeline..."
                  className="form-input resize-none" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Budget ($)">
                  <input value={form.budget} onChange={e => set('budget', e.target.value)}
                    placeholder="e.g. 50000" className="form-input" />
                </Field>
                <Field label="Issues / Blockers">
                  <input value={form.issuesBlockers} onChange={e => set('issuesBlockers', e.target.value)}
                    placeholder="e.g. Pending vendor approval" className="form-input" />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-pharaoh-500/10 flex items-center justify-between">
          <div className="flex gap-2">
            {section > 0 && (
              <button onClick={() => setSection(s => s - 1)}
                className="px-4 py-2 rounded-lg text-xs border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40">
                ← Previous
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-pharaoh-500/50 hover:text-pharaoh-400">Cancel</button>
            {section < sections.length - 1 ? (
              <button onClick={() => setSection(s => s + 1)}
                className="px-5 py-2 rounded-lg text-xs font-bold gold-gradient text-nile-900">
                Next →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || !form.riskId || !form.riskTitle}
                className="px-5 py-2 rounded-lg text-xs font-bold gold-gradient text-nile-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Pen size={12} />}
                {saving ? 'Saving…' : editRisk ? 'Update Risk' : 'Save Risk'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-[10px] text-pharaoh-400/70 mb-1.5 font-medium">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function useColumnResize() {
  const [widths, setWidths] = useState({})
  const drag = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current) return
      const { colKey, startX, startW } = drag.current
      const diff = e.clientX - startX
      const w = Math.max(50, startW + diff)
      setWidths(p => ({ ...p, [colKey]: w }))
    }
    const onUp = () => {
      if (!drag.current) return
      drag.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])
  const startResize = useCallback((colKey, startX, startW) => {
    drag.current = { colKey, startX, startW }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])
  return { colWidths: widths, startResize }
}

function ResizeHandle({ colKey, startResize, initialWidth }) {
  const onMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    startResize(colKey, e.clientX, initialWidth || 80)
  }
  return (
    <div onMouseDown={onMouseDown}
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-pharaoh-500/40 active:bg-pharaoh-500/60 z-10"
      style={{ backgroundClip: 'content-box' }} />
  )
}

export default function RiskHub({ auditorMode }) {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [levelFilter, setLevelFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRisk, setEditRisk] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [riskMappings, setRiskMappings] = useState({ kpis: [], kris: [] })
  const [enrichedMetrics, setEnrichedMetrics] = useState({ kpis: [], kris: [] })
  const [riskControlMaps, setRiskControlMaps] = useState([])
  const [riskIdsWithMapping, setRiskIdsWithMapping] = useState(new Set())
  const [showControlBrowser, setShowControlBrowser] = useState(false)
  const [showLinkMetricModal, setShowLinkMetricModal] = useState(false)
  const [linkedCatalogIds, setLinkedCatalogIds] = useState(new Set())
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [approveNotes, setApproveNotes] = useState('')

  const fetchSuggestions = useCallback(async (riskId) => {
    try {
      const r = await fetch(`/api/risk-control-maps/suggestions?riskId=${riskId}`)
      const data = await r.json()
      setSuggestions(data.suggestions || [])
    } catch { setSuggestions([]) }
  }, [])

  const handleApproveSuggestion = useCallback(async (riskId, suggestion, notes) => {
    await fetch('/api/risk-control-maps/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        riskId,
        controlId: suggestion.controlId,
        frameworkCode: suggestion.frameworkCode,
        controlRef: suggestion.controlRef,
        mappingType: suggestion.suggestedMappingType,
        notes,
        approvedBy: 'user',
      }),
    })
    const r = await fetch(`/api/risk-control-maps?riskId=${riskId}`)
    const data = await r.json()
    setRiskControlMaps(data.items || [])
    const r2 = await fetch('/api/risk-control-maps')
    const d2 = await r2.json()
    setRiskIdsWithMapping(new Set((d2.items || []).map(m => m.riskId)))
    fetchSuggestions(riskId)
  }, [fetchSuggestions])

  const handleRejectSuggestion = useCallback(async (riskId, controlId) => {
    await fetch('/api/risk-control-maps/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riskId, controlId }),
    })
    fetchSuggestions(riskId)
  }, [fetchSuggestions])

  const handleUpdateMapping = useCallback(async (mapId, updates) => {
    // Use PUT via findByIdAndUpdate — send full update
    await fetch(`/api/risk-control-maps/${mapId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk?._id}`)
    const data = await r.json()
    setRiskControlMaps(data.items || [])
  }, [selectedRisk])

  const handleDeleteMapping = useCallback(async (mapId) => {
    await fetch(`/api/risk-control-maps/${mapId}`, { method: 'DELETE' })
    const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk?._id}`)
    const data = await r.json()
    setRiskControlMaps(data.items || [])
    const r2 = await fetch('/api/risk-control-maps')
    const d2 = await r2.json()
    setRiskIdsWithMapping(new Set((d2.items || []).map(m => m.riskId)))
    if (selectedRisk) fetchSuggestions(selectedRisk._id)
  }, [selectedRisk, fetchSuggestions])

  const handleSaveMetricMappings = useCallback(async (selections) => {
    if (!selectedRisk?._id) return
    const ok = await saveMetricMappings(selectedRisk._id, selections)
    if (ok) {
      setShowLinkMetricModal(false)
      const r = await fetch(`/api/metric-mappings?riskId=${selectedRisk._id}`)
      const data = await r.json()
      const items = data.items || []
      const kpis = items.filter(m => m.metricType === 'KPI')
      const kris = items.filter(m => m.metricType === 'KRI')
      setRiskMappings({ kpis, kris })
      setLinkedCatalogIds(new Set(items.map(m => m.metricCatalogId)))
      const enriched = await enrichMetricMappings(kpis, kris)
      setEnrichedMetrics(enriched)
    }
  }, [selectedRisk])

  const [tab, setTab] = useState('inherent')
  const [hId, setHId] = useState(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [spacerWidth, setSpacerWidth] = useState(9999)
  const headerRef = useRef(null)
  const topBarRef = useRef(null)
  const wrapRef = useRef(null)
  const syncing = useRef(false)
  const { colWidths, startResize } = useColumnResize()

  const fetchRisks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/risks')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      const mapped = (data.risks || []).map(r => mapRisk(r))
      setRisks(mapped)
      setError(null)
      window.dispatchEvent(new CustomEvent('risks-updated'))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRisks() }, [])

  useEffect(() => {
    fetch('/api/risk-control-maps')
      .then(r => r.json())
      .then(data => {
        const ids = new Set((data.items || []).map(m => m.riskId))
        setRiskIdsWithMapping(ids)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedRisk?._id) { setRiskMappings({ kpis: [], kris: [] }); setEnrichedMetrics({ kpis: [], kris: [] }); setRiskControlMaps([]); return }
    fetch(`/api/metric-mappings?riskId=${selectedRisk._id}`)
      .then(r => r.json())
      .then(async data => {
        const items = data.items || []
        const kpis = items.filter(m => m.metricType === 'KPI')
        const kris = items.filter(m => m.metricType === 'KRI')
        setRiskMappings({ kpis, kris })
        setLinkedCatalogIds(new Set(items.map(m => m.metricCatalogId)))
        const enriched = await enrichMetricMappings(kpis, kris)
        setEnrichedMetrics(enriched)
      })
      .catch(() => { setRiskMappings({ kpis: [], kris: [] }); setEnrichedMetrics({ kpis: [], kris: [] }) })

    fetch(`/api/risk-control-maps?riskId=${selectedRisk._id}`)
      .then(r => r.json())
      .then(data => setRiskControlMaps(data.items || []))
      .catch(() => setRiskControlMaps([]))

    fetchSuggestions(selectedRisk._id)
  }, [selectedRisk?._id, fetchSuggestions])

  useLayoutEffect(() => {
    const el = headerRef.current
    if (el) setHeaderHeight(el.offsetHeight)
    if (!el) return
    let timer
    const ro = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => setHeaderHeight(el.offsetHeight), 50)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (el && el.scrollWidth > el.clientWidth) {
      setSpacerWidth(el.scrollWidth)
    }
  }, [tab, risks])

  const handleAddRisk = async (form) => {
    const res = await fetch('/api/risks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowAddModal(false)
      await fetchRisks()
    }
  }

  const handleStatusChange = async (id, status) => {
    await fetch(`/api/risks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setRisks(prev => prev.map(r => r._id === id ? { ...r, status } : r))
    if (selectedRisk?._id === id) setSelectedRisk(r => ({ ...r, status }))
  }

  const handleEditRisk = async (form) => {
    const res = await fetch(`/api/risks/${editRisk._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setEditRisk(null)
      setSelectedRisk(null)
      await fetchRisks()
    }
  }

  const handleDeleteRisk = async (id) => {
    setConfirmDelete(null)
    setSelectedRisk(null)
    setRisks(prev => prev.filter(r => r._id !== id))
    try {
      await fetch(`/api/risks/${id}`, { method: 'DELETE' })
    } catch (e) { /* no backend */ }
  }

  const syncPct = (from, to) => {
    if (!from || !to || syncing.current) return
    syncing.current = true
    const mf = from.scrollWidth - from.clientWidth
    const mt = to.scrollWidth - to.clientWidth
    if (mf > 0 && mt > 0) {
      to.scrollLeft = (from.scrollLeft / mf) * mt
    }
    requestAnimationFrame(() => { syncing.current = false })
  }

  const syncScroll = (from) => syncPct(from.current, wrapRef.current)
  const syncScrollBack = () => syncPct(wrapRef.current, topBarRef.current)

  const filtered = useMemo(() => {
    let r = risks
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(x => x.riskTitle?.toLowerCase().includes(q) || x.riskId?.toLowerCase().includes(q) || x.riskCategory?.toLowerCase().includes(q) || x.owner?.toLowerCase().includes(q))
    }
    if (catFilter !== 'All') r = r.filter(x => x.riskCategory === catFilter)
    if (levelFilter !== 'All') r = r.filter(x => x.inherentLevel === levelFilter)
    if (statusFilter !== 'All') r = r.filter(x => x.status === statusFilter)
    return r
  }, [risks, search, catFilter, levelFilter, statusFilter])

  const treatmentFiltered = useMemo(() => {
    return filtered.filter(r =>
      r.status !== 'Closed' &&
      r.status !== 'Accepted' &&
      (
        r.status === 'Open' ||
        r.status === 'In Progress' ||
        !r.existingControls ||
        ['', '—', 'None', 'No controls in place'].includes(r.existingControls?.trim())
      )
    )
  }, [filtered])

  const stats = useMemo(() => ({
    total: risks.length,
    critical: risks.filter(r => r.inherentLevel === 'Critical').length,
    high: risks.filter(r => r.inherentLevel === 'High').length,
    medium: risks.filter(r => r.inherentLevel === 'Medium').length,
    low: risks.filter(r => r.inherentLevel === 'Low').length,
    open: risks.filter(r => r.status === 'Open').length,
    inProgress: risks.filter(r => r.status === 'In Progress').length,
  }), [risks])

  const col = (key, def) => colWidths[key] || def
  const w = (key, def) => ({ width: col(key, def), minWidth: col(key, def) })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top section — header, stats, filters (no scroll) */}
      <div className="shrink-0 p-6 pb-0 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.15)' }}>
              <AlertTriangle size={16} style={{ color: '#dc3545' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>Risk Register</h1>
              <p className="text-xs text-pharaoh-400/60 mt-0.5">WADJET GRC — Full risk register with all assessment columns</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadRiskRegisterTemplateXLSX()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-egyptian-green/60 hover:text-egyptian-green transition-all">
              <Download size={13} /> Download Template (.xlsx)
            </button>
            {risks.length > 0 && (
              <>
                <button onClick={() => downloadRiskRegisterXLSX(risks)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-egyptian-green/60 hover:text-egyptian-green transition-all">
                  <Download size={13} /> Export Register (.xlsx)
                </button>
                <button onClick={() => downloadRiskRegisterPDF(risks)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40 hover:text-pharaoh-300 transition-all">
                  <Download size={13} /> Export Register (.pdf)
                </button>
              </>
            )}
            {!auditorMode && (
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold gold-gradient text-nile-900 shadow-lg shadow-pharaoh-500/20 hover:shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all">
                <Plus size={13} /> Add New Risk
              </button>
            )}
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-7 gap-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          {[
            { label: 'Total Risks', value: stats.total, color: '#f8f9fa' },
            { label: 'Critical', value: stats.critical, color: '#dc3545' },
            { label: 'High', value: stats.high, color: '#fd7e14' },
            { label: 'Medium', value: stats.medium, color: '#d4a832' },
            { label: 'Low', value: stats.low, color: '#20c997' },
            { label: 'Open', value: stats.open, color: '#ced4da' },
            { label: 'In Progress', value: stats.inProgress, color: '#e9ecef' },
          ].map(k => (
            <div key={k.label} className="pharaoh-card px-3 py-3 text-center">
              <div className="text-2xl font-bold mono" style={{ color: k.color }}>{loading ? '—' : k.value}</div>
              <div className="text-[9px] text-pharaoh-500/40 mt-0.5 font-medium">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filter bar + tab switcher */}
        <div className="pharaoh-card px-4 py-3 flex items-center gap-3 flex-wrap animate-fade-in" style={{ animationDelay: '0.08s' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID, title, category, owner…"
              className="w-full bg-transparent pl-8 pr-3 py-1.5 text-xs text-pharaoh-200 placeholder-pharaoh-500/40 border-none outline-none" />
          </div>
          <div className="h-4 w-px bg-pharaoh-500/15" />
          {[
            { label: 'Category', value: catFilter, setter: setCatFilter, opts: CATEGORIES },
            { label: 'Level', value: levelFilter, setter: setLevelFilter, opts: LEVELS },
            { label: 'Status', value: statusFilter, setter: setStatusFilter, opts: STATUSES },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-1.5">
              <Filter size={11} className="text-pharaoh-500/40" />
              <select value={f.value} onChange={e => f.setter(e.target.value)}
                className="bg-transparent text-[11px] text-pharaoh-300 outline-none cursor-pointer border-none">
                {f.opts.map(o => <option key={o} value={o} style={{ background: '#070f1a' }}>{f.label}: {o}</option>)}
              </select>
            </div>
          ))}
          {/* Tab switcher */}
          <div className="flex bg-pharaoh-900/60 rounded-lg p-0.5 border border-pharaoh-500/20">
            <button onClick={() => setTab('inherent')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${tab === 'inherent' ? 'bg-pharaoh-800/80 text-amber-300 shadow-sm border border-pharaoh-500/30' : 'text-pharaoh-500/60 hover:text-pharaoh-400 border border-transparent'}`}>
              Inherent
            </button>
            <button onClick={() => setTab('treatment')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${tab === 'treatment' ? 'bg-pharaoh-800/80 text-amber-300 shadow-sm border border-pharaoh-500/30' : 'text-pharaoh-500/60 hover:text-pharaoh-400 border border-transparent'}`}>
              Treatment
            </button>
          </div>
          <span className="text-[10px] text-pharaoh-500/40 ml-auto">{filtered.length} of {risks.length} risks</span>
          <button onClick={fetchRisks} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable table area */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 mt-5">
        {/* Synced scrollbar (sticky at top of table area) */}
        <div className="overflow-x-auto overflow-y-hidden h-2.5 bg-pharaoh-900/40 rounded-lg"
          ref={topBarRef} onScroll={() => syncScroll(topBarRef)} style={{ scrollbarWidth: 'thin' }}>
          <div style={{ width: spacerWidth, height: '1px' }} />
        </div>

        {/* Table card with vertical scroll */}
        <div className="pharaoh-card overflow-hidden flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="overflow-x-auto overflow-y-auto flex-1" ref={wrapRef} onScroll={syncScrollBack}>
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <RefreshCw size={16} className="animate-spin text-pharaoh-400" />
                <span className="text-sm text-pharaoh-400/60">Loading risk register…</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16 gap-3 text-egyptian-red/70">
                <AlertTriangle size={16} /><span className="text-sm">{error}</span>
              </div>
            ) : tab === 'inherent' ? (
              <>
                <table className="text-left border-collapse whitespace-nowrap text-xs w-full">
                  <thead className="bg-pharaoh-900/60 text-pharaoh-300 font-semibold" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr className="border-b border-pharaoh-500/10">
                      <th className="p-3 sticky left-0 z-20 bg-pharaoh-900/60" style={{ ...w('in_riskId', 90), top: 0 }}>
                        Risk ID
                        <ResizeHandle colKey="in_riskId" startResize={startResize} initialWidth={col('in_riskId', 90)} />
                      </th>
                      <th className="p-3 sticky left-[90px] z-10 bg-pharaoh-900/60 min-w-[180px]" style={{ ...w('in_riskTitle', 180), top: 0 }}>
                        Risk Title
                        <ResizeHandle colKey="in_riskTitle" startResize={startResize} initialWidth={col('in_riskTitle', 180)} />
                      </th>
                      <th className="p-3 min-w-[100px]">Risk Date</th>
                      <th className="p-3 min-w-[150px]">Process</th>
                      <th className="p-3 min-w-[150px]">Sub-Process</th>
                      <th className="p-3 min-w-[130px]">Asset / System</th>
                      <th className="p-3 min-w-[110px]">Owner Team</th>
                      <th className="p-3 min-w-[120px]">Category</th>
                      <th className="p-3 min-w-[130px]">Threat</th>
                      <th className="p-3 min-w-[130px]">Vulnerability</th>
                      <th className="p-3 min-w-[70px]">Severity</th>
                      <th className="p-3 max-w-[140px]">Description</th>
                      <th className="p-3 text-center min-w-[26px]">L</th>
                      <th className="p-3 text-center min-w-[30px]">Fin</th>
                      <th className="p-3 text-center min-w-[50px]">Reg</th>
                      <th className="p-3 text-center min-w-[30px]">Rep</th>
                      <th className="p-3 text-center min-w-[32px]">Safe</th>
                      <th className="p-3 text-center min-w-[30px]">Ops</th>
                      <th className="p-3 text-center min-w-[22px]">C</th>
                      <th className="p-3 text-center min-w-[20px]">I</th>
                      <th className="p-3 text-center min-w-[22px]">A</th>
                      <th className="p-3 text-center min-w-[100px]">Inherent Score</th>
                      <th className="p-3 text-center min-w-[70px]">Level</th>
                      <th className="p-3 min-w-[160px]">Existing Controls</th>
                      <th className="p-3 text-center min-w-[90px]">Residual</th>
                      <th className="p-3 text-center min-w-[50px]">RAG</th>
                      <th className="p-3 min-w-[110px]">Treatment</th>
                      <th className="p-3 text-center w-8">Map</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pharaoh-500/8">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={28} className="py-16 text-center text-sm text-pharaoh-500/40">
                          <div className="flex flex-col items-center gap-3">
                            <AlertTriangle size={24} className="opacity-40" />
                            <span>No risks match current filters</span>
                            <button onClick={() => { setSearch(''); setCatFilter('All'); setLevelFilter('All'); setStatusFilter('All') }}
                              className="text-[10px] px-4 py-1.5 rounded-lg border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-400/40 transition-colors">
                              Clear all filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map(r => (
                      <tr key={r._id || r.riskId}
                        className={`cursor-pointer transition-colors ${rowBg(r.inherentLevel)} ${hId === r.riskId ? 'ring-1 ring-amber-500/30 bg-amber-500/5' : ''} hover:bg-pharaoh-800/40`}
                        onClick={() => setSelectedRisk(r)}
                        onMouseEnter={() => setHId(r.riskId)}
                        onMouseLeave={() => setHId(null)}>
                        <td className="p-3 font-mono font-bold text-amber-400/90 sticky left-0 bg-[#070f1a] z-10" style={w('in_riskId', 90)}>{r.riskId}</td>
                        <td className="p-3 font-bold text-pharaoh-200 sticky left-[90px] bg-[#070f1a] z-10" style={w('in_riskTitle', 180)}>{r.riskTitle}</td>
                        <td className="p-3 font-mono text-pharaoh-500/50">{r.riskDate}</td>
                        <td className="p-3 text-pharaoh-300/80">{r.process}</td>
                        <td className="p-3 text-pharaoh-300/80">{r.subProcess}</td>
                        <td className="p-3 font-medium text-pharaoh-200">{r.assetSystem}</td>
                        <td className="p-3 text-pharaoh-300/80">{r.ownerTeam}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'rgba(196,160,48,0.08)', color: 'rgba(196,160,48,0.7)' }}>{r.riskCategory}</span>
                        </td>
                        <td className="p-3 text-egyptian-red font-medium">{r.threat}</td>
                        <td className="p-3 text-pharaoh-300/80">{r.vulnerability}</td>
                        <td className="p-3 font-mono text-pharaoh-300/80">{r.severity}</td>
                        <td className="p-3 max-w-[140px] overflow-hidden text-ellipsis text-pharaoh-500/50 italic">"{r.riskDescription}"</td>
                        <td className="p-3 font-mono text-center font-bold text-amber-400/80">{r.likelihood}</td>
                        <td className="p-3 font-mono text-center text-pharaoh-300/70">{r.impactFinance}</td>
                        <td className="p-3 font-mono text-center font-bold text-egyptian-red/80">{r.impactRegulatory}</td>
                        <td className="p-3 font-mono text-center text-pharaoh-300/70">{r.impactReputational}</td>
                        <td className="p-3 font-mono text-center text-pharaoh-300/70">{r.impactSafety || 1}</td>
                        <td className="p-3 font-mono text-center text-pharaoh-300/70">{r.impactOperational}</td>
                        <td className="p-3 font-mono text-center text-pharaoh-300/70">{r.impactC}</td>
                        <td className="p-3 font-mono text-center text-pharaoh-300/70">{r.impactI}</td>
                        <td className="p-3 font-mono text-center text-pharaoh-300/70">{r.impactA}</td>
                        <td className={`p-3 font-mono text-center font-black text-sm ${
                          r.riskScore >= 15 ? 'text-[#dc3545] bg-[rgba(220,53,69,0.08)]' : r.riskScore >= 10 ? 'text-[#fd7e14] bg-[rgba(253,126,20,0.06)]' : r.riskScore >= 5 ? 'text-[#d4a832] bg-[rgba(212,168,50,0.04)]' : 'text-pharaoh-300'
                        }`}>{r.riskScore}</td>
                        <td className="p-3 text-center"><span className={levelBadge(r.inherentLevel)}>{r.inherentLevel}</span></td>
                        <td className="p-3 text-pharaoh-400/60 whitespace-pre-line leading-relaxed text-[10px]">{r.existingControls || 'No controls in place'}</td>
                        <td className="p-3 font-mono font-black text-center text-amber-400/80">{r.residualScore ?? '—'}</td>
                        <td className="p-3 text-center font-mono text-base">{ragDot(r.residualScore)}</td>
                        <td className="p-3 font-medium text-pharaoh-300/80 capitalize">{r.treatment || '—'}</td>
                        <td className="p-3 text-center text-[10px] text-pharaoh-500/50">
                          {riskIdsWithMapping.has(r._id) && <span title="Mapped to compliance controls" className="cursor-help text-amber-400/60">⧉</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 border-t border-pharaoh-500/8 flex items-center justify-between text-[10px] text-pharaoh-500/40">
                  <span>WADJET GRC Risk Register · Inherent Assessment · {filtered.length} risks</span>
                  <span className="flex items-center gap-1.5"><Eye size={10} /> Click any row to view full details</span>
                </div>
              </>
            ) : (
              <>
                <table className="text-left border-collapse whitespace-nowrap text-xs w-full">
                  <thead className="bg-pharaoh-900/60 text-pharaoh-300 font-semibold" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr className="border-b border-pharaoh-500/10">
                      <th className="p-3 sticky left-0 z-20 bg-pharaoh-900/60" style={{ ...w('tr_riskId', 90), top: 0 }}>
                        Risk ID
                        <ResizeHandle colKey="tr_riskId" startResize={startResize} initialWidth={col('tr_riskId', 90)} />
                      </th>
                      <th className="p-3 sticky left-[90px] z-10 bg-pharaoh-900/60 min-w-[180px]" style={{ ...w('tr_riskTitle', 180), top: 0 }}>
                        Risk Title
                        <ResizeHandle colKey="tr_riskTitle" startResize={startResize} initialWidth={col('tr_riskTitle', 180)} />
                      </th>
                      <th className="p-3 min-w-[160px]">Existing Controls</th>
                      <th className="p-3 text-center min-w-[90px]">Residual Score</th>
                      <th className="p-3 text-center min-w-[80px]">Residual Level</th>
                      <th className="p-3 min-w-[110px]">Treatment Strategy</th>
                      <th className="p-3 min-w-[200px]">Mitigation Actions Plan</th>
                      <th className="p-3 text-center min-w-[90px]">Target Residual</th>
                      <th className="p-3 text-center min-w-[80px]">Status</th>
                      <th className="p-3 text-center min-w-[42px]">RAG</th>
                      <th className="p-3 text-center min-w-[96px]">Target Date</th>
                      <th className="p-3 text-right min-w-[80px]">Budget ($)</th>
                      <th className="p-3 min-w-[160px]">Issues / Blockers</th>
                      <th className="p-3 min-w-[130px]">Source & Review</th>
                      <th className="p-3 min-w-[150px]">Owner & Last Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pharaoh-500/8">
                    {treatmentFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="py-16 text-center text-sm text-pharaoh-500/40">
                          <div className="flex flex-col items-center gap-3">
                            <AlertTriangle size={24} className="opacity-40" />
                            <span>No risks match current filters</span>
                            <button onClick={() => { setSearch(''); setCatFilter('All'); setLevelFilter('All'); setStatusFilter('All') }}
                              className="text-[10px] px-4 py-1.5 rounded-lg border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-400/40 transition-colors">
                              Clear all filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : treatmentFiltered.map(r => {
                      const target = calcTarget(r)
                      const rag = ragDot(r.residualScore)
                      return (
                        <tr key={r._id || r.riskId}
                          className={`cursor-pointer transition-colors ${rowBg(r.inherentLevel)} ${hId === r.riskId ? 'ring-1 ring-amber-500/30 bg-amber-500/5' : ''} hover:bg-pharaoh-800/40`}
                          onClick={() => setSelectedRisk(r)}
                          onMouseEnter={() => setHId(r.riskId)}
                          onMouseLeave={() => setHId(null)}>
                          <td className="p-3 font-mono font-bold text-amber-400/90 sticky left-0 bg-[#070f1a] z-10" style={w('tr_riskId', 90)}>{r.riskId}</td>
                          <td className="p-3 font-bold text-pharaoh-200 sticky left-[90px] bg-[#070f1a] z-10" style={w('tr_riskTitle', 180)}>{r.riskTitle}</td>
                          <td className="p-3 text-pharaoh-400/60 whitespace-pre-line leading-relaxed text-[10px]">{r.existingControls || 'No controls in place'}</td>
                          <td className="p-3 font-mono font-black text-center text-amber-400/80">{r.residualScore ?? '—'}</td>
                          <td className="p-3 text-center"><span className={levelBadge(r.overallRisk)}>{r.overallRisk || '—'}</span></td>
                          <td className="p-3 font-medium text-pharaoh-300/80 capitalize">{r.treatment || '—'}</td>
                          <td className="p-3 text-pharaoh-200 font-medium whitespace-pre-line max-w-[200px] overflow-hidden text-ellipsis">{r.mitigationActions || '—'}</td>
                          <td className="p-3 font-mono text-center font-bold text-amber-400/80">{target}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              r.status === 'Open' ? 'bg-red-950/30 text-red-400 border border-red-500/20' :
                              r.status === 'In Progress' ? 'bg-amber-950/30 text-amber-400 border border-amber-500/20' :
                              'bg-green-950/30 text-green-400 border border-green-500/20'
                            }`}>
                              {r.status || 'Open'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-lg">{rag}</td>
                          <td className="p-3 font-mono text-center font-bold text-pharaoh-400/70">{r.deadline || '—'}</td>
                          <td className="p-3 font-mono font-bold text-right text-emerald-400/70">{r.budget}</td>
                          <td className="p-3 max-w-[160px] overflow-hidden text-ellipsis text-[10px]"
                            style={r.issuesBlockers && !['None','—',''].includes(r.issuesBlockers) ? { color: '#dc3545' } : { color: 'rgba(206,212,218,0.5)' }}>
                            {r.issuesBlockers}
                          </td>
                          <td className="p-3 font-mono text-pharaoh-500/50 text-[10px]">{r.riskSource} | {r.reviewFreq}</td>
                          <td className="p-3 font-medium text-pharaoh-300/80">
                            <span className="block text-[10px] text-pharaoh-500/50 font-mono">{r.lastReview}</span>
                            <span className="font-bold text-pharaoh-200">{r.owner}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 border-t border-pharaoh-500/8 flex items-center justify-between text-[10px] text-pharaoh-500/40">
                  <span>WADJET GRC Risk Register · Treatment View · {treatmentFiltered.length} risks (open / needs controls)</span>
                  <span>RAG: 🔴 ≥15 · 🟡 ≥10 · 🟢 &lt;10</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Detail side panel */}
      {selectedRisk && (
        <RiskDetailPanel
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
          onStatusChange={handleStatusChange}
          onEdit={(r) => { setSelectedRisk(null); setEditRisk(r) }}
          onDelete={(r) => setConfirmDelete(r)}
          mappings={riskMappings}
          enrichedMetrics={enrichedMetrics}
          riskControlMaps={riskControlMaps}
          onOpenControlBrowser={() => setShowControlBrowser(true)}
          onOpenLinkMetric={() => setShowLinkMetricModal(true)}
          suggestions={suggestions}
          onApproveSuggestion={handleApproveSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onUpdateMapping={handleUpdateMapping}
          onDeleteMapping={handleDeleteMapping}
        />
      )}

      {/* Add / Edit Risk Modal */}
      {((showAddModal && !auditorMode) || editRisk) && (
        <AddRiskModal
          onClose={() => { setShowAddModal(false); setEditRisk(null) }}
          onSave={editRisk ? handleEditRisk : handleAddRisk}
          existingIds={risks.map(r => r.riskId)}
          editRisk={editRisk}
        />
      )}

      {/* Control Browser */}
      {showControlBrowser && selectedRisk && (
        <ControlBrowser
          riskId={selectedRisk._id}
          linkedControlIds={new Set(riskControlMaps.map(m => m.controlId))}
          onLink={async (controlId, frameworkCode, controlRef, mappingType) => {
            await fetch('/api/risk-control-maps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                riskId: selectedRisk._id,
                controlId,
                frameworkCode,
                controlRef: controlRef || '',
                mappingType: mappingType || 'Supporting',
              }),
            })
            // Refresh
            const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk._id}`)
            const data = await r.json()
            setRiskControlMaps(data.items || [])
            // Refresh global set
            const r2 = await fetch('/api/risk-control-maps')
            const data2 = await r2.json()
            setRiskIdsWithMapping(new Set((data2.items || []).map(m => m.riskId)))
          }}
          onUnlink={async (mapId) => {
            await fetch(`/api/risk-control-maps/${mapId}`, { method: 'DELETE' })
            const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk._id}`)
            const data = await r.json()
            setRiskControlMaps(data.items || [])
            const r2 = await fetch('/api/risk-control-maps')
            const data2 = await r2.json()
            setRiskIdsWithMapping(new Set((data2.items || []).map(m => m.riskId)))
          }}
          onClose={() => setShowControlBrowser(false)}
        />
      )}

      {/* Link Metric Modal */}
      {showLinkMetricModal && selectedRisk && (
        <LinkMetricModal
          riskId={selectedRisk._id}
          linkedCatalogIds={linkedCatalogIds}
          onSave={handleSaveMetricMappings}
          onClose={() => setShowLinkMetricModal(false)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-[420px] bg-[#070f1a] border border-pharaoh-500/20 rounded-2xl p-6 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/20">
                <AlertTriangle size={16} style={{ color: '#dc3545' }} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-pharaoh-100">Delete Risk</h2>
                <p className="text-[10px] text-pharaoh-500/50">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-pharaoh-400/80 mb-4">
              Are you sure you want to delete <span className="text-pharaoh-200 font-semibold">{confirmDelete.riskTitle}</span> ({confirmDelete.riskId})?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-xs border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDeleteRisk(confirmDelete._id)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white"
                style={{ background: '#dc3545' }}>
                <Trash2 size={12} className="inline mr-1" />Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
