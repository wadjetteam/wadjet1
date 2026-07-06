import { useState } from 'react'
import { Pen, Trash2 } from 'lucide-react'

export default function LinkedControlRow({ mapping, onUpdateMapping, onDeleteMapping }) {
  const [editing, setEditing] = useState(false)
  const [mappingType, setMappingType] = useState(mapping.mappingType)
  const [notes, setNotes] = useState(mapping.notes || '')

  const handleSave = async () => {
    await onUpdateMapping(mapping._id, { mappingType, notes })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 py-2 px-2 rounded-lg"
        style={{ background: 'rgba(212,168,50,0.06)', border: '1px solid rgba(212,168,50,0.15)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-pharaoh-200">{mapping.control?.controlId || mapping.controlRef}</span>
          <span className="text-[9px] text-pharaoh-400/60 truncate">{mapping.control?.controlName || ''}</span>
        </div>
        <select value={mappingType} onChange={e => setMappingType(e.target.value)}
          className="w-full px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[10px] text-pharaoh-300 focus:outline-none focus:border-amber-500/40">
          <option value="Supporting">Supporting</option>
          <option value="Primary">Primary</option>
        </select>
        <textarea placeholder="Audit justification..."
          value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full px-2 py-1 rounded-lg bg-pharaoh-900/50 border border-pharaoh-500/15 text-[10px] text-pharaoh-300 resize-none focus:outline-none focus:border-amber-500/40" rows={2} />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)}
            className="px-2 py-1 rounded text-[9px] text-pharaoh-500/50 hover:text-pharaoh-400">Cancel</button>
          <button onClick={handleSave}
            className="px-2 py-1 rounded text-[9px] font-semibold text-green-400 border border-green-500/30 hover:border-green-500/60">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between py-1.5 px-2 rounded-lg group"
      style={{ background: mapping.source === 'seed' ? 'rgba(100,100,255,0.04)' : 'rgba(212,168,50,0.04)', border: '1px solid rgba(212,168,50,0.08)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-pharaoh-200">{mapping.control?.controlId || mapping.controlRef}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full border"
            style={{
              borderColor: mapping.source === 'seed' ? 'rgba(100,100,255,0.3)' : 'rgba(212,168,50,0.3)',
              color: mapping.source === 'seed' ? '#d4a832' : '#d4a832',
            }}>
            {mapping.source === 'seed' ? 'Auto' : 'Manual'}
          </span>
        </div>
        <p className="text-[9px] text-pharaoh-400/60 truncate mt-0.5">{mapping.control?.controlName || ''}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[8px] uppercase tracking-wider"
            style={{ color: mapping.mappingType === 'Primary' ? '#20c997' : '#fd7e14' }}>{mapping.mappingType}</span>
          <span className="text-[8px] font-mono text-pharaoh-500/40">{mapping.frameworkCode || ''}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)}
          className="p-1 rounded border border-pharaoh-500/20 text-pharaoh-500/60 hover:border-amber-500/40 hover:text-amber-400 transition-all"
          title="Edit mapping">
          <Pen size={10} />
        </button>
        <button onClick={() => onDeleteMapping(mapping._id)}
          className="p-1 rounded border border-pharaoh-500/20 text-pharaoh-500/60 hover:border-red-500/40 hover:text-red-400 transition-all"
          title="Unlink control">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  )
}
