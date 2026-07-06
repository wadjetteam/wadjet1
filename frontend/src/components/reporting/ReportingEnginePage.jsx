import { useState, useEffect } from 'react'
import { BarChart3, PieChart, LayoutDashboard, Users, Loader, X, ChevronRight, Eye } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

export default function ReportingEnginePage() {
  const [components, setComponents] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDash, setLoadingDash] = useState(false)
  const [error, setError] = useState(null)

  const [roles, setRoles] = useState([])

  useEffect(() => { loadComponents(); loadRoles() }, [])

  const loadComponents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reporting/components')
      const data = await res.json()
      setComponents(data.components || [])
    } catch { setError('Failed to load reporting components') }
    setLoading(false)
  }

  const loadRoles = async () => {
    try {
      const res = await fetch('/api/reporting/roles')
      const data = await res.json()
      setRoles(data.roles || [])
    } catch {}
  }

  const loadDashboard = async (role) => {
    setSelectedRole(role)
    setLoadingDash(true)
    setDashboard(null)
    try {
      const res = await fetch('/api/reporting/dashboard?role=' + encodeURIComponent(role))
      const data = await res.json()
      if (res.ok) setDashboard(data.components || [])
      else setError(data.message || 'Failed to load dashboard')
    } catch { setError('Failed to load dashboard') }
    setLoadingDash(false)
  }

  const typeIcon = (typeCode) => {
    const map = { 'risk_heatmap': BarChart3, 'breach_summary': PieChart, 'risk_register_table': LayoutDashboard, 'compliance_gauge': LayoutDashboard }
    return map[typeCode] || LayoutDashboard
  }

  const typeColor = (typeCode) => {
    const map = { 'risk_heatmap': GOLD, 'breach_summary': EMERALD, 'risk_register_table': AMBER, 'compliance_gauge': GOLD }
    return map[typeCode] || SILVER
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
            <BarChart3 size={16} style={{ color: GOLD }} />
          </div>
          <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Reporting Engine</h1>
        </div>
        <p className="text-xs" style={{ color: GOLD }}>Available reporting components and role-based dashboards</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: 'rgba(220,53,69,0.10)', border: '1px solid rgba(220,53,69,0.25)', color: CRIMSON }}>
          <X size={12} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: WHITE }}>
            <PieChart size={14} style={{ color: GOLD }} /> Available Components
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0s' }} />
                <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.15s' }} />
                <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.3s' }} />
              </div>
            </div>
          ) : components.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: 'rgba(206,212,218,0.55)' }}>No components available.</p>
          ) : (
            <div className="grid gap-2">
              {components.map((comp, idx) => {
                const typeCode = comp.typeCode || comp.type || ''
                const IconComp = typeIcon(typeCode)
                const cColor = typeColor(typeCode)
                return (
                  <div key={comp.code || idx} className="p-3 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background: cColor + '12' }}>
                        <IconComp size={12} style={{ color: cColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium" style={{ color: WHITE }}>{comp.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px]" style={{ color: 'rgba(206,212,218,0.55)' }}>{typeCode}</span>
                          {comp.permission?.roleCode && <span className="text-[9px]" style={{ color: GOLD }}>{comp.permission.roleCode}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: WHITE }}>
            <LayoutDashboard size={14} style={{ color: GOLD }} /> Role Dashboard
          </h2>

          {roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {roles.map(r => (
                <button key={r.roleCode} onClick={() => loadDashboard(r.roleCode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={selectedRole === r.roleCode
                    ? { background: GOLD + '15', border: '1px solid ' + GOLD + '30', color: GOLD }
                    : { background: 'rgba(212,168,50,0.03)', border: BORDER, color: SILVER }}>
                  <Users size={10} />
                  {r.displayName || r.roleCode}
                </button>
              ))}
            </div>
          )}

          {loadingDash && (
            <div className="flex items-center justify-center py-12">
              <Loader size={16} className="animate-spin" style={{ color: GOLD }} />
            </div>
          )}

          {!loadingDash && (!dashboard || dashboard.length === 0) && !loading && (
            <p className="text-xs py-8 text-center" style={{ color: 'rgba(206,212,218,0.55)' }}>Select a role to view its dashboard.</p>
          )}

          {dashboard && dashboard.length > 0 && !loadingDash && (
            <div className="space-y-2">
              {dashboard.map((item, idx) => {
                const c = item.component || item
                return (
                  <div key={c.code || idx} className="p-3 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
                    <div className="flex items-center gap-2 mb-2">
                      <ChevronRight size={10} style={{ color: GOLD }} />
                      <span className="text-xs font-medium" style={{ color: WHITE }}>{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 py-1 px-2 text-[10px]" style={{ color: SILVER }}>
                      <Eye size={8} style={{ color: 'rgba(206,212,218,0.40)' }} />
                      {c.description}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
