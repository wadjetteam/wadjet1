import { useState, useEffect, useCallback } from 'react'
import { Wifi, RefreshCw, Activity, AlertTriangle, X, CheckCircle, XCircle, Clock, Settings, Server, Database, Bell, Archive, Play, ExternalLink, Save, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const CONNECTOR_META = {
  regulatory_reporter: {
    label: 'Central Bank of Egypt Reporting System',
    icon: Server,
    desc: 'Automated regulatory submission pipeline for CBE risk reports, breach notifications, and compliance filings.',
    color: '#fd7e14',
  },
  grc_exchange: {
    label: 'External GRC Exchange',
    icon: Database,
    desc: 'Bidirectional data exchange with external GRC platforms for risk register publishing and control library ingestion.',
    color: '#20c997',
  },
  notification_relay: {
    label: 'Notification Relay',
    icon: Bell,
    desc: 'Multi-channel alert dispatch for escalation workflows, compliance reminders, and incident notifications.',
    color: '#339af0',
  },
  audit_archive: {
    label: 'Audit Archive',
    icon: Archive,
    desc: 'Tamper-proof archival service for audit logs, evidence packages, and regulatory submission records.',
    color: '#b197fc',
  },
}

function StatusBadge({ status }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-[#20c997]" />
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#20c997] animate-ping opacity-40" />
        </div>
        <span className="text-[10px] font-semibold text-[#20c997]">Connected</span>
      </div>
    )
  }
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5">
        <RefreshCw size={11} className="text-[#d4a832] animate-spin" />
        <span className="text-[10px] font-semibold text-[#d4a832]">Connecting</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <XCircle size={12} className="text-[#dc3545]" />
      <span className="text-[10px] font-semibold text-[#dc3545]">Disconnected</span>
    </div>
  )
}

function ConfigDrawer({ integration, onClose, onSave }) {
  const [baseUrl, setBaseUrl] = useState(integration?.provider?.baseUrl || '')
  const [apiKey, setApiKey] = useState(integration?.provider?.apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [enabled, setEnabled] = useState(integration?.provider?.enabled ?? true)
  const [timeoutMs, setTimeoutMs] = useState(integration?.provider?.timeoutMs ?? 30000)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(integration.key, { baseUrl, apiKey, enabled, timeoutMs })
    setSaving(false)
  }

  const meta = CONNECTOR_META[integration?.key]
  const Icon = meta?.icon

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="w-[500px] h-full bg-[#070f1a] border-l border-pharaoh-500/15 overflow-y-auto flex flex-col animate-fade-in shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-pharaoh-500/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl" style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}25` }}>
                <Icon size={16} style={{ color: meta.color }} />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-pharaoh-100">{meta?.label || integration?.name}</h2>
              <p className="text-[10px] text-pharaoh-500/50 mt-0.5">Connection Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5 text-xs">
          <div className="pharaoh-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40">Status</span>
              <StatusBadge status={integration?.status || 'disconnected'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40">Protocol</span>
              <span className="text-[10px] font-mono text-pharaoh-300">{integration?.provider?.protocol || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40">Auth Method</span>
              <span className="text-[10px] font-mono text-pharaoh-300">{integration?.provider?.authMethod || '—'}</span>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-3">Connection Settings</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-pharaoh-400/70 mb-1">Base URL</label>
                <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://api.bank.example.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-xs text-pharaoh-200 placeholder-pharaoh-500/30 focus:outline-none focus:border-amber-500/40 font-mono" />
              </div>
              <div>
                <label className="block text-[10px] text-pharaoh-400/70 mb-1">API Key</label>
                <div className="relative">
                  <input value={apiKey} onChange={e => setApiKey(e.target.value)}
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    className="w-full px-3 py-1.5 pr-8 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-xs text-pharaoh-200 placeholder-pharaoh-500/30 focus:outline-none focus:border-amber-500/40 font-mono" />
                  <button onClick={() => setShowKey(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-pharaoh-500/40 hover:text-pharaoh-300">
                    {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="enabled" checked={enabled} onChange={e => setEnabled(e.target.checked)}
                    className="rounded border-pharaoh-500/30 bg-pharaoh-900/50 text-amber-500 focus:ring-amber-500/30" />
                  <label htmlFor="enabled" className="text-[10px] text-pharaoh-400/70">Enabled</label>
                </div>
                <div className="flex-1" />
                <div>
                  <label className="text-[9px] text-pharaoh-500/40 mr-1">Timeout:</label>
                  <select value={timeoutMs} onChange={e => setTimeoutMs(Number(e.target.value))}
                    className="px-2 py-0.5 rounded bg-pharaoh-900/50 border border-pharaoh-500/15 text-[9px] text-pharaoh-300 focus:outline-none">
                    <option value={5000}>5s</option>
                    <option value={10000}>10s</option>
                    <option value={15000}>15s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>60s</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-3">Endpoints</p>
            <div className="space-y-1.5">
              {(integration?.endpoints || []).map((ep, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-pharaoh-900/30 border border-pharaoh-500/8">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${ep.method === 'GET' ? 'bg-green-950/30 text-green-400' : 'bg-amber-950/30 text-amber-400'}`}>
                      {ep.method}
                    </span>
                    <span className="text-[10px] font-mono text-pharaoh-300">{ep.name}</span>
                  </div>
                  <span className="text-[8px] text-pharaoh-500/40 font-mono">{ep.path}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-pharaoh-500/10 flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-[10px] border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg text-[10px] font-bold gold-gradient text-nile-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
            {saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IntegrationsHub() {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(new Set())
  const [configOpen, setConfigOpen] = useState(null)
  const [configDetail, setConfigDetail] = useState(null)

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/integrations')
      const data = await res.json()
      const items = (data.integrations || []).map(i => ({
        ...i,
        ...(CONNECTOR_META[i.key] || { label: i.name, icon: Wifi, desc: '', color: '#868e96' }),
      }))
      setIntegrations(items)
    } catch {
      toast({ title: 'Failed to load integrations', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchIntegrations() }, [fetchIntegrations])

  const handleTest = async (key) => {
    setTesting(prev => new Set(prev).add(key))
    try {
      const res = await fetch(`/api/integrations/${key}/test`, { method: 'POST' })
      const data = await res.json()
      setIntegrations(prev => prev.map(i => i.key === key ? { ...i, status: data.status, lastSync: new Date().toISOString() } : i))
      toast({
        title: data.ok ? 'Connection Successful' : 'Connection Failed',
        description: data.message || (data.ok ? 'Endpoint responded successfully' : 'Could not reach endpoint'),
        variant: data.ok ? 'default' : 'destructive',
      })
    } catch {
      toast({ title: 'Test failed', description: 'Network error', variant: 'destructive' })
    } finally {
      setTesting(prev => { const n = new Set(prev); n.delete(key); return n })
    }
  }

  const openConfig = async (key) => {
    setConfigOpen(key)
    try {
      const res = await fetch(`/api/integrations/${key}`)
      if (res.ok) {
        const data = await res.json()
        setConfigDetail({ key, ...data })
      } else {
        setConfigDetail({ key, provider: {}, endpoints: [], status: 'disconnected' })
      }
    } catch {
      setConfigDetail({ key, provider: {}, endpoints: [], status: 'disconnected' })
    }
  }

  const handleConfigSave = async (key, updates) => {
    try {
      const res = await fetch(`/api/integrations/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        toast({ title: 'Configuration saved', description: `${key} settings updated` })
        setConfigOpen(null)
        setConfigDetail(null)
        fetchIntegrations()
      } else {
        toast({ title: 'Save failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Save failed', description: 'Network error', variant: 'destructive' })
    }
  }

  const onlineCount = integrations.filter(i => i.status === 'connected').length
  const errorCount = integrations.filter(i => i.status === 'error').length
  const offlineCount = integrations.filter(i => i.status === 'disconnected').length

  const statusSummary = [
    { label: 'Connected', count: onlineCount, color: '#20c997', icon: CheckCircle },
    { label: 'Errors', count: errorCount, color: '#dc3545', icon: AlertTriangle },
    { label: 'Disconnected', count: offlineCount, color: '#868e96', icon: XCircle },
  ]

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Wifi size={20} className="text-pharaoh-400" />
            <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>System Integrations & Sync</h1>
          </div>
          <p className="text-sm text-pharaoh-400/60 mt-0.5">Live status monitoring for all connected GRC ecosystem services</p>
        </div>
        <button onClick={fetchIntegrations}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 text-xs font-medium hover:bg-pharaoh-500/15 transition-all disabled:opacity-40"
          disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh All
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {statusSummary.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="pharaoh-card p-4 flex items-center gap-3">
              <Icon size={16} style={{ color: s.color }} />
              <div>
                <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{loading ? '—' : s.count}</div>
                <div className="text-[10px] text-pharaoh-500/40">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pharaoh-card p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pharaoh-800/40" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-2/3 rounded bg-pharaoh-800/40" />
                  <div className="h-2 w-full rounded bg-pharaoh-800/30" />
                </div>
              </div>
              <div className="flex justify-between">
                <div className="h-2 w-24 rounded bg-pharaoh-800/30" />
                <div className="h-2 w-20 rounded bg-pharaoh-800/30" />
              </div>
            </div>
          ))
        ) : integrations.length === 0 ? (
          <div className="col-span-2 pharaoh-card p-8 text-center">
            <Wifi size={24} className="mx-auto text-pharaoh-500/30 mb-3" />
            <p className="text-sm text-pharaoh-400/60">No integrations configured</p>
            <p className="text-[10px] text-pharaoh-500/30 mt-1">Set environment variables (CBE_REPORTING_URL, GRC_EXCHANGE_URL, etc.) to enable connectors</p>
          </div>
        ) : integrations.map(int => {
          const Icon = int.icon
          const isTesting = testing.has(int.key)
          return (
            <div key={int.key}
              className="pharaoh-card transition-all cursor-pointer hover:ring-1 hover:ring-pharaoh-500/20 group"
              onClick={() => openConfig(int.key)}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl`}
                      style={{
                        background: `${int.color}10`,
                        border: `1px solid ${int.color}20`,
                      }}>
                      <Icon size={18} style={{ color: int.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-pharaoh-200">{int.label || int.name}</h3>
                      <p className="text-[10px] text-pharaoh-500/40 mt-0.5 leading-relaxed max-w-[280px]">{int.desc}</p>
                    </div>
                  </div>
                  <StatusBadge status={int.status} />
                </div>

                <div className="flex items-center justify-between text-[10px] text-pharaoh-500/40">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>{int.lastSync ? new Date(int.lastSync).toLocaleString('en-US') : 'Never synced'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Server size={10} />
                    <span className="capitalize">{int.protocol || '—'}</span>
                  </div>
                </div>

                {/* Action buttons — visible on hover or always */}
                <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={async (e) => { e.stopPropagation(); await handleTest(int.key) }} disabled={isTesting}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-amber-500/40 hover:text-amber-400 transition-all disabled:opacity-40">
                    {isTesting ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openConfig(int.key) }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40 hover:text-pharaoh-300 transition-all">
                    <Settings size={10} /> Configure
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Config Drawer */}
      {configOpen && configDetail && (
        <ConfigDrawer
          integration={configDetail}
          onClose={() => { setConfigOpen(null); setConfigDetail(null) }}
          onSave={handleConfigSave}
        />
      )}

      <div className="ankh-divider" />
    </div>
  )
}
