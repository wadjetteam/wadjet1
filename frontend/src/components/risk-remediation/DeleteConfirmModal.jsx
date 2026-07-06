import { AlertTriangle, Trash2 } from 'lucide-react'

export default function DeleteConfirmModal({ confirmDelete, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-[420px] bg-[#060d15] border border-pharaoh-500/20 rounded-2xl p-6 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/20">
            <AlertTriangle size={16} style={{ color: '#dc3545' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-pharaoh-100">Delete Risk</h2>
            <p className="text-[10px] text-pharaoh-500/50">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-xs text-pharaoh-400/80 mb-4">
          Are you sure you want to delete <span className="text-pharaoh-200 font-semibold">{confirmDelete.riskTitle}</span> ({confirmDelete.riskId})?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40 transition-all">
            Cancel
          </button>
          <button onClick={() => onConfirm(confirmDelete._id)}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: '#dc3545' }}>
            <Trash2 size={12} className="inline mr-1" />Delete
          </button>
        </div>
      </div>
    </div>
  )
}
