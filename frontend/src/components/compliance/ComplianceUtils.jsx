import { EMERALD, AMBER, CRIMSON } from './ComplianceConstants'

export const statusBadge = (s) => {
  if (!s) return <span className="text-[8px] text-pharaoh-500/30">–</span>
  const cols = {
    'Compliant': { bg: 'rgba(32,201,151,0.18)', fg: EMERALD, icon: '✓' },
    'Partially Compliant': { bg: 'rgba(253,126,20,0.15)', fg: AMBER, icon: '◐' },
    'Non-Compliant': { bg: 'rgba(220,53,69,0.15)', fg: CRIMSON, icon: '✗' },
  }
  const c = cols[s.status] || { bg: 'rgba(206,212,218,0.08)', fg: '#ced4da', icon: '?' }
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap inline-flex items-center gap-1" style={{ background: c.bg, color: c.fg }}>
      <span className="text-[11px]">{c.icon}</span>
      {s.status}
    </span>
  )
}
