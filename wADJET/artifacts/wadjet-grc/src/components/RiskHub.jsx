import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Search, X, Download, Plus, ChevronDown, ChevronUp, Shield, RefreshCw, Filter, Eye } from 'lucide-react'
import { downloadRiskRegisterCSV, downloadRiskRegisterXLSX, downloadRiskRegisterPDF, downloadRiskRegisterTemplateXLSX } from '../lib/downloadUtils'

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
const calcScore = (f) => (f.likelihood || 1) * Math.max(f.impactFinance||1, f.impactRegulatory||1, f.impactReputational||1, f.impactOperational||1)

const EMPTY_FORM = {
  riskId: '', process: '', subProcess: '', assetSystem: '', ownerTeam: '',
  riskCategory: 'Cybersecurity', threat: '', vulnerability: '', severity: 'High',
  riskTitle: '', riskDescription: '', riskRef: '',
  likelihood: 3, impactFinance: 3, impactRegulatory: 3, impactReputational: 3, impactSafety: 1, impactOperational: 3,
  impactC: 3, impactI: 3, impactA: 3,
  existingControls: '', residualScore: '', overallRisk: 'Medium',
  treatment: 'Mitigate', status: 'Open', mitigationActions: '', deadline: '', owner: '',
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

function RiskDetailPanel({ risk, onClose, onStatusChange }) {
  const levelC = LEVEL_COLOR[risk.inherentLevel] || {}
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="w-[600px] h-full bg-[#070f1a] border-l border-pharaoh-500/15 overflow-y-auto flex flex-col animate-fade-in shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-pharaoh-500/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-pharaoh-500/50">{risk.riskId}</span>
              <span className={levelBadge(risk.inherentLevel)}>{risk.inherentLevel}</span>
              <span className={levelBadge(risk.status)}>{risk.status}</span>
            </div>
            <h2 className="text-base font-bold text-pharaoh-100">{risk.riskTitle}</h2>
          </div>
          <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5 text-xs">
          {/* Score bar */}
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

          {/* Section: Risk Scenario */}
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
          </Section>

          <Section title="Description">
            <p className="text-pharaoh-300/80 leading-relaxed text-[11px] bg-pharaoh-900/30 rounded-lg p-3 border border-pharaoh-500/8">{risk.riskDescription}</p>
          </Section>

          <Section title="Likelihood & Impact Dimensions">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {[
                ['Likelihood', risk.likelihood],
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
          </Section>

          <Section title="Risk Scoring">
            <Row label="Overall Score" value={risk.overallScore} mono />
            <Row label="Risk Score" value={risk.riskScore} mono />
            <Row label="Inherent Level" value={risk.inherentLevel} badge />
            <Row label="Residual Score" value={risk.residualScore} mono />
            <Row label="Overall Risk (Residual)" value={risk.overallRisk} badge />
          </Section>

          <Section title="Existing Controls">
            <p className="text-pharaoh-300/80 leading-relaxed text-[11px] bg-pharaoh-900/30 rounded-lg p-3 border border-pharaoh-500/8">{risk.existingControls || '—'}</p>
          </Section>

          <Section title="Treatment & Mitigation">
            <Row label="Treatment" value={risk.treatment} />
            <Row label="Status" value={risk.status} badge />
            <Row label="Deadline" value={risk.deadline || '—'} mono />
            <Row label="Owner" value={risk.owner} />
          </Section>

          <Section title="Mitigation Actions">
            <p className="text-pharaoh-300/80 leading-relaxed text-[11px] bg-pharaoh-900/30 rounded-lg p-3 border border-pharaoh-500/8">{risk.mitigationActions || '—'}</p>
          </Section>

          {/* Quick status update */}
          <div className="flex gap-2 flex-wrap pt-2 border-t border-pharaoh-500/10">
            {STATUSES.filter(s => s !== 'All').map(s => (
              <button key={s} onClick={() => onStatusChange(risk.id, s)}
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

function AddRiskModal({ onClose, onSave, existingIds }) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [section, setSection] = useState(0)
  const [saving, setSaving] = useState(false)

  const score = calcScore(form)
  const level = scoreToLevel(score)
  const residualLevel = scoreToLevel(Number(form.residualScore) || 0)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.riskId || !form.riskTitle) return
    setSaving(true)
    await onSave({
      ...form,
      riskRef: form.riskRef || form.riskId,
      overallScore: score,
      riskScore: score,
      inherentLevel: level,
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
      residualScore: Number(form.residualScore) || Math.max(1, score - 4),
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-pharaoh-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20">
              <Plus size={15} className="text-pharaoh-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-pharaoh-100">Add New Risk</h2>
              <p className="text-[10px] text-pharaoh-500/50">Complete all sections to register a new risk</p>
            </div>
          </div>
          <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300"><X size={18} /></button>
        </div>

        {/* Live score bar */}
        <div className="px-6 py-3 border-b border-pharaoh-500/8 flex items-center gap-4">
          <span className="text-[10px] text-pharaoh-400/60">Live Risk Score:</span>
          <span className="text-lg font-bold mono text-pharaoh-200">{score} / 25</span>
          <span className={levelBadge(level)}>{level}</span>
          <div className="flex-1 h-1.5 rounded-full bg-pharaoh-800/40 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(score/25)*100}%`, background: score >= 15 ? '#c41e3a' : score >= 10 ? '#c9a82e' : score >= 5 ? '#b8860b' : '#2d7d46' }} />
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-pharaoh-500/10">
          {sections.map((s, i) => (
            <button key={s} onClick={() => setSection(i)}
              className={`flex-1 py-2.5 text-[10px] font-semibold transition-all ${section === i ? 'text-pharaoh-300 border-b-2 border-pharaoh-400' : 'text-pharaoh-500/40 hover:text-pharaoh-400'}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Form content */}
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
            </div>
          )}

          {section === 1 && (
            <div className="space-y-5">
              <p className="text-[10px] text-pharaoh-400/60 italic">Rate each dimension 1 (Very Low) → 5 (Critical). Risk Score = Likelihood × max Impact.</p>
              <ScoreSlider label="Likelihood" value={form.likelihood} onChange={v => set('likelihood', v)} />
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
              <div className="pharaoh-card p-4 grid grid-cols-2 gap-4">
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
            </div>
          )}
        </div>

        {/* Footer */}
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
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                {saving ? 'Saving…' : 'Save Risk'}
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
  const [sortField, setSortField] = useState('riskId')
  const [sortAsc, setSortAsc] = useState(true)

  const fetchRisks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/risks')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setRisks(data.risks)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRisks() }, [])

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
    setRisks(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (selectedRisk?.id === id) setSelectedRisk(r => ({ ...r, status }))
  }

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(a => !a)
    else { setSortField(field); setSortAsc(true) }
  }

  const filtered = useMemo(() => {
    let r = risks
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(x => x.riskTitle.toLowerCase().includes(q) || x.riskId.toLowerCase().includes(q) || x.riskCategory.toLowerCase().includes(q) || x.owner.toLowerCase().includes(q))
    }
    if (catFilter !== 'All') r = r.filter(x => x.riskCategory === catFilter)
    if (levelFilter !== 'All') r = r.filter(x => x.inherentLevel === levelFilter)
    if (statusFilter !== 'All') r = r.filter(x => x.status === statusFilter)
    r = [...r].sort((a, b) => {
      const av = a[sortField]; const bv = b[sortField]
      if (typeof av === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return r
  }, [risks, search, catFilter, levelFilter, statusFilter, sortField, sortAsc])

  const stats = useMemo(() => ({
    total: risks.length,
    critical: risks.filter(r => r.inherentLevel === 'Critical').length,
    high: risks.filter(r => r.inherentLevel === 'High').length,
    medium: risks.filter(r => r.inherentLevel === 'Medium').length,
    low: risks.filter(r => r.inherentLevel === 'Low').length,
    open: risks.filter(r => r.status === 'Open').length,
    inProgress: risks.filter(r => r.status === 'In Progress').length,
  }), [risks])

  const TH = ({ field, label, className = '' }) => (
    <th className={`text-left py-2 px-3 text-[9px] font-semibold tracking-wide text-pharaoh-400/50 cursor-pointer select-none whitespace-nowrap hover:text-pharaoh-300 transition-colors ${className}`}
      onClick={() => handleSort(field)}>
      {label}
      {sortField === field && (sortAsc ? <ChevronUp size={9} className="inline ml-0.5" /> : <ChevronDown size={9} className="inline ml-0.5" />)}
    </th>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">

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

        {/* KPI summary */}
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

        {/* Filter bar */}
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
          <span className="text-[10px] text-pharaoh-500/40 ml-auto">{filtered.length} of {risks.length} risks</span>
          <button onClick={fetchRisks} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Risk Register Table */}
        <div className="pharaoh-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <RefreshCw size={16} className="animate-spin text-pharaoh-400" />
              <span className="text-sm text-pharaoh-400/60">Loading risk register…</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 gap-3 text-egyptian-red/70">
              <AlertTriangle size={16} /><span className="text-sm">{error}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse risk-table" style={{ minWidth: '2000px' }}>
                <thead>
                  <tr className="border-b border-pharaoh-500/10">
                    <th colSpan={3} className="py-2 px-3 text-[9px] text-pharaoh-200 font-bold tracking-widest uppercase text-left border-r border-pharaoh-500/8 col-group-id">
                      RISK ID
                    </th>
                    <th colSpan={4} className="py-2 px-3 text-[9px] text-pharaoh-200 font-bold tracking-widest uppercase text-left border-r border-pharaoh-500/8 col-group-scenario">
                      SCENARIO
                    </th>
                    <th colSpan={5} className="py-2 px-3 text-[9px] text-pharaoh-200 font-bold tracking-widest uppercase text-left border-r border-pharaoh-500/8 col-group-scoring">
                      THREAT & DESCRIPTION
                    </th>
                    <th colSpan={9} className="py-2 px-3 text-[9px] text-pharaoh-200 font-bold tracking-widest uppercase text-left border-r border-pharaoh-500/8 col-group-scoring">
                      IMPACT SCORES (1–5)
                    </th>
                    <th colSpan={3} className="py-2 px-3 text-[9px] text-pharaoh-200 font-bold tracking-widest uppercase text-left border-r border-pharaoh-500/8 col-group-scoring">
                      INHERENT
                    </th>
                    <th colSpan={3} className="py-2 px-3 text-[9px] text-pharaoh-200 font-bold tracking-widest uppercase text-left border-r border-pharaoh-500/8 col-group-controls">
                      CONTROLS & RESIDUAL
                    </th>
                    <th colSpan={5} className="py-2 px-3 text-[9px] text-pharaoh-200 font-bold tracking-widest uppercase text-left col-group-status">
                      TREATMENT & STATUS
                    </th>
                  </tr>
                  <tr className="border-b border-pharaoh-500/10">
                    <th colSpan={3} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-left border-r border-pharaoh-500/8">
                      Identification
                    </th>
                    <th colSpan={4} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-left border-r border-pharaoh-500/8">
                      Context
                    </th>
                    <th colSpan={5} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-left border-r border-pharaoh-500/8">
                      Threat Info
                    </th>
                    <th colSpan={1} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-center border-r border-pharaoh-500/8">
                      L'hood
                    </th>
                    <th colSpan={8} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-center border-r border-pharaoh-500/8">
                      Impact Dimensions
                    </th>
                    <th colSpan={3} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-center border-r border-pharaoh-500/8">
                      Scoring
                    </th>
                    <th colSpan={3} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-center border-r border-pharaoh-500/8">
                      Controls & Residual
                    </th>
                    <th colSpan={5} className="py-1.5 px-3 text-[8px] text-pharaoh-400/50 font-semibold uppercase tracking-wider text-center">
                      Mitigation
                    </th>
                  </tr>
                  <tr className="border-b border-pharaoh-500/10">
                    <TH field="riskId" label="Risk ID" className="risk-col-sticky" />
                    <TH field="process" label="Process" className="risk-col-sticky-2" />
                    <TH field="subProcess" label="Sub-Process" className="risk-col-sticky-3" />
                    <TH field="assetSystem" label="Asset / System" />
                    <TH field="ownerTeam" label="Owner Team" />
                    <TH field="riskCategory" label="Category" />
                    <TH field="threat" label="Threat" />
                    <TH field="vulnerability" label="Vulnerability" />
                    <TH field="severity" label="Severity" />
                    <TH field="riskTitle" label="Risk Title" />
                    <TH field="riskDescription" label="Description" />
                    <TH field="riskRef" label="Ref" className="border-r border-pharaoh-500/8" />
                    <TH field="likelihood" label="L'hood" className="text-center border-r border-pharaoh-500/8" />
                    <TH field="impactFinance" label="Fin." className="text-center" />
                    <TH field="impactRegulatory" label="Reg." className="text-center" />
                    <TH field="impactReputational" label="Rep." className="text-center" />
                    <TH field="impactSafety" label="Safe." className="text-center" />
                    <TH field="impactOperational" label="Ops." className="text-center" />
                    <TH field="impactC" label="C" className="text-center" />
                    <TH field="impactI" label="I" className="text-center" />
                    <TH field="impactA" label="A" className="text-center border-r border-pharaoh-500/8" />
                    <TH field="overallScore" label="Score" className="text-center" />
                    <TH field="riskScore" label="Risk" className="text-center" />
                    <TH field="inherentLevel" label="Inherent" className="border-r border-pharaoh-500/8" />
                    <TH field="existingControls" label="Controls" />
                    <TH field="residualScore" label="Res." className="text-center" />
                    <TH field="overallRisk" label="Overall" className="border-r border-pharaoh-500/8" />
                    <TH field="treatment" label="Treatment" />
                    <TH field="status" label="Status" />
                    <TH field="mitigationActions" label="Actions" />
                    <TH field="deadline" label="Deadline" />
                    <TH field="owner" label="Owner" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={30} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-pharaoh-500/40">
                          <AlertTriangle size={24} className="opacity-40" />
                          <span className="text-sm">No risks match current filters</span>
                          <button onClick={() => { setSearch(''); setCatFilter('All'); setLevelFilter('All'); setStatusFilter('All') }}
                            className="text-[10px] px-4 py-1.5 rounded-lg border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-400/40 transition-colors">
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map((risk, i) => (
                    <tr key={risk.id}
                      className={`border-b border-pharaoh-500/6 cursor-pointer transition-colors risk-row ${risk.inherentLevel === 'Critical' ? 'risk-row-critical' : risk.inherentLevel === 'High' ? 'risk-row-high' : risk.inherentLevel === 'Medium' ? 'risk-row-medium' : risk.inherentLevel === 'Low' ? 'risk-row-low' : ''}`}
                      onClick={() => setSelectedRisk(risk)}>
                      <td className="py-2 px-3 font-mono text-[10px] text-pharaoh-400 whitespace-nowrap risk-col-sticky">{risk.riskId}</td>
                      <td className="py-2 px-3 risk-cell risk-col-sticky-2" title={risk.process}>{risk.process}</td>
                      <td className="py-2 px-3 risk-cell risk-col-sticky-3" title={risk.subProcess}>{risk.subProcess}</td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/70 max-w-[120px] truncate" title={risk.assetSystem}>{risk.assetSystem}</td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/70 whitespace-nowrap">{risk.ownerTeam}</td>
                      <td className="py-2 px-3 text-[10px] whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'rgba(196,160,48,0.08)', color: 'rgba(196,160,48,0.7)' }}>{risk.riskCategory}</span>
                      </td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/70 max-w-[100px] truncate" title={risk.threat}>{risk.threat}</td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/70 max-w-[120px] truncate" title={risk.vulnerability}>{risk.vulnerability}</td>
                      <td className="py-2 px-3">
                        <span className={levelBadge(risk.severity)}>{risk.severity}</span>
                      </td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-200 max-w-[160px] truncate font-medium" title={risk.riskTitle}>{risk.riskTitle}</td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/60 max-w-[180px] truncate" title={risk.riskDescription}>{risk.riskDescription}</td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-500/40 font-mono border-r border-pharaoh-500/8">{risk.riskRef}</td>
                      <td className={`py-2 px-3 text-center text-[11px] font-bold mono border-r border-pharaoh-500/8 ${
                        risk.likelihood >= 4 ? 'text-[#f08080] bg-[rgba(220,53,69,0.10)]' : risk.likelihood >= 3 ? 'text-[#ffb068] bg-[rgba(253,126,20,0.08)]' : 'text-pharaoh-300'
                      }`}>{risk.likelihood}</td>
                      {[risk.impactFinance, risk.impactRegulatory, risk.impactReputational, risk.impactSafety, risk.impactOperational, risk.impactC, risk.impactI, risk.impactA].map((v, i2) => (
                        <td key={i2} className={`py-2 px-3 text-center text-[11px] font-mono ${v >= 4 ? 'text-[#f08080] bg-[rgba(220,53,69,0.08)]' : v >= 3 ? 'text-[#ffb068] bg-[rgba(253,126,20,0.06)]' : 'text-pharaoh-500/50'} ${i2 === 7 ? 'border-r border-pharaoh-500/8' : ''}`}>{v}</td>
                      ))}
                      <td className={`py-2 px-3 text-center text-[11px] font-bold mono ${
                        risk.overallScore >= 15 ? 'text-[#dc3545] bg-[rgba(220,53,69,0.10)]' : risk.overallScore >= 10 ? 'text-[#fd7e14] bg-[rgba(253,126,20,0.08)]' : risk.overallScore >= 5 ? 'text-[#d4a832] bg-[rgba(212,168,50,0.06)]' : 'text-pharaoh-300'
                      }`}>{risk.overallScore}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold mono ${
                          risk.riskScore >= 15 ? 'text-[#dc3545] bg-[rgba(220,53,69,0.14)]' : risk.riskScore >= 10 ? 'text-[#fd7e14] bg-[rgba(253,126,20,0.12)]' : risk.riskScore >= 5 ? 'text-[#d4a832] bg-[rgba(212,168,50,0.08)]' : 'text-[#20c997] bg-[rgba(32,201,151,0.08)]'
                        }`}>{risk.riskScore}</span>
                      </td>
                      <td className="py-2 px-3 border-r border-pharaoh-500/8">
                        <span className={levelBadge(risk.inherentLevel)}>{risk.inherentLevel}</span>
                      </td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/60 max-w-[140px] truncate" title={risk.existingControls}>{risk.existingControls}</td>
                      <td className={`py-2 px-3 text-center text-[11px] font-mono ${risk.residualScore >= 15 ? 'text-red-400 bg-red-950/15' : risk.residualScore >= 10 ? 'text-amber-400 bg-amber-950/15' : risk.residualScore >= 5 ? 'text-yellow-400 bg-yellow-950/10' : 'text-pharaoh-400/70'}`}>{risk.residualScore}</td>
                      <td className="py-2 px-3 border-r border-pharaoh-500/8">
                        <span className={levelBadge(risk.overallRisk)}>{risk.overallRisk}</span>
                      </td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/70 whitespace-nowrap">{risk.treatment}</td>
                      <td className="py-2 px-3">
                        <span className={levelBadge(risk.status)}>{risk.status}</span>
                      </td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/60 max-w-[160px] truncate" title={risk.mitigationActions}>{risk.mitigationActions}</td>
                      <td className="py-2 px-3 text-[10px] font-mono text-pharaoh-500/50 whitespace-nowrap">{risk.deadline || '—'}</td>
                      <td className="py-2 px-3 text-[10px] text-pharaoh-400/70 whitespace-nowrap">{risk.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-pharaoh-500/8 flex items-center justify-between text-[10px] text-pharaoh-500/40">
            <span>WADJET GRC Risk Register · {filtered.length} risks displayed</span>
            <span className="flex items-center gap-1.5"><Eye size={10} /> Click any row to view full details</span>
          </div>
        </div>
      </div>

      {/* Detail side panel */}
      {selectedRisk && (
        <RiskDetailPanel
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Add Risk Modal */}
      {showAddModal && !auditorMode && (
        <AddRiskModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddRisk}
          existingIds={risks.map(r => r.riskId)}
        />
      )}
    </div>
  )
}
