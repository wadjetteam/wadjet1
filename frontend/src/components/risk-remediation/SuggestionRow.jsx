import { useState } from 'react'

export default function SuggestionRow({ suggestion, riskId, onApprove, onReject }) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await onApprove(notes)
    setShowNotes(false)
    setNotes('')
    setLoading(false)
  }

  const handleReject = async () => {
    setLoading(true)
    await onReject()
    setLoading(false)
  }

  const pct = suggestion.confidenceScore
  const barColor = pct >= 45 ? '#20c997' : pct >= 30 ? '#fd7e14' : '#ced4da'

  return (
    <div className="py-2 px-2 rounded-lg"
      style={{ background: 'rgba(50,120,255,0.04)', border: '1px solid rgba(50,120,255,0.1)' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-pharaoh-200">{suggestion.controlRef}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full border"
              style={{
                borderColor: suggestion.frameworkCode === 'ISO27001' ? 'rgba(32,201,151,0.3)' : suggestion.frameworkCode === 'CBE_CSF' ? 'rgba(253,126,20,0.3)' : 'rgba(153,102,255,0.3)',
                color: suggestion.frameworkCode === 'ISO27001' ? '#20c997' : suggestion.frameworkCode === 'CBE_CSF' ? '#fd7e14' : '#d4a832'
              }}>{suggestion.frameworkCode}</span>
          </div>
          <p className="text-[9px] text-pharaoh-400/60 truncate mt-0.5">{suggestion.controlName}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-pharaoh-800/40 max-w-[80px]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="text-[8px] font-mono" style={{ color: barColor }}>{pct}%</span>
          </div>
          <div className="mt-1">
            {suggestion.reasoning?.slice(0, 1).map((r, i) => (
              <p key={i} className="text-[8px] text-pharaoh-500/40 italic">↳ {r}</p>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {showNotes ? (
            <div className="flex flex-col gap-1 items-end">
              <textarea placeholder="Audit justification (required)..."
                value={notes} onChange={e => setNotes(e.target.value)}
                className="w-[160px] px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[9px] text-pharaoh-300 resize-none focus:outline-none focus:border-green-500/40" rows={2} />
              <div className="flex gap-1">
                <button onClick={() => { setShowNotes(false); setNotes('') }}
                  className="px-1.5 py-0.5 rounded text-[8px] text-pharaoh-500/50">Cancel</button>
                <button onClick={handleApprove} disabled={loading || !notes.trim()}
                  className="px-1.5 py-0.5 rounded text-[8px] font-semibold text-green-400 border border-green-500/30 hover:border-green-500/60 disabled:opacity-40">
                  {loading ? '...' : 'Confirm'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => setShowNotes(true)}
                className="p-1 rounded border border-green-500/30 text-green-400/80 hover:border-green-500/60 hover:text-green-300 transition-all"
                title="Approve">
                ✓
              </button>
              <button onClick={handleReject} disabled={loading}
                className="p-1 rounded border border-red-500/30 text-red-400/80 hover:border-red-500/60 hover:text-red-300 transition-all disabled:opacity-40"
                title="Reject">
                ✗
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
