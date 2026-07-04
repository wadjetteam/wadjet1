import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock, ChevronDown, ChevronUp, ChevronRight, Upload, FileText, CheckCircle, X, Shield, User, Phone, Mail, Search, Zap, Bell, ExternalLink } from 'lucide-react'
import { useGRC } from '../context/GRCContext'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const GOLD_BORDER = '1px solid rgba(212,168,50,0.12)'
const GOLD_GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

const ESCALATION_COLORS = {
  'Level0_Owner': GOLD,
  'Level1_DeptHead': AMBER,
  'Level2_CRO_CEO': CRIMSON,
}

const ESCALATION_LABELS = {
  'Level0_Owner': 'Owner',
  'Level1_DeptHead': 'Dept Head',
  'Level2_CRO_CEO': 'CRO/CEO',
}

function StatusBadge({ status }) {
  const color = status === 'Open' ? CRIMSON : status === 'In Progress' ? AMBER : status === 'Resolved' ? EMERALD : SILVER
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {status}
    </span>
  )
}

function EscalationTimeline({ task }) {
  const events = [
    { time: task.createdAt, label: 'Breach Detected — Remediation Task Created', level: 0, icon: AlertTriangle },
  ]
  if (task.level0EscalatedAt) {
    events.push({ time: task.level0EscalatedAt, label: 'Level 0 — Assigned to Risk Owner', level: 0, icon: User })
  }
  if (task.level1EscalatedAt) {
    events.push({ time: task.level1EscalatedAt, label: 'Level 1 — Escalated to Department Head (Email + SMS)', level: 1, icon: Phone })
  }
  if (task.level2EscalatedAt) {
    events.push({ time: task.level2EscalatedAt, label: 'Level 2 — Escalated to CRO & CEO (Executive Alert)', level: 2, icon: Mail })
  }
  if (task.resolvedAt) {
    events.push({ time: task.resolvedAt, label: 'Task Resolved — Evidence Submitted', level: 0, icon: CheckCircle })
  }
  return (
    <div className="relative pl-6 space-y-3">
      {events.map((ev, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: ev.level === 2 ? CRIMSON : ev.level === 1 ? AMBER : GOLD }}>
            <ev.icon size={8} style={{ color: '#000' }} />
          </div>
          {i < events.length - 1 && (
            <div className="absolute -left-[19.5px] top-3.5 w-px h-full"
              style={{ background: 'rgba(212,168,50,0.15)' }} />
          )}
          <div>
            <div className="text-[11px]" style={{ color: WHITE }}>{ev.label}</div>
            <div className="text-[10px]" style={{ color: SILVER }}>
              {new Date(ev.time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ResolveModal({ task, onClose, onResolve }) {
  const [rootCause, setRootCause] = useState('')
  const [evidenceFile, setEvidenceFile] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rootCause.trim()) return
    setSubmitting(true)
    await onResolve(task._id, rootCause, evidenceFile)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#0a0a0a', border: GOLD_BORDER }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Resolve Remediation Task</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70">
            <X size={14} style={{ color: SILVER }} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: GOLD }}>Root Cause Analysis & Action Taken</label>
            <textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              rows={4}
              placeholder="Describe the root cause and remediation actions taken..."
              className="w-full text-xs p-3 rounded-xl outline-none resize-none"
              style={{ background: 'rgba(212,168,50,0.06)', border: GOLD_BORDER, color: WHITE }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: GOLD }}>Compliance Evidence File</label>
            <div className="flex items-center gap-2 p-3 rounded-xl cursor-pointer"
              style={{ background: 'rgba(212,168,50,0.06)', border: GOLD_BORDER }}
              onClick={() => {
                const path = prompt('Enter evidence file path or URL:')
                if (path) setEvidenceFile(path)
              }}>
              <Upload size={14} style={{ color: GOLD }} />
              <span className="text-xs" style={{ color: evidenceFile ? WHITE : SILVER }}>
                {evidenceFile || 'Click to attach evidence file...'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose}
              className="text-xs px-4 py-2 rounded-lg"
              style={{ border: GOLD_BORDER, color: SILVER }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting || !rootCause.trim()}
              className="text-xs px-4 py-2 rounded-lg font-medium"
              style={{ background: GOLD_GRADIENT, border: GOLD_BORDER, color: GOLD }}>
              {submitting ? 'Submitting...' : 'Resolve Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RemediationWorkspace() {
  const [activeRemTab, setActiveRemTab] = useState('breach')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState(null)
  const [resolveTask, setResolveTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const { followUpTasks, setFollowUpTasks } = useGRC()

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/breach-tasks')
      const data = await res.json()
      setTasks(data.items || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const handleResolve = async (taskId, rootCauseAnalysis, evidenceFilePath) => {
    try {
      await fetch(`/api/breach-tasks/${taskId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootCauseAnalysis, evidenceFilePath }),
      })
      setResolveTask(null)
      await loadTasks()
    } catch {}
  }

  const filteredTasks = tasks.filter(t => {
    if (searchTerm && !t.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !t._id?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterLevel !== 'all' && t.escalationLevel !== filterLevel) return false
    return true
  })

  const getDueUrgency = (dueBy) => {
    const hours = (new Date(dueBy).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hours < 0) return { color: CRIMSON, label: `${Math.abs(Math.round(hours))}h overdue` }
    if (hours < 12) return { color: AMBER, label: `${Math.round(hours)}h left` }
    return { color: EMERALD, label: `${Math.round(hours)}h left` }
  }

  const countByLevel = (level) => tasks.filter(t => t.escalationLevel === level).length

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GOLD_GRADIENT, border: GOLD_BORDER }}>
              <Shield size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Remediation Workspace</h1>
          </div>
          <p className="text-xs" style={{ color: GOLD }}>Breach Remediation Tasks · Follow-Up Kanban</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2" style={{ background: DARK_BG, border: GOLD_BORDER, borderRadius: 12, padding: 3, width: 'fit-content' }}>
        {[
          { id: 'breach', label: 'Breach Tasks', icon: Shield },
          { id: 'follow-up', label: 'Follow-Up Kanban', icon: Zap },
        ].map(tab => {
          const TabIcon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveRemTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all"
              style={activeRemTab === tab.id
                ? { background: GOLD_GRADIENT, border: GOLD_BORDER, color: GOLD }
                : { color: SILVER, border: '1px solid transparent' }}>
              <TabIcon size={14} /><span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeRemTab === 'breach' && (<>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl" style={{ background: DARK_BG, border: GOLD_BORDER }}>
          <div className="text-xs" style={{ color: SILVER }}>Total Active</div>
          <div className="text-2xl font-bold mt-1" style={{ color: WHITE }}>{tasks.filter(t => t.status !== 'Closed').length}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(212,168,50,0.06)', border: `1px solid ${GOLD}30` }}>
          <div className="text-xs" style={{ color: GOLD }}>Level 0 · Owner</div>
          <div className="text-2xl font-bold mt-1" style={{ color: GOLD }}>{countByLevel('Level0_Owner')}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(253,126,20,0.06)', border: `1px solid ${AMBER}30` }}>
          <div className="text-xs" style={{ color: AMBER }}>Level 1 · Dept Head</div>
          <div className="text-2xl font-bold mt-1" style={{ color: AMBER }}>{countByLevel('Level1_DeptHead')}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(220,53,69,0.06)', border: `1px solid ${CRIMSON}30` }}>
          <div className="text-xs" style={{ color: CRIMSON }}>Level 2 · CRO/CEO</div>
          <div className="text-2xl font-bold mt-1" style={{ color: CRIMSON }}>{countByLevel('Level2_CRO_CEO')}</div>
        </div>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: GOLD_BORDER }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Breach Remediation Tasks</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={11} style={{ color: SILVER, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-32 text-[11px] py-1.5 pl-6 pr-2 rounded-lg outline-none"
                style={{ background: 'rgba(212,168,50,0.06)', border: GOLD_BORDER, color: WHITE }}
              />
            </div>
            <select value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="text-[11px] py-1.5 px-2 rounded-lg outline-none"
              style={{ background: 'rgba(212,168,50,0.06)', border: GOLD_BORDER, color: GOLD }}>
              <option value="all" style={{ background: '#0a0a0a' }}>All Levels</option>
              <option value="Level0_Owner" style={{ background: '#0a0a0a' }}>Level 0 · Owner</option>
              <option value="Level1_DeptHead" style={{ background: '#0a0a0a' }}>Level 1 · Dept Head</option>
              <option value="Level2_CRO_CEO" style={{ background: '#0a0a0a' }}>Level 2 · CRO/CEO</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-xs" style={{ color: SILVER }}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={28} className="mx-auto mb-2" style={{ color: EMERALD }} />
            <p className="text-xs" style={{ color: SILVER }}>No active breach remediation tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => {
              const urgency = getDueUrgency(task.dueBy)
              const isExpanded = expandedTask === task._id
              return (
                <div key={task._id} className="rounded-xl overflow-hidden"
                  style={{ border: GOLD_BORDER, background: 'rgba(212,168,50,0.02)' }}>
                  <div
                    onClick={() => setExpandedTask(isExpanded ? null : task._id)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:opacity-90"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${ESCALATION_COLORS[task.escalationLevel]}15`, border: `1px solid ${ESCALATION_COLORS[task.escalationLevel]}30` }}>
                      <AlertTriangle size={14} style={{ color: ESCALATION_COLORS[task.escalationLevel] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: WHITE }}>{task.title}</div>
                      <div className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color: SILVER }}>
                        <span className="font-mono">#{task._id?.slice(0, 8)}</span>
                        <span>·</span>
                        <span>Owner: {task.riskOwnerId}</span>
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                    <div className="text-[10px] px-2 py-1 rounded-full font-medium"
                      style={{ background: `${ESCALATION_COLORS[task.escalationLevel]}15`, color: ESCALATION_COLORS[task.escalationLevel], border: `1px solid ${ESCALATION_COLORS[task.escalationLevel]}30` }}>
                      {ESCALATION_LABELS[task.escalationLevel]}
                    </div>
                    <div className="text-[10px] flex items-center gap-1 font-mono" style={{ color: urgency.color }}>
                      <Clock size={10} />
                      {urgency.label}
                    </div>
                    {isExpanded ? <ChevronUp size={14} style={{ color: SILVER }} /> : <ChevronDown size={14} style={{ color: SILVER }} />}
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t" style={{ borderColor: 'rgba(212,168,50,0.1)' }}>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <div className="text-[11px] font-medium mb-2" style={{ color: GOLD }}>Task Details</div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between">
                              <span style={{ color: SILVER }}>Task ID</span>
                              <span className="font-mono" style={{ color: WHITE }}>{task._id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: SILVER }}>KRI Catalog</span>
                              <span style={{ color: WHITE }}>{task.kriCatalog?.code || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: SILVER }}>Severity</span>
                              <span style={{ color: CRIMSON }}>{task.severity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: SILVER }}>Due By</span>
                              <span style={{ color: urgency.color }}>
                                {new Date(task.dueBy).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: SILVER }}>Created</span>
                              <span style={{ color: WHITE }}>
                                {new Date(task.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                          {task.description && (
                            <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(212,168,50,0.04)' }}>
                              <div className="text-[10px]" style={{ color: SILVER }}>{task.description}</div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] font-medium mb-2" style={{ color: GOLD }}>Escalation Audit Trail</div>
                          <EscalationTimeline task={task} />
                        </div>
                      </div>
                      {task.status !== 'Resolved' && task.status !== 'Closed' && (
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => setResolveTask(task)}
                            className="text-xs px-4 py-1.5 rounded-lg font-medium transition-all hover:opacity-90"
                            style={{ background: EMERALD + '20', border: `1px solid ${EMERALD}40`, color: EMERALD }}>
                            <CheckCircle size={12} className="inline mr-1" />Resolve Task
                          </button>
                        </div>
                      )}
                      {task.rootCauseAnalysis && (
                        <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(32,201,151,0.04)', border: '1px solid rgba(32,201,151,0.1)' }}>
                          <div className="text-[10px] font-medium mb-1" style={{ color: EMERALD }}>Root Cause Analysis</div>
                          <div className="text-[10px]" style={{ color: SILVER }}>{task.rootCauseAnalysis}</div>
                          {task.evidenceFilePath && (
                            <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: GOLD }}>
                              <FileText size={10} /> {task.evidenceFilePath}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {resolveTask && (
        <ResolveModal
          task={resolveTask}
          onClose={() => setResolveTask(null)}
          onResolve={handleResolve}
        />
      )}
      </>)}
      {activeRemTab === 'follow-up' && <FollowUpTab />}
    </div>
  )
}

/* ── Follow-Up Kanban Tab (merged from FollowUpWorkspace) ── */
const KANBAN_COLUMNS = [
  { id: 'open', label: 'Open Gaps (Received)', icon: AlertTriangle },
  { id: 'in-progress', label: 'In Progress', icon: ChevronRight },
  { id: 'review', label: 'Under Compliance Review', icon: Shield },
  { id: 'closed', label: 'Closed & Verified', icon: CheckCircle },
]

function FollowUpTab() {
  const { followUpTasks, setFollowUpTasks } = useGRC()
  const [dragOverCol, setDragOverCol] = useState(null)
  const [showEvidenceModal, setShowEvidenceModal] = useState(null)
  const [showEscalateModal, setShowEscalateModal] = useState(null)
  const [showNotificationBanner, setShowNotificationBanner] = useState(false)
  const [pulseNotification, setPulseNotification] = useState(false)
  const tasks = followUpTasks

  const openTasks = tasks.filter(t => t.status === 'open').length
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
  const breachedTasks = tasks.filter(t => t.breached).length

  const getLevelColor = (level) => {
    const map = { 2: '#c9a82e', 3: '#b8860b', 4: '#2d7d46' }
    return map[level] || '#b8860b'
  }

  const handleForceNotification = () => {
    setPulseNotification(true)
    setTimeout(() => {
      setShowNotificationBanner(true)
      setPulseNotification(false)
      setTimeout(() => setShowNotificationBanner(false), 4000)
    }, 600)
  }

  return (
    <div className="space-y-5">
      {/* SLA & Notification Center */}
      <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: GOLD_BORDER }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={14} style={{ color: GOLD }} />
            <span className="text-sm font-semibold" style={{ color: WHITE }}>SLA & Notification Center</span>
          </div>
          <button onClick={handleForceNotification} disabled={pulseNotification}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${pulseNotification ? 'opacity-40' : ''}`}
            style={pulseNotification ? { background: 'rgba(212,168,50,0.1)', color: GOLD } : { background: GOLD_GRADIENT, border: GOLD_BORDER, color: GOLD }}>
            <Bell size={12} className={pulseNotification ? 'animate-pulse-dot' : ''} />
            {pulseNotification ? 'Broadcasting...' : 'Trigger Force Notification Push'}
          </button>
        </div>

        {pulseNotification && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2 animate-fade-in" style={{ background: 'rgba(212,168,50,0.08)', border: GOLD_BORDER }}>
            <div className="flex gap-0.5">
              {[0, 0.15, 0.3].map((d, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: `${d}s` }} />
              ))}
            </div>
            <span className="text-xs" style={{ color: GOLD }}>Pinging desktop agents for overdue employees...</span>
          </div>
        )}

        {showNotificationBanner && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2 animate-fade-in" style={{ background: 'rgba(32,201,151,0.1)', border: '1px solid rgba(32,201,151,0.2)' }}>
            <CheckCircle size={14} style={{ color: EMERALD }} />
            <span className="text-xs" style={{ color: EMERALD }}>Force push completed. 23 desktop agents notified successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,168,50,0.04)', border: GOLD_BORDER }}>
            <div className="text-2xl font-bold font-mono" style={{ color: GOLD }}>{openTasks}</div>
            <div className="text-[10px] mt-1" style={{ color: SILVER }}>Open Remediation Tasks</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,168,50,0.04)', border: GOLD_BORDER }}>
            <div className="text-2xl font-bold font-mono" style={{ color: GOLD }}>{inProgressTasks}</div>
            <div className="text-[10px] mt-1" style={{ color: SILVER }}>Tasks In-Progress</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(220,53,69,0.06)', border: `1px solid ${CRIMSON}30` }}>
            <div className="text-2xl font-bold font-mono" style={{ color: breachedTasks > 0 ? CRIMSON : SILVER }}>{breachedTasks}</div>
            <div className="text-[10px] mt-1" style={{ color: SILVER }}>Critical SLA Breaches</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,168,50,0.04)', border: GOLD_BORDER }}>
            <div className="text-2xl font-bold font-mono" style={{ color: EMERALD }}>1,240 / 1,250</div>
            <div className="text-[10px] mt-1" style={{ color: SILVER }}>Connected Desktop Agents</div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          const ColIcon = col.icon
          return (
            <div key={col.id}
              className="rounded-xl p-4 transition-all duration-300"
              style={{ background: DARK_BG, border: dragOverCol === col.id ? '1px dashed rgba(212,168,50,0.4)' : GOLD_BORDER }}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => setDragOverCol(null)}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ColIcon size={14} style={{ color: col.id === 'closed' ? EMERALD : col.id === 'open' ? CRIMSON : col.id === 'in-progress' ? GOLD : SILVER }} />
                  <span className="text-xs font-semibold" style={{ color: WHITE }}>{col.label}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(212,168,50,0.08)', color: GOLD }}>{colTasks.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {colTasks.map(task => {
                  const levelColor = getLevelColor(task.level)
                  return (
                    <div key={task.id} className="rounded-xl p-3 transition-all" style={{ background: 'rgba(212,168,50,0.03)', border: GOLD_BORDER }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}30` }}>
                          {task.levelLabel}
                        </span>
                      </div>
                      <p className="text-xs font-medium mb-3" style={{ color: WHITE }}>{task.title}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,168,50,0.1)' }}>
                            <User size={8} style={{ color: GOLD }} />
                          </div>
                          <span className="text-[9px]" style={{ color: SILVER }}>{task.assignee}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          task.breached ? 'bg-red-900/20 text-red-400' : task.sla <= 24 && task.sla > 0 ? 'bg-amber-900/20 text-amber-400' : 'opacity-50'
                        }`}>
                          <Clock size={8} />
                          {task.breached ? 'SLA Breached' : `SLA: ${task.sla}h`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'rgba(212,168,50,0.06)' }}>
                        {task.status !== 'closed' && (
                          <button onClick={() => setShowEvidenceModal(task)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all"
                            style={{ background: 'rgba(212,168,50,0.08)', border: GOLD_BORDER, color: GOLD }}>
                            <Upload size={10} /> Upload Evidence
                          </button>
                        )}
                        {(task.breached || task.status === 'open') && task.status !== 'closed' && (
                          <button onClick={() => setShowEscalateModal(task)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all ml-auto"
                            style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: CRIMSON }}>
                            <AlertTriangle size={10} /> Escalate
                          </button>
                        )}
                        {task.status === 'closed' && (
                          <div className="flex items-center gap-1 text-[9px] ml-auto" style={{ color: EMERALD }}>
                            <CheckCircle size={10} /> Verified Closed
                          </div>
                        )}
                      </div>
                      {task.status === 'review' && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(212,168,50,0.06)' }}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(212,168,50,0.08)' }}>
                              <div className="h-full rounded-full" style={{ width: '60%', background: GOLD }} />
                            </div>
                            <span className="text-[8px]" style={{ color: SILVER }}>60%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[480px] rounded-2xl overflow-hidden animate-fade-in" style={{ background: '#0a0a0a', border: GOLD_BORDER }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: GOLD_BORDER }}>
              <div className="flex items-center gap-3">
                <Upload size={18} style={{ color: GOLD }} />
                <div>
                  <h3 className="text-sm font-bold" style={{ color: WHITE }}>Upload Closure Evidence</h3>
                  <p className="text-[10px]" style={{ color: SILVER }}>{showEvidenceModal.title}</p>
                </div>
              </div>
              <button onClick={() => setShowEvidenceModal(null)} className="p-1 hover:opacity-70"><X size={16} style={{ color: SILVER }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all" style={{ borderColor: 'rgba(212,168,50,0.3)' }}>
                <Upload size={28} className="mx-auto mb-3" style={{ color: 'rgba(212,168,50,0.4)' }} />
                <p className="text-sm font-medium" style={{ color: SILVER }}>Drop evidence files here</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(206,212,218,0.3)' }}>PDF, PCAP, Screenshot · Max 25 MB</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5" style={{ borderTop: GOLD_BORDER }}>
              <button onClick={() => setShowEvidenceModal(null)} className="px-4 py-2 rounded-xl text-xs" style={{ border: GOLD_BORDER, color: SILVER }}>Cancel</button>
              <button onClick={() => setShowEvidenceModal(null)} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: GOLD_GRADIENT, border: GOLD_BORDER, color: GOLD }}>Submit for Review</button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[520px] rounded-2xl overflow-hidden animate-fade-in" style={{ background: '#0a0a0a', border: GOLD_BORDER }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: GOLD_BORDER }}>
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} style={{ color: CRIMSON }} />
                <div>
                  <h3 className="text-sm font-bold" style={{ color: WHITE }}>Escalate to CISO</h3>
                  <p className="text-[10px]" style={{ color: SILVER }}>{showEscalateModal.title}</p>
                </div>
              </div>
              <button onClick={() => setShowEscalateModal(null)} className="p-1 hover:opacity-70"><X size={16} style={{ color: SILVER }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={12} style={{ color: CRIMSON }} />
                  <span className="text-[10px] font-medium" style={{ color: CRIMSON }}>SLA Breached</span>
                </div>
                <p className="text-[10px]" style={{ color: SILVER }}>This task has exceeded its SLA window and requires immediate CISO intervention.</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(212,168,50,0.04)', border: GOLD_BORDER }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={12} style={{ color: GOLD }} />
                  <span className="text-xs font-medium" style={{ color: WHITE }}>Task Details</span>
                </div>
                <div className="text-[10px] space-y-1" style={{ color: SILVER }}>
                  <div>Assignee: <span style={{ color: WHITE }}>{showEscalateModal.assignee}</span></div>
                  <div>Maturity Target: <span style={{ color: WHITE }}>{showEscalateModal.levelLabel}</span></div>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: SILVER }}>CISO Escalation Notes</label>
                <textarea placeholder="Provide escalation justification..." rows={4}
                  className="w-full rounded-xl py-2.5 px-3 text-xs outline-none resize-none"
                  style={{ background: 'rgba(212,168,50,0.06)', border: GOLD_BORDER, color: WHITE }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5" style={{ borderTop: GOLD_BORDER }}>
              <button onClick={() => setShowEscalateModal(null)} className="px-4 py-2 rounded-xl text-xs" style={{ border: GOLD_BORDER, color: SILVER }}>Cancel</button>
              <button onClick={() => setShowEscalateModal(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: GOLD_GRADIENT, border: GOLD_BORDER, color: GOLD }}>
                <ExternalLink size={12} /> Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
