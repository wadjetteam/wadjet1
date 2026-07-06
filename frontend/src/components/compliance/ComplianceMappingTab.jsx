import { useState, useMemo } from 'react'
import { Search, Info } from 'lucide-react'
import { GOLD, EMERALD, AMBER } from './ComplianceConstants'
import { statusBadge } from './ComplianceUtils'

export default function ComplianceMappingTab({ tripleMappings }) {
  const [mapQ, setMapQ] = useState('')
  const [mapCatF, setMapCatF] = useState('')
  const [mapScoreF, setMapScoreF] = useState('')
  const [expandedMap, setExpandedMap] = useState({})

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

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex gap-2 flex-wrap items-center pharaoh-card p-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pharaoh-500/15 bg-pharaoh-900/30">
          <Search size="12" color="rgba(206,212,218,0.55)" />
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

      <div className="pharaoh-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-pharaoh-500/15" style={{ background: 'rgba(212,168,50,0.04)' }}>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: GOLD }}>Map ID</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(212,168,50,0.08)', color: '#d4a832' }}>ISO Ref</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ color: GOLD }}>Category</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(212,168,50,0.08)', color: '#d4a832' }}>ISO Control Title</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(212,168,50,0.08)', color: '#d4a832' }}>ISO</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(32,201,151,0.08)', color: '#20c997' }}>CBE Ref</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(32,201,151,0.08)', color: '#20c997' }}>CBE Title</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(32,201,151,0.08)', color: '#20c997' }}>Str</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(32,201,151,0.08)', color: '#20c997' }}>CBE</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(253,126,20,0.08)', color: '#fd7e14' }}>PCI Ref</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(253,126,20,0.08)', color: '#fd7e14' }}>PCI Title</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(253,126,20,0.08)', color: '#fd7e14' }}>Str</th>
                <th className="text-left py-2.5 px-2 text-[8px] uppercase tracking-wider font-semibold whitespace-nowrap" style={{ background: 'rgba(253,126,20,0.08)', color: '#fd7e14' }}>PCI</th>
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
                    <td className="py-2 px-2 font-mono text-pharaoh-300" style={{ background: 'rgba(212,168,50,0.03)' }}>{m.isoRef}</td>
                    <td className="py-2 px-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,168,50,0.08)', color: GOLD }}>
                        {m.category}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-pharaoh-200 max-w-[130px] truncate" title={m.isoTitle} style={{ background: 'rgba(212,168,50,0.03)' }}>{m.isoTitle}</td>
                    <td className="py-2 px-2" style={{ background: 'rgba(212,168,50,0.03)' }}>{statusBadge(m.isoAssessment)}</td>
                    <td className="py-2 px-2 font-mono text-pharaoh-300" style={{ background: 'rgba(32,201,151,0.03)' }}>{m.cbeRef}</td>
                    <td className="py-2 px-2 max-w-[140px] truncate text-pharaoh-400" title={m.cbeTitle} style={{ background: 'rgba(32,201,151,0.03)' }}>{m.cbeTitle}</td>
                    <td className="py-2 px-2" style={{ background: 'rgba(32,201,151,0.03)' }}>
                      {m.cbeStrength !== '—' && (
                        <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${
                          m.cbeStrength === 'Direct' ? 'text-emerald-400 bg-emerald-950/30' :
                          'text-amber-400 bg-amber-950/30'
                        }`}>{m.cbeStrength}</span>
                      )}
                    </td>
                    <td className="py-2 px-2" style={{ background: 'rgba(32,201,151,0.03)' }}>{statusBadge(m.cbeAssessment)}</td>
                    <td className="py-2 px-2 font-mono text-pharaoh-300" style={{ background: 'rgba(253,126,20,0.03)' }}>{m.pciRef}</td>
                    <td className="py-2 px-2 max-w-[140px] truncate text-pharaoh-400" title={m.pciTitle} style={{ background: 'rgba(253,126,20,0.03)' }}>{m.pciTitle}</td>
                    <td className="py-2 px-2" style={{ background: 'rgba(253,126,20,0.03)' }}>
                      {m.pciStrength !== '—' && (
                        <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${
                          m.pciStrength === 'Direct' ? 'text-emerald-400 bg-emerald-950/30' :
                          'text-amber-400 bg-amber-950/30'
                        }`}>{m.pciStrength}</span>
                      )}
                    </td>
                    <td className="py-2 px-2" style={{ background: 'rgba(253,126,20,0.03)' }}>{statusBadge(m.pciAssessment)}</td>
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
  )
}
