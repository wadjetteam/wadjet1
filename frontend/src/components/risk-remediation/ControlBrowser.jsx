import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

export default function ControlBrowser({ riskId, linkedControlIds, onLink, onUnlink, onClose }) {
  const [controls, setControls] = useState([])
  const [search, setSearch] = useState('')
  const [framework, setFramework] = useState('')
  const [mappingType, setMappingType] = useState('Supporting')
  const [linking, setLinking] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (framework) params.set('frameworkCode', framework)
    fetch(`/api/controls?${params}`)
      .then(r => r.json())
      .then(data => setControls(data.items || []))
      .catch(() => setControls([]))
  }, [framework])

  const filtered = controls.filter(c => {
    if (linkedControlIds.has(c._id)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (c.controlId || '').toLowerCase().includes(q)
        || (c.name || '').toLowerCase().includes(q)
        || (c.description || '').toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[680px] max-h-[80vh] bg-[#060d15] border border-pharaoh-500/20 rounded-2xl flex flex-col shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-pharaoh-500/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-pharaoh-100">Link Compliance Control</h2>
            <p className="text-[10px] text-pharaoh-500/50">Select a control to link to this risk</p>
          </div>
          <button onClick={onClose} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-pharaoh-500/8 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
            <input type="text" placeholder="Search controls..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-xs text-pharaoh-200 placeholder-pharaoh-500/30 focus:outline-none focus:border-amber-500/40" />
          </div>
          <select value={framework} onChange={e => setFramework(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-xs text-pharaoh-300 focus:outline-none focus:border-amber-500/40">
            <option value="">All Frameworks</option>
            <option value="ISO">ISO 27001</option>
            <option value="CBE">CBE</option>
            <option value="PCI">PCI DSS</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-pharaoh-500/40 text-xs italic text-center py-8">
              {controls.length === 0 ? 'Loading controls...' : 'No matching controls found'}
            </p>
          ) : filtered.slice(0, 50).map(c => (
            <div key={c._id}
              className="flex items-center justify-between py-2 px-3 rounded-lg border border-pharaoh-500/8 hover:border-amber-500/20 transition-all cursor-pointer"
              style={{ background: 'rgba(212,168,50,0.03)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-pharaoh-200">{c.controlId}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full border"
                    style={{
                      borderColor: c.frameworkCode === 'ISO' ? 'rgba(32,201,151,0.3)' : c.frameworkCode === 'CBE' ? 'rgba(253,126,20,0.3)' : 'rgba(153,102,255,0.3)',
                      color: c.frameworkCode === 'ISO' ? '#20c997' : c.frameworkCode === 'CBE' ? '#fd7e14' : '#d4a832'
                    }}>{c.frameworkCode}</span>
                </div>
                <p className="text-[10px] text-pharaoh-400/60 truncate mt-0.5">{c.name}</p>
              </div>
              <button onClick={async () => {
                setLinking(c._id)
                await onLink(c._id, c.frameworkCode, c.controlId, mappingType)
                setLinking(null)
              }} disabled={linking === c._id}
                className="ml-3 px-2.5 py-1 rounded-lg text-[9px] font-semibold border border-amber-500/30 text-amber-400/80 hover:border-amber-500/60 hover:text-amber-300 transition-all disabled:opacity-40">
                {linking === c._id ? '...' : 'Link'}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-pharaoh-500/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-pharaoh-500/40">Mapping:</span>
            <select value={mappingType} onChange={e => setMappingType(e.target.value)}
              className="px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[9px] text-pharaoh-300 focus:outline-none">
              <option value="Supporting">Supporting</option>
              <option value="Primary">Primary</option>
            </select>
          </div>
          <span className="text-[9px] text-pharaoh-500/30">{filtered.length} available · {controls.length} total</span>
        </div>
      </div>
    </div>
  )
}
