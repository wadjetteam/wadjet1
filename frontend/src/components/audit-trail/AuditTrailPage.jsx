import { useState, useEffect } from 'react'
import { History, Shield, CheckCircle, Search, Loader, X, RefreshCw, User, Clock } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'
const INPUT_BG = 'rgba(255,255,255,0.04)'
const INPUT_BORDER = 'rgba(212,168,50,0.12)'

export default function AuditTrailPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [error, setError] = useState(null)
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => { loadEntries() }, [])

  const loadEntries = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/audit-trail')
      const data = await res.json()
      setEntries(data.items || data.entries || [])
    } catch { setError('Failed to load audit entries') }
    setLoading(false)
  }

  const verifyChain = async () => {
    setVerifying(true)
    setVerifyResult(null)
    setError(null)
    try {
      const res = await fetch('/api/audit-trail/verify', { method: 'POST' })
      const data = await res.json()
      if (res.ok) setVerifyResult(data)
      else setError(data.message || 'Verification failed')
    } catch { setError('Failed to verify chain integrity') }
    setVerifying(false)
  }

  const filtered = entries.filter(e => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return (e.action || '').toLowerCase().includes(q)
      || (e.entity || '').toLowerCase().includes(q)
      || (e.user || '').toLowerCase().includes(q)
      || (e.details || '').toLowerCase().includes(q)
  })

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
              <History size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Audit Trail</h1>
          </div>
          <p className="text-xs" style={{ color: GOLD }}>Immutable audit log with cryptographic chain verification</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={verifyChain} disabled={verifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: 'rgba(32,201,151,0.06)', border: '1px solid rgba(32,201,151,0.20)', color: EMERALD }}>
            {verifying ? <Loader size={11} className="animate-spin" /> : <Shield size={11} />}
            {verifying ? 'Verifying...' : 'Verify Chain'}
          </button>
          <button onClick={loadEntries}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: GOLD }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      <div className="relative animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(206,212,218,0.55)' }} />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="Search audit entries..."
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: INPUT_BG, border: '1px solid ' + INPUT_BORDER, color: WHITE }} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: 'rgba(220,53,69,0.10)', border: '1px solid rgba(220,53,69,0.25)', color: CRIMSON }}>
          <X size={12} /> {error}
        </div>
      )}

      {verifyResult && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs animate-fade-in"
          style={{ background: verifyResult.valid ? 'rgba(32,201,151,0.10)' : 'rgba(220,53,69,0.10)',
            border: '1px solid ' + (verifyResult.valid ? 'rgba(32,201,151,0.25)' : 'rgba(220,53,69,0.25)'),
            color: verifyResult.valid ? EMERALD : CRIMSON }}>
          {verifyResult.valid ? <CheckCircle size={12} /> : <X size={12} />}
          {verifyResult.message || (verifyResult.valid ? 'Chain integrity verified' : 'Chain integrity check failed')}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0s' }} />
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.15s' }} />
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.3s' }} />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <History size={40} className="mx-auto mb-4" style={{ color: 'rgba(212,168,50,0.15)' }} />
          <p className="text-sm" style={{ color: SILVER }}>{searchQ ? 'No matching entries' : 'No audit entries'}</p>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(206,212,218,0.55)' }}>
            {searchQ ? 'Try a different search term' : 'Audit entries will appear here once activity is logged'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(206,212,218,0.55)' }}>
                <th className="text-left p-2 font-medium">Timestamp</th>
                <th className="text-left p-2 font-medium">Action</th>
                <th className="text-left p-2 font-medium">Entity</th>
                <th className="text-left p-2 font-medium">User</th>
                <th className="text-left p-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => (
                <tr key={entry.id || idx}
                  className="rounded-xl transition-all duration-200 hover:scale-[1.005]"
                  style={{ background: DARK_BG }}>
                  <td className="p-2.5 rounded-l-xl">
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} style={{ color: 'rgba(206,212,218,0.40)' }} />
                      <span style={{ color: SILVER }}>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '-'}</span>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                      style={{ background: GOLD + '12', color: GOLD }}>{entry.action}</span>
                  </td>
                  <td className="p-2.5" style={{ color: WHITE }}>{entry.entity || '-'}</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <User size={10} style={{ color: 'rgba(206,212,218,0.40)' }} />
                      <span style={{ color: SILVER }}>{entry.user || '-'}</span>
                    </div>
                  </td>
                  <td className="p-2.5 rounded-r-xl" style={{ color: 'rgba(206,212,218,0.50)' }}>{entry.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
