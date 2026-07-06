import { Sun, Moon, Eye, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = [
  { id: 'unified-dashboards', label: 'Unified Dashboards', desc: 'Executive · Board · CRO' },
  { id: 'compliance-hub', label: 'Compliance Hub', desc: 'Engine · Gap Assessment' },
  { id: 'risk-remediation-center', label: 'Risk & Remediation', desc: 'Risk Hub · Controls' },
  { id: 'policy-portal', label: 'Policy & Attestation', desc: 'Digital sign-off' },
  { id: 'cbe-deadlines-hub', label: 'CBE Deadlines', desc: 'Calendar · Exams' },
  { id: 'operational-risk-hub', label: 'Operational Risk', desc: 'Loss Events · TPRM' },
  { id: 'grc-management', label: 'GRC Management', desc: 'Administration' },
  { id: 'audit-log', label: 'Audit Log Viewer', desc: 'Immutable trail' },
  { id: 'evidence-connector', label: 'Evidence Connector', desc: 'Automated Compliance Checks' },
  { id: 'impact-analysis', label: 'Impact Analysis', desc: 'Cascading Risk Impact' },
  { id: 'reporting-engine', label: 'Reporting Engine', desc: 'Dynamic Reports' },
  { id: 'audit-trail', label: 'Audit Trail', desc: 'Tamper-proof ledger' },
  { id: 'identity-mgmt', label: 'User Management', desc: 'Users · Permissions' },
]

interface TopBarProps {
  activeView: string
  auditorMode: boolean
}

export default function TopBar({ activeView, auditorMode }: TopBarProps) {
  const { user } = useAuth()
  const { darkMode, toggleTheme } = useTheme()

  const activeItem = NAV_ITEMS.find(i => i.id === activeView)

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 relative z-20"
      style={{ background: 'rgba(30,30,30,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,168,50,0.06)' }}>

      <div className="flex items-center gap-4">
        <div className="w-0.5 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(212,168,50,0.60), rgba(212,168,50,0.20))' }} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: '#f8f9fa' }}>{activeItem?.label ?? 'Dashboard'}</span>
            {auditorMode && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(212,168,50,0.10)', border: '1px solid rgba(212,168,50,0.22)' }}>
                <Eye size={9} style={{ color: '#d4a832' }} />
                <span className="text-[9px] font-semibold" style={{ color: '#d4a832' }}>Read-only</span>
              </span>
            )}
          </div>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(206,212,218,0.50)' }}>{activeItem?.desc ?? 'Governance overview'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(212,168,50,0.06)', border: '1px solid rgba(212,168,50,0.14)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#d4a832' }} />
          <span className="text-xs font-semibold" style={{ color: '#d4a832' }}>Online</span>
        </div>

        <span className="text-[10px] font-mono" style={{ color: 'rgba(206,212,218,0.40)' }}>{user.ip}</span>

        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(206,212,218,0.40)' }}>
          <Clock size={12} />
          <span>Active</span>
        </div>

        <button onClick={toggleTheme} className="theme-toggle" title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {darkMode ? <Sun size={15} style={{ color: '#e9ecf9' }} /> : <Moon size={15} style={{ color: '#d4a832' }} />}
        </button>
      </div>
    </header>
  )
}
