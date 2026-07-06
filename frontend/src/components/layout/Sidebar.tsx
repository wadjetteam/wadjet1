import { LayoutDashboard, Shield, AlertTriangle, FileCheck, Calendar, Database, Settings, ClipboardList, Sun, Eye, EyeOff, Activity, BarChart3, History, Key } from 'lucide-react'

const GOLD = '#d4a832'

const NAV_GROUPS = [
  {
    label: 'Core GRC',
    items: [
      { id: 'unified-dashboards', label: 'Unified Dashboards', icon: LayoutDashboard, desc: 'Executive · Board · CRO' },
      { id: 'compliance-hub', label: 'Compliance Hub', icon: Shield, desc: 'Engine · Gap Assessment' },
      { id: 'risk-remediation-center', label: 'Risk & Remediation', icon: AlertTriangle, desc: 'Risk Hub · Controls' },
      { id: 'policy-portal', label: 'Policy & Attestation', icon: FileCheck, desc: 'Digital sign-off' },
      { id: 'evidence-connector', label: 'Evidence Connector', icon: Shield, desc: 'Automated Compliance Checks' },
      { id: 'impact-analysis', label: 'Impact Analysis', icon: Activity, desc: 'Cascading Risk Impact' },
      { id: 'reporting-engine', label: 'Reporting Engine', icon: BarChart3, desc: 'Dynamic Reports & Dashboards' },
    ],
  },
  {
    label: 'Banking Modules',
    items: [
      { id: 'cbe-deadlines-hub', label: 'CBE Deadlines', icon: Calendar, desc: 'Calendar · Exams' },
      { id: 'operational-risk-hub', label: 'Operational Risk', icon: Database, desc: 'Loss Events · TPRM' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'grc-management', label: 'GRC Management', icon: Settings, desc: 'Administration' },
      { id: 'audit-log', label: 'Audit Log Viewer', icon: ClipboardList, desc: 'Immutable trail' },
      { id: 'audit-trail', label: 'Audit Trail', icon: History, desc: 'Tamper-proof ledger' },
      { id: 'identity-mgmt', label: 'User Management', icon: Key, desc: 'Users · Permissions' },
    ],
  },
]

interface SidebarProps {
  activeView: string
  onNavigate: (view: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  auditorMode: boolean
  onToggleAuditorMode: () => void
}

export default function Sidebar({ activeView, onNavigate, collapsed, onToggleCollapse, auditorMode, onToggleAuditorMode }: SidebarProps) {
  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-[260px]'} flex-shrink-0 flex flex-col transition-all duration-300 relative z-30`}
      style={{ background: '#060d15', borderRight: '1px solid rgba(212,168,50,0.06)' }}>
      <div className="py-6 px-4 relative" style={{ borderBottom: '1px solid rgba(212,168,50,0.05)' }}>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4" style={{ padding: '3px' }}>
            <img src="/logo.png" alt="Wadjet GRC Logo"
              className={`${collapsed ? 'h-10 w-10' : 'h-[110px] w-[110px]'} mx-auto object-contain transition-all duration-300`}
              onError={(e) => { const img = e.currentTarget; img.src = '/logo.svg'; img.onerror = null }} />
          </div>
          {!collapsed && (
            <div className="space-y-2">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 18px 4px 12px', border: '1.5px solid rgba(212,168,50,0.30)', borderRadius: '60px' }}>
                <span className="text-base font-bold tracking-[0.22em]" style={{ color: GOLD }}>WADJET</span>
              </div>
              <p className="text-[10px] tracking-wider font-semibold uppercase" style={{ color: 'rgba(212,168,50,0.40)', letterSpacing: '0.12em' }}>Eyes on Risk. Control in Action.</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-2">
              {!collapsed && (
                <div className="flex items-center gap-2 px-3 py-2 mb-0.5">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, rgba(212,168,50,0.30), transparent)` }} />
                  <p className="text-[9px] font-bold tracking-[0.18em] uppercase flex-shrink-0" style={{ color: 'rgba(212,168,50,0.35)' }}>{group.label}</p>
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon
                const active = activeView === item.id
                return (
                  <button key={item.id} onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group mb-0.5`}
                    style={active
                      ? { background: 'rgba(212,168,50,0.08)', color: GOLD, border: '1px solid rgba(212,168,50,0.12)' }
                      : { color: 'rgba(233,236,239,0.55)', border: '1px solid transparent' }
                    }>
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                      style={active ? { background: 'rgba(212,168,50,0.10)' } : { background: 'transparent' }}>
                      <Icon size={14} style={{ color: active ? GOLD : 'rgba(233,236,239,0.40)' }} />
                    </div>
                    {!collapsed && (
                      <div className="flex flex-col items-start min-w-0">
                        <span className={`text-xs ${active ? 'font-bold' : 'font-medium'} truncate w-full leading-tight`}
                          style={{ color: active ? GOLD : '#ced4da' }}>{item.label}</span>
                        <span className="text-[9px] truncate w-full leading-tight mt-0.5"
                          style={{ color: active ? 'rgba(212,168,50,0.45)' : 'rgba(206,212,218,0.50)' }}>{item.desc}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        )}
      </nav>

      {!collapsed && (
        <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(212,168,50,0.05)' }}>
          <button onClick={onToggleAuditorMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={auditorMode
              ? { background: 'rgba(212,168,50,0.08)', color: GOLD, border: '1px solid rgba(212,168,50,0.15)' }
              : { color: 'rgba(233,236,239,0.40)', border: '1px solid transparent' }
            }>
            {auditorMode ? <Eye size={16} /> : <EyeOff size={16} />}
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold">{auditorMode ? 'Auditor View Active' : 'Auditor View'}</span>
              <span className="text-[9px] opacity-55">{auditorMode ? 'Read-only mode' : 'CBE Audit Mode'}</span>
            </div>
          </button>
        </div>
      )}

      <div className="p-3" style={{ borderTop: '1px solid rgba(212,168,50,0.05)' }}>
        <button onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs transition-all"
          style={{ color: 'rgba(212,168,50,0.30)' }}>
          <LayoutDashboard size={13} />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
        {!collapsed && (
          <p className="text-center text-[8px] mt-2" style={{ color: 'rgba(212,168,50,0.20)' }}>v2.4.1 · GRC Enterprise Suite</p>
        )}
      </div>
    </aside>
  )
}
