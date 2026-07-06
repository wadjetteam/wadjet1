import { X, Pen, Trash2 } from 'lucide-react'
import { LEVEL_COLOR, levelBadge, ragDot, calcMaxImpact, STATUSES } from './RiskHubConstants'
import { Section, Row } from './Section'
import LinkedControlRow from './LinkedControlRow'
import SuggestionRow from './SuggestionRow'

export default function RiskDetailPanel({ risk, onClose, onStatusChange, onEdit, onDelete, riskControlMaps, onOpenControlBrowser, suggestions, onApproveSuggestion, onRejectSuggestion, onUpdateMapping, onDeleteMapping }) {
  const levelC = LEVEL_COLOR[risk.inherentLevel] || {}
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="w-[600px] h-full bg-[#060d15] border-l border-pharaoh-500/15 overflow-y-auto flex flex-col animate-fade-in shadow-2xl"
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
                  <div className="h-full rounded-full" style={{ width: `${(kp.value/kp.max)*100}%`, backgroundColor: levelC.dot ? undefined : '#d4a832', background: kp.highlight ? `linear-gradient(90deg,#dc3545,#d4a832)` : `rgba(196,160,48,0.4)` }} />
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
            <p className="text-pharaoh-400/60 text-[11px] italic">No metrics linked to this risk</p>
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
