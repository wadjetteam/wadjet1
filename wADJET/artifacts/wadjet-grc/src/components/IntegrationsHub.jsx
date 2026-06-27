import { useState } from 'react'
import { RefreshCw, Server, Activity, AlertTriangle, Shield, Database, Wifi, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

const initialIntegrations = [
  {
    id: 'ad-sync',
    label: 'Active Directory User Sync',
    icon: Server,
    status: 'online',
    lastSync: '2026-06-08T14:30:22Z',
    nextSync: '2026-06-08T15:00:00Z',
    description: 'LDAP directory synchronization for user provisioning and role-based access control.',
    details: { usersSynced: 1247, groups: 38, lastDelta: 12, failRate: '0.02%' },
  },
  {
    id: 'qualys',
    label: 'Vulnerability Scanner - Qualys',
    icon: Shield,
    status: 'online',
    lastSync: '2026-06-08T14:25:00Z',
    nextSync: '2026-06-08T14:55:00Z',
    description: 'Continuous vulnerability assessment and CVE ingestion pipeline.',
    details: { scansToday: 6, vulnsFound: 47, criticalCount: 3, avgScore: 6.8 },
  },
  {
    id: 'tenable',
    label: 'Vulnerability Scanner - Tenable.sc',
    icon: Shield,
    status: 'offline',
    lastSync: '2026-06-08T12:10:00Z',
    nextSync: null,
    description: 'SecurityCenter vulnerability management and compliance scanning.',
    details: { scansToday: 4, vulnsFound: 0, criticalCount: 0, avgScore: 0, error: 'Connection timeout - retry scheduled' },
  },
  {
    id: 'siem',
    label: 'Real-Time SIEM Alerts Stream',
    icon: Activity,
    status: 'online',
    lastSync: '2026-06-08T14:30:45Z',
    nextSync: 'Real-time',
    description: 'Security Information and Event Management correlation and alerting pipeline.',
    details: { alerts24h: 284, critical: 2, high: 18, medium: 64, low: 200 },
  },
  {
    id: 'itsm',
    label: 'ITSM Ticket Gateway - ServiceNow',
    icon: Database,
    status: 'online',
    lastSync: '2026-06-08T14:29:10Z',
    nextSync: '2026-06-08T14:59:10Z',
    description: 'Automated ticket creation for risk escalations and CAPA workflows.',
    details: { ticketsToday: 15, openTickets: 42, resolvedToday: 11, avgResolution: '3.2h' },
  },
  {
    id: 'jira',
    label: 'ITSM Ticket Gateway - Jira',
    icon: Database,
    status: 'degraded',
    lastSync: '2026-06-08T13:45:00Z',
    nextSync: null,
    description: 'Backup ITSM gateway for audit finding tracking and remediation.',
    details: { ticketsToday: 3, openTickets: 8, resolvedToday: 1, avgResolution: '8.7h', error: 'Rate limit approaching' },
  },
]

export default function IntegrationsHub() {
  const [expandedId, setExpandedId] = useState(null)
  const [integrations, setIntegrations] = useState(initialIntegrations)

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  const statusIcon = (status) => {
    switch (status) {
      case 'online': return <div className="relative"><div className="w-3 h-3 rounded-full bg-egyptian-green" /><div className="absolute inset-0 w-3 h-3 rounded-full bg-egyptian-green animate-ping opacity-40" /></div>
      case 'offline': return <XCircle size="14" className="text-egyptian-red" />
      case 'degraded': return <AlertTriangle size="14" className="text-pharaoh-400" />
      default: return <XCircle size="14" className="text-pharaoh-500/40" />
    }
  }

  const onlineCount = integrations.filter(i => i.status === 'online').length
  const degradedCount = integrations.filter(i => i.status === 'degraded').length
  const offlineCount = integrations.filter(i => i.status === 'offline').length

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Wifi size="20" className="text-pharaoh-400" />
            <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>System Integrations & Sync</h1>
          </div>
          <p className="text-sm text-pharaoh-400/60 mt-0.5">Live status monitoring for all connected GRC ecosystem services</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 text-xs font-medium hover:bg-pharaoh-500/15 transition-all">
          <RefreshCw size="12" /> Refresh All
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="pharaoh-card p-4 flex items-center gap-3">
          <div className="relative"><div className="w-4 h-4 rounded-full bg-egyptian-green" /><div className="absolute inset-0 w-4 h-4 rounded-full bg-egyptian-green animate-ping opacity-40" /></div>
          <div><div className="text-lg font-bold font-mono text-egyptian-green">{onlineCount}</div><div className="text-[10px] text-pharaoh-500/40">Online</div></div>
        </div>
        <div className="pharaoh-card p-4 flex items-center gap-3">
          <AlertTriangle size="16" className="text-pharaoh-400" />
          <div><div className="text-lg font-bold font-mono text-pharaoh-400">{degradedCount}</div><div className="text-[10px] text-pharaoh-500/40">Degraded</div></div>
        </div>
        <div className="pharaoh-card p-4 flex items-center gap-3">
          <XCircle size="16" className="text-egyptian-red" />
          <div><div className="text-lg font-bold font-mono text-egyptian-red">{offlineCount}</div><div className="text-[10px] text-pharaoh-500/40">Offline</div></div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {integrations.map(int => {
          const Icon = int.icon
          const isExpanded = expandedId === int.id
          return (
            <div key={int.id} className={`pharaoh-card transition-all ${int.status === 'offline' ? 'opacity-60' : ''}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      int.status === 'online' ? 'bg-egyptian-green/10 border border-egyptian-green/20' :
                      int.status === 'offline' ? 'bg-egyptian-red/10 border border-egyptian-red/20' :
                      'bg-pharaoh-400/10 border border-pharaoh-400/20'
                    }`}>
                      <Icon size="18" className={
                        int.status === 'online' ? 'text-egyptian-green' :
                        int.status === 'offline' ? 'text-egyptian-red' : 'text-pharaoh-400'
                      } />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-pharaoh-200">{int.label}</h3>
                      <p className="text-[10px] text-pharaoh-500/40 mt-0.5">{int.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(int.status)}
                    <span className={`text-[10px] font-medium capitalize ${
                      int.status === 'online' ? 'text-egyptian-green' :
                      int.status === 'offline' ? 'text-egyptian-red' : 'text-pharaoh-400'
                    }`}>{int.status}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-pharaoh-500/40">
                  <div className="flex items-center gap-1"><Clock size="10" /><span>Last sync: {new Date(int.lastSync).toLocaleTimeString('en-US')}</span></div>
                  {int.nextSync && <div className="flex items-center gap-1"><RefreshCw size="10" /><span>Next: {new Date(int.nextSync).toLocaleTimeString('en-US')}</span></div>}
                </div>

                {/* Error display */}
                {int.details.error && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-egyptian-red/5 border border-egyptian-red/15 flex items-center gap-2">
                    <AlertTriangle size="10" className="text-egyptian-red" />
                    <span className="text-[10px] text-egyptian-red">{int.details.error}</span>
                  </div>
                )}
              </div>

              {/* Expandable Details */}
              <button onClick={() => toggleExpand(int.id)} className="w-full flex items-center justify-center gap-1 py-2 border-t border-pharaoh-500/10 text-[10px] text-pharaoh-500/40 hover:text-pharaoh-300 transition-all">
                {isExpanded ? <><ChevronUp size="12" /> Hide Details</> : <><ChevronDown size="12" /> Show Details</>}
              </button>
              {isExpanded && (
                <div className="px-5 pb-4 space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pharaoh-500/8">
                    {Object.entries(int.details).filter(([k]) => k !== 'error').map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-pharaoh-500/5">
                        <span className="text-[10px] text-pharaoh-500/40 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/([0-9]+h)/g, ' $1').trim()}</span>
                        <span className="text-[10px] font-mono text-pharaoh-300 font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="ankh-divider" />
    </div>
  )
}
