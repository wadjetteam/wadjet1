import { useState } from 'react'
import LossEventsTab from './LossEventsTab'
import TPRMModule from './TPRMModule'

const TABS = [
  { id: 'loss', label: 'Loss Events' },
  { id: 'tprm', label: 'Third-Party Risk (TPRM)' },
]

export default function OperationalRiskHub() {
  const [activeTab, setActiveTab] = useState('loss')

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.id ? 'gold-gradient text-nile-900 shadow' : 'text-pharaoh-400/60 hover:text-pharaoh-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'loss' && <LossEventsTab />}
      {activeTab === 'tprm' && <TPRMModule />}
    </div>
  )
}
