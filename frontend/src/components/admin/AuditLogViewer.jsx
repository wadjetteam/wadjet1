import { useState } from 'react'
import { Search, Clock, User, Shield, FileText, LogIn, AlertTriangle, CheckCircle, X, Filter, Download } from 'lucide-react'

const auditLogs = Array.from({ length: 40 }).map((_, i) => {
  const actions = [
    { action: 'Login', userAction: 'Authenticated to GRC platform', icon: LogIn },
    { action: 'Override', userAction: 'CISO risk override approved for SWIFT vulnerability', icon: AlertTriangle },
    { action: 'Policy Sign-Off', userAction: 'Digital attestation for Information Security Policy v3.2', icon: FileText },
    { action: 'Form Creation', userAction: 'Created new control: AC-02 in CBE framework', icon: Shield },
    { action: 'Risk Escalation', userAction: 'CAPA ticket generated for CVE-2026-3412', icon: AlertTriangle },
    { action: 'Evidence Upload', userAction: 'Uploaded penetration test report for PCI DSS v4.0', icon: Shield },
    { action: 'Framework Toggle', userAction: 'Deactivated Law 151/2020 framework compliance mapping', icon: Shield },
    { action: 'Audit View', userAction: 'Activated CBE Auditor View mode', icon: Shield },
  ]
  const action = actions[i % actions.length]
  const roles = ['Compliance Officer', 'CISO', 'Auditor', 'Executive', 'Risk Analyst']
  const users = ['Ahmed Abdullah', 'Laila Mahmoud', 'Khaled Ibrahim', 'Nadia Farouk', 'Omar Hassan']
  const ips = ['10.88.142.37', '10.88.15.22', '10.88.3.198', '10.88.47.101', '10.88.92.55']
  const date = new Date(2026, 5, 8, 8 + Math.floor(i / 4), (i * 13) % 60, i * 7, i * 123)
  return {
    id: `LOG-${String(1000 + i).padStart(6, '0')}`,
    userId: `USR-${['A7X3K9', 'B4M2P8', 'C9R5D1', 'D6J8N3', 'E2K7L5'][i % 5]}`,
    userName: users[i % 5],
    role: roles[i % 5],
    action: action.action,
    userAction: action.userAction,
    icon: action.icon,
    timestamp: date.toISOString(),
    ip: ips[i % 5],
    sessionId: `SES-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  }
})

export default function AuditLogViewer() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const roles = [...new Set(auditLogs.map(l => l.role))]
  const actions = [...new Set(auditLogs.map(l => l.action))]

  const filtered = auditLogs.filter(log => {
    if (roleFilter !== 'all' && log.role !== roleFilter) return false
    if (actionFilter !== 'all' && log.action !== actionFilter) return false
    if (search && !log.userAction.toLowerCase().includes(search.toLowerCase()) && !log.userId.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Shield size="20" className="text-pharaoh-400" />
            <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>Audit Log Viewer</h1>
          </div>
          <p className="text-sm text-pharaoh-400/60 mt-0.5">Immutable read-only audit trail · All modifications are permanently prohibited</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 text-xs font-medium hover:bg-pharaoh-500/15 transition-all">
            <Download size="12" /> Export Audit Log
          </button>
        </div>
      </div>

      {/* Immutable Warning Banner */}
      <div className="px-4 py-3 rounded-xl bg-egyptian-red/5 border border-egyptian-red/15 flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.03s' }}>
        <Shield size="16" className="text-egyptian-red flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-egyptian-red">Immutable Record · Read-Only Access</p>
          <p className="text-[10px] text-pharaoh-500/40">This log is a cryptographically anchored audit trail. Delete and edit actions are strictly blocked per CBE regulatory requirements.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
          <input type="text" placeholder="Search by user, action, or ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-lg py-2 pl-9 pr-3 text-xs text-pharaoh-300 placeholder-pharaoh-500/40 focus:border-pharaoh-500/30 focus:outline-none transition-all" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-lg py-2 px-3 text-xs text-pharaoh-300 focus:border-pharaoh-500/30 focus:outline-none appearance-none">
          <option value="all">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-lg py-2 px-3 text-xs text-pharaoh-300 focus:border-pharaoh-500/30 focus:outline-none appearance-none">
          <option value="all">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="text-[10px] text-pharaoh-500/40 font-mono">{filtered.length} entries</div>
      </div>

      {/* Log Table */}
      <div className="pharaoh-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pharaoh-500/10">
                <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Log ID</th>
                <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">User ID</th>
                <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Role</th>
                <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Action</th>
                <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Details</th>
                <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Timestamp</th>
                <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Source IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                  <td className="py-3 px-3"><span className="text-[10px] font-mono text-pharaoh-400/60">{log.id}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <User size="10" className="text-pharaoh-500/40" />
                      <span className="text-xs font-mono text-pharaoh-300">{log.userId}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3"><span className="text-[10px] text-pharaoh-400/70">{log.role}</span></td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-medium border ${
                      log.action === 'Login' ? 'bg-egyptian-green/10 text-egyptian-green border-egyptian-green/20' :
                      log.action === 'Override' ? 'bg-pharaoh-500/10 text-pharaoh-300 border-pharaoh-500/20' :
                      log.action === 'Policy Sign-Off' ? 'bg-pharaoh-400/10 text-pharaoh-400 border-pharaoh-400/20' :
                      log.action === 'Audit View' ? 'bg-egyptian-green/10 text-egyptian-green border-egyptian-green/20' :
                      'bg-pharaoh-500/5 text-pharaoh-500/40 border-pharaoh-500/15'
                    }`}>{log.action}</span>
                  </td>
                  <td className="py-3 px-3 max-w-[250px]"><span className="text-xs text-pharaoh-400/70 truncate block">{log.userAction}</span></td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size="10" className="text-pharaoh-500/40" />
                      <span className="text-[10px] font-mono text-pharaoh-400/60">{new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="text-[8px] text-pharaoh-500/30 font-mono">.{String(new Date(log.timestamp).getMilliseconds()).padStart(3, '0')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="text-[10px] font-mono text-pharaoh-500/40">{log.ip}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search size="32" className="mx-auto mb-3 text-pharaoh-500/40" />
            <p className="text-sm text-pharaoh-400/60">No log entries match your filters.</p>
          </div>
        )}
        <div className="flex items-center justify-between px-3 py-3 border-t border-pharaoh-500/10">
          <span className="text-[10px] text-pharaoh-500/40">Total: {auditLogs.length} immutable records · Page 1 of 1</span>
          <div className="flex items-center gap-2 text-[10px] text-pharaoh-500/40">
            <div className="flex items-center gap-1"><CheckCircle size="10" className="text-egyptian-green" /><span>Integrity verified</span></div>
            <span>|</span>
            <div className="flex items-center gap-1"><X size="10" className="text-egyptian-red" /><span>Edit/Delete locked</span></div>
          </div>
        </div>
      </div>

      <div className="ankh-divider" />
    </div>
  )
}
