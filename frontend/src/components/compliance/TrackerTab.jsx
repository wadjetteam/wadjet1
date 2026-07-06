import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, Search, FileText } from 'lucide-react'
import { GOLD, SILVER, WHITE, EMERALD, AMBER, CRIMSON, TRACKER_SEV_COLORS, SEV_ORDER, TRACKER_BG, TRACKER_BORDER } from './ComplianceConstants'

function TrackerChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(2,2,4,0.97)', border: TRACKER_BORDER, borderRadius: 10, padding: '10px 14px', fontSize: 11 }}>
      <div style={{ color: WHITE, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || GOLD }} />
          <span style={{ color: SILVER }}>{p.name}:</span>
          <span style={{ color: WHITE, fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function TrackerRiskRow({ risk }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: TRACKER_BORDER, background: 'rgba(212,168,50,0.02)' }}>
      <div onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 p-3 cursor-pointer">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${TRACKER_SEV_COLORS[risk.severity] || SILVER}15` }}>
          <AlertTriangle size={12} style={{ color: TRACKER_SEV_COLORS[risk.severity] || SILVER }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: WHITE }}>{risk.riskTitle}</div>
          <div className="text-[10px]" style={{ color: SILVER }}>{risk.riskId} · {risk.riskCategory}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${TRACKER_SEV_COLORS[risk.severity] || SILVER}15`, color: TRACKER_SEV_COLORS[risk.severity] || SILVER, border: `1px solid ${TRACKER_SEV_COLORS[risk.severity] || SILVER}30` }}>
          {risk.severity}
        </span>
        <span className="text-[10px]" style={{ color: risk.status === 'Closed' || risk.status === 'Resolved' ? EMERALD : AMBER }}>
          {risk.status}
        </span>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t space-y-1.5 text-[11px]" style={{ borderColor: 'rgba(212,168,50,0.1)' }}>
          <div className="pt-2 flex justify-between"><span style={{ color: SILVER }}>Department</span><span style={{ color: WHITE }}>{risk.ownerTeam}</span></div>
          <div className="flex justify-between"><span style={{ color: SILVER }}>Process</span><span style={{ color: WHITE }}>{risk.process}</span></div>
          <div className="flex justify-between"><span style={{ color: SILVER }}>Owner</span><span style={{ color: GOLD }}>{risk.owner}</span></div>
          <div className="flex justify-between"><span style={{ color: SILVER }}>Due Date</span><span style={{ color: risk.deadline ? AMBER : SILVER }}>{risk.deadline || 'N/A'}</span></div>
          {risk.mitigationActions && (
            <div className="mt-1 p-2 rounded-lg" style={{ background: 'rgba(212,168,50,0.04)' }}>
              <span style={{ color: GOLD, fontSize: 10 }}>Mitigation: </span>
              <span style={{ color: SILVER, fontSize: 10 }}>{risk.mitigationActions}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TrackerTab() {
  const [risks, setRisks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sevFilter, setSevFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/api/risks').then(r => r.json()).then(d => setRisks(d.risks || [])).catch(() => {})
  }, [])

  const { deptRes, filtered } = useMemo(() => {
    const deptMap = {}
    risks.forEach(r => {
      const dept = r.ownerTeam || 'Unknown'
      if (!deptMap[dept]) deptMap[dept] = { total: 0, closed: 0, critical: 0 }
      deptMap[dept].total++
      if (r.status === 'Closed' || r.status === 'Resolved') deptMap[dept].closed++
      if (r.severity === 'Critical') deptMap[dept].critical++
    })
    const deptRes = Object.entries(deptMap)
      .map(([name, d]) => ({
        name: name.length > 18 ? name.slice(0, 16) + '..' : name,
        rate: d.total ? Math.round((d.closed / d.total) * 100) : 0,
        total: d.total, closed: d.closed, critical: d.critical,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    const filtered = risks.filter(r => {
      if (sevFilter !== 'all' && r.severity !== sevFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (searchTerm && !r.riskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !r.riskId?.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    return { deptRes, filtered }
  }, [risks, searchTerm, sevFilter, statusFilter])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-7 space-y-5">
          <div className="p-5 rounded-2xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>Resolution Rate by Department</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptRes} layout="vertical" margin={{ left: 110, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,50,0.06)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: SILVER, fontSize: 10 }}
                    axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: SILVER, fontSize: 10 }}
                    axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<TrackerChartTip />} />
                  <Bar dataKey="rate" name="Resolution Rate" radius={[0, 4, 4, 0]} barSize={18}>
                    {deptRes.map((e, i) => (
                      <Cell key={i} fill={e.rate >= 70 ? EMERALD : e.rate >= 40 ? GOLD : e.rate >= 20 ? AMBER : CRIMSON} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Total Risks</div>
              <div className="text-2xl font-bold mt-1" style={{ color: WHITE }}>{risks.length}</div>
              <div className="text-[10px] mt-1" style={{ color: GOLD }}>48 seeded</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Resolved</div>
              <div className="text-2xl font-bold mt-1" style={{ color: EMERALD }}>
                {risks.filter(r => r.status === 'Closed' || r.status === 'Resolved').length}
              </div>
              <div className="text-[10px] mt-1" style={{ color: AMBER }}>
                {risks.filter(r => r.status !== 'Closed' && r.status !== 'Resolved').length} open
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Critical</div>
              <div className="text-2xl font-bold mt-1" style={{ color: CRIMSON }}>
                {risks.filter(r => r.severity === 'Critical').length}
              </div>
              <div className="text-[10px] mt-1" style={{ color: AMBER }}>
                {risks.filter(r => r.severity === 'High').length} High
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
              <div className="text-[10px]" style={{ color: SILVER }}>Departments</div>
              <div className="text-2xl font-bold mt-1" style={{ color: GOLD }}>
                {new Set(risks.map(r => r.ownerTeam)).size}
              </div>
              <div className="text-[10px] mt-1" style={{ color: SILVER }}>Categories: {new Set(risks.map(r => r.riskCategory)).size}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: TRACKER_BG, border: TRACKER_BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: WHITE }}>Risk Register Browser</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={10} style={{ color: SILVER, position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)' }} />
                  <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-24 text-[10px] py-1.5 pl-5 pr-2 rounded-lg outline-none"
                    style={{ background: 'rgba(212,168,50,0.06)', border: TRACKER_BORDER, color: WHITE }} />
                </div>
                <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
                  className="text-[10px] py-1.5 px-2 rounded-lg outline-none"
                  style={{ background: 'rgba(212,168,50,0.06)', border: TRACKER_BORDER, color: GOLD }}>
                  <option value="all" style={{ background: '#0a0a0a' }}>All Severity</option>
                  {SEV_ORDER.map(s => <option key={s} value={s} style={{ background: '#0a0a0a' }}>{s}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="text-[10px] py-1.5 px-2 rounded-lg outline-none"
                  style={{ background: 'rgba(212,168,50,0.06)', border: TRACKER_BORDER, color: GOLD }}>
                  <option value="all" style={{ background: '#0a0a0a' }}>All Status</option>
                  <option value="Open" style={{ background: '#0a0a0a' }}>Open</option>
                  <option value="Closed" style={{ background: '#0a0a0a' }}>Closed</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-6">
                  <FileText size={24} className="mx-auto mb-2" style={{ color: SILVER }} />
                  <p className="text-xs" style={{ color: SILVER }}>No matching risks</p>
                </div>
              ) : (
                filtered.map(r => <TrackerRiskRow key={r._id} risk={r} />)
              )}
            </div>
            <div className="mt-2 text-[10px] text-center" style={{ color: SILVER }}>
              {filtered.length} of {risks.length} risks shown
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
