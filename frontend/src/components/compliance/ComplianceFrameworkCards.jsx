import { ToggleLeft, ToggleRight } from 'lucide-react'

export default function ComplianceFrameworkCards({ frameworks, activeFwCodes, auditorMode, toggleFramework }) {
  return (
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
  )
}
