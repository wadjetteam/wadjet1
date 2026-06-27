import { useState } from 'react'
import { Clock, User, AlertTriangle, Upload, CheckCircle, Bell, Zap, ChevronRight, Shield, Monitor, ExternalLink, X, Download } from 'lucide-react'
import { downloadFollowUpCSV, downloadFollowUpPDF } from '../lib/downloadUtils'
import { useGRC } from '../context/GRCContext'

const columns = [
  { id: 'open', label: 'Open Gaps (Received)', icon: AlertTriangle },
  { id: 'in-progress', label: 'In Progress', icon: ChevronRight },
  { id: 'review', label: 'Under Compliance Review', icon: Shield },
  { id: 'closed', label: 'Closed & Verified', icon: CheckCircle },
]

const agentData = { active: 1240, total: 1250 }

export default function FollowUpWorkspace() {
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
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Zap size="18" className="text-pharaoh-500" />
            <h1 className="page-title">Follow-Up Workspace</h1>
          </div>
          <p className="page-subtitle">Remediation action plan execution and task lifecycle management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadFollowUpCSV(tasks)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green hover:border-egyptian-green/30 transition-all">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={() => downloadFollowUpPDF(tasks)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300 transition-all">
            <Download size={12} /> Export PDF
          </button>
        </div>
      </div>

      {/* SLA & Notification Center */}
      <div className="pharaoh-card p-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size="14" className="text-pharaoh-400" />
            <span className="text-sm font-semibold text-pharaoh-200">SLA & Notification Center</span>
          </div>
          <button onClick={handleForceNotification} disabled={pulseNotification}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${pulseNotification ? 'bg-pharaoh-500/10 text-pharaoh-500/40' : 'gold-gradient text-nile-900 hover:opacity-90 shadow-lg shadow-pharaoh-500/20'}`}>
            <Bell size="12" className={pulseNotification ? 'animate-pulse-dot' : ''} />
            {pulseNotification ? 'Broadcasting...' : 'Trigger Force Notification Push'}
          </button>
        </div>

        {/* Pulse animation overlay */}
        {pulseNotification && (
          <div className="mb-4 p-3 rounded-xl bg-pharaoh-400/10 border border-pharaoh-400/20 flex items-center gap-2 animate-fade-in">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pharaoh-400 animate-pulse-dot" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-pharaoh-400 animate-pulse-dot" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-pharaoh-400 animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
            </div>
            <span className="text-xs text-pharaoh-300 font-medium">Pinging desktop agents for overdue employees...</span>
          </div>
        )}

        {showNotificationBanner && (
          <div className="mb-4 p-3 rounded-xl bg-egyptian-green/10 border border-egyptian-green/20 flex items-center gap-2 animate-fade-in">
            <CheckCircle size="14" className="text-egyptian-green" />
            <span className="text-xs text-egyptian-green font-medium">Force push completed. 23 desktop agents notified successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
            <div className="text-2xl font-bold font-mono text-pharaoh-400">{openTasks}</div>
            <div className="text-[10px] text-pharaoh-500/40 mt-1">Open Remediation Tasks</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
            <div className="text-2xl font-bold font-mono text-pharaoh-400">{inProgressTasks}</div>
            <div className="text-[10px] text-pharaoh-500/40 mt-1">Tasks In-Progress</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
            <div className={`text-2xl font-bold font-mono ${breachedTasks > 0 ? 'text-egyptian-red animate-blink' : 'text-pharaoh-500/40'}`}>{breachedTasks}</div>
            <div className="text-[10px] text-pharaoh-500/40 mt-1">Critical SLA Breaches</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
            <div className="text-2xl font-bold font-mono text-egyptian-green">{agentData.active.toLocaleString()} / {agentData.total.toLocaleString()}</div>
            <div className="text-[10px] text-pharaoh-500/40 mt-1">Connected Desktop Agents</div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          const ColIcon = col.icon
          return (
            <div key={col.id}
              className={`bg-zinc-900/40 border rounded-xl p-4 transition-all duration-300 ${dragOverCol === col.id ? 'border-dashed border-amber-500/30' : 'border-zinc-800'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => { setDragOverCol(null) }}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ColIcon size="14" className={col.id === 'closed' ? 'text-egyptian-green' : col.id === 'open' ? 'text-egyptian-red' : col.id === 'in-progress' ? 'text-pharaoh-400' : 'text-pharaoh-300'} />
                  <span className="text-xs font-semibold text-pharaoh-200">{col.label}</span>
                </div>
                <span className="text-[10px] font-mono text-pharaoh-500/40 bg-zinc-800/60 px-2 py-0.5 rounded">{colTasks.length}</span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 min-h-[200px]">
                {colTasks.map(task => {
                  const levelColor = getLevelColor(task.level)
                  return (
                    <div key={task.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
                      {/* Maturity Tag */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}30` }}>
                          {task.levelLabel === 'Level 3 Blocker' ? '🔑' : '⚡'} {task.levelLabel}
                        </span>
                      </div>

                      {/* Task Title */}
                      <p className="text-xs font-medium text-pharaoh-200 leading-relaxed mb-3">{task.title}</p>

                      {/* Operations Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-pharaoh-500/15 border border-pharaoh-500/20 flex items-center justify-center">
                            <User size="8" className="text-pharaoh-400" />
                          </div>
                          <span className="text-[9px] text-pharaoh-400/70">{task.assignee}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          task.breached
                            ? 'bg-egyptian-red/10 text-egyptian-red border border-egyptian-red/30 animate-blink'
                            : task.sla <= 24 && task.sla > 0
                              ? 'bg-pharaoh-400/10 text-pharaoh-400 border border-pharaoh-400/20'
                              : 'bg-pharaoh-500/5 text-pharaoh-500/40 border border-pharaoh-500/15'
                        }`}>
                          <Clock size="8" />
                          {task.breached ? 'SLA Breached' : `SLA: ${task.sla}h Remaining`}
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-700/30">
                        {task.status !== 'closed' && (
                          <button onClick={() => setShowEvidenceModal(task)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 hover:bg-pharaoh-500/15 transition-all">
                            <Upload size="10" /> Upload Evidence
                          </button>
                        )}
                        {(task.breached || task.status === 'open') && task.status !== 'closed' && (
                          <button onClick={() => setShowEscalateModal(task)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium bg-egyptian-red/10 border border-egyptian-red/20 text-egyptian-red hover:bg-egyptian-red/15 transition-all ml-auto">
                            <AlertTriangle size="10" /> Escalate to CISO
                          </button>
                        )}
                        {task.status === 'closed' && (
                          <div className="flex items-center gap-1 text-[9px] text-egyptian-green ml-auto">
                            <CheckCircle size="10" /> Verified Closed
                          </div>
                        )}
                      </div>

                      {/* Review Progress */}
                      {task.status === 'review' && (
                        <div className="mt-2 pt-2 border-t border-zinc-700/30">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-pharaoh-800/30 overflow-hidden">
                              <div className="h-full rounded-full bg-pharaoh-400" style={{ width: '60%' }} />
                            </div>
                            <span className="text-[8px] text-pharaoh-500/40">60%</span>
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

      {/* Evidence Upload Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-nile-900 rounded-2xl shadow-2xl border border-pharaoh-500/15 w-[480px] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-pharaoh-500/10">
              <div className="flex items-center gap-3">
                <Upload size="18" className="text-pharaoh-400" />
                <div>
                  <h3 className="text-sm font-bold text-pharaoh-200">Upload Closure Evidence</h3>
                  <p className="text-[10px] text-pharaoh-400/60">{showEvidenceModal.title}</p>
                </div>
              </div>
              <button onClick={() => setShowEvidenceModal(null)} className="text-pharaoh-500/40 hover:text-pharaoh-300"><X size="16" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="border-2 border-dashed border-pharaoh-500/30 rounded-2xl p-8 text-center cursor-pointer hover:border-pharaoh-400 hover:bg-pharaoh-500/10 transition-all">
                <Upload size="28" className="mx-auto mb-3 text-pharaoh-500/40" />
                <p className="text-sm text-pharaoh-400/70 font-medium mb-1">Drop evidence files here</p>
                <p className="text-xs text-pharaoh-500/40">PDF, PCAP, Screenshot · Max 25 MB</p>
              </div>
              <div className="p-3 rounded-xl bg-pharaoh-900/30 border border-pharaoh-500/15">
                <div className="flex items-center gap-2 mb-1"><Shield size="12" className="text-pharaoh-400" /><span className="text-xs text-pharaoh-300 font-medium">Evidence Requirements</span></div>
                <p className="text-[10px] text-pharaoh-500/40">Upload proof of remediation including scan results, configuration screenshots, or signed attestation forms.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-pharaoh-500/10">
              <button onClick={() => setShowEvidenceModal(null)} className="px-4 py-2 rounded-xl text-xs text-pharaoh-500/40 hover:text-pharaoh-300 border border-pharaoh-500/15 transition-all">Cancel</button>
              <button onClick={() => setShowEvidenceModal(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium gold-gradient text-nile-900 font-bold hover:opacity-90 transition-all">
                <Upload size="12" /> Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate to CISO Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-nile-900 rounded-2xl shadow-2xl border border-pharaoh-500/15 w-[520px] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-pharaoh-500/10">
              <div className="flex items-center gap-3">
                <AlertTriangle size="18" className="text-egyptian-red" />
                <div>
                  <h3 className="text-sm font-bold text-pharaoh-200">Escalate to CISO</h3>
                  <p className="text-[10px] text-pharaoh-400/60">{showEscalateModal.title}</p>
                </div>
              </div>
              <button onClick={() => setShowEscalateModal(null)} className="text-pharaoh-500/40 hover:text-pharaoh-300"><X size="16" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-egyptian-red/10 border border-egyptian-red/20">
                <div className="flex items-center gap-1.5 mb-1"><Clock size="12" className="text-egyptian-red" /><span className="text-[10px] text-egyptian-red font-medium">SLA Breached</span></div>
                <p className="text-[10px] text-pharaoh-400/70">This task has exceeded its SLA window and requires immediate CISO intervention.</p>
              </div>
              <div className="p-3 rounded-xl bg-pharaoh-900/30 border border-pharaoh-500/15">
                <div className="flex items-center gap-2 mb-2"><Shield size="12" className="text-pharaoh-300" /><span className="text-xs text-pharaoh-300 font-medium">Task Details</span></div>
                <div className="text-[10px] text-pharaoh-400/70 space-y-1">
                  <div>Assignee: <span className="text-pharaoh-300">{showEscalateModal.assignee}</span></div>
                  <div>Maturity Target: <span className="text-pharaoh-300">{showEscalateModal.levelLabel}</span></div>
                </div>
              </div>
              <div>
                <label className="text-xs text-pharaoh-400/60 mb-1.5 block">CISO Escalation Notes</label>
                <textarea placeholder="Provide escalation justification and recommended actions..." rows="4"
                  className="w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 px-3 text-xs text-pharaoh-300 placeholder-pharaoh-500/40 focus:border-pharaoh-500/50 focus:outline-none transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-pharaoh-500/10">
              <button onClick={() => setShowEscalateModal(null)} className="px-4 py-2 rounded-xl text-xs text-pharaoh-500/40 hover:text-pharaoh-300 border border-pharaoh-500/15 transition-all">Cancel</button>
              <button onClick={() => setShowEscalateModal(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium gold-gradient text-nile-900 font-bold hover:opacity-90 transition-all">
                <ExternalLink size="12" /> Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ankh-divider" />
    </div>
  )
}
