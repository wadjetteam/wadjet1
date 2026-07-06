import { useState } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { GRCProvider } from './context/GRCContext'
import { useInactivityTimer } from './hooks/useInactivityTimer'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import SessionTimeoutModal from './components/layout/SessionTimeoutModal'
import UnifiedDashboards from './components/unified-dashboards/UnifiedDashboards'
import ComplianceHub from './components/compliance/ComplianceHub'
import RiskRemediationCenter from './components/risk-remediation/RiskRemediationCenter'
import CBEDeadlinesHub from './components/regulatory/CBEDeadlinesHub'
import OperationalRiskHub from './components/operational-risk/OperationalRiskHub'
import PolicyPortal from './components/admin/PolicyPortal'
import GRCManagement from './components/admin/GRCManagement'
import AuditLogViewer from './components/admin/AuditLogViewer'
import UserManagement from './components/admin/UserManagement'
import EvidenceConnectorPage from './components/evidence/EvidenceConnectorPage'
import ImpactAnalysisPage from './components/impact/ImpactAnalysisPage'
import ReportingEnginePage from './components/reporting/ReportingEnginePage'
import AuditTrailPage from './components/audit-trail/AuditTrailPage'

const VIEWS: Record<string, React.ReactNode> = {}

function AppContent() {
  const { darkMode } = useTheme()
  const { auditorMode, isLoggedOut, setIsLoggedOut } = useAuth()
  const { showTimeout, handleStayLoggedIn } = useInactivityTimer()
  const [activeView, setActiveView] = useState('unified-dashboards')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleAuditorToggle = () => {
    if (auditorMode) setActiveView('unified-dashboards')
  }

  if (isLoggedOut) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#1e1e1e' }}>
        <div className="text-center max-w-md">
          <div className="p-10 mb-8 mx-auto max-w-sm rounded-2xl" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(212,168,50,0.12)' }}>
            <img src="/logo.png" alt="Wadjet" className="h-32 w-32 mx-auto mb-6 object-contain" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#f8f9fa' }}>Session Terminated</h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(212,168,50,0.35)' }}>Your session has expired due to inactivity.</p>
            <button onClick={() => setIsLoggedOut(false)}
              className="px-10 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, rgba(212,168,50,0.15), rgba(212,168,50,0.05))', color: '#f8f9fa', border: '1px solid rgba(212,168,50,0.20)' }}>
              Return
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex" style={{ background: '#060d15' }} data-theme={darkMode ? 'dark' : 'light'}>
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
        auditorMode={auditorMode}
        onToggleAuditorMode={handleAuditorToggle}
      />

      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${auditorMode ? 'opacity-90' : ''}`}>
        <TopBar activeView={activeView} auditorMode={auditorMode} />

        <div className="flex-1 overflow-hidden">
          {activeView === 'unified-dashboards' && <UnifiedDashboards auditorMode={auditorMode} />}
          {activeView === 'compliance-hub' && <ComplianceHub auditorMode={auditorMode} />}
          {activeView === 'risk-remediation-center' && <RiskRemediationCenter auditorMode={auditorMode} />}
          {activeView === 'policy-portal' && <PolicyPortal auditorMode={auditorMode} />}
          {activeView === 'cbe-deadlines-hub' && <CBEDeadlinesHub />}
          {activeView === 'operational-risk-hub' && <OperationalRiskHub />}
          {activeView === 'grc-management' && <GRCManagement auditorMode={auditorMode} />}
          {activeView === 'audit-log' && <AuditLogViewer />}
          {activeView === 'identity-mgmt' && <UserManagement />}
          {activeView === 'evidence-connector' && <EvidenceConnectorPage />}
          {activeView === 'impact-analysis' && <ImpactAnalysisPage />}
          {activeView === 'reporting-engine' && <ReportingEnginePage />}
          {activeView === 'audit-trail' && <AuditTrailPage />}
        </div>
      </main>

      {showTimeout && <SessionTimeoutModal onStayLoggedIn={handleStayLoggedIn} onLogout={() => setIsLoggedOut(true)} />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GRCProvider>
          <AppContent />
        </GRCProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

