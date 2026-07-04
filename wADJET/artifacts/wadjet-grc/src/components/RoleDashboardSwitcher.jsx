import { useState, useEffect, useMemo } from 'react'
import { LayoutDashboard, Shield, Eye, ClipboardList, TrendingUp, Activity, ChevronRight, Target, AlertTriangle, CheckCircle, Clock, Users, FileText, Zap, BarChart3 } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

const ROLES = [
  {
    id: 'employee',
    label: 'Employee',
    icon: Users,
    desc: 'Policy attestation, personal tasks, acknowledgments',
    color: '#6f42c1',
    views: ['policy-portal'],
  },
  {
    id: 'compliance-officer',
    label: 'Compliance Officer',
    icon: Shield,
    desc: 'Compliance engine, risk hub, remediation, gap assessment',
    color: GOLD,
    views: ['compliance-engine', 'risk-hub', 'remediation-workspace', 'gap-assessment', 'follow-up'],
  },
  {
    id: 'ciso',
    label: 'CISO',
    icon: Eye,
    desc: 'CISO approvals, risk overview, audit, compliance tracker',
    color: CRIMSON,
    views: ['ciso-approvals', 'cro-dashboard', 'compliance-tracker', 'audit-log'],
  },
  {
    id: 'auditor',
    label: 'Auditor',
    icon: ClipboardList,
    desc: 'Read-only audit trail, examinations, compliance engine',
    color: '#0dcaf0',
    views: ['audit-log', 'examination-tracker', 'compliance-engine'],
  },
  {
    id: 'executive',
    label: 'Executive / Board',
    icon: TrendingUp,
    desc: 'Board view, executive dashboard, CRO dashboard, capital adequacy',
    color: EMERALD,
    views: ['executive-board', 'dashboard', 'cro-dashboard', 'basel-capital', 'board-pack'],
  },
]

const ROLE_METRICS = {
  'employee': { label: 'Pending Attestations', value: 3, color: AMBER },
  'compliance-officer': { label: 'Open Compliance Gaps', value: 8, color: CRIMSON },
  'ciso': { label: 'Pending Approvals', value: 5, color: GOLD },
  'auditor': { label: 'Open Findings', value: 12, color: AMBER },
  'executive': { label: 'Risk Appetite Status', value: '74%', color: EMERALD },
}

export default function RoleDashboardSwitcher({ currentRole, onRoleChange, onNavigate }) {
  const [hoveredRole, setHoveredRole] = useState(null)

  const quickStats = useMemo(() => {
    return {
      totalRisks: 48,
      criticalRisks: 7,
      openFindings: 23,
      complianceRate: '68%',
      pendingApprovals: 5,
      activePolicies: 12,
    }
  }, [])

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
            <LayoutDashboard size={16} style={{ color: GOLD }} />
          </div>
          <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Role Dashboard Switcher</h1>
        </div>
        <p className="text-xs" style={{ color: GOLD }}>Select your role to access role-specific dashboards and tools</p>
      </div>

      <div className="grid grid-cols-5 gap-4 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Total Risks', value: quickStats.totalRisks, icon: AlertTriangle, color: GOLD },
          { label: 'Critical', value: quickStats.criticalRisks, icon: Target, color: CRIMSON },
          { label: 'Open Findings', value: quickStats.openFindings, icon: FileText, color: AMBER },
          { label: 'Compliance Rate', value: quickStats.complianceRate, icon: CheckCircle, color: EMERALD },
          { label: 'Active Policies', value: quickStats.activePolicies, icon: BarChart3, color: '#6f42c1' },
        ].map((stat, i) => {
          const StatIcon = stat.icon
          return (
            <div key={i} className="p-4 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium" style={{ color: SILVER }}>{stat.label}</span>
                <StatIcon size={14} style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: WHITE }}>{stat.value}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {ROLES.map(role => {
          const RoleIcon = role.icon
          const isActive = currentRole === role.id
          const isHovered = hoveredRole === role.id
          const metric = ROLE_METRICS[role.id]

          return (
            <div
              key={role.id}
              className="rounded-2xl transition-all duration-300 cursor-pointer"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${role.color}12, ${role.color}04)`
                  : DARK_BG,
                border: isActive
                  ? `1px solid ${role.color}40`
                  : BORDER,
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? `0 0 30px ${role.color}10` : 'none',
              }}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => {
                if (currentRole !== role.id) onRoleChange(role.id)
                if (role.views.length > 0) onNavigate(role.views[0])
              }}
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${role.color}15`, border: `1px solid ${role.color}30` }}
                  >
                    <RoleIcon size={18} style={{ color: role.color }} />
                  </div>
                  {isActive && (
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${role.color}20`, color: role.color }}
                    >
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold" style={{ color: WHITE }}>{role.label}</h3>
                  <p className="text-[10px] mt-1 leading-relaxed" style={{ color: SILVER }}>{role.desc}</p>
                </div>

                {metric && (
                  <div
                    className="p-2.5 rounded-lg flex items-center justify-between"
                    style={{ background: `${metric.color}08`, border: `1px solid ${metric.color}15` }}
                  >
                    <span className="text-[9px] font-medium" style={{ color: SILVER }}>{metric.label}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: metric.color }}>{metric.value}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: role.color }}>
                  <span>Open Dashboard</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-5 rounded-2xl animate-fade-in" style={{ background: DARK_BG, border: BORDER, animationDelay: '0.15s' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: WHITE }}>Quick Navigation by Role</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {ROLES.map(role => {
            const RoleIcon = role.icon
            return (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <RoleIcon size={12} style={{ color: role.color }} />
                  <span className="text-[10px] font-bold" style={{ color: role.color }}>{role.label}</span>
                </div>
                {role.views.map(view => (
                  <button
                    key={view}
                    onClick={() => {
                      if (currentRole !== role.id) onRoleChange(role.id)
                      onNavigate(view)
                    }}
                    className="w-full text-left text-[9px] px-2.5 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(212,168,50,0.03)', border: BORDER, color: SILVER }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,50,0.08)'; e.currentTarget.style.color = WHITE }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,50,0.03)'; e.currentTarget.style.color = SILVER }}
                  >
                    <ChevronRight size={8} className="inline mr-1" />
                    {view.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
