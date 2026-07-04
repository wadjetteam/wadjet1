import { useState, useEffect } from 'react'
import { Search, Clock, AlertTriangle, CheckCircle, ChevronRight, Plus, Filter, TrendingUp, FileSearch, Download } from 'lucide-react'
import { downloadExaminationPDF, downloadExaminationCSV } from '../lib/downloadUtils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const findingTypeColors = { MRA: '#c41e3a', MRIA: '#b8860b', Requirement: '#d4af37', Observation: '#4f7da6', 'Action Point': '#2d7d46' }
const severityColors = { critical: '#c41e3a', high: '#b8860b', medium: '#d4af37', low: '#2d7d46' }
const statusColors = { open: '#c41e3a', 'in-progress': '#d4af37', closed: '#2d7d46' }

export default function ExaminationTracker() {
  const [examinations, setExaminations] = useState([])
  const [findings, setFindings] = useState([])
  const [agingData, setAgingData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/examinations').then(r => r.json()),
      fetch('/api/findings').then(r => r.json()),
      fetch('/api/findings/aging').then(r => r.json()),
    ]).then(([exams, fnds, aging]) => {
      setExaminations(exams.items || [])
      setFindings(fnds.items || [])
      setAgingData(aging.items || [])
    }).catch(err => console.error('Failed to fetch examination data:', err))
    .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-full p-6 text-center text-pharaoh-400/60 text-sm">Loading examination data...</div>
  }

  const filtered = findings.filter(f =>
    (selectedExam === 'all' || f.examId === selectedExam) &&
    (filterSeverity === 'all' || f.severity === filterSeverity) &&
    (filterStatus === 'all' || f.status === filterStatus)
  )

  const openCount = findings.filter(f => f.status !== 'closed').length
  const overdueCount = findings.filter(f => f.status !== 'closed' && new Date(f.dueDate) < new Date('2026-06-09')).length
  const criticalOpen = findings.filter(f => f.severity === 'critical' && f.status !== 'closed').length

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <FileSearch size={18} className="text-pharaoh-500" />
            <h1 className="page-title">Regulatory Findings & Examination Tracker</h1>
          </div>
          <p className="page-subtitle">MRA/MRIA management · CBE/External audit findings · Remediation tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadExaminationCSV(findings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green hover:border-egyptian-green/30 transition-all">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={() => downloadExaminationPDF(findings, examinations)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300 transition-all">
            <Download size={12} /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-105">
            <Plus size={15} /> Log Finding
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Open Findings', value: openCount, color: '#d4af37', sub: `of ${findings.length} total` },
          { label: 'Overdue Remediation', value: overdueCount, color: '#c41e3a', sub: 'Past due date' },
          { label: 'Critical Open (MRA)', value: criticalOpen, color: '#c41e3a', sub: 'Immediate action required' },
          { label: 'Avg. Days Open', value: Math.round(findings.filter(f => f.status !== 'closed').reduce((s, f) => s + f.agingDays, 0) / openCount), color: '#b8860b', sub: 'Open findings' },
        ].map(k => (
          <div key={k.label} className="pharaoh-card p-4">
            <p className="text-[10px] text-pharaoh-400/60 mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-pharaoh-400/50 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="pharaoh-card p-4 col-span-1">
          <h3 className="text-xs font-semibold text-pharaoh-300 mb-3">Findings Aging Distribution</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
              <XAxis dataKey="range" tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="count" name="Findings" radius={[4, 4, 0, 0]}>
                {agingData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pharaoh-card p-4 col-span-2">
          <h3 className="text-xs font-semibold text-pharaoh-300 mb-3">Active Examinations</h3>
          <div className="space-y-2">
            {examinations.map(ex => (
              <button key={ex.id} onClick={() => setSelectedExam(selectedExam === ex.id ? 'all' : ex.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedExam === ex.id ? 'gold-gradient text-nile-900' : ''}`}
                style={selectedExam !== ex.id ? { background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${selectedExam === ex.id ? 'text-nile-900' : 'text-pharaoh-200'}`}>{ex.title}</p>
                    <p className={`text-[10px] mt-0.5 ${selectedExam === ex.id ? 'text-nile-800' : 'text-pharaoh-400/50'}`}>{ex.examiner} · {ex.startDate} → {ex.endDate}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${selectedExam === ex.id ? 'text-nile-900' : 'text-pharaoh-300'}`}>{ex.findings}</p>
                    <p className={`text-[10px] ${selectedExam === ex.id ? 'text-nile-800' : 'text-pharaoh-400/50'}`}>findings</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-pharaoh-400/50" />
        {['all', 'critical', 'high', 'medium'].map(s => (
          <button key={s} onClick={() => setFilterSeverity(s)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${filterSeverity === s ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
            style={filterSeverity !== s ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
            {s}
          </button>
        ))}
        {['all', 'open', 'in-progress', 'closed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${filterStatus === s ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
            style={filterStatus !== s ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(f => {
          const isExpanded = expanded === f.id
          const isOverdue = f.status !== 'closed' && new Date(f.dueDate) < new Date('2026-06-09')
          return (
            <div key={f.id} className="pharaoh-card overflow-hidden">
              <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : f.id)}>
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: findingTypeColors[f.type], minWidth: 3 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono text-pharaoh-400/50">{f.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: `${findingTypeColors[f.type]}20`, color: findingTypeColors[f.type] }}>{f.type}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${severityColors[f.severity]}15`, color: severityColors[f.severity] }}>{f.severity}</span>
                    <span className="text-[10px] text-pharaoh-400/40">{f.category}</span>
                    {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 animate-pulse">OVERDUE</span>}
                  </div>
                  <p className="text-sm font-semibold text-pharaoh-200 line-clamp-1">{f.title}</p>
                  <p className="text-[10px] text-pharaoh-400/50 mt-0.5">Owner: {f.owner} · Due: {f.dueDate} · {f.agingDays} days open</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-pharaoh-400/40">Progress</span>
                      <span style={{ color: f.progressPct === 100 ? '#2d7d46' : '#d4af37' }}>{f.progressPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${f.progressPct}%`, background: f.progressPct === 100 ? '#2d7d46' : '#d4af37' }} />
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-lg capitalize" style={{ background: `${statusColors[f.status]}18`, color: statusColors[f.status] }}>
                    {f.status.replace('-', ' ')}
                  </span>
                  <ChevronRight size={14} className={`text-pharaoh-400/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 border-t animate-fade-in space-y-3" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                  <div className="mt-4">
                    <p className="text-[10px] text-pharaoh-400/50 uppercase tracking-wide mb-1">Finding Description</p>
                    <p className="text-xs text-pharaoh-300/80">{f.description}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-pharaoh-400/50 uppercase tracking-wide mb-1">Remediation Plan</p>
                    <p className="text-xs text-pharaoh-300/80">{f.remediationPlan}</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
                      Update Progress
                    </button>
                    {f.status !== 'closed' && (
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium gold-gradient text-nile-900">
                        Submit for CISO Review
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
