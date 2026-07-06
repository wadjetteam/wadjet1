export default function RiskStatsCards({ stats, loading }) {
  return (
    <div className="grid grid-cols-7 gap-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
      {[
        { label: 'Total Risks', value: stats.total, color: '#f8f9fa' },
        { label: 'Critical', value: stats.critical, color: '#dc3545' },
        { label: 'High', value: stats.high, color: '#fd7e14' },
        { label: 'Medium', value: stats.medium, color: '#d4a832' },
        { label: 'Low', value: stats.low, color: '#20c997' },
        { label: 'Open', value: stats.open, color: '#ced4da' },
        { label: 'In Progress', value: stats.inProgress, color: '#e9ecef' },
      ].map(k => (
        <div key={k.label} className="pharaoh-card px-3 py-3 text-center">
          <div className="text-2xl font-bold mono" style={{ color: k.color }}>{loading ? '—' : k.value}</div>
          <div className="text-[9px] text-pharaoh-500/40 mt-0.5 font-medium">{k.label}</div>
        </div>
      ))}
    </div>
  )
}
