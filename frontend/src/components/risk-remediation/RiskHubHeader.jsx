import { AlertTriangle, Download, Plus } from 'lucide-react'
import { downloadRiskRegisterTemplateXLSX, downloadRiskRegisterXLSX, downloadRiskRegisterPDF } from '../../lib/downloadUtils'

export default function RiskHubHeader({ auditorMode, risks, setShowAddModal }) {
  return (
    <div className="flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.15)' }}>
          <AlertTriangle size={16} style={{ color: '#dc3545' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>Risk Register</h1>
          <p className="text-xs text-pharaoh-400/60 mt-0.5">WADJET GRC — Full risk register with all assessment columns</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => downloadRiskRegisterTemplateXLSX()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-egyptian-green/60 hover:text-egyptian-green transition-all">
          <Download size={13} /> Download Template (.xlsx)
        </button>
        {risks.length > 0 && (
          <>
            <button onClick={() => downloadRiskRegisterXLSX(risks)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-egyptian-green/60 hover:text-egyptian-green transition-all">
              <Download size={13} /> Export Register (.xlsx)
            </button>
            <button onClick={() => downloadRiskRegisterPDF(risks)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-pharaoh-500/20 text-pharaoh-400 hover:border-pharaoh-500/40 hover:text-pharaoh-300 transition-all">
              <Download size={13} /> Export Register (.pdf)
            </button>
          </>
        )}
        {!auditorMode && (
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold gold-gradient text-nile-900 shadow-lg shadow-pharaoh-500/20 hover:shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all">
            <Plus size={13} /> Add New Risk
          </button>
        )}
      </div>
    </div>
  )
}
