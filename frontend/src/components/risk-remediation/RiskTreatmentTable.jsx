import { AlertTriangle } from 'lucide-react'
import { rowBg, levelBadge, ragDot, calcTarget } from './RiskHubConstants'
import ResizeHandle from './ResizeHandle'

export default function RiskTreatmentTable({ treatmentFiltered, colWidths, startResize, hId, setHId, setSelectedRisk, onClearFilters }) {
  const col = (key, def) => colWidths[key] || def
  const w = (key, def) => ({ width: col(key, def), minWidth: col(key, def) })

  return (
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
                  <button onClick={onClearFilters}
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
                <td className="p-3 font-mono font-bold text-amber-400/90 sticky left-0 bg-[#060d15] z-10" style={w('tr_riskId', 90)}>{r.riskId}</td>
                <td className="p-3 font-bold text-pharaoh-200 sticky left-[90px] bg-[#060d15] z-10" style={w('tr_riskTitle', 180)}>{r.riskTitle}</td>
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
  )
}
