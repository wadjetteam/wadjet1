import { Search, Filter, RefreshCw } from 'lucide-react'
import { CATEGORIES, LEVELS, STATUSES } from './RiskHubConstants'

export default function RiskFilterBar({ search, setSearch, catFilter, setCatFilter, levelFilter, setLevelFilter, statusFilter, setStatusFilter, tab, setTab, filteredCount, totalCount, onRefresh }) {
  return (
    <div className="pharaoh-card px-4 py-3 flex items-center gap-3 flex-wrap animate-fade-in" style={{ animationDelay: '0.08s' }}>
      <div className="relative flex-1 min-w-[200px]">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by ID, title, category, owner…"
          className="w-full bg-transparent pl-8 pr-3 py-1.5 text-xs text-pharaoh-200 placeholder-pharaoh-500/40 border-none outline-none" />
      </div>
      <div className="h-4 w-px bg-pharaoh-500/15" />
      {[
        { label: 'Category', value: catFilter, setter: setCatFilter, opts: CATEGORIES },
        { label: 'Level', value: levelFilter, setter: setLevelFilter, opts: LEVELS },
        { label: 'Status', value: statusFilter, setter: setStatusFilter, opts: STATUSES },
      ].map(f => (
        <div key={f.label} className="flex items-center gap-1.5">
          <Filter size={11} className="text-pharaoh-500/40" />
          <select value={f.value} onChange={e => f.setter(e.target.value)}
            className="bg-transparent text-[11px] text-pharaoh-300 outline-none cursor-pointer border-none">
            {f.opts.map(o => <option key={o} value={o} style={{ background: '#070f1a' }}>{f.label}: {o}</option>)}
          </select>
        </div>
      ))}
      <div className="flex bg-pharaoh-900/60 rounded-lg p-0.5 border border-pharaoh-500/20">
        <button onClick={() => setTab('inherent')}
          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${tab === 'inherent' ? 'bg-pharaoh-800/80 text-amber-300 shadow-sm border border-pharaoh-500/30' : 'text-pharaoh-500/60 hover:text-pharaoh-400 border border-transparent'}`}>
          Inherent
        </button>
        <button onClick={() => setTab('treatment')}
          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${tab === 'treatment' ? 'bg-pharaoh-800/80 text-amber-300 shadow-sm border border-pharaoh-500/30' : 'text-pharaoh-500/60 hover:text-pharaoh-400 border border-transparent'}`}>
          Treatment
        </button>
      </div>
      <span className="text-[10px] text-pharaoh-500/40 ml-auto">{filteredCount} of {totalCount} risks</span>
      <button onClick={onRefresh} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors">
        <RefreshCw size={13} />
      </button>
    </div>
  )
}
