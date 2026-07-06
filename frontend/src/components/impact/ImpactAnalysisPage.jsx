import { useState } from 'react'
import { AlertTriangle, ArrowRight, Shield, Search, Loader, X, Target, Users, FileText } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'
const INPUT_BG = 'rgba(255,255,255,0.04)'
const INPUT_BORDER = 'rgba(212,168,50,0.12)'

export default function ImpactAnalysisPage() {
  const [assetId, setAssetId] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runAnalysis = async (e) => {
    e.preventDefault()
    if (!assetId) return
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/impact/analysis?asset_id=' + encodeURIComponent(assetId))
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Analysis failed')
      setAnalysis(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const ResultCard = ({ icon: Icon, title, items, color, emptyMsg }) => (
    <div className="p-4 rounded-xl" style={{ background: DARK_BG, border: BORDER }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color }} />
        <h3 className="text-xs font-semibold" style={{ color: WHITE }}>{title}</h3>
        <span className="text-[9px] font-mono ml-auto" style={{ color: 'rgba(206,212,218,0.40)' }}>{items?.length || 0}</span>
      </div>
      {(!items || items.length === 0) ? (
        <p className="text-[10px] py-4 text-center" style={{ color: 'rgba(206,212,218,0.55)' }}>{emptyMsg}</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <ArrowRight size={10} style={{ color: 'rgba(206,212,218,0.40)' }} />
              <span className="text-[11px]" style={{ color: SILVER }}>{item.name || item.id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
            <AlertTriangle size={16} style={{ color: GOLD }} />
          </div>
          <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Impact Analysis</h1>
        </div>
        <p className="text-xs" style={{ color: GOLD }}>Analyze downstream impact of asset failures on risks and requirements</p>
      </div>

      <form onSubmit={runAnalysis} className="flex items-end gap-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5" style={{ color: SILVER }}>Asset ID</label>
          <div className="relative">
            <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(206,212,218,0.55)' }} />
            <input value={assetId} onChange={e => setAssetId(e.target.value)}
              placeholder="e.g. ASSET-001"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: INPUT_BG, border: '1px solid ' + INPUT_BORDER, color: WHITE }} />
          </div>
        </div>
        <button type="submit" disabled={loading || !assetId}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-medium transition-all"
          style={{ background: GRADIENT, border: BORDER, color: GOLD }}>
          {loading ? <Loader size={11} className="animate-spin" /> : <Search size={11} />}
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: 'rgba(220,53,69,0.10)', border: '1px solid rgba(220,53,69,0.25)', color: CRIMSON }}>
          <X size={12} /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0s' }} />
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.15s' }} />
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD, animationDelay: '0.3s' }} />
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <ResultCard icon={Shield} title="Downstream Assets" items={analysis.downstream_assets} color={AMBER} emptyMsg="No downstream assets found" />
          <ResultCard icon={AlertTriangle} title="Escalated Risks" items={analysis.escalated_risks} color={CRIMSON} emptyMsg="No escalated risks" />
          <ResultCard icon={FileText} title="Requirements at Risk" items={analysis.requirements_at_risk} color={GOLD} emptyMsg="No requirements at risk" />
        </div>
      )}
    </div>
  )
}
