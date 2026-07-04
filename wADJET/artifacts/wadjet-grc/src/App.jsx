import { useState, useCallback, useEffect, useRef } from 'react'
import { LayoutDashboard, Shield, AlertTriangle, FileCheck, Bot, Eye, EyeOff, Clock, Settings, Sun, Moon, Wifi, UserCheck, ClipboardList, ChevronDown, BarChart2, Calendar, Database, Flag, TrendingUp } from 'lucide-react'
import UnifiedDashboards from './containers/UnifiedDashboards'
import KpiMetricsHub from './containers/KpiMetricsHub'
import ComplianceHub from './containers/ComplianceHub'
import RiskRemediationCenter from './containers/RiskRemediationCenter'
import CapitalAdequacyHub from './containers/CapitalAdequacyHub'
import CBEDeadlinesHub from './containers/CBEDeadlinesHub'
import OperationalRiskHub from './containers/OperationalRiskHub'
import AMLExecutivePack from './containers/AMLExecutivePack'
import PolicyPortal from './components/PolicyPortal'
import GRCManagement from './components/GRCManagement'
import IntegrationsHub from './components/IntegrationsHub'
import AuditLogViewer from './components/AuditLogViewer'
import AICopilot from './components/AICopilot'
import SessionTimeoutModal from './components/SessionTimeoutModal'
import { GRCProvider } from './context/GRCContext'

const MOCK_USER = { id: 'USR-A7X3K9', name: 'Ahmed Abdullah', role: 'Senior Compliance Officer', ip: '10.88.142.37', dept: 'Risk & Compliance Division' }

const roles = [
  { id: 'employee', label: 'Regular Employee', icon: UserCheck },
  { id: 'compliance-officer', label: 'Compliance Officer', icon: Shield },
  { id: 'ciso', label: 'CISO (Approver)', icon: Eye },
  { id: 'auditor', label: 'Auditor (Read-Only)', icon: ClipboardList },
  { id: 'executive', label: 'Executive Dashboard', icon: LayoutDashboard },
]

const navGroups = [
  {
    label: 'Core GRC',
    color: 'rgba(212,168,50,0.50)',
    items: [
      { id: 'unified-dashboards', label: 'Unified Dashboards', icon: LayoutDashboard, desc: 'Executive · Board · CRO', roles: ['employee', 'compliance-officer', 'ciso', 'auditor', 'executive'] },
      { id: 'kpi-metrics-hub', label: 'KPIs & Metrics', icon: BarChart2, desc: 'Library · Risk Mapper', roles: ['compliance-officer', 'ciso', 'auditor', 'executive'] },
      { id: 'compliance-hub', label: 'Compliance Hub', icon: Shield, desc: 'Engine · Gap Assessment', roles: ['compliance-officer', 'ciso', 'auditor'] },
      { id: 'risk-remediation-center', label: 'Risk & Remediation', icon: AlertTriangle, desc: 'Risk Hub · Breach Tasks', roles: ['compliance-officer', 'ciso', 'auditor', 'executive'] },
      { id: 'policy-portal', label: 'Policy & Attestation', icon: FileCheck, desc: 'Digital sign-off', roles: ['employee', 'compliance-officer', 'ciso', 'auditor'] },
      { id: 'integrations-hub', label: 'Integrations Hub', icon: Wifi, desc: 'System sync', roles: ['ciso', 'auditor'] },
    ],
  },
  {
    label: 'Banking Modules',
    color: 'rgba(212,168,50,0.35)',
    items: [
      { id: 'capital-adequacy-hub', label: 'Capital & Reporting', icon: TrendingUp, desc: 'Basel III · Regulatory', roles: ['compliance-officer', 'ciso', 'auditor', 'executive'] },
      { id: 'cbe-deadlines-hub', label: 'CBE Deadlines', icon: Calendar, desc: 'Calendar · Exams', roles: ['compliance-officer', 'ciso', 'auditor', 'executive'] },
      { id: 'operational-risk-hub', label: 'Operational Risk', icon: Database, desc: 'Loss Events · TPRM', roles: ['compliance-officer', 'ciso', 'auditor', 'executive'] },
      { id: 'aml-executive-pack', label: 'AML & Executive Pack', icon: Flag, desc: 'AML · Board Packs', roles: ['compliance-officer', 'ciso', 'auditor', 'executive'] },
    ],
  },
  {
    label: 'Administration',
    color: 'rgba(212,168,50,0.25)',
    items: [
      { id: 'grc-management', label: 'GRC Management', icon: Settings, desc: 'Administration', roles: ['compliance-officer', 'ciso'] },
      { id: 'audit-log', label: 'Audit Log Viewer', icon: ClipboardList, desc: 'Immutable trail', roles: ['auditor'] },
    ],
  },
]

const allNavItems = navGroups.flatMap(g => g.items)


export default function App() {
  const [activeView, setActiveView] = useState('unified-dashboards')
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [auditorMode, setAuditorMode] = useState(false)
  const [showTimeout, setShowTimeout] = useState(false)
  const [isLoggedOut, setIsLoggedOut] = useState(false)
  const [currentRole, setCurrentRole] = useState('compliance-officer')
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [risksData, setRisksData] = useState([])
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('wadjet-theme') !== 'light' } catch { return true }
  })
  const inactivityTimerRef = useRef(null)
  const timeoutWarningRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    fetch('/api/risks').then(r => r.json()).then(d => setRisksData(d.risks || [])).catch(() => {})
  }, [])

  const navItems = allNavItems.filter(item => item.roles.includes(currentRole))
  const roleLabel = roles.find(r => r.id === currentRole)?.label || 'Compliance Officer'

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev
      try { localStorage.setItem('wadjet-theme', next ? 'dark' : 'light') } catch {}
      return next
    })
  }

  const INACTIVITY_LIMIT = 300000
  const TIMEOUT_WARNING_DURATION = 60000

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (showTimeout) setShowTimeout(false)
    if (timeoutWarningRef.current) { clearTimeout(timeoutWarningRef.current); timeoutWarningRef.current = null }
    if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current) }
    inactivityTimerRef.current = setTimeout(() => {
      setShowTimeout(true)
      timeoutWarningRef.current = setTimeout(() => { setIsLoggedOut(true); setShowTimeout(false) }, TIMEOUT_WARNING_DURATION)
    }, INACTIVITY_LIMIT)
  }, [showTimeout])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll']
    const handleActivity = () => resetInactivityTimer()
    events.forEach(ev => window.addEventListener(ev, handleActivity))
    resetInactivityTimer()
    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleActivity))
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (timeoutWarningRef.current) clearTimeout(timeoutWarningRef.current)
    }
  }, [resetInactivityTimer])

  const handleStayLoggedIn = useCallback(() => resetInactivityTimer(), [resetInactivityTimer])
  const toggleCopilot = useCallback(() => setCopilotOpen(p => !p), [])

  if (isLoggedOut) {
    return (
      <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#1e1e1e' }} data-theme={darkMode ? 'dark' : 'light'}>
        <div className="text-center max-w-md relative z-10">
          <div className="p-10 mb-8 animate-fade-in mx-auto max-w-sm rounded-2xl" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(212,168,50,0.12)' }}>
            <div className="logo-frame rounded-full w-40 h-40 mx-auto mb-6" style={{ padding: '4px' }}>
              <img src="./image_5afd7f.png" alt="Wadjet GRC Logo"
                className="h-full w-full object-cover"
                style={{ borderRadius: '50%' }}
                onError={(e) => { e.target.src = '/logo.png'; e.onerror = (e2) => { e2.target.src = '/logo.svg'; e2.onerror = null } }} />
            </div>
            <div className="cartouche-frame mx-auto w-fit mb-3">
              <span className="text-lg font-bold tracking-[0.22em]" style={{ color: '#d4a832', fontFamily: "'Inter', sans-serif" }}>WADJET</span>
            </div>
            <p className="text-xs tracking-wide font-medium" style={{ color: 'rgba(212,168,50,0.35)' }}>Eyes on Risk. Control in Action.</p>
          </div>
          <div className="ankh-divider w-40 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#f8f9fa', fontFamily: "'Inter', sans-serif" }}>Session Terminated</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(212,168,50,0.35)' }}>Your session has expired due to inactivity. Please log in again.</p>
          <button onClick={() => { setIsLoggedOut(false); resetInactivityTimer() }}
            className="px-10 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, rgba(212,168,50,0.15), rgba(212,168,50,0.05))', color: '#f8f9fa', border: '1px solid rgba(212,168,50,0.20)' }}>
            Return
          </button>
        </div>
      </div>
    )
  }

  return (
    <GRCProvider>
    <div
      className="h-screen w-screen overflow-hidden flex"
      style={{ fontFamily: "'Inter', 'Cairo', sans-serif", background: '#060d15' }}
      data-theme={darkMode ? 'dark' : 'light'}
    >
      {/* ── SIDEBAR ── */}
      <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'} flex-shrink-0 pharaonic-bg flex flex-col transition-all duration-300 relative z-30 temple-col-glow`}
        style={{ borderRight: '1px solid rgba(212,168,50,0.06)' }}>

        {/* ── Branding Header ── */}
        <div className="py-6 px-4 relative" style={{ borderBottom: '1px solid rgba(212,168,50,0.05)' }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,50,0.20), rgba(212,168,50,0.10), transparent)' }} />
          
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4" style={{ padding: '3px' }}>
              <img src="/logo.png" alt="Wadjet GRC Logo"
                className={`${sidebarCollapsed ? 'h-10 w-10' : 'h-[110px] w-[110px]'} mx-auto object-contain transition-all duration-300`}
                onError={(e) => { e.target.src = '/logo.svg'; e.onerror = null }} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#d4a832]" />
            </div>

            {!sidebarCollapsed && (
              <div className="space-y-2">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 18px 4px 12px', border: '1.5px solid rgba(212,168,50,0.30)', borderRadius: '60px' }}>
                  <span className="text-base font-bold tracking-[0.22em]" style={{ color: '#d4a832', fontFamily: "'Inter', sans-serif" }}>WADJET</span>
                </div>
                <p className="text-[10px] tracking-wider font-semibold uppercase" style={{ color: 'rgba(212,168,50,0.40)', letterSpacing: '0.12em' }}>Eyes on Risk. Control in Action.</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(212,168,50,0.05)' }}>
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl" style={{ background: 'rgba(212,168,50,0.03)', border: '1px solid rgba(212,168,50,0.07)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(212,168,50,0.15), rgba(212,168,50,0.05))', border: '1px solid rgba(212,168,50,0.20)' }}>
                <Sun size={14} style={{ color: '#d4a832' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#e9ecef' }}>{MOCK_USER.name}</p>
                <p className="text-[9px] truncate" style={{ color: 'rgba(212,168,50,0.40)' }}>{MOCK_USER.role}</p>
              </div>
              <div className="w-2 h-2 rounded-full" style={{ background: '#d4a832' }} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
          {navGroups.map(group => {
            const groupItems = group.items.filter(item => item.roles.includes(currentRole))
            if (groupItems.length === 0) return null
            return (
              <div key={group.label} className="mb-2">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-0.5">
                    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, rgba(212,168,50,0.30), transparent)` }} />
                    <p className="text-[9px] font-bold tracking-[0.18em] uppercase flex-shrink-0" style={{ color: 'rgba(212,168,50,0.35)' }}>{group.label}</p>
                  </div>
                )}
                {groupItems.map(item => {
                  const Icon = item.icon
                  const active = activeView === item.id
                  return (
                    <button key={item.id} onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group mb-0.5 ${
                        active ? '' : ''
                      }`}
                      style={active
                        ? { background: 'rgba(212,168,50,0.08)', color: '#d4a832', border: '1px solid rgba(212,168,50,0.12)' }
                        : { color: 'rgba(233,236,239,0.55)', border: '1px solid transparent' }
                      }
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(212,168,50,0.04)'; e.currentTarget.style.color = 'rgba(233,236,239,0.80)' } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(233,236,239,0.55)' } }}
                    >
                      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200`}
                        style={active
                          ? { background: 'rgba(212,168,50,0.10)' }
                          : { background: 'transparent' }
                        }>
                        <Icon size={14} style={{ color: active ? '#d4a832' : 'rgba(233,236,239,0.40)' }} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex flex-col items-start min-w-0">
                          <span className={`text-xs ${active ? 'font-bold' : 'font-medium'} truncate w-full leading-tight`}
                            style={{ color: active ? '#d4a832' : '#ced4da' }}>
                            {item.label}
                          </span>
                          <span className="text-[9px] truncate w-full leading-tight mt-0.5"
                            style={{ color: active ? 'rgba(212,168,50,0.45)' : 'rgba(206,212,218,0.30)' }}>
                            {item.desc}
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Auditor Mode */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(212,168,50,0.05)' }}>
            <button onClick={() => setAuditorMode(p => !p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all`}
              style={auditorMode
                ? { background: 'rgba(212,168,50,0.08)', color: '#d4a832', border: '1px solid rgba(212,168,50,0.15)' }
                : { color: 'rgba(233,236,239,0.40)', border: '1px solid transparent' }
              }
              onMouseEnter={e => { if (!auditorMode) { e.currentTarget.style.background = 'rgba(212,168,50,0.03)'; e.currentTarget.style.color = 'rgba(233,236,239,0.65)' } }}
              onMouseLeave={e => { if (!auditorMode) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(233,236,239,0.40)' } }}
            >
              {auditorMode ? <Eye size={16} /> : <EyeOff size={16} />}
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold">{auditorMode ? 'Auditor View Active' : 'Auditor View'}</span>
                <span className="text-[9px] opacity-55">{auditorMode ? 'Read-only mode' : 'CBE Audit Mode'}</span>
              </div>
            </button>
          </div>
        )}

        {/* Collapse + Version */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(212,168,50,0.05)' }}>
          <button onClick={() => setSidebarCollapsed(p => !p)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs transition-all"
            style={{ color: 'rgba(212,168,50,0.30)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(212,168,50,0.60)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(212,168,50,0.30)' }}
          >
            <LayoutDashboard size={13} />
            {!sidebarCollapsed && <span>Collapse sidebar</span>}
          </button>
          {!sidebarCollapsed && (
            <p className="text-center text-[8px] mt-2" style={{ color: 'rgba(212,168,50,0.20)' }}>v2.4.1 · GRC Enterprise Suite</p>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 app-content-bg relative ${auditorMode ? 'opacity-90' : ''}`} style={{ zIndex: 2 }}>

        {/* ── TOP BAR ── */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 relative z-20"
          style={{
            background: 'rgba(30,30,30,0.97)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(212,168,50,0.06)',
          }}>

          {/* Left: page title + subtitle */}
          {(() => {
            const activeItem = allNavItems.find(i => i.id === activeView)
            return (
              <div className="flex items-center gap-4">
                <div className="w-0.5 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(212,168,50,0.60), rgba(212,168,50,0.20))' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: '#f8f9fa' }}>{activeItem?.label ?? 'Dashboard'}</span>
                    {auditorMode && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,212,184,0.10)', border: '1px solid rgba(0,212,184,0.22)' }}>
                        <Eye size={9} style={{ color: '#00d4b8' }} />
                        <span className="text-[9px] font-semibold" style={{ color: '#00d4b8' }}>Read-only</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(206,212,218,0.50)' }}>{activeItem?.desc ?? 'Governance overview'}</p>
                </div>
                <div className="h-5 w-px mx-1" style={{ background: 'rgba(212,168,50,0.08)' }} />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: 'rgba(206,212,218,0.70)' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ color: 'rgba(206,212,218,0.20)' }}>·</span>
                  <span className="text-[11px] mono" style={{ color: 'rgba(206,212,218,0.45)' }}>
                    {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Right: controls */}
          <div className="flex items-center gap-3">

            {/* Role Switcher */}
            <div className="relative">
              <button onClick={() => setShowRoleDropdown(p => !p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(212,168,50,0.04)', border: '1px solid rgba(212,168,50,0.08)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,50,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,168,50,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,50,0.04)'; e.currentTarget.style.borderColor = 'rgba(212,168,50,0.08)' }}
              >
                <UserCheck size={12} style={{ color: '#d4a832' }} />
                <span className="text-[10px] font-medium" style={{ color: '#e9ecef' }}>Demo Role:</span>
                <span className="text-[10px] font-bold" style={{ color: '#d4a832' }}>{roleLabel}</span>
                <ChevronDown size={12} style={{ color: '#e9ecef' }} />
              </button>
              {showRoleDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-58 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in"
                  style={{ background: '#0a0a0a', border: '1px solid rgba(212,168,50,0.15)' }}
                  onMouseLeave={() => setShowRoleDropdown(false)}>
                  {roles.map(r => {
                    const Icon = r.icon
                    return (
                      <button key={r.id}
                        onClick={() => { setCurrentRole(r.id); setShowRoleDropdown(false); if (r.id === 'auditor') setAuditorMode(true); else setAuditorMode(false); if (!navItems.find(n => n.id === activeView)) setActiveView('dashboard') }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-all ${currentRole === r.id ? 'border-l-2' : ''}`}
                        style={currentRole === r.id
                          ? { background: 'rgba(212,168,50,0.08)', color: '#d4a832', borderLeftColor: '#d4a832' }
                          : { color: 'rgba(233,236,239,0.50)' }
                        }
                        onMouseEnter={e => { if (currentRole !== r.id) { e.currentTarget.style.background = 'rgba(212,168,50,0.03)'; e.currentTarget.style.color = '#e9ecef' } }}
                        onMouseLeave={e => { if (currentRole !== r.id) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(233,236,239,0.50)' } }}
                      >
                        <Icon size={14} />
                        <span>{r.label}</span>
                        {currentRole === r.id && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#d4a832' }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* System Online pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(212,168,50,0.06)', border: '1px solid rgba(212,168,50,0.14)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                style={{ background: '#d4a832' }} />
              <span className="text-xs font-semibold" style={{ color: '#d4a832' }}>Online</span>
            </div>

            {/* IP */}
            <span className="text-[10px] mono" style={{ color: 'rgba(206,212,218,0.40)' }}>{MOCK_USER.ip}</span>

            {/* Activity */}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(206,212,218,0.40)' }}>
              <Clock size={12} />
              <span>Active</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode
                ? <Sun size={15} style={{ color: '#e9ecef' }} />
                : <Moon size={15} style={{ color: '#d4a832' }} />
              }
            </button>

          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'unified-dashboards' && <UnifiedDashboards auditorMode={auditorMode} />}
          {activeView === 'kpi-metrics-hub' && <KpiMetricsHub />}
          {activeView === 'compliance-hub' && <ComplianceHub auditorMode={auditorMode} />}
          {activeView === 'risk-remediation-center' && <RiskRemediationCenter auditorMode={auditorMode} />}
          {activeView === 'policy-portal' && <PolicyPortal auditorMode={auditorMode} />}
          {activeView === 'integrations-hub' && <IntegrationsHub />}
          {activeView === 'capital-adequacy-hub' && <CapitalAdequacyHub />}
          {activeView === 'cbe-deadlines-hub' && <CBEDeadlinesHub />}
          {activeView === 'operational-risk-hub' && <OperationalRiskHub />}
          {activeView === 'aml-executive-pack' && <AMLExecutivePack />}
          {activeView === 'grc-management' && <GRCManagement auditorMode={auditorMode} />}
          {activeView === 'audit-log' && <AuditLogViewer />}
        </div>
      </main>

      {/* AI Copilot Button */}
      <button onClick={toggleCopilot}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 animate-float-glow"
        style={{ zIndex: 50, background: 'linear-gradient(135deg, rgba(248,249,250,0.80), rgba(206,212,218,0.50))', boxShadow: '0 8px 30px rgba(248,249,250,0.15)' }}>
        {copilotOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a1520" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : <Bot size={22} style={{ color: '#0a1520' }} />}
      </button>

      {copilotOpen && <AICopilot onClose={() => setCopilotOpen(false)} />}
      {showTimeout && <SessionTimeoutModal onStayLoggedIn={handleStayLoggedIn} onLogout={() => { setIsLoggedOut(true); setShowTimeout(false) }} />}
    </div>
    </GRCProvider>
  )
}
