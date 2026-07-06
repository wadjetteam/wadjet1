import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { mapRisk } from './RiskHubConstants'
import useColumnResize from './useColumnResize'
import RiskHubHeader from './RiskHubHeader'
import RiskStatsCards from './RiskStatsCards'
import RiskFilterBar from './RiskFilterBar'
import RiskInherentTable from './RiskInherentTable'
import RiskTreatmentTable from './RiskTreatmentTable'
import RiskDetailPanel from './RiskDetailPanel'
import AddRiskModal from './AddRiskModal'
import ControlBrowser from './ControlBrowser'
import DeleteConfirmModal from './DeleteConfirmModal'

export default function RiskHub({ auditorMode }) {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [levelFilter, setLevelFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRisk, setEditRisk] = useState(null)
  const [riskControlMaps, setRiskControlMaps] = useState([])
  const [riskIdsWithMapping, setRiskIdsWithMapping] = useState(new Set())
  const [showControlBrowser, setShowControlBrowser] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [tab, setTab] = useState('inherent')
  const [hId, setHId] = useState(null)
  const [spacerWidth, setSpacerWidth] = useState(9999)
  const topBarRef = useRef(null)
  const wrapRef = useRef(null)
  const syncing = useRef(false)
  const { colWidths, startResize } = useColumnResize()

  const fetchSuggestions = useCallback(async (riskId) => {
    try { const r = await fetch(`/api/risk-control-maps/suggestions?riskId=${riskId}`); const data = await r.json(); setSuggestions(data.suggestions || []) }
    catch { setSuggestions([]) }
  }, [])

  const handleApproveSuggestion = useCallback(async (riskId, suggestion, notes) => {
    await fetch('/api/risk-control-maps/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riskId, controlId: suggestion.controlId, frameworkCode: suggestion.frameworkCode, controlRef: suggestion.controlRef, mappingType: suggestion.suggestedMappingType, notes, approvedBy: 'user' }),
    })
    const r = await fetch(`/api/risk-control-maps?riskId=${riskId}`); const data = await r.json(); setRiskControlMaps(data.items || [])
    const r2 = await fetch('/api/risk-control-maps'); const d2 = await r2.json(); setRiskIdsWithMapping(new Set((d2.items || []).map(m => m.riskId)))
    fetchSuggestions(riskId)
  }, [fetchSuggestions])

  const handleRejectSuggestion = useCallback(async (riskId, controlId) => {
    await fetch('/api/risk-control-maps/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ riskId, controlId }) })
    fetchSuggestions(riskId)
  }, [fetchSuggestions])

  const handleUpdateMapping = useCallback(async (mapId, updates) => {
    await fetch(`/api/risk-control-maps/${mapId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk?._id}`); const data = await r.json(); setRiskControlMaps(data.items || [])
  }, [selectedRisk])

  const handleDeleteMapping = useCallback(async (mapId) => {
    await fetch(`/api/risk-control-maps/${mapId}`, { method: 'DELETE' })
    const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk?._id}`); const data = await r.json(); setRiskControlMaps(data.items || [])
    const r2 = await fetch('/api/risk-control-maps'); const d2 = await r2.json(); setRiskIdsWithMapping(new Set((d2.items || []).map(m => m.riskId)))
    if (selectedRisk) fetchSuggestions(selectedRisk._id)
  }, [selectedRisk, fetchSuggestions])

  const fetchRisks = async () => {
    try {
      setLoading(true); const res = await fetch('/api/risks')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json(); const mapped = (data.risks || []).map(r => mapRisk(r))
      setRisks(mapped); setError(null); window.dispatchEvent(new CustomEvent('risks-updated'))
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchRisks() }, [])
  useEffect(() => {
    fetch('/api/risk-control-maps').then(r => r.json()).then(data => { setRiskIdsWithMapping(new Set((data.items || []).map(m => m.riskId))) }).catch(() => {})
  }, [])
  useEffect(() => {
    if (!selectedRisk?._id) { setRiskControlMaps([]); return }
    fetch(`/api/risk-control-maps?riskId=${selectedRisk._id}`).then(r => r.json()).then(data => setRiskControlMaps(data.items || [])).catch(() => setRiskControlMaps([]))
    fetchSuggestions(selectedRisk._id)
  }, [selectedRisk?._id, fetchSuggestions])
  useEffect(() => {
    const el = wrapRef.current; if (el && el.scrollWidth > el.clientWidth) { setSpacerWidth(el.scrollWidth) }
  }, [tab, risks])

  const handleAddRisk = async (form) => {
    const res = await fetch('/api/risks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setShowAddModal(false); await fetchRisks() }
  }

  const handleStatusChange = async (id, status) => {
    await fetch(`/api/risks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setRisks(prev => prev.map(r => r._id === id ? { ...r, status } : r))
    if (selectedRisk?._id === id) setSelectedRisk(r => ({ ...r, status }))
  }

  const handleEditRisk = async (form) => {
    const res = await fetch(`/api/risks/${editRisk._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setEditRisk(null); setSelectedRisk(null); await fetchRisks() }
  }

  const handleDeleteRisk = async (id) => {
    setConfirmDelete(null); setSelectedRisk(null); setRisks(prev => prev.filter(r => r._id !== id))
    try { await fetch(`/api/risks/${id}`, { method: 'DELETE' }) } catch (e) { /* no backend */ }
  }

  const syncPct = (from, to) => {
    if (!from || !to || syncing.current) return
    syncing.current = true
    const mf = from.scrollWidth - from.clientWidth; const mt = to.scrollWidth - to.clientWidth
    if (mf > 0 && mt > 0) { to.scrollLeft = (from.scrollLeft / mf) * mt }
    requestAnimationFrame(() => { syncing.current = false })
  }
  const syncScroll = (from) => syncPct(from.current, wrapRef.current)
  const syncScrollBack = () => syncPct(wrapRef.current, topBarRef.current)
  const clearFilters = () => { setSearch(''); setCatFilter('All'); setLevelFilter('All'); setStatusFilter('All') }

  const filtered = useMemo(() => {
    let r = risks
    if (search) { const q = search.toLowerCase(); r = r.filter(x => x.riskTitle?.toLowerCase().includes(q) || x.riskId?.toLowerCase().includes(q) || x.riskCategory?.toLowerCase().includes(q) || x.owner?.toLowerCase().includes(q)) }
    if (catFilter !== 'All') r = r.filter(x => x.riskCategory === catFilter)
    if (levelFilter !== 'All') r = r.filter(x => x.inherentLevel === levelFilter)
    if (statusFilter !== 'All') r = r.filter(x => x.status === statusFilter)
    return r
  }, [risks, search, catFilter, levelFilter, statusFilter])

  const treatmentFiltered = useMemo(() => filtered.filter(r =>
    r.status !== 'Closed' && r.status !== 'Accepted' && (r.status === 'Open' || r.status === 'In Progress' || !r.existingControls || ['', '—', 'None', 'No controls in place'].includes(r.existingControls?.trim()))
  ), [filtered])

  const stats = useMemo(() => ({
    total: risks.length, critical: risks.filter(r => r.inherentLevel === 'Critical').length,
    high: risks.filter(r => r.inherentLevel === 'High').length, medium: risks.filter(r => r.inherentLevel === 'Medium').length,
    low: risks.filter(r => r.inherentLevel === 'Low').length, open: risks.filter(r => r.status === 'Open').length,
    inProgress: risks.filter(r => r.status === 'In Progress').length,
  }), [risks])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 p-6 pb-0 space-y-5">
        <RiskHubHeader auditorMode={auditorMode} risks={risks} setShowAddModal={setShowAddModal} />
        <RiskStatsCards stats={stats} loading={loading} />
        <RiskFilterBar search={search} setSearch={setSearch} catFilter={catFilter} setCatFilter={setCatFilter}
          levelFilter={levelFilter} setLevelFilter={setLevelFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          tab={tab} setTab={setTab} filteredCount={filtered.length} totalCount={risks.length} onRefresh={fetchRisks} />
      </div>
      <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 mt-5">
        <div className="overflow-x-auto overflow-y-hidden h-2.5 bg-pharaoh-900/40 rounded-lg"
          ref={topBarRef} onScroll={() => syncScroll(topBarRef)} style={{ scrollbarWidth: 'thin' }}>
          <div style={{ width: spacerWidth, height: '1px' }} />
        </div>
        <div className="pharaoh-card overflow-hidden flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="overflow-x-auto overflow-y-auto flex-1" ref={wrapRef} onScroll={syncScrollBack}>
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <RefreshCw size={16} className="animate-spin text-pharaoh-400" />
                <span className="text-sm text-pharaoh-400/60">Loading risk register…</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16 gap-3 text-egyptian-red/70">
                <AlertTriangle size={16} /><span className="text-sm">{error}</span>
              </div>
            ) : tab === 'inherent' ? (
              <RiskInherentTable filtered={filtered} colWidths={colWidths} startResize={startResize}
                hId={hId} setHId={setHId} setSelectedRisk={setSelectedRisk}
                riskIdsWithMapping={riskIdsWithMapping} onClearFilters={clearFilters} />
            ) : (
              <RiskTreatmentTable treatmentFiltered={treatmentFiltered} colWidths={colWidths} startResize={startResize}
                hId={hId} setHId={setHId} setSelectedRisk={setSelectedRisk} onClearFilters={clearFilters} />
            )}
          </div>
        </div>
      </div>
      {selectedRisk && (
        <RiskDetailPanel risk={selectedRisk} onClose={() => setSelectedRisk(null)}
          onStatusChange={handleStatusChange} onEdit={(r) => { setSelectedRisk(null); setEditRisk(r) }}
          onDelete={(r) => setConfirmDelete(r)} riskControlMaps={riskControlMaps}
          onOpenControlBrowser={() => setShowControlBrowser(true)} suggestions={suggestions}
          onApproveSuggestion={handleApproveSuggestion} onRejectSuggestion={handleRejectSuggestion}
          onUpdateMapping={handleUpdateMapping} onDeleteMapping={handleDeleteMapping} />
      )}
      {((showAddModal && !auditorMode) || editRisk) && (
        <AddRiskModal onClose={() => { setShowAddModal(false); setEditRisk(null) }}
          onSave={editRisk ? handleEditRisk : handleAddRisk} existingIds={risks.map(r => r.riskId)} editRisk={editRisk} />
      )}
      {showControlBrowser && selectedRisk && (
        <ControlBrowser riskId={selectedRisk._id} linkedControlIds={new Set(riskControlMaps.map(m => m.controlId))}
          onLink={async (controlId, frameworkCode, controlRef, mappingType) => {
            await fetch('/api/risk-control-maps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ riskId: selectedRisk._id, controlId, frameworkCode, controlRef: controlRef || '', mappingType: mappingType || 'Supporting' }) })
            const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk._id}`); const data = await r.json(); setRiskControlMaps(data.items || [])
            const r2 = await fetch('/api/risk-control-maps'); const data2 = await r2.json(); setRiskIdsWithMapping(new Set((data2.items || []).map(m => m.riskId)))
          }}
          onUnlink={async (mapId) => {
            await fetch(`/api/risk-control-maps/${mapId}`, { method: 'DELETE' })
            const r = await fetch(`/api/risk-control-maps?riskId=${selectedRisk._id}`); const data = await r.json(); setRiskControlMaps(data.items || [])
            const r2 = await fetch('/api/risk-control-maps'); const data2 = await r2.json(); setRiskIdsWithMapping(new Set((data2.items || []).map(m => m.riskId)))
          }}
          onClose={() => setShowControlBrowser(false)} />
      )}
      {confirmDelete && (
        <DeleteConfirmModal confirmDelete={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={handleDeleteRisk} />
      )}
    </div>
  )
}
