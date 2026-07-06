import { AlertTriangle, Eye } from 'lucide-react'
import { rowBg, levelBadge, ragDot } from './RiskHubConstants'
import ResizeHandle from './ResizeHandle'

export default function RiskInherentTable({ filtered, colWidths, startResize, hId, setHId, setSelectedRisk, riskIdsWithMapping, onClearFilters }) {
  const col = (key, def) => colWidths[key] || def
  const w = (key, def) => ({ width: col(key, def), minWidth: col(key, def) })

  return (
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
                  <button onClick={onClearFilters}
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
              <td className="p-3 font-mono font-bold text-amber-400/90 sticky left-0 bg-[#060d15] z-10" style={w('in_riskId', 90)}>{r.riskId}</td>
              <td className="p-3 font-bold text-pharaoh-200 sticky left-[90px] bg-[#060d15] z-10" style={w('in_riskTitle', 180)}>{r.riskTitle}</td>
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
  )
}
