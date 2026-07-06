import { useState, useEffect } from 'react'
import { Plus, X, Pen, RefreshCw } from 'lucide-react'
import { CATEGORIES, SEVERITIES, TREATMENTS, STATUSES, EMPTY_FORM, calcScore, levelBadge, scoreToLevel, calcMaxImpact } from './RiskHubConstants'
import ScoreSlider from './ScoreSlider'
import Field from './Field'

export default function AddRiskModal({ onClose, onSave, existingIds, editRisk }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...editRisk })
  const [section, setSection] = useState(0)
  const [saving, setSaving] = useState(false)
  const score = calcScore(form)
  const effectiveness = { 'Implemented': 1, 'Partially Implemented': 0.5, 'Planned': 0.2, 'None': 0 }[form.controlStatus] || 0
  const autoResidual = Math.max(1, Math.round(score * (1 - effectiveness)))
  const level = scoreToLevel(score)
  const residualLevel = scoreToLevel(Number(form.residualScore) || autoResidual)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  useEffect(() => { setForm(f => ({ ...f, severity: level })) }, [score])
  const handleSave = async () => {
    if (!form.riskId || !form.riskTitle) return
    setSaving(true)
    await onSave({
      ...form, riskRef: form.riskRef || form.riskId, overallRisk: residualLevel,
      likelihood: Number(form.likelihood), impactFinance: Number(form.impactFinance), impactRegulatory: Number(form.impactRegulatory),
      impactReputational: Number(form.impactReputational), impactSafety: Number(form.impactSafety), impactOperational: Number(form.impactOperational),
      impactC: Number(form.impactC), impactI: Number(form.impactI), impactA: Number(form.impactA),
      residualScore: Number(form.residualScore) || autoResidual,
    })
    setSaving(false)
  }
  const sections = ['Risk Identification', 'Likelihood & Impact', 'Controls & Scoring', 'Treatment & Mitigation']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[700px] max-h-[88vh] bg-[#060d15] border border-pharaoh-500/20 rounded-2xl flex flex-col shadow-2xl animate-fade-in"
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
              style={{ width: `${(score/25)*100}%`, background: score >= 15 ? '#dc3545' : score >= 10 ? '#d4a832' : score >= 5 ? '#fd7e14' : '#20c997' }} />
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
                    placeholder={`R-0${String(existingIds.length + 1).padStart(2,'0')}`} className="form-input" />
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
                  rows={3} placeholder="Describe the risk scenario in detail..." className="form-input resize-none" />
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
                  <input type="date" value={form.riskDate} onChange={e => set('riskDate', e.target.value)} className="form-input" />
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
                  rows={4} placeholder="List existing controls that address this risk..." className="form-input resize-none" />
              </Field>
              <Field label="Control Implementation Status">
                <select value={form.controlStatus} onChange={e => set('controlStatus', e.target.value)} className="form-input">
                  <option value="None">None (0%)</option>
                  <option value="Planned">Planned (20%)</option>
                  <option value="Partially Implemented">Partially Implemented (50%)</option>
                  <option value="Implemented">Implemented (100%)</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Residual Score (1–25)">
                  <input type="number" min="1" max="25" value={form.residualScore}
                    onChange={e => set('residualScore', e.target.value)} placeholder="After controls applied" className="form-input" />
                </Field>
                <div className="flex flex-col justify-end pb-1">
                  <p className="text-[9px] text-pharaoh-500/40 mb-1">Residual Level (auto)</p>
                  <span className={levelBadge(residualLevel)}>{residualLevel}</span>
                </div>
              </div>
              <div className="pharaoh-card p-4">
                <p className="text-[10px] text-pharaoh-400/60 mb-3">Score Reference</p>
                <div className="grid grid-cols-4 gap-2">
                  {[['1–4','Low','#20c997'],['5–9','Medium','#d4a832'],['10–14','High','#d4a832'],['15–25','Critical','#dc3545']].map(([r,l,c]) => (
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
                  rows={5} placeholder="Describe the specific mitigation actions and timeline..." className="form-input resize-none" />
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
                className="px-4 py-2 rounded-lg text-xs border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40">← Previous</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-pharaoh-500/50 hover:text-pharaoh-400">Cancel</button>
            {section < sections.length - 1 ? (
              <button onClick={() => setSection(s => s + 1)}
                className="px-5 py-2 rounded-lg text-xs font-bold gold-gradient text-nile-900">Next →</button>
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
