import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, CartesianGrid } from 'recharts'
import { Link, AlertTriangle, Shield, Clock, CheckCircle, Plus, ChevronDown, ChevronUp, ExternalLink, Filter, Download } from 'lucide-react'
import { downloadCSV, downloadTPRMPDF } from '../lib/downloadUtils'

const vendors = [
  {
    id: 'V-001', name: 'Temenos T24 Core Banking', category: 'Core Infrastructure', tier: 1, country: 'Switzerland',
    riskScore: 28, riskLevel: 'medium', status: 'active', contractExpiry: '2027-12-31',
    lastAssessment: '2026-02-15', nextAssessment: '2026-08-15',
    concentration: 95, dataAccess: true, regulatoryApproved: true,
    controls: { security: 4.2, bcp: 4.5, dataPrivacy: 3.8, financial: 4.8, compliance: 4.1 },
    findings: 2, openFindings: 1,
    subVendors: ['Amazon AWS (EU)', 'Oracle DB'],
    spend: 8.4,
  },
  {
    id: 'V-002', name: 'SWIFT Service Bureau', category: 'Payments Infrastructure', tier: 1, country: 'Belgium',
    riskScore: 32, riskLevel: 'medium', status: 'active', contractExpiry: '2026-09-30',
    lastAssessment: '2025-12-01', nextAssessment: '2026-06-01',
    concentration: 100, dataAccess: true, regulatoryApproved: true,
    controls: { security: 4.8, bcp: 4.6, dataPrivacy: 4.0, financial: 4.9, compliance: 4.7 },
    findings: 1, openFindings: 0,
    subVendors: [],
    spend: 2.1,
  },
  {
    id: 'V-003', name: 'IBM Security QRadar SIEM', category: 'Cybersecurity', tier: 2, country: 'USA',
    riskScore: 41, riskLevel: 'medium', status: 'active', contractExpiry: '2027-06-15',
    lastAssessment: '2025-10-20', nextAssessment: '2026-04-20',
    concentration: 60, dataAccess: false, regulatoryApproved: true,
    controls: { security: 4.5, bcp: 3.9, dataPrivacy: 4.2, financial: 4.3, compliance: 4.0 },
    findings: 3, openFindings: 2,
    subVendors: ['Azure (US East)'],
    spend: 1.8,
  },
  {
    id: 'V-004', name: 'Equifax Credit Bureau Egypt', category: 'Credit Data Services', tier: 2, country: 'Egypt',
    riskScore: 55, riskLevel: 'high', status: 'review', contractExpiry: '2026-12-31',
    lastAssessment: '2025-08-10', nextAssessment: '2026-02-10',
    concentration: 40, dataAccess: true, regulatoryApproved: true,
    controls: { security: 3.2, bcp: 3.5, dataPrivacy: 2.9, financial: 4.0, compliance: 3.4 },
    findings: 6, openFindings: 4,
    subVendors: [],
    spend: 0.9,
  },
  {
    id: 'V-005', name: 'Fiserv Payment Gateway', category: 'Card Processing', tier: 1, country: 'USA',
    riskScore: 35, riskLevel: 'medium', status: 'active', contractExpiry: '2028-03-31',
    lastAssessment: '2026-01-15', nextAssessment: '2026-07-15',
    concentration: 80, dataAccess: true, regulatoryApproved: true,
    controls: { security: 4.3, bcp: 4.4, dataPrivacy: 4.1, financial: 4.6, compliance: 4.5 },
    findings: 2, openFindings: 0,
    subVendors: ['Visa Network', 'MasterCard Network'],
    spend: 3.2,
  },
  {
    id: 'V-006', name: 'Unisys Outsourced Data Center', category: 'IT Infrastructure', tier: 1, country: 'Egypt',
    riskScore: 68, riskLevel: 'high', status: 'remediation', contractExpiry: '2026-06-30',
    lastAssessment: '2025-11-05', nextAssessment: '2026-05-05',
    concentration: 70, dataAccess: true, regulatoryApproved: false,
    controls: { security: 2.8, bcp: 3.1, dataPrivacy: 2.5, financial: 3.8, compliance: 2.9 },
    findings: 9, openFindings: 6,
    subVendors: ['Schneider Electric', 'Cisco'],
    spend: 5.6,
  },
]

const riskColors = { low: '#2d7d46', medium: '#d4af37', high: '#b8860b', critical: '#c41e3a' }
const statusCfg = {
  active: { label: 'Active', color: '#2d7d46' },
  review: { label: 'Under Review', color: '#d4af37' },
  remediation: { label: 'Remediation Required', color: '#c41e3a' },
  offboarding: { label: 'Offboarding', color: '#4f7da6' },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="pharaoh-card p-3 text-xs shadow-xl">
      <p className="text-pharaoh-300 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-pharaoh-400/70">{p.name}:</span>
          <span className="text-pharaoh-200 font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function ConcentrationBar({ value, name }) {
  const color = value >= 80 ? '#c41e3a' : value >= 60 ? '#b8860b' : '#2d7d46'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-pharaoh-400/60 truncate max-w-[140px]">{name}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

export default function TPRMModule() {
  const [expanded, setExpanded] = useState(null)
  const [filterTier, setFilterTier] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  const filtered = vendors.filter(v =>
    (filterTier === 'all' || v.tier === Number(filterTier)) &&
    (filterRisk === 'all' || v.riskLevel === filterRisk)
  )

  const highRisk = vendors.filter(v => v.riskLevel === 'high' || v.riskLevel === 'critical').length
  const expiringSoon = vendors.filter(v => {
    const days = Math.ceil((new Date(v.contractExpiry) - new Date('2026-06-09')) / 86400000)
    return days <= 180 && days > 0
  }).length
  const totalSpend = vendors.reduce((s, v) => s + v.spend, 0)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Link size={18} className="text-pharaoh-500" />
            <h1 className="page-title">Third-Party Risk Management</h1>
          </div>
          <p className="page-subtitle">Vendor registry · Concentration risk · Due diligence · Contract management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCSV('Wadjet-GRC-TPRM-Vendor-Register',
            ['Vendor ID', 'Vendor Name', 'Category', 'Tier', 'Country', 'Risk Score', 'Risk Level', 'Status', 'Contract Expiry', 'Last Assessment', 'Next Assessment', 'Open Findings', 'Annual Spend (MEGP)', 'CBE Approved'],
            vendors.map(v => [v.id, v.name, v.category, v.tier, v.country, v.riskScore, v.riskLevel, v.status, v.contractExpiry, v.lastAssessment, v.nextAssessment, v.openFindings, v.spend, v.regulatoryApproved ? 'Yes' : 'No'])
          )}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green hover:border-egyptian-green/30 transition-all">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={() => downloadTPRMPDF(vendors)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300 transition-all">
            <Download size={12} /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-105">
            <Plus size={15} /> Onboard Vendor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Vendors', value: vendors.length, sub: `${vendors.filter(v => v.tier === 1).length} Tier 1 critical`, color: '#d4af37' },
          { label: 'High Risk Vendors', value: highRisk, sub: 'Require urgent action', color: '#c41e3a' },
          { label: 'Contracts Expiring (6M)', value: expiringSoon, sub: 'Renewal action needed', color: '#b8860b' },
          { label: 'Annual Spend (M EGP)', value: `${totalSpend.toFixed(1)}`, sub: 'Under TPRM management', color: '#2d7d46' },
        ].map(k => (
          <div key={k.label} className="pharaoh-card p-4">
            <p className="text-[10px] text-pharaoh-400/60 mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-pharaoh-400/50 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="pharaoh-card p-5">
          <h3 className="text-sm font-semibold text-pharaoh-300 mb-3">Concentration Risk by Vendor (%)</h3>
          <div className="space-y-2.5">
            {[...vendors].sort((a, b) => b.concentration - a.concentration).slice(0, 5).map(v => (
              <ConcentrationBar key={v.id} value={v.concentration} name={v.name} />
            ))}
          </div>
        </div>
        <div className="pharaoh-card p-5">
          <h3 className="text-sm font-semibold text-pharaoh-300 mb-3">Open Findings by Vendor</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={vendors.filter(v => v.openFindings > 0)} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 9 }} axisLine={false} tickLine={false} width={100}
                tickFormatter={v => v.split(' ').slice(0, 2).join(' ')} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="openFindings" name="Open Findings" radius={[0, 4, 4, 0]}>
                {vendors.filter(v => v.openFindings > 0).map((v, i) => (
                  <rect key={i} fill={riskColors[v.riskLevel]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={13} className="text-pharaoh-400/50" />
        {['all', '1', '2'].map(t => (
          <button key={t} onClick={() => setFilterTier(t)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-all ${filterTier === t ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
            style={filterTier !== t ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
            {t === 'all' ? 'All Tiers' : `Tier ${t}`}
          </button>
        ))}
        {['all', 'low', 'medium', 'high'].map(r => (
          <button key={r} onClick={() => setFilterRisk(r)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${filterRisk === r ? 'gold-gradient text-nile-900 font-semibold' : 'text-pharaoh-400/50 hover:text-pharaoh-300'}`}
            style={filterRisk !== r ? { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
            {r}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(v => {
          const isExpanded = expanded === v.id
          const sc = statusCfg[v.status]
          const daysToExpiry = Math.ceil((new Date(v.contractExpiry) - new Date('2026-06-09')) / 86400000)
          const radarData = Object.entries(v.controls).map(([k, val]) => ({
            subject: k.charAt(0).toUpperCase() + k.slice(1), value: val, fullMark: 5,
          }))
          return (
            <div key={v.id} className="pharaoh-card overflow-hidden">
              <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : v.id)}>
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: riskColors[v.riskLevel], minWidth: 3 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-pharaoh-400/50">{v.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.08)', color: '#d4af37' }}>Tier {v.tier}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${riskColors[v.riskLevel]}15`, color: riskColors[v.riskLevel] }}>{v.riskLevel.toUpperCase()} RISK</span>
                    {!v.regulatoryApproved && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/20">⚠ CBE Approval Pending</span>}
                  </div>
                  <p className="text-sm font-semibold text-pharaoh-200">{v.name}</p>
                  <p className="text-[10px] text-pharaoh-400/50 mt-0.5">{v.category} · {v.country} · EGP {v.spend}M annual spend</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: daysToExpiry <= 90 ? '#c41e3a' : daysToExpiry <= 180 ? '#b8860b' : '#d4af37' }}>
                      {daysToExpiry > 0 ? `Expires in ${daysToExpiry}d` : 'CONTRACT EXPIRED'}
                    </p>
                    <p className="text-[10px] text-pharaoh-400/50">{v.openFindings} open finding{v.openFindings !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: `${sc.color}18`, color: sc.color }}>{sc.label}</span>
                  {isExpanded ? <ChevronUp size={14} className="text-pharaoh-400/40" /> : <ChevronDown size={14} className="text-pharaoh-400/40" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 border-t animate-fade-in" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-pharaoh-300 mb-2">Control Assessment Scores</p>
                      <ResponsiveContainer width="100%" height={190}>
                        <RadarChart data={radarData} margin={{ top: 8, right: 22, bottom: 8, left: 22 }}>
                          <defs>
                            <radialGradient id={`radarVendor${v.id}`} cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor={riskColors[v.riskLevel]} stopOpacity={0.35} />
                              <stop offset="100%" stopColor={riskColors[v.riskLevel]} stopOpacity={0.05} />
                            </radialGradient>
                          </defs>
                          <PolarGrid stroke="rgba(212,175,55,0.12)" gridType="polygon" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'rgba(212,175,55,0.7)', fontSize: 10, fontWeight: 600 }}
                            tickLine={false}
                          />
                          <PolarRadiusAxis
                            angle={90} domain={[0, 5]} tickCount={4}
                            tick={{ fill: 'rgba(212,175,55,0.2)', fontSize: 8 }}
                            axisLine={false}
                          />
                          <Radar name="Benchmark" dataKey="fullMark"
                            stroke="rgba(79,125,166,0.3)" strokeWidth={1} strokeDasharray="3 3"
                            fill="rgba(79,125,166,0.05)" dot={false} />
                          <Radar name="Score" dataKey="value"
                            stroke={riskColors[v.riskLevel]} strokeWidth={2.5}
                            fill={`url(#radarVendor${v.id})`}
                            dot={{ r: 3.5, fill: riskColors[v.riskLevel], stroke: '#0a1628', strokeWidth: 1.5,
                              style: { filter: `drop-shadow(0 0 4px ${riskColors[v.riskLevel]}80)` } }} />
                          <Tooltip contentStyle={{ background: 'rgba(8,18,34,0.97)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }}
                            labelStyle={{ color: '#e8d5b7', fontWeight: 600 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: riskColors[v.riskLevel] }} />
                          <span className="text-[9px] text-pharaoh-400/50">Vendor Score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-0.5 rounded-full inline-block" style={{ borderTop: '1px dashed rgba(79,125,166,0.5)' }} />
                          <span className="text-[9px] text-pharaoh-400/50">Max (5.0)</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
                          <p className="text-[10px] text-pharaoh-400/60">Risk Score</p>
                          <p className="text-xl font-bold" style={{ color: riskColors[v.riskLevel] }}>{v.riskScore}</p>
                        </div>
                        <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
                          <p className="text-[10px] text-pharaoh-400/60">Concentration</p>
                          <p className="text-xl font-bold text-pharaoh-300">{v.concentration}%</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-pharaoh-400/60">Last Assessment</span>
                          <span className="text-pharaoh-300">{v.lastAssessment}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-pharaoh-400/60">Next Due</span>
                          <span className="text-pharaoh-300">{v.nextAssessment}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-pharaoh-400/60">Customer Data Access</span>
                          <span style={{ color: v.dataAccess ? '#c41e3a' : '#2d7d46' }}>{v.dataAccess ? 'Yes — PII/Financial' : 'No'}</span>
                        </div>
                        {v.subVendors.length > 0 && (
                          <div className="flex items-start justify-between text-xs">
                            <span className="text-pharaoh-400/60">Sub-vendors</span>
                            <span className="text-pharaoh-300 text-right">{v.subVendors.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <button className="w-full py-2 rounded-xl text-xs font-medium transition-all" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
                        Start Due Diligence Assessment
                      </button>
                    </div>
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
