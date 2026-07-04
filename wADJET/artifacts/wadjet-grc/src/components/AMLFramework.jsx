import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import { Shield, AlertTriangle, Eye, CheckCircle, Clock, Plus, Filter, TrendingUp, Flag, FileSearch, Download } from 'lucide-react'
import { downloadAMLPDF, downloadAMLCSV } from '../lib/downloadUtils'

const statusColors = { compliant: '#2d7d46', partial: '#d4af37', 'non-compliant': '#c41e3a' }
const riskColors = { critical: '#c41e3a', high: '#b8860b', medium: '#d4af37', low: '#2d7d46' }
const excStatusColors = { 'in-progress': '#d4af37', overdue: '#c41e3a', open: '#b8860b', closed: '#2d7d46' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="pharaoh-card p-3 text-xs shadow-xl">
      <p className="text-pharaoh-300 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2">
          <span className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ background: p.color }} />
          <span className="text-pharaoh-400/70">{p.name}:</span>
          <span className="text-pharaoh-200 font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AMLFramework() {
  const [activeTab, setActiveTab] = useState('fatf')
  const [expanded, setExpanded] = useState(null)
  const [fatfRecommendations, setFatfRecommendations] = useState([])
  const [sarData, setSarData] = useState([])
  const [kycExceptions, setKycExceptions] = useState([])
  const [highRiskSegments, setHighRiskSegments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/aml/fatf-recommendations').then(r => r.json()),
      fetch('/api/aml/sar-data').then(r => r.json()),
      fetch('/api/aml/kyc-exceptions').then(r => r.json()),
      fetch('/api/aml/high-risk-segments').then(r => r.json()),
    ]).then(([fatf, sar, kyc, segments]) => {
      setFatfRecommendations(fatf.items || [])
      setSarData(sar.items || [])
      setKycExceptions(kyc.items || [])
      setHighRiskSegments(segments.items || [])
    }).catch(err => console.error('Failed to fetch AML data:', err))
    .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-full p-6 text-center text-pharaoh-400/60 text-sm">Loading AML data...</div>
  }

  const compliant = fatfRecommendations.filter(r => r.status === 'compliant').length
  const partial = fatfRecommendations.filter(r => r.status === 'partial').length
  const nonCompliant = fatfRecommendations.filter(r => r.status === 'non-compliant').length
  const totalSar = sarData.reduce((s, m) => s + m.filed, 0)
  const pendingExc = kycExceptions.filter(e => e.status !== 'closed').length

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-pharaoh-500" />
            <h1 className="page-title">AML / Financial Crime Controls</h1>
          </div>
          <p className="page-subtitle">FATF Recommendations · STR/SAR Management · KYC Exceptions · High-Risk Segments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadAMLCSV(fatfRecommendations, sarData, kycExceptions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green hover:border-egyptian-green/30 transition-all">
            <Download size="12" /> Export Excel
          </button>
          <button onClick={() => downloadAMLPDF(fatfRecommendations, kycExceptions, sarData)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300 transition-all">
            <Download size="12" /> Export PDF
          </button>
          <span className="text-[10px] px-2 py-1 rounded-md font-semibold" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
            FATF Mutual Evaluation: 2027
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'FATF Controls Compliant', value: `${compliant}/${fatfRecommendations.length}`, color: '#2d7d46', sub: `${Math.round((compliant / fatfRecommendations.length) * 100)}% coverage` },
          { label: 'STR/SAR Filed (YTD)', value: totalSar, color: '#d4af37', sub: `Avg. 13/month` },
          { label: 'Overdue KYC Exceptions', value: kycExceptions.filter(e => e.status === 'overdue').length, color: '#c41e3a', sub: 'Requires immediate action' },
          { label: 'High-Risk Customers (EDD)', value: highRiskSegments.reduce((s, seg) => s + seg.count, 0), color: '#b8860b', sub: `${highRiskSegments.reduce((s, seg) => s + seg.pending, 0)} EDD pending` },
        ].map(k => (
          <div key={k.label} className="pharaoh-card p-4">
            <p className="text-[10px] text-pharaoh-400/60 mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-pharaoh-400/50 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
        {[
          { id: 'fatf', label: 'FATF Recommendations' },
          { id: 'str', label: 'STR/SAR Dashboard' },
          { id: 'kyc', label: 'KYC Exceptions' },
          { id: 'segments', label: 'High-Risk Segments' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === t.id ? 'gold-gradient text-nile-900 shadow' : 'text-pharaoh-400/60 hover:text-pharaoh-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'fatf' && (
        <div className="space-y-2 animate-fade-in">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Compliant', value: compliant, color: '#2d7d46' },
              { label: 'Partial', value: partial, color: '#d4af37' },
              { label: 'Non-Compliant', value: nonCompliant, color: '#c41e3a' },
            ].map(k => (
              <div key={k.label} className="pharaoh-card p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs text-pharaoh-400/60">{k.label}</p>
              </div>
            ))}
          </div>
          {fatfRecommendations.map(rec => {
            const isExpanded = expanded === rec.id
            return (
              <div key={rec.id} className="pharaoh-card overflow-hidden">
                <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : rec.id)}>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: statusColors[rec.status], minWidth: 3 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-pharaoh-400/50">{rec.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${riskColors[rec.risk]}18`, color: riskColors[rec.risk] }}>{rec.risk.toUpperCase()} RISK</span>
                      <span className="text-[10px] text-pharaoh-400/40">{rec.category}</span>
                    </div>
                    <p className="text-sm font-semibold text-pharaoh-200">{rec.title}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-pharaoh-300">{rec.tested}/{rec.controls} controls tested</p>
                      {rec.gaps > 0 && <p className="text-[10px] text-red-400">{rec.gaps} gap{rec.gaps > 1 ? 's' : ''}</p>}
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-lg capitalize" style={{ background: `${statusColors[rec.status]}18`, color: statusColors[rec.status] }}>
                      {rec.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-4 border-t pt-3 animate-fade-in" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                    <p className="text-xs text-pharaoh-300/70">{rec.notes}</p>
                    {rec.lastTest && <p className="text-[10px] text-pharaoh-400/40 mt-2">Last control test: {rec.lastTest}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'str' && (
        <div className="space-y-6 animate-fade-in">
          <div className="pharaoh-card p-5">
            <h3 className="text-sm font-semibold text-pharaoh-300 mb-4">STR/SAR Filing Trend — 2026 YTD</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(212,175,55,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="filed" name="STR Filed" fill="#d4af37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending Review" fill="#b8860b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected/Recalled" fill="#c41e3a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Avg Filing Time', value: '18 hrs', sub: 'Post-detection to EMLCU', color: '#2d7d46' },
              { label: 'CBE/EMLCU Target', value: '< 24 hrs', sub: 'Regulatory SLA', color: '#d4af37' },
              { label: 'YTD STR Conversion Rate', value: '2.3%', sub: 'Alerts → STR filed', color: '#4f7da6' },
            ].map(k => (
              <div key={k.label} className="pharaoh-card p-4 text-center">
                <p className="text-[10px] text-pharaoh-400/60 mb-1">{k.label}</p>
                <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] text-pharaoh-400/50 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gold-gradient text-nile-900 shadow-lg">
              <Plus size={14} /> Log Exception
            </button>
          </div>
          {kycExceptions.map(exc => (
            <div key={exc.id} className="pharaoh-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: riskColors[exc.risk], minWidth: 3 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-pharaoh-400/50">{exc.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${riskColors[exc.risk]}18`, color: riskColors[exc.risk] }}>{exc.risk} risk</span>
                  </div>
                  <p className="text-sm font-semibold text-pharaoh-200">{exc.customer}</p>
                  <p className="text-xs text-amber-400/80 mt-1">{exc.issue}</p>
                  <p className="text-[10px] text-pharaoh-400/50 mt-1">Owner: {exc.owner} · Raised: {exc.raised} · Due: {exc.due}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-lg capitalize flex-shrink-0" style={{ background: `${excStatusColors[exc.status]}18`, color: excStatusColors[exc.status] }}>
                  {exc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="space-y-3 animate-fade-in">
          {highRiskSegments.map(seg => {
            const eddPct = Math.round((seg.edd / seg.count) * 100)
            return (
              <div key={seg.segment} className="pharaoh-card p-4">
                <div className="flex items-center gap-4">
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: riskColors[seg.risk], minWidth: 3 }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-pharaoh-200">{seg.segment}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-pharaoh-300">{seg.count} customers</span>
                        {seg.pending > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/30 text-amber-400">{seg.pending} EDD pending</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${eddPct}%`, background: eddPct === 100 ? '#2d7d46' : eddPct > 90 ? '#d4af37' : '#c41e3a' }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: eddPct === 100 ? '#2d7d46' : eddPct > 90 ? '#d4af37' : '#c41e3a' }}>{eddPct}% EDD complete</span>
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
