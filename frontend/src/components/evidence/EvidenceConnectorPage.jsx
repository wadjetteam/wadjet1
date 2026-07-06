import { useState, useEffect } from 'react'
import { Shield, CheckCircle, Upload, Database, Plus, X, Loader, FileText, Clock } from 'lucide-react'

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

const STATUS_STYLE = {
  'pass': { bg: 'rgba(32,201,151,0.10)', color: EMERALD },
  'fail': { bg: 'rgba(220,53,69,0.10)', color: CRIMSON },
  'pending': { bg: 'rgba(212,168,50,0.10)', color: GOLD },
  'running': { bg: 'rgba(212,168,50,0.10)', color: '#d4a832' },
}

export default function EvidenceConnectorPage() {
  const [checks, setChecks] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState({ provider: '', config: '{}' })
  const [error, setError] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [chkRes, recRes] = await Promise.all([
        fetch('/api/evidence-connector/checks'),
        fetch('/api/evidence-connector/records'),
      ])
      setChecks((await chkRes.json()).checks || [])
      setRecords((await recRes.json()).records || [])
    } catch { setError('Failed to load evidence data') }
    setLoading(false)
  }

  const runCheck = async (e) => {
    e.preventDefault()
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/evidence-connector/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerName: form.provider, baseUrl: 'http://localhost', authType: 'API_KEY', apiKey: '', endpoint: '' }),
      })
      const data = await res.json()
      if (res.ok) { setShowForm(false); setForm({ provider: '', config: '{}' }); loadData() }
      else setError(data.message || 'Check failed')
    } catch { setError('Failed to run evidence check') }
    setRunning(false)
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
              <Shield size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Evidence Connector</h1>
          </div>
          <p className="text-xs" style={{ color: GOLD }}>Run evidence checks and view collected evidence records</p>
        </div>
        <button onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
          style={{ background: GRADIENT, border: BORDER, color: GOLD }}>
          {showForm ? <X size={11} /> : <Plus size={11} />}
          {showForm ? 'Cancel' : 'New Check'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: 'rgba(220,53,69,0.10)', border: '1px solid rgba(220,53,69,0.25)', color: CRIMSON }}>
          <X size={12} /> {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={runCheck} className="p-4 rounded-xl animate-fade-in space-y-4" style={{ background: DARK_BG, border: BORDER }}>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: SILVER }}>Provider</label>
            <input value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
              placeholder="e.g. aws-config, azure-policy, splunk"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: INPUT_BG, border: `1px solid ${INPUT_BORDER}`, color: WHITE }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: SILVER }}>Config (JSON)</label>
            <textarea value={form.config} onChange={e => setForm(p => ({ ...p, config: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={{ background: INPUT_BG, border: `1px solid ${INPUT_BORDER}`, color: WHITE }} />
          </div>
          <button type="submit" disabled={running || !form.provider}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: GRADIENT, border: BORDER, color: GOLD }}>
            {running ? <Loader size={11} className="animate-spin" /> : <Upload size={11} />}
            {running ? 'Running...' : 'Run Check'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0s' }} />
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.15s' }} />
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.3s' }} />
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: WHITE }}>
              <Database size={14} style={{ color: GOLD }} /> Evidence Checks
            </h2>
            {checks.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: 'rgba(206,212,218,0.55)' }}>No checks yet. Run a new evidence check.</p>
            ) : (
              <div className="grid gap-2">
                {checks.map((chk, idx) => {
                  const st = STATUS_STYLE[chk.status] || STATUS_STYLE['pending']
                  return (
                    <div key={chk.id || idx} className="p-3 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield size={12} style={{ color: GOLD }} />
                          <span className="text-xs font-medium" style={{ color: WHITE }}>{chk.provider}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: st.bg, color: st.color }}>
                            {chk.status}
                          </span>
                        </div>
                        {chk.created_at && (
                          <span className="text-[9px]" style={{ color: 'rgba(206,212,218,0.40)' }}>
                            <Clock size={8} className="inline mr-1" />{new Date(chk.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: WHITE }}>
              <FileText size={14} style={{ color: GOLD }} /> Evidence Records
            </h2>
            {records.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: 'rgba(206,212,218,0.55)' }}>No evidence records found.</p>
            ) : (
              <div className="grid gap-2">
                {records.map((rec, idx) => (
                  <div key={rec.id || idx} className="p-3 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} style={{ color: EMERALD }} />
                        <span className="text-xs" style={{ color: WHITE }}>{rec.name || rec.id}</span>
                      </div>
                      <span className="text-[9px]" style={{ color: 'rgba(206,212,218,0.40)' }}>
                        {rec.created_at && new Date(rec.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
