import { useState } from 'react'
import AMLFramework from '../components/AMLFramework'
import BoardPackGenerator from '../components/BoardPackGenerator'

const TABS = [
  { id: 'aml', label: 'AML / Financial Crime' },
  { id: 'board', label: 'Board Pack Generator' },
]

export default function AMLExecutivePack() {
  const [activeTab, setActiveTab] = useState('aml')

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
      {activeTab === 'aml' && <AMLFramework />}
      {activeTab === 'board' && <BoardPackGenerator />}
    </div>
  )
}
