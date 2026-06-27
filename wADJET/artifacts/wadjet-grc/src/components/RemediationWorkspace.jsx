import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock, ChevronDown, ChevronUp, Upload, FileText, CheckCircle, X, Shield, User, Phone, Mail, Search } from 'lucide-react'

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
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState(null)
  const [resolveTask, setResolveTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')

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
          <p className="text-xs" style={{ color: GOLD }}>Breach Remediation Tasks · Escalation Matrix</p>
        </div>
      </div>

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
    </div>
  )
}
