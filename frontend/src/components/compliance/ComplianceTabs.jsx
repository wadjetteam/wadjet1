import { Layers, Shield, ArrowLeftRight, Database, Activity } from 'lucide-react'

const TABS = [
  { id: 'matrix', label: 'Framework Matrix', icon: Layers },
  { id: 'controls', label: 'Control Assessment', icon: Shield },
  { id: 'mapping', label: 'Cross-Mappings', icon: ArrowLeftRight },
  { id: 'evidence', label: 'Evidence Vault', icon: Database },
  { id: 'tracker', label: 'Tracker', icon: Activity },
]

export default function ComplianceTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex items-center gap-2 pharaoh-card rounded-xl p-1 w-fit animate-fade-in">
      {TABS.map(tab => {
        const Icon = tab.icon
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20' : 'text-pharaoh-500/40 hover:text-pharaoh-300'}`}>
            <Icon size="16" /><span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
