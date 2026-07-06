import { useState } from 'react'

export default function ComplianceMatrixTab({ selectedDomains, complianceData, selectedFramework }) {
  const [statusQuickFilter, setStatusQuickFilter] = useState('')

  return (
    <div className="animate-fade-in">
      <div className="pharaoh-card p-5">
        <h3 className="text-sm font-semibold text-pharaoh-200 mb-1">Compliance Status per Domain</h3>
        <p className="text-xs text-pharaoh-400/70 mb-3">{selectedFramework?.name || 'Select a framework'}</p>
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
  )
}
