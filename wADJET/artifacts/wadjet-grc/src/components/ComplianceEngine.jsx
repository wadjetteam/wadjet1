import { useState, useEffect, useMemo, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { Upload, Shield, FileText, CheckCircle, X, Database, ArrowLeftRight, Layers, User, Tag, Calendar, Download, ToggleLeft, ToggleRight, AlertTriangle, Search, ChevronDown, ChevronUp, Info, Filter, Activity } from 'lucide-react'
import { downloadCompliancePDF, downloadComplianceCSV } from '../lib/downloadUtils'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const EMERALD = '#20c997'
const AMBER = '#fd7e14'
const CRIMSON = '#dc3545'

const TEMPLATES = {
  'Update Policy': 'Policy document needs to be updated to reflect current requirements. Evidence of version control and approval workflow attached.',
  'Missing Evidence': 'No evidence of control implementation was provided. Required: screenshots, configuration exports, or signed attestation.',
  'Partially Met': 'Control is partially implemented. Gap identified in [specific area]. Remediation plan submitted with target date.',
  'Fully Compliant': 'All requirements reviewed and confirmed compliant. Evidence verified and approved.',
  'Procedure Gap': 'Technical control exists but supporting procedure/documentation is missing or outdated.',
  'Training Gap': 'Staff awareness/training records for this control requirement could not be verified.',
}

const STATUS_COLOR = {
  'Compliant': { bg: 'rgba(32,201,151,0.12)', text: '#20c997', border: 'rgba(32,201,151,0.25)' },
  'Non-Compliant': { bg: 'rgba(220,53,69,0.12)', text: '#dc3545', border: 'rgba(220,53,69,0.25)' },
  'Partially Compliant': { bg: 'rgba(253,126,20,0.10)', text: '#fd7e14', border: 'rgba(253,126,20,0.22)' },
  'Not Assessed': { bg: 'rgba(134,142,150,0.08)', text: '#868e96', border: 'rgba(134,142,150,0.18)' },
  'Not Applicable': { bg: 'rgba(134,142,150,0.05)', text: '#6c757d', border: 'rgba(134,142,150,0.12)' },
}

export default function ComplianceEngine({ auditorMode }) {
  const [frameworks, setFrameworks] = useState([])
  const [domains, setDomains] = useState([])
  const [complianceData, setComplianceData] = useState(null)
  const [tripleMappings, setTripleMappings] = useState([])
  const [activeFwCodes, setActiveFwCodes] = useState([])
  const [activeTab, setActiveTab] = useState('matrix')
  const [loading, setLoading] = useState(true)
  const [selectedFw, setSelectedFw] = useState(null)
  const [assessing, setAssessing] = useState(null)
  const [assessForm, setAssessForm] = useState({ status: 'Not Assessed', score: 0, findings: '' })
  const [selectedControl, setSelectedControl] = useState(null)
  const [mapQ, setMapQ] = useState('')
  const [mapCatF, setMapCatF] = useState('')
  const [mapScoreF, setMapScoreF] = useState('')
  const [expandedMap, setExpandedMap] = useState({})
  const [detailControl, setDetailControl] = useState(null)
  const [assessMsg, setAssessMsg] = useState(null)
  const [statusQuickFilter, setStatusQuickFilter] = useState('')
  const [cascadeAssessment, setCascadeAssessment] = useState(false)


  const loadTriples = async () => {
    try {
      const res = await fetch('/api/triple-mappings')
      const data = await res.json()
      setTripleMappings(data.items || [])
    } catch {}
  }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [fwRes, domRes, triRes] = await Promise.all([
        fetch('/api/frameworks'),
        fetch('/api/domains'),
        fetch('/api/triple-mappings'),
      ])
      const fws = (await fwRes.json()).items || []
      const doms = (await domRes.json()).items || []
      const tris = (await triRes.json()).items || []
      setFrameworks(fws)
      setDomains(doms)
      setTripleMappings(tris)
      const initialActive = fws.map(f => f.code)
      setActiveFwCodes(initialActive)
      if (fws.length > 0) setSelectedFw(fws[0].code)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!selectedFw) return
    fetch(`/api/compliance/status?frameworkCode=${selectedFw}`)
      .then(r => r.json())
      .then(data => setComplianceData(data))
      .catch(() => {})
  }, [selectedFw])

  const activeFrameworks = frameworks.filter(f => activeFwCodes.includes(f.code))
  const selectedFramework = frameworks.find(f => f.code === selectedFw)
  const selectedDomains = domains.filter(d => d.frameworkCode === selectedFw)

  const toggleFramework = (code) => {
    setActiveFwCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const handleStatusChange = (status) => {
    const autoScore = { 'Compliant': 100, 'Partially Compliant': 50, 'Non-Compliant': 0, 'Not Assessed': 0, 'Not Applicable': 0 }
    const autoFindings = { 'Compliant': 'Control objective fully met. Evidence verified.', 'Partially Compliant': 'Partial compliance — remediation required.', 'Non-Compliant': 'Control not implemented or failed.', 'Not Applicable': 'Control not applicable to current scope.', 'Not Assessed': '' }
    setAssessForm(prev => ({
      ...prev,
      status,
      score: autoScore[status] ?? prev.score,
      findings: autoFindings[status] ?? prev.findings,
    }))
  }

  const handleAssess = async (controlId) => {
    if (auditorMode) return
    try {
      if (assessForm.isOverride) {
        if (!assessForm.overrideReason || assessForm.overrideReason.trim().length < 10) {
          setAssessMsg('✗ Override reason must be at least 10 characters');
          setTimeout(() => setAssessMsg(null), 3000);
          return;
        }
        const assessRes = await fetch('/api/compliance/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controlId,
            frameworkCode: selectedFw,
            status: assessForm.status,
            score: Number(assessForm.score),
            overrideReason: assessForm.overrideReason.trim(),
          }),
        });
        if (!assessRes.ok) {
          const errData = await assessRes.json();
          throw new Error(errData.error || 'Override failed');
        }
        setAssessMsg(`✓ Override: ${assessForm.status} (${assessForm.score}%) — reason logged`);
      } else {
        const body = JSON.stringify({
          controlId,
          frameworkCode: selectedFw,
          status: assessForm.status,
          score: Number(assessForm.score),
          findings: assessForm.findings || '',
          assessedBy: 'Current User',
          assessedAt: new Date().toISOString(),
          source: 'MANUAL',
        });
        const assessRes = await fetch('/api/compliance/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        if (!assessRes.ok) throw new Error('Assessment failed');
        setAssessMsg(`✓ ${selectedFw}: ${assessForm.status} (${assessForm.score}%)`);
        // Cascade to mapped frameworks
        if (cascadeAssessment) {
          const relatedMappings = tripleMappings.filter(m =>
            (m.isoRef === controlId || m.cbeRef === controlId || m.pciRef === controlId) &&
            (m.isoAssessment && m.cbeAssessment && m.pciAssessment)
          )
          if (relatedMappings.length > 0) {
            const mapped = relatedMappings[0]
            const cascadeTargets = []
            const currentFw = selectedFw
            if (currentFw !== 'ISO 27001-2022' && mapped.isoRef && mapped.isoRef !== controlId) cascadeTargets.push({ fw: 'ISO 27001-2022', ctrl: mapped.isoRef })
            if (currentFw !== 'CBE' && mapped.cbeRef && mapped.cbeRef !== controlId) cascadeTargets.push({ fw: 'CBE', ctrl: mapped.cbeRef })
            if (currentFw !== 'PCI DSS v4.0' && mapped.pciRef && mapped.pciRef !== controlId) cascadeTargets.push({ fw: 'PCI DSS v4.0', ctrl: mapped.pciRef })
            for (const target of cascadeTargets) {
              await fetch('/api/compliance/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  controlId: target.ctrl,
                  frameworkCode: target.fw,
                  status: assessForm.status,
                  score: Number(assessForm.score),
                  findings: `[Cascaded from ${selectedFw}] ${assessForm.findings || ''}`,
                  assessedBy: 'Current User',
                  assessedAt: new Date().toISOString(),
                  source: 'MANUAL',
                }),
              }).catch(() => {})
            }
            if (cascadeTargets.length > 0) setAssessMsg(`✓ ${assessForm.status} — cascaded to ${cascadeTargets.length} mapped control(s)`)
          }
        }
      }
      setTimeout(() => setAssessMsg(null), 3000);
      setAssessing(null);
      setCascadeAssessment(false)
      setAssessForm({ status: 'Not Assessed', score: 0, findings: '', overrideReason: '', isOverride: false });
      const [statusRes] = await Promise.all([
        fetch(`/api/compliance/status?frameworkCode=${selectedFw}`),
        loadTriples(),
      ]);
      const statusData = await statusRes.json();
      setComplianceData(statusData);
    } catch (err) {
      console.error('Assess error:', err);
      setAssessMsg('✗ Assessment failed');
      setTimeout(() => setAssessMsg(null), 3000);
    }
  }

  const categories = [...new Set(tripleMappings.map(m => m.category))]
  const catCount = c => tripleMappings.filter(m => m.category === c).length

  const filteredTriples = useMemo(() => {
    let items = tripleMappings
    if (mapCatF) items = items.filter(m => m.category === mapCatF)
    if (mapScoreF) items = items.filter(m => m.score === mapScoreF)
    if (mapQ) {
      const lq = mapQ.toLowerCase()
      items = items.filter(m =>
        m.mapId.toLowerCase().includes(lq) ||
        m.isoRef.toLowerCase().includes(lq) ||
        m.isoTitle.toLowerCase().includes(lq) ||
        m.cbeRef.toLowerCase().includes(lq) ||
        m.pciRef.toLowerCase().includes(lq) ||
        m.rationale.toLowerCase().includes(lq)
      )
    }
    return items
  }, [mapQ, mapCatF, mapScoreF, tripleMappings])

  const statusBadge = (s) => {
    if (!s) return <span className="text-[8px] text-pharaoh-500/30">–</span>
    const cols = {
      'Compliant': { bg: 'rgba(32,201,151,0.18)', fg: EMERALD, icon: '✓' },
      'Partially Compliant': { bg: 'rgba(253,126,20,0.15)', fg: AMBER, icon: '◐' },
      'Non-Compliant': { bg: 'rgba(220,53,69,0.15)', fg: CRIMSON, icon: '✗' },
    }
    const c = cols[s.status] || { bg: 'rgba(134,142,150,0.08)', fg: '#868e96', icon: '?' }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap inline-flex items-center gap-1" style={{ background: c.bg, color: c.fg }}>
        <span className="text-[11px]">{c.icon}</span>
        {s.status}
      </span>
    )
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="text-pharaoh-400/60 text-sm">Loading compliance data...</div></div>
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Cross-Framework Compliance Engine</h1>
          <p className="page-subtitle">Unified compliance mapping across regulatory frameworks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCompliancePDF(activeFrameworks, [])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300">
            <Download size="12" /> Export PDF
          </button>
          <button onClick={() => downloadComplianceCSV(activeFrameworks, [])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green">
            <Download size="12" /> Export Excel
          </button>
        </div>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-4 gap-3 animate-fade-in">
        {frameworks.map(fw => (
          <div key={fw.code} className={`pharaoh-card p-4 transition-all duration-300 ${!activeFwCodes.includes(fw.code) ? 'opacity-40 grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-pharaoh-400/60">{fw.authority?.split(' ')[0]}</span>
              {!auditorMode ? (
                <button onClick={() => toggleFramework(fw.code)} className="transition-all hover:scale-105">
                  {activeFwCodes.includes(fw.code) ? <ToggleRight size="20" className="text-pharaoh-400" /> : <ToggleLeft size="20" className="text-pharaoh-500/40" />}
                </button>
              ) : (
                <span className={`text-[9px] font-medium ${activeFwCodes.includes(fw.code) ? 'text-egyptian-green' : 'text-pharaoh-500/40'}`}>{activeFwCodes.includes(fw.code) ? 'Active' : 'Inactive'}</span>
              )}
            </div>
            <div className="text-xs font-semibold text-pharaoh-200 mb-1">{fw.name}</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold font-mono text-pharaoh-200">{fw.controlCount}</span>
              <span className="text-[10px] text-pharaoh-500/40 font-mono">controls</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-pharaoh-500/5 overflow-hidden">
              <div className="h-full rounded-full bg-pharaoh-400/40 transition-all duration-500" style={{ width: `${Math.min(100, fw.controlCount)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Framework Selector + Score */}
      <div className="pharaoh-card p-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <span className="text-xs text-pharaoh-400/60 font-medium">Select Framework:</span>
          <div className="flex gap-1">
            {frameworks.map(fw => (
              <button key={fw.code} onClick={() => setSelectedFw(fw.code)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${selectedFw === fw.code ? 'gold-gradient text-nile-900' : 'text-pharaoh-400/60 border border-pharaoh-500/15 hover:text-pharaoh-300'}`}>
                {fw.code}
              </button>
            ))}
          </div>
          {complianceData && (
              <div className="ml-auto flex items-center gap-4">
                <span className="text-xs text-pharaoh-500/40">
                  {complianceData.total - (complianceData.notApplicable || 0)} / {complianceData.total} in scope
                  <span className="ml-1.5 text-pharaoh-500/30">
                    ({complianceData.notAssessed} remaining)
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#20c997' }} />
                  <span className="text-[10px] text-pharaoh-500/40">{complianceData.compliant}</span>
                  <div className="w-1.5 h-1.5 rounded-full ml-2" style={{ background: '#fd7e14' }} />
                  <span className="text-[10px] text-pharaoh-500/40">{complianceData.partial}</span>
                  <div className="w-1.5 h-1.5 rounded-full ml-2" style={{ background: '#dc3545' }} />
                  <span className="text-[10px] text-pharaoh-500/40">{complianceData.nonCompliant}</span>
                  <div className="w-1.5 h-1.5 rounded-full ml-2" style={{ background: '#6c757d' }} />
                  <span className="text-[10px] text-pharaoh-500/40">{complianceData.notApplicable || 0} N/A</span>
                  <div className="w-1.5 h-1.5 rounded-full ml-2" style={{ background: '#868e96' }} />
                  <span className="text-[10px] text-pharaoh-500/40">{complianceData.notAssessed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-lg font-bold font-mono ${(complianceData.overallScore || 0) >= 70 ? 'text-egyptian-green' : (complianceData.overallScore || 0) >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {complianceData.overallScore ?? 0}%
                  </span>
                  {(complianceData.overallScore || 0) < 70 && (
                    <span className="text-[8px] text-pharaoh-500/40">{Math.round(70 - (complianceData.overallScore || 0))} pts to green</span>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 pharaoh-card rounded-xl p-1 w-fit animate-fade-in">
        {[
          { id: 'matrix', label: 'Framework Matrix', icon: Layers },
          { id: 'controls', label: 'Control Assessment', icon: Shield },
          { id: 'mapping', label: 'Cross-Mappings', icon: ArrowLeftRight },
          { id: 'evidence', label: 'Evidence Vault', icon: Database },
          { id: 'tracker', label: 'Tracker', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20' : 'text-pharaoh-500/40 hover:text-pharaoh-300'}`}>
              <Icon size="16" /><span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Assessment Toast */}
      {assessMsg && (
        <div className="fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in"
          style={{
            background: assessMsg.startsWith('✓') ? 'rgba(32,201,151,0.15)' : 'rgba(220,53,69,0.15)',
            color: assessMsg.startsWith('✓') ? '#20c997' : '#dc3545',
            border: `1px solid ${assessMsg.startsWith('✓') ? 'rgba(32,201,151,0.3)' : 'rgba(220,53,69,0.3)'}`,
            backdropFilter: 'blur(12px)',
          }}>
          {assessMsg}
        </div>
      )}

      {/* Tab: Control Assessment */}
      {activeTab === 'controls' && (
        <div className="animate-fade-in space-y-4">
          {selectedDomains.map(domain => {
            const domainControls = complianceData?.controls.filter(c => c.domainCode === domain.code) || []
            if (domainControls.length === 0) return null
            const done = domainControls.filter(c => c.status !== 'Not Assessed').length
            return (
              <div key={domain.code} className="pharaoh-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-pharaoh-300">{domain.code} — {domain.name}</span>
                    <span className="text-[10px] text-pharaoh-500/40 ml-2">{done}/{domainControls.length} assessed</span>
                  </div>
                  <div className="h-1.5 w-32 rounded-full bg-pharaoh-800/40 overflow-hidden">
                    <div className="h-full rounded-full bg-pharaoh-400/50" style={{ width: `${done/domainControls.length*100}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  {domainControls.map(c => {
                    const sc = STATUS_COLOR[c.status] || STATUS_COLOR['Not Assessed']
                    return (
                      <div key={c._id}>
                        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-pharaoh-500/5 transition-all">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-[10px] font-mono text-pharaoh-500/50 w-16">{c.controlId}</span>
                            <button onClick={() => setDetailControl(detailControl?._id === c._id ? null : c)}
                              className="text-[11px] text-pharaoh-200 truncate hover:text-pharaoh-100 transition-all text-left flex-1">
                              {c.name}
                            </button>
                            <button onClick={() => setDetailControl(detailControl?._id === c._id ? null : c)}
                              className="text-pharaoh-500/30 hover:text-pharaoh-300 transition-all p-1">
                              <Info size="12" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {c.status !== 'Not Assessed' && <span className="text-[10px] font-mono text-pharaoh-500/50">{c.score}%</span>}
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{c.status}</span>
                            {c.assessment?.source && c.assessment.source !== 'MANUAL' && (
                              <span className={`text-[7px] px-1 py-0.5 rounded uppercase font-bold ${
                                c.assessment.source === 'AUTOMATION' ? 'text-blue-400 bg-blue-900/20' : 'text-amber-400 bg-amber-900/20'
                              }`}>{c.assessment.source}</span>
                            )}
                            {!auditorMode && (
                              assessing === c._id ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    <select value={assessForm.status} onChange={e => handleStatusChange(e.target.value)}
                                      className="text-[9px] bg-pharaoh-900 border border-pharaoh-500/20 rounded px-1 py-0.5 text-pharaoh-300">
                                      {Object.keys(STATUS_COLOR).map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    <input type="number" min="0" max="100" value={assessForm.score} onChange={e => setAssessForm(f => ({ ...f, score: e.target.value }))}
                                      className="text-[9px] bg-pharaoh-900 border border-pharaoh-500/20 rounded px-1 py-0.5 text-pharaoh-300 w-12" />
                                    <button onClick={() => handleAssess(c._id)} className="text-[9px] px-1.5 py-0.5 rounded bg-egyptian-green/20 text-egyptian-green"><CheckCircle size="10" /></button>
                                    <button onClick={() => setAssessing(null)} className="text-[9px] px-1.5 py-0.5 rounded text-pharaoh-500/40"><X size="10" /></button>
                                  </div>
                                  {/* Template Chips */}
                                  <div className="flex gap-1 flex-wrap max-w-[260px]">
                                    {Object.keys(TEMPLATES).map(t => (
                                      <button key={t} onClick={() => setAssessForm(f => ({ ...f, findings: TEMPLATES[t] }))}
                                        className="text-[7px] px-1.5 py-0.5 rounded-full border border-pharaoh-500/15 text-pharaoh-500/40 hover:text-pharaoh-300 hover:border-pharaoh-500/30 transition-all">
                                        {t}
                                      </button>
                                    ))}
                                  </div>
                                  <textarea value={assessForm.findings || ''} onChange={e => setAssessForm(f => ({ ...f, findings: e.target.value }))}
                                    placeholder="Assessment notes"
                                    className="text-[9px] bg-pharaoh-900 border border-pharaoh-500/15 rounded px-2 py-1 text-pharaoh-300 outline-none w-56 h-12 resize-none placeholder-pharaoh-500/40" />
                                  {/* Cascade Checkbox */}
                                  {!assessForm.isOverride && (
                                    <label className="flex items-center gap-1 text-[8px] text-pharaoh-500/40 cursor-pointer select-none">
                                      <input type="checkbox" checked={cascadeAssessment} onChange={e => setCascadeAssessment(e.target.checked)}
                                        className="accent-pharaoh-400" />
                                      Cascade to mapped frameworks
                                    </label>
                                  )}
                                  {assessForm.isOverride && (
                                    <textarea value={assessForm.overrideReason || ''} onChange={e => setAssessForm(f => ({ ...f, overrideReason: e.target.value }))}
                                      placeholder="Override reason (min 10 characters, required for audit)"
                                      className="text-[9px] bg-pharaoh-900 border border-amber-400/20 rounded px-2 py-1 text-pharaoh-300 outline-none w-56 h-12 resize-none placeholder-pharaoh-500/40" />
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => { setAssessing(c._id); setAssessForm({ status: c.status, score: c.score, findings: '', overrideReason: '' }); setCascadeAssessment(false) }}
                                    className="text-[9px] px-1.5 py-0.5 rounded border border-pharaoh-500/15 text-pharaoh-500/40 hover:text-pharaoh-300 transition-all">Assess</button>
                                  {c.assessment?.source === 'AUTOMATION' && (
                                    <button onClick={() => { setAssessing(c._id); setAssessForm({ status: c.status, score: c.score, findings: '', overrideReason: '', isOverride: true }); setCascadeAssessment(false) }}
                                      className="text-[9px] px-1.5 py-0.5 rounded border border-amber-400/20 text-amber-400 hover:bg-amber-400/10 transition-all">Override</button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        {/* Control Detail Panel */}
                        {detailControl?._id === c._id && (
                          <div className="mx-3 mb-2 p-4 rounded-xl border border-pharaoh-500/15 bg-pharaoh-900/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Shield size="14" color={GOLD} />
                                <span className="text-xs font-bold text-pharaoh-200">{c.controlId} — {c.name}</span>
                              </div>
                              <button onClick={() => setDetailControl(null)} className="text-pharaoh-500/40 hover:text-pharaoh-200">
                                <X size="14" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-pharaoh-500/40 font-medium">Purpose</span>
                                <p className="text-xs text-pharaoh-300 mt-1 leading-relaxed">{c.purpose || 'No purpose defined'}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-pharaoh-500/40 font-medium">Guidance</span>
                                <p className="text-xs text-pharaoh-300 mt-1 leading-relaxed">{c.guidance || 'No guidance defined'}</p>
                              </div>
                            </div>
                            {c.assessment && (
                              <div className="mt-3 pt-3 border-t border-pharaoh-500/10 space-y-2">
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider text-pharaoh-500/40 font-medium">Assessment Notes</span>
                                  <p className="text-xs text-pharaoh-300 mt-1">{c.assessment.findings || 'No assessment notes'}</p>
                                </div>
                                <div className="flex gap-4 text-[9px]">
                                  <span className="text-pharaoh-500/40">Source: <strong className={c.assessment.source === 'AUTOMATION' ? 'text-blue-400' : c.assessment.source === 'OVERRIDE' ? 'text-amber-400' : 'text-pharaoh-300'}>{c.assessment.source || 'MANUAL'}</strong></span>
                                  {c.assessment.overrideReason && <span className="text-pharaoh-500/40">Override: <em className="text-amber-400">{c.assessment.overrideReason}</em></span>}
                                  {c.assessment.overrideExpiresAt && <span className="text-pharaoh-500/40">Cooldown until: {new Date(c.assessment.overrideExpiresAt).toLocaleString()}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Cross-Mappings — EXCEL FORMAT */}
      {activeTab === 'mapping' && (
        <div className="animate-fade-in space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center pharaoh-card p-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pharaoh-500/15 bg-pharaoh-900/30">
              <Search size="12" color="rgba(206,212,218,0.35)" />
              <input value={mapQ} onChange={e => setMapQ(e.target.value)} placeholder="Search ID, ISO, CBE, PCI..."
                className="bg-transparent border-none text-[11px] text-pharaoh-300 outline-none w-48 placeholder-pharaoh-500/40" />
            </div>
            <select value={mapCatF} onChange={e => setMapCatF(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-pharaoh-500/15 bg-pharaoh-900/30 text-[11px] text-pharaoh-300 outline-none">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c} ({catCount(c)})</option>)}
            </select>
            <select value={mapScoreF} onChange={e => setMapScoreF(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-pharaoh-500/15 bg-pharaoh-900/30 text-[11px] text-pharaoh-300 outline-none">
              <option value="">All Scores</option>
              <option value="3/3">3/3 — Full Coverage</option>
              <option value="2/3">2/3 — Partial Gap</option>
            </select>
            <span className="text-[10px] text-pharaoh-500/40 ml-auto">{filteredTriples.length} of {tripleMappings.length} mappings</span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="pharaoh-card p-3 text-center">
              <div className="text-[9px] uppercase tracking-wider text-pharaoh-500/40">Total Mappings</div>
              <div className="text-xl font-bold font-mono text-pharaoh-200">{tripleMappings.length}</div>
            </div>
            <div className="pharaoh-card p-3 text-center">
              <div className="text-[9px] uppercase tracking-wider text-pharaoh-500/40">Full Coverage (3/3)</div>
              <div className="text-xl font-bold font-mono" style={{ color: EMERALD }}>{tripleMappings.filter(m => m.score === '3/3').length}</div>
            </div>
            <div className="pharaoh-card p-3 text-center">
              <div className="text-[9px] uppercase tracking-wider text-pharaoh-500/40">Partial Gap (2/3)</div>
              <div className="text-xl font-bold font-mono" style={{ color: AMBER }}>{tripleMappings.filter(m => m.score === '2/3').length}</div>
            </div>
          </div>

          {/* Excel-style Table */}
          <div className="pharaoh-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-pharaoh-500/15" style={{ background: 'rgba(212,168,50,0.04)' }}>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: GOLD }}>Map ID</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>ISO Ref</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: GOLD }}>Category</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>ISO Control Title</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>ISO</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80' }}>CBE Ref</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80' }}>CBE Title</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80' }}>Str</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80' }}>CBE</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(168,85,247,0.08)', color: '#c084fc' }}>PCI Ref</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(168,85,247,0.08)', color: '#c084fc' }}>PCI Title</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(168,85,247,0.08)', color: '#c084fc' }}>Str</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(168,85,247,0.08)', color: '#c084fc' }}>PCI</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: GOLD }}>Score</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: GOLD }}>Gap</th>
                    <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: GOLD }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTriples.map((m, idx) => {
                    const scoreColor = m.score === '3/3' ? EMERALD : AMBER
                    return (
                      <tr key={idx} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                        <td className="py-2 px-2 font-mono font-semibold" style={{ color: GOLD }} title={m.rationale}>{m.mapId}</td>
                        <td className="py-2 px-2 font-mono text-pharaoh-300" style={{ background: 'rgba(59,130,246,0.03)' }}>{m.isoRef}</td>
                        <td className="py-2 px-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,168,50,0.08)', color: GOLD }}>
                            {m.category}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-pharaoh-200 max-w-[130px] truncate" title={m.isoTitle} style={{ background: 'rgba(59,130,246,0.03)' }}>{m.isoTitle}</td>
                        <td className="py-2 px-2" style={{ background: 'rgba(59,130,246,0.03)' }}>{statusBadge(m.isoAssessment)}</td>
                        <td className="py-2 px-2 font-mono text-pharaoh-300" style={{ background: 'rgba(34,197,94,0.03)' }}>{m.cbeRef}</td>
                        <td className="py-2 px-2 max-w-[140px] truncate text-pharaoh-400" title={m.cbeTitle} style={{ background: 'rgba(34,197,94,0.03)' }}>{m.cbeTitle}</td>
                        <td className="py-2 px-2" style={{ background: 'rgba(34,197,94,0.03)' }}>
                          {m.cbeStrength !== '—' && (
                            <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${
                              m.cbeStrength === 'Direct' ? 'text-emerald-400 bg-emerald-950/30' :
                              'text-amber-400 bg-amber-950/30'
                            }`}>{m.cbeStrength}</span>
                          )}
                        </td>
                        <td className="py-2 px-2" style={{ background: 'rgba(34,197,94,0.03)' }}>{statusBadge(m.cbeAssessment)}</td>
                        <td className="py-2 px-2 font-mono text-pharaoh-300" style={{ background: 'rgba(168,85,247,0.03)' }}>{m.pciRef}</td>
                        <td className="py-2 px-2 max-w-[140px] truncate text-pharaoh-400" title={m.pciTitle} style={{ background: 'rgba(168,85,247,0.03)' }}>{m.pciTitle}</td>
                        <td className="py-2 px-2" style={{ background: 'rgba(168,85,247,0.03)' }}>
                          {m.pciStrength !== '—' && (
                            <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${
                              m.pciStrength === 'Direct' ? 'text-emerald-400 bg-emerald-950/30' :
                              'text-amber-400 bg-amber-950/30'
                            }`}>{m.pciStrength}</span>
                          )}
                        </td>
                        <td className="py-2 px-2" style={{ background: 'rgba(168,85,247,0.03)' }}>{statusBadge(m.pciAssessment)}</td>
                        <td className="py-2 px-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{
                            background: `${scoreColor}15`, color: scoreColor,
                            border: `1px solid ${scoreColor}30`
                          }}>{m.score}</span>
                        </td>
                        <td className="py-2 px-2">
                          {m.gapFlag.includes('Full') ? (
                            <span className="text-[9px]" style={{ color: EMERALD }}>✓ Full</span>
                          ) : (
                            <span className="text-[9px]" style={{ color: AMBER }}>◐ Partial</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <span title={m.rationale} className="cursor-help text-pharaoh-500/30 hover:text-pharaoh-300 transition-all"><Info size="11" /></span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredTriples.length === 0 && (
                <div className="text-center py-10">
                  <span className="text-xs text-pharaoh-500/40">No mappings match your filters</span>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Rationale */}
          {filteredTriples.filter((_, idx) => expandedMap[idx]).map((m, idx) => expandedMap[idx] && (
            <div key={'r-'+idx} className="pharaoh-card p-4 border-l-2" style={{ borderLeftColor: m.score === '3/3' ? EMERALD : AMBER }}>
              <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: GOLD }}>
                Rationale — {m.mapId} ({m.isoRef})
              </div>
              <p className="text-[11px] leading-relaxed text-pharaoh-300">{m.rationale}</p>
              <div className="flex gap-4 mt-2 text-[9px] text-pharaoh-500/40">
                <span>ISO: {m.isoRef}</span>
                <span>CBE: {m.cbeRef}</span>
                <span>PCI: {m.pciRef || '—'}</span>
              </div>
            </div>
          ))}

          <div className="text-[9px] text-pharaoh-500/30 text-center pb-2">
            Data source: Unified Triple Cross-Mapping — ISO 27001:2022 (Clauses 4–10 + Annex A) ↔ CBE Egypt CSF ↔ PCI DSS v4.0
          </div>
        </div>
      )}

      {/* Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="animate-fade-in">
          <div className="pharaoh-card p-5">
            <h3 className="text-sm font-semibold text-pharaoh-200 mb-1">Compliance Status per Domain</h3>
            <p className="text-xs text-pharaoh-400/70 mb-3">{selectedFramework?.name || 'Select a framework'}</p>
            {/* Quick-Action Filters */}
            <div className="flex items-center gap-1 mb-4">
              {['', 'Gaps', 'Pending', 'At Risk', 'Compliant'].map(f => (
                <button key={f} onClick={() => setStatusQuickFilter(f === statusQuickFilter ? '' : f)}
                  className={`px-2 py-1 text-[9px] rounded-lg transition-all ${statusQuickFilter === f ? 'bg-pharaoh-500/20 text-pharaoh-200' : 'text-pharaoh-500/40 hover:text-pharaoh-300'}`}>
                  {f || 'All'}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {selectedDomains.map(domain => {
                let domainControls = complianceData?.controls.filter(c => c.domainCode === domain.code) || []
                if (domainControls.length === 0) return null
                if (statusQuickFilter === 'Gaps') domainControls = domainControls.filter(c => c.status === 'Not Assessed')
                else if (statusQuickFilter === 'Pending') domainControls = domainControls.filter(c => c.status === 'Partially Compliant')
                else if (statusQuickFilter === 'At Risk') domainControls = domainControls.filter(c => c.status === 'Non-Compliant' || c.status === 'Not Assessed')
                else if (statusQuickFilter === 'Compliant') domainControls = domainControls.filter(c => c.status === 'Compliant')
                const avgScore = domainControls.length > 0 ? Math.round(domainControls.reduce((s, c) => s + (c.score || 0), 0) / domainControls.length) : 0
                return (
                  <div key={domain.code} className="p-3 rounded-xl bg-pharaoh-900/20 border border-pharaoh-500/8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-pharaoh-300">{domain.code}: {domain.name}</span>
                      <span className="text-sm font-bold font-mono text-pharaoh-400">{avgScore}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-pharaoh-800/40 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${avgScore}%`, background: avgScore >= 70 ? 'linear-gradient(90deg, #20c997, #20c997)' : avgScore >= 40 ? 'linear-gradient(90deg, #fd7e14, #d4a832)' : 'linear-gradient(90deg, #dc3545, #fd7e14)' }} />
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      {['Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Assessed'].map(s => {
                        const count = domainControls.filter(c => c.status === s).length
                        if (count === 0) return null
                        return <span key={s} className="text-[9px] text-pharaoh-500/40">{s}: {count}</span>
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Evidence Tab */}
      {activeTab === 'evidence' && <EvidenceTab auditorMode={auditorMode} />}

      {/* Tracker Tab */}
      {activeTab === 'tracker' && <TrackerTab />}
    </div>
  )
}

function EvidenceTab({ auditorMode }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [evList, setEvList] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapTargets, setMapTargets] = useState({})
  const [detailId, setDetailId] = useState(null)
  const fileInputRef = useRef(null)

  const loadEvidences = async () => {
    try {
      const res = await fetch('/api/evidence')
      const d = await res.json()
      setEvList(d.items || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { loadEvidences() }, [])

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024; const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (!uploadedFile) return
    const form = new FormData()
    form.append('file', uploadedFile)
    try {
      await fetch('/api/evidence/upload', { method: 'POST', body: form })
      setUploadedFile(null)
      await loadEvidences()
    } catch (err) { console.error('Upload failed', err) }
  }

  const handleDelete = async (id, approved) => {
    if (approved) return alert('Approved evidence cannot be deleted (immutable)')
    if (!confirm('Delete this evidence?')) return
    try {
      await fetch(`/api/evidence/${id}`, { method: 'DELETE' })
      await loadEvidences()
    } catch (err) { console.error('Delete failed', err) }
  }

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/evidence/${id}/approve`, { method: 'POST' })
      await loadEvidences()
    } catch (err) { console.error('Approve failed', err) }
  }

  const handleMap = async (evidenceId, controlIds) => {
    if (!controlIds || controlIds.length === 0) return
    try {
      await fetch(`/api/evidence/${evidenceId}/map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controlIds, frameworkCode: 'ISO27001' }),
      })
      setMapTargets(p => ({ ...p, [evidenceId]: '' }))
      await loadEvidences()
    } catch (err) { console.error('Map failed', err) }
  }

  return (
    <div className="grid grid-cols-1 gap-5 animate-fade-in">
      {/* Upload Area */}
      <div className="pharaoh-card p-5">
        <h3 className="text-sm font-semibold text-pharaoh-200 mb-1">Evidence Vault</h3>
        <p className="text-xs text-pharaoh-400/70 mb-5">Upload evidence files for compliance audit trail</p>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadedFile(f) }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-pharaoh-400 bg-pharaoh-500/10' : 'border-pharaoh-500/20 hover:border-pharaoh-500/40'}`}>
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) setUploadedFile(f) }} accept=".pdf,.doc,.docx,.xlsx,.png,.jpg" />
              <Upload size="24" className={`mx-auto mb-2 ${dragOver ? 'text-pharaoh-400' : 'text-pharaoh-500/40'}`} />
              <p className="text-xs text-pharaoh-400/60">{dragOver ? 'Drop file here' : 'Drag & drop or click to browse'}</p>
              <p className="text-[10px] text-pharaoh-500/40">PDF, DOC, XLSX, PNG — max 50MB</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {uploadedFile && (
              <div className="p-2 px-3 rounded-lg bg-egyptian-green/10 border border-egyptian-green/20 flex items-center gap-2 max-w-[240px]">
                <FileText size="14" className="text-egyptian-green flex-shrink-0" />
                <span className="text-[10px] text-pharaoh-300 truncate flex-1">{uploadedFile.name}</span>
                <span className="text-[9px] text-pharaoh-500/40">{formatSize(uploadedFile.size)}</span>
                <button onClick={() => setUploadedFile(null)} className="text-pharaoh-500/40 hover:text-red-400"><X size="12" /></button>
              </div>
            )}
            <button onClick={handleUpload} disabled={!uploadedFile || auditorMode}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 gold-gradient text-nile-900">
              {auditorMode ? 'Upload Disabled' : 'Upload Evidence'}
            </button>
          </div>
        </div>
      </div>

      {/* Evidence List */}
      <div className="pharaoh-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-pharaoh-200">Uploaded Evidence</h3>
          <span className="text-[10px] text-pharaoh-500/40">{evList.length} files</span>
        </div>
        {loading ? (
          <div className="text-center py-8 text-xs text-pharaoh-500/40">Loading...</div>
        ) : evList.length === 0 ? (
          <div className="text-center py-8 text-xs text-pharaoh-500/40">No evidence uploaded yet</div>
        ) : (
          <div className="space-y-2">
            {evList.map(ev => (
              <div key={ev._id} className="p-3 rounded-xl bg-pharaoh-900/20 border border-pharaoh-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText size="16" className="text-pharaoh-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-pharaoh-200 truncate font-medium">{ev.fileName}</p>
                      <div className="flex items-center gap-2 text-[9px] text-pharaoh-500/40">
                        <span>{formatSize(ev.fileSize)}</span>
                        <span>•</span>
                        <span className={ev.status === 'VERIFIED' ? 'text-egyptian-green' : 'text-amber-400'}>{ev.status}</span>
                        {ev.isApproved && <><span>•</span><span className="text-egyptian-green">Approved</span></>}
                        {ev.sha256Hash && <><span>•</span><span className="font-mono">{ev.sha256Hash.slice(0, 12)}...</span></>}
                      </div>
                      {ev.mappedControls?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ev.mappedControls.map((m, i) => (
                            <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-pharaoh-500/10 text-pharaoh-400">
                              {m.controlId.slice(0, 8)}... ({m.frameworkCode})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!ev.isApproved && (
                      <>
                        <button onClick={() => handleApprove(ev._id)}
                          className="text-[9px] px-2 py-1 rounded-lg border border-egyptian-green/20 text-egyptian-green hover:bg-egyptian-green/10 transition-all">
                          Approve
                        </button>
                        <button onClick={() => handleDelete(ev._id, ev.isApproved)}
                          className="text-[9px] px-2 py-1 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all">
                          Delete
                        </button>
                      </>
                    )}
                    <button onClick={() => setDetailId(detailId === ev._id ? null : ev._id)}
                      className="p-1 text-pharaoh-500/30 hover:text-pharaoh-300">
                      <ChevronDown size="12" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {detailId === ev._id && (
                  <div className="mt-3 pt-3 border-t border-pharaoh-500/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="text-pharaoh-500/40">SHA-256</span>
                        <p className="font-mono text-pharaoh-300 break-all">{ev.sha256Hash}</p>
                      </div>
                      <div>
                        <span className="text-pharaoh-500/40">Uploaded</span>
                        <p className="text-pharaoh-300">{new Date(ev.uploadedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-pharaoh-500/40">Map to controls</span>
                      <div className="flex gap-2 mt-1">
                        <input value={mapTargets[ev._id] || ''} onChange={e => setMapTargets(p => ({ ...p, [ev._id]: e.target.value }))}
                          placeholder="controlId1, controlId2,..."
                          className="flex-1 bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-lg px-3 py-1.5 text-[10px] text-pharaoh-300 outline-none placeholder-pharaoh-500/40" />
                        <button onClick={() => handleMap(ev._id, (mapTargets[ev._id] || '').split(',').map(s => s.trim()).filter(Boolean))}
                          className="text-[9px] px-3 py-1.5 rounded-lg gold-gradient text-nile-900 font-bold">
                          Map
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Tracker Tab (merged from ComplianceTracker) ── */
const TRACKER_SEV_COLORS = { Critical: '#dc3545', High: '#fd7e14', Medium: '#d4a832', Low: '#20c997' }
const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']
const TRACKER_BG = 'rgba(5,5,5,0.85)'
const TRACKER_BORDER = '1px solid rgba(212,168,50,0.12)'

function TrackerChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(2,2,4,0.97)', border: TRACKER_BORDER, borderRadius: 10, padding: '10px 14px', fontSize: 11 }}>
      <div style={{ color: WHITE, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || GOLD }} />
          <span style={{ color: SILVER }}>{p.name}:</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function TrackerRiskRow({ risk }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: TRACKER_BORDER, background: 'rgba(212,168,50,0.02)' }}>
      <div onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 p-3 cursor-pointer">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${TRACKER_SEV_COLORS[risk.severity] || SILVER}15` }}>
          <AlertTriangle size={12} style={{ color: TRACKER_SEV_COLORS[risk.severity] || SILVER }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: WHITE }}>{risk.riskTitle}</div>
          <div className="text-[10px]" style={{ color: SILVER }}>{risk.riskId} · {risk.riskCategory}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${TRACKER_SEV_COLORS[risk.severity] || SILVER}15`, color: TRACKER_SEV_COLORS[risk.severity] || SILVER, border: `1px solid ${TRACKER_SEV_COLORS[risk.severity] || SILVER}30` }}>
          {risk.severity}
        </span>
        <span className="text-[10px]" style={{ color: risk.status === 'Closed' || risk.status === 'Resolved' ? EMERALD : AMBER }}>
          {risk.status}
        </span>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t space-y-1.5 text-[11px]" style={{ borderColor: 'rgba(212,168,50,0.1)' }}>
          <div className="pt-2 flex justify-between"><span style={{ color: SILVER }}>Department</span><span style={{ color: WHITE }}>{risk.ownerTeam}</span></div>
          <div className="flex justify-between"><span style={{ color: SILVER }}>Process</span><span style={{ color: WHITE }}>{risk.process}</span></div>
          <div className="flex justify-between"><span style={{ color: SILVER }}>Owner</span><span style={{ color: GOLD }}>{risk.owner}</span></div>
          <div className="flex justify-between"><span style={{ color: SILVER }}>Due Date</span><span style={{ color: risk.deadline ? AMBER : SILVER }}>{risk.deadline || 'N/A'}</span></div>
          {risk.mitigationActions && (
            <div className="mt-1 p-2 rounded-lg" style={{ background: 'rgba(212,168,50,0.04)' }}>
              <span style={{ color: GOLD, fontSize: 10 }}>Mitigation: </span>
              <span style={{ color: SILVER, fontSize: 10 }}>{risk.mitigationActions}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TrackerTab() {
  const [risks, setRisks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sevFilter, setSevFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/api/risks').then(r => r.json()).then(d => setRisks(d.risks || [])).catch(() => {})
  }, [])

  const { deptRes, filtered } = useMemo(() => {
    const deptMap = {}
    risks.forEach(r => {
      const dept = r.ownerTeam || 'Unknown'
      if (!deptMap[dept]) deptMap[dept] = { total: 0, closed: 0, critical: 0 }
      deptMap[dept].total++
      if (r.status === 'Closed' || r.status === 'Resolved') deptMap[dept].closed++
      if (r.severity === 'Critical') deptMap[dept].critical++
    })
    const deptRes = Object.entries(deptMap)
      .map(([name, d]) => ({
        name: name.length > 18 ? name.slice(0, 16) + '..' : name,
        rate: d.total ? Math.round((d.closed / d.total) * 100) : 0,
        total: d.total, closed: d.closed, critical: d.critical,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    const filtered = risks.filter(r => {
      if (sevFilter !== 'all' && r.severity !== sevFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (searchTerm && !r.riskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !r.riskId?.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    return { deptRes, filtered }
  }, [risks, searchTerm, sevFilter, statusFilter])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-7 space-y-5">
          <div className="p-5 rounded-2xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>Resolution Rate by Department</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptRes} layout="vertical" margin={{ left: 110, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.06)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: SILVER, fontSize: 10 }}
                    axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: SILVER, fontSize: 10 }}
                    axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<TrackerChartTip />} />
                  <Bar dataKey="rate" name="Resolution Rate" radius={[0, 4, 4, 0]} barSize={18}>
                    {deptRes.map((e, i) => (
                      <Cell key={i} fill={e.rate >= 70 ? EMERALD : e.rate >= 40 ? GOLD : e.rate >= 20 ? AMBER : CRIMSON} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Total Risks</div>
              <div className="text-2xl font-bold mt-1" style={{ color: WHITE }}>{risks.length}</div>
              <div className="text-[10px] mt-1" style={{ color: GOLD }}>48 seeded</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Resolved</div>
              <div className="text-2xl font-bold mt-1" style={{ color: EMERALD }}>
                {risks.filter(r => r.status === 'Closed' || r.status === 'Resolved').length}
              </div>
              <div className="text-[10px] mt-1" style={{ color: AMBER }}>
                {risks.filter(r => r.status !== 'Closed' && r.status !== 'Resolved').length} open
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Critical</div>
              <div className="text-2xl font-bold mt-1" style={{ color: CRIMSON }}>
                {risks.filter(r => r.severity === 'Critical').length}
              </div>
              <div className="text-[10px] mt-1" style={{ color: AMBER }}>
                {risks.filter(r => r.severity === 'High').length} High
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Departments</div>
              <div className="text-2xl font-bold mt-1" style={{ color: GOLD }}>
                {new Set(risks.map(r => r.ownerTeam)).size}
              </div>
              <div className="text-[10px] mt-1" style={{ color: SILVER }}>Categories: {new Set(risks.map(r => r.riskCategory)).size}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Register Browser</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={10} style={{ color: SILVER, position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)' }} />
                  <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-24 text-[10px] py-1.5 pl-5 pr-2 rounded-lg outline-none"
                    style={{ background: 'rgba(212,168,50,0.06)', border: TRACKER_BORDER, color: WHITE }} />
                </div>
                <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
                  className="text-[10px] py-1.5 px-2 rounded-lg outline-none"
                  style={{ background: 'rgba(212,168,50,0.06)', border: TRACKER_BORDER, color: GOLD }}>
                  <option value="all" style={{ background: '#0a0a0a' }}>All Severity</option>
                  {SEV_ORDER.map(s => <option key={s} value={s} style={{ background: '#0a0a0a' }}>{s}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="text-[10px] py-1.5 px-2 rounded-lg outline-none"
                  style={{ background: 'rgba(212,168,50,0.06)', border: TRACKER_BORDER, color: GOLD }}>
                  <option value="all" style={{ background: '#0a0a0a' }}>All Status</option>
                  <option value="Open" style={{ background: '#0a0a0a' }}>Open</option>
                  <option value="Closed" style={{ background: '#0a0a0a' }}>Closed</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-6">
                  <FileText size={24} className="mx-auto mb-2" style={{ color: SILVER }} />
                  <p className="text-xs" style={{ color: SILVER }}>No matching risks</p>
                </div>
              ) : (
                filtered.map(r => <TrackerRiskRow key={r._id} risk={r} />)
              )}
            </div>
            <div className="mt-2 text-[10px] text-center" style={{ color: SILVER }}>
              {filtered.length} of {risks.length} risks shown
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
