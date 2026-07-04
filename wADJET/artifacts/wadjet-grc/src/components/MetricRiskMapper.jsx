import { useState, useEffect, useMemo } from 'react'
import { Search, Link, Unlink, ArrowRight, ArrowLeft, Activity, AlertTriangle, Check } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const GOLD_BORDER = '1px solid rgba(212,168,50,0.12)'
const GOLD_GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

function ThresholdSlider({ kri }) {
  if (!kri) return null
  const min = Math.min(kri.greenMin ?? 0, kri.amberMin ?? 0, kri.redMin ?? 0)
  const max = Math.max(kri.greenMax ?? 100, kri.amberMax ?? 100, kri.redMax ?? 100)
  const range = max - min || 1
  const greenW = kri.greenMin != null && kri.greenMax != null ? ((kri.greenMax - kri.greenMin) / range) * 100 : 33
  const amberW = kri.amberMin != null && kri.amberMax != null ? ((kri.amberMax - kri.amberMin) / range) * 100 : 33
  const redW = kri.redMin != null && kri.redMax != null ? ((kri.redMax - kri.redMin) / range) * 100 : 34
  const greenL = kri.greenMin != null ? ((kri.greenMin - min) / range) * 100 : 0
  const amberL = kri.amberMin != null ? ((kri.amberMin - min) / range) * 100 : greenL + greenW
  const redL = kri.redMin != null ? ((kri.redMin - min) / range) * 100 : amberL + amberW
  return (
    <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(212,168,50,0.04)' }}>
      <div className="text-[10px] font-medium mb-1" style={{ color: GOLD }}>CBE Risk Appetite Boundaries</div>
      <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="absolute h-full transition-all" style={{ left: `${greenL}%`, width: `${greenW}%`, background: EMERALD, opacity: 0.5 }} />
        <div className="absolute h-full transition-all" style={{ left: `${amberL}%`, width: `${amberW}%`, background: AMBER, opacity: 0.5 }} />
        <div className="absolute h-full transition-all" style={{ left: `${redL}%`, width: `${redW}%`, background: CRIMSON, opacity: 0.5 }} />
      </div>
      <div className="flex justify-between text-[9px] mt-0.5">
        <span style={{ color: EMERALD }}>{kri.greenMin ?? '∞'} — {kri.greenMax ?? '∞'}</span>
        <span style={{ color: AMBER }}>{kri.amberMin ?? '∞'} — {kri.amberMax ?? '∞'}</span>
        <span style={{ color: CRIMSON }}>{kri.redMin ?? '∞'} — {kri.redMax ?? '∞'}</span>
      </div>
    </div>
  )
}

export default function MetricRiskMapper() {
  const [risks, setRisks] = useState([])
  const [kpis, setKpis] = useState([])
  const [kris, setKris] = useState([])
  const [mappings, setMappings] = useState([])
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadMappings = async () => {
    try {
      const res = await fetch('/api/metric-mappings')
      setMappings((await res.json()).items || [])
    } catch {}
  }

  const loadData = async () => {
    try {
      const [riskRes, kpiRes, kriRes] = await Promise.all([
        fetch('/api/risks'),
        fetch('/api/kpi-catalog'),
        fetch('/api/kri-catalog'),
      ])
      setRisks((await riskRes.json()).risks || [])
      setKpis((await kpiRes.json()).items || [])
      setKris((await kriRes.json()).items || [])
    } catch {}
    await loadMappings()
  }

  useEffect(() => { loadData() }, [])

  const filteredRisks = risks.filter(r =>
    !searchTerm || r.riskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.riskId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedRiskMappings = useMemo(() => {
    if (!selectedRisk) return { kpis: [], kris: [] }
    const riskMappings = mappings.filter(m => m.riskId === selectedRisk)
    return {
      kpis: riskMappings.filter(m => m.metricType === 'KPI').map(m => {
        const kpi = kpis.find(k => k._id === m.metricCatalogId)
        return { ...m, metric: kpi }
      }),
      kris: riskMappings.filter(m => m.metricType === 'KRI').map(m => {
        const kri = kris.find(k => k._id === m.metricCatalogId)
        return { ...m, metric: kri }
      }),
    }
  }, [selectedRisk, mappings, kpis, kris])

  const availableKpis = kpis.filter(k =>
    !mappings.some(m => m.riskId === selectedRisk && m.metricType === 'KPI' && m.metricCatalogId === k._id)
  )
  const availableKris = kris.filter(k =>
    !mappings.some(m => m.riskId === selectedRisk && m.metricType === 'KRI' && m.metricCatalogId === k._id)
  )

  const addMapping = (metricType, metricCatalogId) => {
    if (!selectedRisk) return
    const newMapping = { riskId: selectedRisk, metricType, metricCatalogId, mappingType: 'Primary' }
    setMappings(prev => [...prev, newMapping])
  }

  const removeMapping = (metricType, metricCatalogId) => {
    setMappings(prev => prev.filter(m =>
      !(m.riskId === selectedRisk && m.metricType === metricType && m.metricCatalogId === metricCatalogId)
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const riskMappings = mappings.filter(m => m.riskId === selectedRisk)
      await fetch('/api/metric-mappings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskId: selectedRisk, mappings: riskMappings }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GOLD_GRADIENT, border: GOLD_BORDER }}>
              <Link size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Metric-Risk Mapper</h1>
          </div>
          <p className="text-xs" style={{ color: GOLD }}>Associate KPIs and KRIs to banking risks</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs px-2 py-1 rounded-full animate-fade-in"
              style={{ background: 'rgba(32,201,151,0.1)', color: EMERALD, border: '1px solid rgba(32,201,151,0.2)' }}>
              <Check size={12} className="inline mr-1" />Saved
            </span>
          )}
          <button onClick={handleSave} disabled={saving}
            className="text-xs px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ background: GOLD_GRADIENT, border: GOLD_BORDER, color: GOLD }}>
            {saving ? 'Saving...' : 'Save Mappings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        <div className="col-span-4 space-y-5">
          <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: GOLD_BORDER }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>Risk Selector</h2>
            <div className="relative">
              <div className="relative">
                <Search size={12} style={{ color: SILVER, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input
                  placeholder="Search risks by ID or title..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full text-xs py-2 pl-8 pr-3 rounded-xl outline-none"
                  style={{ background: 'rgba(212,168,50,0.06)', border: GOLD_BORDER, color: WHITE }}
                />
              </div>
              {showDropdown && (
                <div className="absolute mt-1 left-0 right-0 rounded-xl z-20 max-h-64 overflow-y-auto"
                  style={{ background: '#0a0a0a', border: GOLD_BORDER }}>
                  {filteredRisks.length === 0 ? (
                    <div className="p-3 text-xs text-center" style={{ color: SILVER }}>No risks found</div>
                  ) : (
                    filteredRisks.slice(0, 20).map(r => (
                      <div key={r._id}
                        onClick={() => { setSelectedRisk(r._id); setShowDropdown(false); setSearchTerm(`${r.riskId} — ${r.riskTitle?.slice(0, 60)}`) }}
                        className="px-3 py-2 text-xs cursor-pointer hover:opacity-80 flex items-center gap-2"
                        style={{ color: selectedRisk === r._id ? GOLD : SILVER, borderBottom: '1px solid rgba(212,168,50,0.06)' }}>
                        <span className="font-mono text-[10px]" style={{ color: GOLD }}>{r.riskId}</span>
                        <span className="truncate">{r.riskTitle}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedRisk && (() => {
              const risk = risks.find(r => r._id === selectedRisk)
              return risk ? (
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(212,168,50,0.04)', border: GOLD_BORDER }}>
                  <div className="text-xs font-medium" style={{ color: GOLD }}>{risk.riskId}</div>
                  <div className="text-xs mt-1" style={{ color: WHITE }}>{risk.riskTitle}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,168,50,0.08)', color: SILVER }}>
                      {risk.riskCategory}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,168,50,0.08)', color: SILVER }}>
                      {risk.severity}
                    </span>
                  </div>
                </div>
              ) : null
            })()}
          </div>

          {selectedRisk && (
            <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: GOLD_BORDER }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: WHITE }}>Selected Mappings</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: GOLD }}>
                    <Activity size={12} /> KPIs ({selectedRiskMappings.kpis.length})
                  </div>
                  {selectedRiskMappings.kpis.length === 0 ? (
                    <p className="text-[11px]" style={{ color: SILVER }}>No KPIs mapped</p>
                  ) : (
                    selectedRiskMappings.kpis.map(m => (
                      <div key={`kpi-${m.metricCatalogId}`}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg mb-1"
                        style={{ background: 'rgba(212,168,50,0.04)' }}>
                        <div>
                          <div className="text-[11px]" style={{ color: WHITE }}>{m.metric?.code || m.metricCatalogId}</div>
                          <div className="text-[10px]" style={{ color: SILVER }}>{m.metric?.name || ''}</div>
                        </div>
                        <button onClick={() => removeMapping('KPI', m.metricCatalogId)}
                          className="p-1 rounded hover:opacity-70">
                          <Unlink size={11} style={{ color: CRIMSON }} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="h-px" style={{ background: 'rgba(212,168,50,0.06)' }} />
                <div>
                  <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: GOLD }}>
                    <AlertTriangle size={12} /> KRIs ({selectedRiskMappings.kris.length})
                  </div>
                  {selectedRiskMappings.kris.length === 0 ? (
                    <p className="text-[11px]" style={{ color: SILVER }}>No KRIs mapped</p>
                  ) : (
                    selectedRiskMappings.kris.map(m => (
                      <div key={`kri-${m.metricCatalogId}`}>
                        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg mb-1"
                          style={{ background: 'rgba(212,168,50,0.04)' }}>
                          <div>
                            <div className="text-[11px]" style={{ color: WHITE }}>{m.metric?.code || m.metricCatalogId}</div>
                            <div className="text-[10px]" style={{ color: SILVER }}>{m.metric?.name || ''}</div>
                          </div>
                          <button onClick={() => removeMapping('KRI', m.metricCatalogId)}
                            className="p-1 rounded hover:opacity-70">
                            <Unlink size={11} style={{ color: CRIMSON }} />
                          </button>
                        </div>
                        {m.metric?.greenMin != null && <ThresholdSlider kri={m.metric} />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-8 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: GOLD_BORDER }}>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-1" style={{ color: WHITE }}>
                <Activity size={14} style={{ color: GOLD }} /> Available KPIs
              </h2>
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {availableKpis.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: SILVER }}>No available KPIs</p>
                ) : (
                  availableKpis.map(kpi => (
                    <div key={kpi._id}
                      onClick={() => addMapping('KPI', kpi._id)}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:opacity-80"
                      style={{ background: 'rgba(212,168,50,0.04)', border: '1px solid rgba(212,168,50,0.06)' }}>
                      <Activity size={12} style={{ color: GOLD }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium" style={{ color: WHITE }}>{kpi.code}</div>
                        <div className="text-[10px] truncate" style={{ color: SILVER }}>{kpi.name}</div>
                      </div>
                      <ArrowLeft size={11} style={{ color: GOLD }} />
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: DARK_BG, border: GOLD_BORDER }}>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-1" style={{ color: WHITE }}>
                <AlertTriangle size={14} style={{ color: GOLD }} /> Available KRIs
              </h2>
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {availableKris.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: SILVER }}>No available KRIs</p>
                ) : (
                  availableKris.map(kri => (
                    <div key={kri._id}>
                      <div
                        onClick={() => addMapping('KRI', kri._id)}
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:opacity-80"
                        style={{ background: 'rgba(212,168,50,0.04)', border: '1px solid rgba(212,168,50,0.06)' }}>
                        <AlertTriangle size={12} style={{ color: AMBER }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium" style={{ color: WHITE }}>{kri.code}</div>
                          <div className="text-[10px] truncate" style={{ color: SILVER }}>{kri.name}</div>
                        </div>
                        <ArrowLeft size={11} style={{ color: GOLD }} />
                      </div>
                      <ThresholdSlider kri={kri} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
