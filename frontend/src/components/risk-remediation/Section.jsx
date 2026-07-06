import { levelBadge } from './RiskHubConstants'

export function Section({ title, children }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export function Row({ label, value, badge, mono }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-pharaoh-500/6">
      <span className="text-[10px] text-pharaoh-400/60 flex-shrink-0 w-36">{label}</span>
      {badge ? (
        <span className={levelBadge(value)}>{value}</span>
      ) : (
        <span className={`text-[10px] text-pharaoh-200 text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
      )}
    </div>
  )
}
