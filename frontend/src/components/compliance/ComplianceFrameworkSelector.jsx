export default function ComplianceFrameworkSelector({ frameworks, selectedFw, setSelectedFw, complianceData }) {
  return (
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
                <div className="w-1.5 h-1.5 rounded-full ml-2" style={{ background: '#ced4da' }} />
                <span className="text-[10px] text-pharaoh-500/40">{complianceData.notApplicable || 0} N/A</span>
                <div className="w-1.5 h-1.5 rounded-full ml-2" style={{ background: '#ced4da' }} />
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
  )
}
