import { useState, useEffect, useMemo, useCallback } from 'react'
import { Bell, AlertTriangle, CheckCircle, Clock, Shield, FileText, Eye, X, ChevronDown, Filter, RefreshCw, Trash2, Download, Activity, Zap, UserCheck, Target, Flag } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Bell, color: GOLD },
  { id: 'risk', label: 'Risks', icon: AlertTriangle, color: CRIMSON },
  { id: 'compliance', label: 'Compliance', icon: Shield, color: GOLD },
  { id: 'audit', label: 'Audit', icon: FileText, color: AMBER },
  { id: 'approval', label: 'Approvals', icon: Eye, color: '#6f42c1' },
  { id: 'remediation', label: 'Remediation', icon: Activity, color: '#0dcaf0' },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [filterCategory, setFilterCategory] = useState('all')
  const [showRead, setShowRead] = useState(true)
  const [loading, setLoading] = useState(true)

  const generateNotifications = useCallback(() => {
    const now = new Date()
    const items = [
      {
        id: 'N001', type: 'risk', severity: 'critical', title: 'Critical Risk Threshold Breached',
        message: 'RISK-007 (Weak Password Compromise) exceeded critical threshold. Immediate remediation required.',
        time: new Date(now - 1000 * 60 * 15).toISOString(), read: false, actionable: true, actionLabel: 'View Risk',
      },
      {
        id: 'N002', type: 'compliance', severity: 'high', title: 'Regulatory Deadline Approaching',
        message: 'CBE Q3 2026 compliance submission due in 14 days. 3 frameworks still non-compliant.',
        time: new Date(now - 1000 * 60 * 60 * 2).toISOString(), read: false, actionable: true, actionLabel: 'Compliance Engine',
      },
      {
        id: 'N003', type: 'approval', severity: 'medium', title: 'Policy Approval Pending',
        message: 'POL-006 (Third Party Risk Policy) awaiting CISO approval for 3 days.',
        time: new Date(now - 1000 * 60 * 60 * 4).toISOString(), read: false, actionable: true, actionLabel: 'Approve',
      },
      {
        id: 'N004', type: 'audit', severity: 'high', title: 'Audit Finding Overdue',
        message: 'FIND-001 (Q2 access review not performed) is 7 days overdue. Escalation triggered.',
        time: new Date(now - 1000 * 60 * 60 * 6).toISOString(), read: false, actionable: true, actionLabel: 'View Finding',
      },
      {
        id: 'N005', type: 'remediation', severity: 'medium', title: 'Remediation Task In Progress',
        message: 'Task "Deploy SIEM Correlation Rules" at 60% completion. SLA: 48h remaining.',
        time: new Date(now - 1000 * 60 * 60 * 12).toISOString(), read: true, actionable: true, actionLabel: 'Follow Up',
      },
      {
        id: 'N006', type: 'risk', severity: 'medium', title: 'New Risk Identified',
        message: 'Risk assessment identified 2 new operational risks in Treasury department. Review required.',
        time: new Date(now - 1000 * 60 * 60 * 24).toISOString(), read: true, actionable: true, actionLabel: 'Risk Hub',
      },
      {
        id: 'N007', type: 'compliance', severity: 'low', title: 'Compliance Assessment Completed',
        message: 'Q2 compliance assessment completed. Overall readiness: 72%. 4 clauses need attention.',
        time: new Date(now - 1000 * 60 * 60 * 36).toISOString(), read: true, actionable: false,
      },
      {
        id: 'N008', type: 'approval', severity: 'low', title: 'Access Review Completed',
        message: 'Quarterly access review for IT Security department completed. No anomalies found.',
        time: new Date(now - 1000 * 60 * 60 * 48).toISOString(), read: true, actionable: false,
      },
      {
        id: 'N009', type: 'remediation', severity: 'critical', title: 'SLA Breach — Escalate to CISO',
        message: 'Task "Law 175 Art.8 — Anti-DDoS Architecture Review" has breached SLA. Immediate escalation required.',
        time: new Date(now - 1000 * 60 * 60 * 72).toISOString(), read: false, actionable: true, actionLabel: 'Escalate',
      },
      {
        id: 'N010', type: 'audit', severity: 'medium', title: 'Audit Schedule Updated',
        message: 'Internal audit for Q3 2026 scheduled. Focus areas: IT Security, Operations, Compliance.',
        time: new Date(now - 1000 * 60 * 60 * 96).toISOString(), read: true, actionable: false,
      },
      {
        id: 'N011', type: 'risk', severity: 'high', title: 'Risk Appetite Limit Approaching',
        message: 'Current risk exposure at 74% of appetite limit. High-risk concentration in Cybersecurity domain.',
        time: new Date(now - 1000 * 60 * 60 * 120).toISOString(), read: false, actionable: true, actionLabel: 'CRO Dashboard',
      },
      {
        id: 'N012', type: 'compliance', severity: 'critical', title: 'Data Privacy Non-Compliance',
        message: 'ART-24 (Data Breach Notification) remains non-compliant. Potential penalty exposure: EGP 10M.',
        time: new Date(now - 1000 * 60 * 60 * 168).toISOString(), read: false, actionable: true, actionLabel: 'View Clause',
      },
    ]
    setNotifications(items)
    setLoading(false)
  }, [])

  useEffect(() => { generateNotifications() }, [generateNotifications])

  const filtered = useMemo(() => {
    let items = notifications
    if (filterCategory !== 'all') items = items.filter(n => n.type === filterCategory)
    if (!showRead) items = items.filter(n => !n.read)
    return items
  }, [notifications, filterCategory, showRead])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))
  }

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    if (confirm('Clear all notifications?')) setNotifications([])
  }

  const severityStyle = (sev) => {
    const map = {
      critical: { bg: 'rgba(220,53,69,0.10)', border: 'rgba(220,53,69,0.25)', color: CRIMSON, dot: CRIMSON },
      high: { bg: 'rgba(253,126,20,0.10)', border: 'rgba(253,126,20,0.25)', color: AMBER, dot: AMBER },
      medium: { bg: 'rgba(212,168,50,0.08)', border: 'rgba(212,168,50,0.20)', color: GOLD, dot: GOLD },
      low: { bg: 'rgba(32,201,151,0.08)', border: 'rgba(32,201,151,0.20)', color: EMERALD, dot: EMERALD },
    }
    return map[sev] || map.medium
  }

  const typeIcon = (type) => {
    const found = CATEGORIES.find(c => c.id === type)
    const Icon = found?.icon || Bell
    const color = found?.color || GOLD
    return <Icon size={12} style={{ color }} />
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
              <Bell size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Notification Center</h1>
            {unreadCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${CRIMSON}20`, color: CRIMSON }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: GOLD }}>Real-time alerts · Audit triggers · Approval requests · Risk monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generateNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: 'rgba(212,168,50,0.06)', border: BORDER, color: GOLD }}>
            <RefreshCw size={11} /> Refresh
          </button>
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: 'rgba(32,201,151,0.06)', border: '1px solid rgba(32,201,151,0.20)', color: EMERALD }}>
            <CheckCircle size={11} /> Mark All Read
          </button>
          <button onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.20)', color: CRIMSON }}>
            <Trash2 size={11} /> Clear All
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2">
          {CATEGORIES.map(cat => {
            const CatIcon = cat.icon
            const isActive = filterCategory === cat.id
            const count = cat.id === 'all' ? notifications.length : notifications.filter(n => n.type === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                style={isActive
                  ? { background: `${cat.color}12`, border: `1px solid ${cat.color}30`, color: cat.color }
                  : { background: 'rgba(212,168,50,0.03)', border: BORDER, color: SILVER }
                }
              >
                <CatIcon size={10} />
                {cat.label}
                <span className="text-[9px] font-mono" style={{ opacity: 0.6 }}>({count})</span>
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-2 text-[10px]" style={{ color: SILVER }}>
          <input
            type="checkbox"
            checked={showRead}
            onChange={() => setShowRead(p => !p)}
            className="w-3 h-3 rounded"
            style={{ accentColor: GOLD }}
          />
          Show read
        </label>
      </div>

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
          <Bell size={40} className="mx-auto mb-4" style={{ color: 'rgba(212,168,50,0.15)' }} />
          <p className="text-sm" style={{ color: SILVER }}>No notifications</p>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(206,212,218,0.35)' }}>
            {filterCategory !== 'all' ? 'Try changing the category filter' : 'You\'re all caught up'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {filtered.map((notif, idx) => {
            const sev = severityStyle(notif.severity)
            return (
              <div
                key={notif.id}
                className="rounded-xl transition-all duration-200 hover:scale-[1.005]"
                style={{
                  background: notif.read ? DARK_BG : `linear-gradient(135deg, ${sev.bg}, rgba(5,5,5,0.85))`,
                  border: notif.read ? BORDER : `1px solid ${sev.border}`,
                  animationDelay: `${idx * 0.03}s`,
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
                    >
                      {typeIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: WHITE }}>{notif.title}</span>
                        {!notif.read && (
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-dot"
                            style={{ background: sev.dot }}
                          />
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: SILVER }}>{notif.message}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-[9px]" style={{ color: 'rgba(206,212,218,0.35)' }}>
                          <Clock size={8} />
                          {timeAgo(notif.time)}
                        </div>
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
                          style={{ background: sev.bg, color: sev.color }}
                        >
                          {notif.severity}
                        </span>
                        <span className="text-[8px] font-mono" style={{ color: 'rgba(206,212,218,0.25)' }}>{notif.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {notif.actionable && (
                        <button
                          className="px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all"
                          style={{ background: GRADIENT, border: BORDER, color: GOLD }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,50,0.15)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = GRADIENT }}
                        >
                          {notif.actionLabel}
                        </button>
                      )}
                      <button
                        onClick={() => toggleRead(notif.id)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'rgba(206,212,218,0.25)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(212,168,50,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(206,212,218,0.25)'; e.currentTarget.style.background = '' }}
                        title={notif.read ? 'Mark unread' : 'Mark read'}
                      >
                        {notif.read ? <Eye size={11} /> : <Eye size={11} style={{ color: GOLD }} />}
                      </button>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'rgba(206,212,218,0.15)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = CRIMSON; e.currentTarget.style.background = 'rgba(220,53,69,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(206,212,218,0.15)'; e.currentTarget.style.background = '' }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
