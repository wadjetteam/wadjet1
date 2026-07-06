import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, X, ChevronDown, CheckCircle } from 'lucide-react'

export default function EvidenceTab({ auditorMode }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [evList, setEvList] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapTargets, setMapTargets] = useState({})
  const [detailId, setDetailId] = useState(null)
  const fileInputRef = useRef(null)

  const loadEvidences = async () => {
    try {
      const res = await fetch('/api/evidence')
      const d = await res.json()
      setEvList(d.items || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { loadEvidences() }, [])

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024; const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (!uploadedFile) return
    const form = new FormData()
    form.append('file', uploadedFile)
    try {
      await fetch('/api/evidence/upload', { method: 'POST', body: form })
      setUploadedFile(null)
      await loadEvidences()
    } catch (err) { console.error('Upload failed', err) }
  }

  const handleDelete = async (id, approved) => {
    if (approved) return alert('Approved evidence cannot be deleted (immutable)')
    if (!confirm('Delete this evidence?')) return
    try {
      await fetch(`/api/evidence/${id}`, { method: 'DELETE' })
      await loadEvidences()
    } catch (err) { console.error('Delete failed', err) }
  }

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/evidence/${id}/approve`, { method: 'POST' })
      await loadEvidences()
    } catch (err) { console.error('Approve failed', err) }
  }

  const handleMap = async (evidenceId, controlIds) => {
    if (!controlIds || controlIds.length === 0) return
    try {
      await fetch(`/api/evidence/${evidenceId}/map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controlIds, frameworkCode: 'ISO27001' }),
      })
      setMapTargets(p => ({ ...p, [evidenceId]: '' }))
      await loadEvidences()
    } catch (err) { console.error('Map failed', err) }
  }

  return (
    <div className="grid grid-cols-1 gap-5 animate-fade-in">
      <div className="pharaoh-card p-5">
        <h3 className="text-sm font-semibold text-pharaoh-200 mb-1">Evidence Vault</h3>
        <p className="text-xs text-pharaoh-400/70 mb-5">Upload evidence files for compliance audit trail</p>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadedFile(f) }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-pharaoh-400 bg-pharaoh-500/10' : 'border-pharaoh-500/20 hover:border-pharaoh-500/40'}`}>
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) setUploadedFile(f) }} accept=".pdf,.doc,.docx,.xlsx,.png,.jpg" />
              <Upload size="24" className={`mx-auto mb-2 ${dragOver ? 'text-pharaoh-400' : 'text-pharaoh-500/40'}`} />
              <p className="text-xs text-pharaoh-400/60">{dragOver ? 'Drop file here' : 'Drag & drop or click to browse'}</p>
              <p className="text-[10px] text-pharaoh-500/40">PDF, DOC, XLSX, PNG — max 50MB</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {uploadedFile && (
              <div className="p-2 px-3 rounded-lg bg-egyptian-green/10 border border-egyptian-green/20 flex items-center gap-2 max-w-[240px]">
                <FileText size="14" className="text-egyptian-green flex-shrink-0" />
                <span className="text-[10px] text-pharaoh-300 truncate flex-1">{uploadedFile.name}</span>
                <span className="text-[9px] text-pharaoh-500/40">{formatSize(uploadedFile.size)}</span>
                <button onClick={() => setUploadedFile(null)} className="text-pharaoh-500/40 hover:text-red-400"><X size="12" /></button>
              </div>
            )}
            <button onClick={handleUpload} disabled={!uploadedFile || auditorMode}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 gold-gradient text-nile-900">
              {auditorMode ? 'Upload Disabled' : 'Upload Evidence'}
            </button>
          </div>
        </div>
      </div>

      <div className="pharaoh-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-pharaoh-200">Uploaded Evidence</h3>
          <span className="text-[10px] text-pharaoh-500/40">{evList.length} files</span>
        </div>
        {loading ? (
          <div className="text-center py-8 text-xs text-pharaoh-500/40">Loading...</div>
        ) : evList.length === 0 ? (
          <div className="text-center py-8 text-xs text-pharaoh-500/40">No evidence uploaded yet</div>
        ) : (
          <div className="space-y-2">
            {evList.map(ev => (
              <div key={ev._id} className="p-3 rounded-xl bg-pharaoh-900/20 border border-pharaoh-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText size="16" className="text-pharaoh-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-pharaoh-200 truncate font-medium">{ev.fileName}</p>
                      <div className="flex items-center gap-2 text-[9px] text-pharaoh-500/40">
                        <span>{formatSize(ev.fileSize)}</span>
                        <span>•</span>
                        <span className={ev.status === 'VERIFIED' ? 'text-egyptian-green' : 'text-amber-400'}>{ev.status}</span>
                        {ev.isApproved && <><span>•</span><span className="text-egyptian-green">Approved</span></>}
                        {ev.sha256Hash && <><span>•</span><span className="font-mono">{ev.sha256Hash.slice(0, 12)}...</span></>}
                      </div>
                      {ev.mappedControls?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ev.mappedControls.map((m, i) => (
                            <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-pharaoh-500/10 text-pharaoh-400">
                              {m.controlId.slice(0, 8)}... ({m.frameworkCode})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!ev.isApproved && (
                      <>
                        <button onClick={() => handleApprove(ev._id)}
                          className="text-[9px] px-2 py-1 rounded-lg border border-egyptian-green/20 text-egyptian-green hover:bg-egyptian-green/10 transition-all">
                          Approve
                        </button>
                        <button onClick={() => handleDelete(ev._id, ev.isApproved)}
                          className="text-[9px] px-2 py-1 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all">
                          Delete
                        </button>
                      </>
                    )}
                    <button onClick={() => setDetailId(detailId === ev._id ? null : ev._id)}
                      className="p-1 text-pharaoh-500/30 hover:text-pharaoh-300">
                      <ChevronDown size="12" />
                    </button>
                  </div>
                </div>

                {detailId === ev._id && (
                  <div className="mt-3 pt-3 border-t border-pharaoh-500/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="text-pharaoh-500/40">SHA-256</span>
                        <p className="font-mono text-pharaoh-300 break-all">{ev.sha256Hash}</p>
                      </div>
                      <div>
                        <span className="text-pharaoh-500/40">Uploaded</span>
                        <p className="text-pharaoh-300">{new Date(ev.uploadedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-pharaoh-500/40">Map to controls</span>
                      <div className="flex gap-2 mt-1">
                        <input value={mapTargets[ev._id] || ''} onChange={e => setMapTargets(p => ({ ...p, [ev._id]: e.target.value }))}
                          placeholder="controlId1, controlId2,..."
                          className="flex-1 bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-lg px-3 py-1.5 text-[10px] text-pharaoh-300 outline-none placeholder-pharaoh-500/40" />
                        <button onClick={() => handleMap(ev._id, (mapTargets[ev._id] || '').split(',').map(s => s.trim()).filter(Boolean))}
                          className="text-[9px] px-3 py-1.5 rounded-lg gold-gradient text-nile-900 font-bold">
                          Map
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
