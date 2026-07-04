import { useState, useEffect } from 'react'
import { X, Search, Activity, AlertTriangle } from 'lucide-react'
import { fetchAllCatalogItems } from '../lib/metricUtils'

export default function LinkMetricModal({ riskId, linkedCatalogIds, onSave, onClose }) {
  const [catalogs, setCatalogs] = useState({ kpis: [], kris: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(new Map())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAllCatalogItems().then(data => {
      setCatalogs(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const toggleItem = (type, catalogId) => {
    const key = `${type}::${catalogId}`
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.set(key, { type, catalogId, mappingType: 'Primary' })
      }
      return next
    })
  }

  const setMappingType = (type, catalogId, mappingType) => {
    const key = `${type}::${catalogId}`
    setSelected(prev => {
      const next = new Map(prev)
      const existing = next.get(key)
      if (existing) {
        next.set(key, { ...existing, mappingType })
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(Array.from(selected.values()))
    setSaving(false)
  }

  const selectable = (type, items) => {
    const q = search.toLowerCase()
    return items.filter(c => {
      if (linkedCatalogIds.has(c._id)) return false
      if (!search) return true
      return (c.code || '').toLowerCase().includes(q)
          || (c.name || '').toLowerCase().includes(q)
          || (c.riskCategory || c.category || '').toLowerCase().includes(q)
    })
  }

  const allItems = [
    ...(tab === 'all' || tab === 'kpi' ? selectable('KPI', catalogs.kpis).map(c => ({ ...c, _type: 'KPI' })) : []),
    ...(tab === 'all' || tab === 'kri' ? selectable('KRI', catalogs.kris).map(c => ({ ...c, _type: 'KRI' })) : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[720px] max-h-[82vh] bg-[#070f1a] border border-pharaoh-500/20 rounded-2xl flex flex-col shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-pharaoh-500/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-pharaoh-100">Link Metrics to Risk</h2>
            <p className="text-[10px] text-pharaoh-500/50">Select KPIs and KRIs to link to this risk</p>
          </div>
          <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-pharaoh-500/8 flex items-center gap-3 shrink-0">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
            <input type="text" placeholder="Search by code or name..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-xs text-pharaoh-200 placeholder-pharaoh-500/30 focus:outline-none focus:border-amber-500/40" />
          </div>
          <div className="flex bg-pharaoh-900/60 rounded-lg p-0.5 border border-pharaoh-500/20">
            {[
              { key: 'all', label: 'All' },
              { key: 'kpi', label: 'KPI' },
              { key: 'kri', label: 'KRI' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${tab === t.key ? 'bg-pharaoh-800/80 text-amber-300 shadow-sm border border-pharaoh-500/30' : 'text-pharaoh-500/60 hover:text-pharaoh-400 border border-transparent'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
          {loading ? (
            <p className="text-pharaoh-500/40 text-xs italic text-center py-8">Loading metric catalogs...</p>
          ) : allItems.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-pharaoh-500/40 text-xs italic">
                {search ? 'No matching metrics found' : (catalogs.kpis.length === 0 && catalogs.kris.length === 0) ? 'No KPIs or KRIs exist yet' : 'All metrics already linked'}
              </p>
              {(catalogs.kpis.length === 0 && catalogs.kris.length === 0) && (
                <p className="text-pharaoh-500/30 text-[10px]">
                  Create them via <span className="text-amber-400/60">KPI Dashboard</span> or <span className="text-amber-400/60">CRO Dashboard</span> first
                </p>
              )}
            </div>
          ) : allItems.map(item => {
            const key = `${item._type}::${item._id}`
            const isSelected = selected.has(key)
            return (
              <div key={key}
                className="flex items-center justify-between py-2 px-3 rounded-lg border cursor-pointer transition-all"
                style={{
                  borderColor: isSelected ? 'rgba(212,175,55,0.4)' : 'rgba(212,168,50,0.08)',
                  background: isSelected ? 'rgba(212,168,50,0.08)' : item._type === 'KPI' ? 'rgba(32,201,151,0.03)' : 'rgba(253,126,20,0.03)',
                }}
                onClick={() => toggleItem(item._type, item._id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-amber-500/40 border-amber-500/60' : 'border-pharaoh-500/30'}`}>
                    {isSelected && <span className="text-[8px] text-amber-200 font-bold">✓</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {item._type === 'KPI' ? <Activity size={12} className="text-emerald-500/60" /> : <AlertTriangle size={12} className="text-amber-500/60" />}
                    <span className="text-[10px] font-mono text-pharaoh-200">{item.code}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full border"
                      style={{
                        borderColor: item._type === 'KPI' ? 'rgba(32,201,151,0.3)' : 'rgba(253,126,20,0.3)',
                        color: item._type === 'KPI' ? '#69db7c' : '#ffb068',
                      }}>{item._type}</span>
                  </div>
                  <p className="text-[10px] text-pharaoh-400/60 truncate">{item.name}</p>
                </div>
                {isSelected && (
                  <select value={selected.get(key)?.mappingType || 'Primary'}
                    onChange={e => { e.stopPropagation(); setMappingType(item._type, item._id, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    className="ml-2 px-2 py-0.5 rounded bg-pharaoh-900/50 border border-pharaoh-500/15 text-[9px] text-pharaoh-300 focus:outline-none">
                    <option value="Primary">Primary</option>
                    <option value="Supporting">Supporting</option>
                  </select>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-6 py-3 border-t border-pharaoh-500/8 flex items-center justify-between shrink-0">
          <span className="text-[9px] text-pharaoh-500/30">
            {selected.size} selected · {allItems.length} available
          </span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[10px] border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || selected.size === 0}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold gold-gradient text-nile-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {saving ? 'Saving...' : `Link ${selected.size} Metric${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
