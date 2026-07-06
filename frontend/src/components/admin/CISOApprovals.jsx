import { useState } from 'react'
import { Shield, CheckCircle, XCircle, Clock, User, FileText, AlertTriangle, ArrowUpDown } from 'lucide-react'

const initialRequests = [
  { id: 1, riskTitle: 'SWIFT Infrastructure Vulnerability', originalScore: 9.8, overriddenScore: 7.5, justification: 'Existing compensating controls (network segmentation + anomaly detection) reduce actual exposure. SWIFT CSP 2025 compliance verified.', requester: 'Omar Hassan', timestamp: '2026-06-08T09:30:00Z', status: 'pending' },
  { id: 2, riskTitle: 'Customer Portal SSL Certificate', originalScore: 8.5, overriddenScore: 6.0, justification: 'Certificate renewal in progress. Temporary exception approved by IT Director. No data exposure risk during transition.', requester: 'Laila Mahmoud', timestamp: '2026-06-08T10:15:00Z', status: 'pending' },
  { id: 3, riskTitle: 'Legacy Core Banking OS', originalScore: 9.2, overriddenScore: 8.0, justification: 'Migration scheduled Q3 2026. Air-gapped network + enhanced monitoring in place. Vendor EOL extended support confirmed.', requester: 'Khaled Ibrahim', timestamp: '2026-06-07T14:45:00Z', status: 'pending' },
  { id: 4, riskTitle: 'Third-Party API Integration', originalScore: 7.8, overriddenScore: 5.5, justification: 'API gateway rate limiting + WAF deployed. Penetration test showed no critical findings. Monthly review cadence established.', requester: 'Nadia Farouk', timestamp: '2026-06-07T11:20:00Z', status: 'pending' },
]

export default function CISOApprovals({ role }) {
  const [requests, setRequests] = useState(initialRequests)
  const [actionLog, setActionLog] = useState([])
  const [filter, setFilter] = useState('all')

  const handleDecision = (id, decision) => {
    const req = requests.find(r => r.id === id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r))
    setActionLog(prev => [...prev, {
      id: Date.now(),
      riskId: id,
      riskTitle: req.riskTitle,
      decision,
      timestamp: new Date().toISOString(),
      cisoUser: 'CISO-AHMED-X7',
      ip: '10.88.1.1',
    }])
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Shield size="20" className="text-pharaoh-400" />
            <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>CISO Approvals Queue</h1>
          </div>
          <p className="text-sm text-pharaoh-400/60 mt-0.5">Manual risk override requests requiring executive authorization</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20">
            <Clock size="12" className="text-pharaoh-400" />
            <span className="text-xs text-pharaoh-300 font-medium">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-egyptian-green/10 border border-egyptian-green/20">
            <CheckCircle size="12" className="text-egyptian-green" />
            <span className="text-xs text-egyptian-green font-medium">{actionLog.length} Logged</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Pending Review', value: requests.filter(r => r.status === 'pending').length, color: '#d4a832' },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: '#20c997' },
          { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: '#dc3545' },
          { label: 'Total Requests', value: requests.length, color: '#fd7e14' },
        ].map(stat => (
          <div key={stat.label} className="pharaoh-card p-4 text-center">
            <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-pharaoh-400/60 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 bg-nile-900 rounded-xl p-1 border border-pharaoh-500/15 w-fit animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? 'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20' : 'text-pharaoh-500/40 hover:text-pharaoh-300'}`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Approval Cards */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {filtered.length === 0 && (
          <div className="pharaoh-card p-12 text-center">
            <CheckCircle size="40" className="mx-auto mb-3 text-egyptian-green" />
            <p className="text-sm text-pharaoh-400/70">No {filter !== 'all' ? filter : ''} requests at this time.</p>
          </div>
        )}
        {filtered.map(req => {
          const severityColor = req.originalScore >= 9 ? '#dc3545' : req.originalScore >= 7 ? '#d4a832' : '#fd7e14'
          const diff = req.originalScore - req.overriddenScore
          return (
            <div key={req.id} className={`pharaoh-card p-5 transition-all ${req.status !== 'pending' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ background: `${severityColor}15`, border: `1px solid ${severityColor}30` }}>
                    <AlertTriangle size="16" style={{ color: severityColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-pharaoh-200">{req.riskTitle}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <User size="10" className="text-pharaoh-500/40" />
                      <span className="text-[10px] text-pharaoh-500/40">{req.requester}</span>
                      <span className="text-pharaoh-500/20">|</span>
                      <Clock size="10" className="text-pharaoh-500/40" />
                      <span className="text-[10px] text-pharaoh-500/40 font-mono">{new Date(req.timestamp).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize ${
                  req.status === 'approved' ? 'bg-egyptian-green/10 text-egyptian-green border border-egyptian-green/20' :
                  req.status === 'rejected' ? 'bg-egyptian-red/10 text-egyptian-red border border-egyptian-red/20' :
                  'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20'
                }`}>{req.status}</span>
              </div>

              {/* Score Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-egyptian-red/5 border border-egyptian-red/15">
                  <div className="text-[10px] text-pharaoh-500/40 mb-1">Original Score (Inherent)</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-egyptian-red">{req.originalScore.toFixed(1)}</span>
                    <div className="flex-1 h-2 rounded-full bg-pharaoh-800/30 overflow-hidden">
                      <div className="h-full rounded-full bg-egyptian-red" style={{ width: `${(req.originalScore / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-egyptian-green/5 border border-egyptian-green/15">
                  <div className="text-[10px] text-pharaoh-500/40 mb-1">Overridden Score (Residual)</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-egyptian-green">{req.overriddenScore.toFixed(1)}</span>
                    <div className="flex-1 h-2 rounded-full bg-pharaoh-800/30 overflow-hidden">
                      <div className="h-full rounded-full bg-egyptian-green" style={{ width: `${(req.overriddenScore / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reduction indicator */}
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-pharaoh-500/5 border border-pharaoh-500/10">
                <ArrowUpDown size="12" className="text-pharaoh-400" />
                <span className="text-[10px] text-pharaoh-400/70">Risk reduction of <strong className="text-egyptian-green">{diff.toFixed(1)} points</strong> ({Math.round((diff / req.originalScore) * 100)}%) via compensating controls</span>
              </div>

              {/* Justification */}
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(10,22,40,0.4)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText size="11" className="text-pharaoh-400" />
                  <span className="text-[10px] text-pharaoh-400/60 font-medium">Justification</span>
                </div>
                <p className="text-xs text-pharaoh-300 leading-relaxed">{req.justification}</p>
              </div>

              {/* Actions */}
              {req.status === 'pending' && (
                <div className="flex items-center gap-3 pt-3 border-t border-pharaoh-500/10">
                  <button onClick={() => handleDecision(req.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border border-egyptian-red/20 text-egyptian-red hover:bg-egyptian-red/5 transition-all">
                    <XCircle size="14" /> Reject Override
                  </button>
                  <button onClick={() => handleDecision(req.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold gold-gradient text-nile-900 hover:opacity-90 transition-all">
                    <CheckCircle size="14" /> Approve Override
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Decision Log */}
      {actionLog.length > 0 && (
        <div className="pharaoh-card p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-semibold text-pharaoh-200 mb-3">CISO Decision Audit Trail</h3>
          <div className="space-y-2">
            {actionLog.slice().reverse().map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-pharaoh-500/5 border border-pharaoh-500/10">
                <div className="flex items-center gap-2">
                  {log.decision === 'approved' ? <CheckCircle size="12" className="text-egyptian-green" /> : <XCircle size="12" className="text-egyptian-red" />}
                  <span className="text-xs text-pharaoh-300">{log.riskTitle}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-pharaoh-500/40">
                  <span className={`capitalize font-medium ${log.decision === 'approved' ? 'text-egyptian-green' : 'text-egyptian-red'}`}>{log.decision}</span>
                  <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString('en-US')}</span>
                  <span className="font-mono">{log.cisoUser}</span>
                  <span className="font-mono">{log.ip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ankh-divider" />
    </div>
  )
}
