import { Shield, CheckCircle, X, Info } from 'lucide-react'
import { STATUS_COLOR, TEMPLATES, GOLD } from './ComplianceConstants'

export default function ComplianceControlsTab({
  selectedDomains,
  complianceData,
  assessing, setAssessing,
  assessForm, setAssessForm,
  detailControl, setDetailControl,
  cascadeAssessment, setCascadeAssessment,
  auditorMode,
  handleAssess,
  handleStatusChange,
}) {
  return (
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
  )
}
