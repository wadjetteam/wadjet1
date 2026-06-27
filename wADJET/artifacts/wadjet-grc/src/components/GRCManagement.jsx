import { useState } from 'react'
import { Shield, BookOpen, AlertTriangle, FileText, Plus, X, Monitor, CheckCircle, Radio } from 'lucide-react'

const fleetData = [
  { name: 'CAIRO-HQ-IT-001', ip: '10.88.1.101', os: 'Windows 11 Enterprise', status: 'online', agentVer: '4.2.1' },
  { name: 'CAIRO-HQ-IT-002', ip: '10.88.1.102', os: 'Windows 11 Enterprise', status: 'online', agentVer: '4.2.1' },
  { name: 'CAIRO-HQ-FIN-001', ip: '10.88.2.50', os: 'Windows 10 Pro', status: 'online', agentVer: '4.2.0' },
  { name: 'ALEX-BR-001', ip: '10.88.10.10', os: 'Windows 11 Enterprise', status: 'offline', agentVer: '4.1.9' },
  { name: 'ALEX-BR-002', ip: '10.88.10.11', os: 'Windows 10 Pro', status: 'online', agentVer: '4.2.1' },
  { name: 'GIZA-BR-001', ip: '10.88.20.5', os: 'Windows 11 Enterprise', status: 'online', agentVer: '4.2.1' },
  { name: 'GIZA-BR-002', ip: '10.88.20.6', os: 'Windows 10 Pro', status: 'offline', agentVer: '4.1.8' },
  { name: 'DOKKI-BR-001', ip: '10.88.30.15', os: 'Windows 11 Enterprise', status: 'online', agentVer: '4.2.0' },
  { name: 'NASR-CT-001', ip: '10.88.40.22', os: 'Windows 10 Pro', status: 'online', agentVer: '4.2.1' },
  { name: 'MAADI-BR-001', ip: '10.88.50.8', os: 'Windows 11 Enterprise', status: 'offline', agentVer: '4.1.7' },
]

export default function GRCManagement({ auditorMode }) {
  const [activeTab, setActiveTab] = useState('frameworks')
  const [frameworks, setFrameworks] = useState([
    { id: 1, name: 'CBE Cybersecurity Framework', authority: 'Central Bank of Egypt', version: '2.1', description: 'Cybersecurity requirements for Egyptian banking sector' },
    { id: 2, name: 'ISO/IEC 27001:2022', authority: 'ISO', version: '2022', description: 'Information security management system standard' },
  ])
  const [controls, setControls] = useState([
    { id: 1, code: 'AC-01', title: 'Access Control Policy', framework: 'CBE Cybersecurity Framework', type: 'Administrative', criteria: 'Policy document exists and is reviewed annually' },
  ])
  const [risks, setRisks] = useState([
    { id: 1, title: 'SWIFT System Vulnerability', description: 'Critical unpatched vulnerability in SWIFT infrastructure', category: 'Cyber', asset: 'srv-swift-prod-01', likelihood: 'High', impact: 'Critical' },
  ])
  const [policies, setPolicies] = useState([
    { id: 1, title: 'Information Security Policy', code: 'GRC-POL-SEC-001', owner: 'CISO', cycle: 'Annual', content: 'This policy defines the information security framework...' },
  ])

  const [fwForm, setFwForm] = useState({ name: '', authority: '', deadline: '' })
  const [ctrlForm, setCtrlForm] = useState({ code: '', title: '', framework: '', type: 'Administrative', criteria: '' })
  const [riskForm, setRiskForm] = useState({ title: '', description: '', category: 'Operational', asset: '', likelihood: 'Medium', impact: 'Medium' })
  const [polForm, setPolForm] = useState({ title: '', code: '', owner: '', cycle: 'Annual', content: '' })
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState('')
  const [fleet, setFleet] = useState(fleetData)
  const [pushingMachines, setPushingMachines] = useState([])
  const [scanningMachines, setScanningMachines] = useState([])

  const tabs = [
    { id: 'frameworks', label: 'Frameworks', icon: Shield },
    { id: 'controls', label: 'Controls', icon: BookOpen },
    { id: 'risks', label: 'Risks', icon: AlertTriangle },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'fleet', label: 'Agent Fleet', icon: Monitor },
  ]

  const onlineCount = fleet.filter(m => m.status === 'online').length
  const offlineCount = fleet.filter(m => m.status === 'offline').length

  const handleAdd = () => {
    if (editingType === 'framework') {
      if (!fwForm.name || !fwForm.authority) return
      setFrameworks(prev => [...prev, { id: Date.now(), ...fwForm }])
      setFwForm({ name: '', authority: '', deadline: '' })
    } else if (editingType === 'control') {
      if (!ctrlForm.code || !ctrlForm.title) return
      setControls(prev => [...prev, { id: Date.now(), ...ctrlForm }])
      setCtrlForm({ code: '', title: '', framework: '', type: 'Administrative', criteria: '' })
    } else if (editingType === 'risk') {
      if (!riskForm.title || !riskForm.description) return
      setRisks(prev => [...prev, { id: Date.now(), ...riskForm }])
      setRiskForm({ title: '', description: '', category: 'Operational', asset: '', likelihood: 'Medium', impact: 'Medium' })
    } else if (editingType === 'policy') {
      if (!polForm.title || !polForm.code) return
      setPolicies(prev => [...prev, { id: Date.now(), ...polForm }])
      setPolForm({ title: '', code: '', owner: '', cycle: 'Annual', content: '' })
    }
    setShowForm(false)
  }

  const openForm = (type) => {
    setEditingType(type)
    setShowForm(true)
  }

  const frameworkNames = frameworks.map(f => f.name)

  const inputClass = "w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 px-3 text-xs text-pharaoh-300 placeholder-pharaoh-500/40 focus:border-pharaoh-500/30 focus:outline-none transition-all"
  const selectClass = "w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 px-3 text-xs text-pharaoh-400 focus:border-pharaoh-500/30 focus:outline-none appearance-none transition-all"
  const textareaClass = "w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 px-3 text-xs text-pharaoh-300 placeholder-pharaoh-500/40 focus:border-pharaoh-500/30 focus:outline-none resize-none transition-all"

  const renderForm = () => {
    switch (editingType) {
      case 'framework':
        return (
          <div className="space-y-4">
            <input type="text" placeholder="Framework Name" value={fwForm.name} onChange={e => setFwForm({ ...fwForm, name: e.target.value })} className={inputClass} />
            <input type="text" placeholder="Issuing Authority" value={fwForm.authority} onChange={e => setFwForm({ ...fwForm, authority: e.target.value })} className={inputClass} />
            <input type="date" placeholder="Compliance Deadline" value={fwForm.deadline} onChange={e => setFwForm({ ...fwForm, deadline: e.target.value })} className={inputClass} />
          </div>
        )
      case 'control':
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input type="text" placeholder="Control ID (e.g., AC-01)" value={ctrlForm.code} onChange={e => setCtrlForm({ ...ctrlForm, code: e.target.value })} className={`${inputClass} flex-1 font-mono`} />
              <select value={ctrlForm.framework} onChange={e => setCtrlForm({ ...ctrlForm, framework: e.target.value })} className={`${selectClass} flex-1`}>
                <option value="">Select Framework</option>
                {frameworkNames.map(fw => <option key={fw} value={fw}>{fw}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Control Title" value={ctrlForm.title} onChange={e => setCtrlForm({ ...ctrlForm, title: e.target.value })} className={inputClass} />
            <div className="flex gap-3">
              <select value={ctrlForm.type} onChange={e => setCtrlForm({ ...ctrlForm, type: e.target.value })} className={`${selectClass} flex-1`}>
                <option value="Administrative">Administrative</option>
                <option value="Technical">Technical</option>
                <option value="Physical">Physical</option>
              </select>
            </div>
            <textarea placeholder="Assessment Criteria" value={ctrlForm.criteria} onChange={e => setCtrlForm({ ...ctrlForm, criteria: e.target.value })} rows="3" className={textareaClass} />
          </div>
        )
      case 'risk':
        return (
          <div className="space-y-4">
            <input type="text" placeholder="Risk Title" value={riskForm.title} onChange={e => setRiskForm({ ...riskForm, title: e.target.value })} className={inputClass} />
            <textarea placeholder="Risk Description" value={riskForm.description} onChange={e => setRiskForm({ ...riskForm, description: e.target.value })} rows="3" className={textareaClass} />
            <div className="flex gap-3">
              <select value={riskForm.category} onChange={e => setRiskForm({ ...riskForm, category: e.target.value })} className={`${selectClass} flex-1`}>
                <option value="Operational">Operational</option>
                <option value="Cyber">Cyber</option>
                <option value="Legal">Legal</option>
                <option value="Financial">Financial</option>
              </select>
              <input type="text" placeholder="Targeted Asset" value={riskForm.asset} onChange={e => setRiskForm({ ...riskForm, asset: e.target.value })} className={`${inputClass} flex-1 font-mono`} />
            </div>
            <div className="flex gap-3">
              <select value={riskForm.likelihood} onChange={e => setRiskForm({ ...riskForm, likelihood: e.target.value })} className={`${selectClass} flex-1`}>
                <option value="Low">Likelihood: Low</option><option value="Medium">Likelihood: Medium</option><option value="High">Likelihood: High</option><option value="Critical">Likelihood: Critical</option>
              </select>
              <select value={riskForm.impact} onChange={e => setRiskForm({ ...riskForm, impact: e.target.value })} className={`${selectClass} flex-1`}>
                <option value="Low">Impact: Low</option><option value="Medium">Impact: Medium</option><option value="High">Impact: High</option><option value="Critical">Impact: Critical</option>
              </select>
            </div>
          </div>
        )
      case 'policy':
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input type="text" placeholder="Policy Title" value={polForm.title} onChange={e => setPolForm({ ...polForm, title: e.target.value })} className={`${inputClass} flex-1`} />
              <input type="text" placeholder="Policy Code" value={polForm.code} onChange={e => setPolForm({ ...polForm, code: e.target.value })} className={`${inputClass} flex-1 font-mono`} />
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Owner Department" value={polForm.owner} onChange={e => setPolForm({ ...polForm, owner: e.target.value })} className={`${inputClass} flex-1`} />
              <select value={polForm.cycle} onChange={e => setPolForm({ ...polForm, cycle: e.target.value })} className={`${selectClass} flex-1`}>
                <option value="Quarterly">Quarterly</option><option value="Semi-Annual">Semi-Annual</option><option value="Annual">Annual</option><option value="Biennial">Biennial</option>
              </select>
            </div>
            <textarea placeholder="Policy Content" value={polForm.content} onChange={e => setPolForm({ ...polForm, content: e.target.value })} rows="6" className={textareaClass} />
          </div>
        )
    }
  }

  const badgeClass = (type) => {
    const map = {
      Administrative: 'bg-pharaoh-500/10 text-pharaoh-300 border-pharaoh-500/20',
      Technical: 'bg-pharaoh-400/10 text-pharaoh-400 border-pharaoh-400/20',
      Physical: 'bg-pharaoh-500/5 text-pharaoh-500/40 border-pharaoh-500/15',
      Critical: 'bg-egyptian-red/10 text-egyptian-red border-egyptian-red/20',
      High: 'bg-pharaoh-500/10 text-pharaoh-300 border-pharaoh-500/20',
      Medium: 'bg-pharaoh-400/10 text-pharaoh-400 border-pharaoh-400/20',
      Low: 'bg-pharaoh-500/5 text-pharaoh-500/40 border-pharaoh-500/15',
    }
    return map[type] || 'bg-pharaoh-500/5 text-pharaoh-500/40 border-pharaoh-500/15'
  }

  const renderTable = () => {
    switch (activeTab) {
      case 'frameworks':
        return (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-pharaoh-500/10">
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Name</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Authority</th>
              <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Version</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Description</th>
            </tr></thead>
            <tbody>
              {frameworks.map(fw => (
                <tr key={fw.id} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                  <td className="py-3 px-3 text-xs text-pharaoh-300 font-medium">{fw.name}</td>
                  <td className="py-3 px-3 text-xs text-pharaoh-400/70">{fw.authority}</td>
                  <td className="py-3 px-3 text-center text-xs font-mono text-pharaoh-400/70">{fw.version}</td>
                  <td className="py-3 px-3 text-xs text-pharaoh-500/40">{fw.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'controls':
        return (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-pharaoh-500/10">
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Code</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Title</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Framework</th>
              <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Type</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Criteria</th>
            </tr></thead>
            <tbody>
              {controls.map(ctrl => (
                <tr key={ctrl.id} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                  <td className="py-3 px-3 text-xs font-mono text-pharaoh-300 font-medium">{ctrl.code}</td>
                  <td className="py-3 px-3 text-xs text-pharaoh-300">{ctrl.title}</td>
                  <td className="py-3 px-3 text-xs text-pharaoh-400/70">{ctrl.framework}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium border ${badgeClass(ctrl.type)}`}>{ctrl.type}</span>
                  </td>
                  <td className="py-3 px-3 text-xs text-pharaoh-500/40 max-w-[200px] truncate">{ctrl.criteria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'risks':
        return (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-pharaoh-500/10">
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Title</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Category</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Asset</th>
              <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Likelihood</th>
              <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Impact</th>
            </tr></thead>
            <tbody>
              {risks.map(risk => (
                <tr key={risk.id} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                  <td className="py-3 px-3 text-xs text-pharaoh-300 font-medium">{risk.title}</td>
                  <td className="py-3 px-3 text-xs text-pharaoh-400/70">{risk.category}</td>
                  <td className="py-3 px-3 text-xs font-mono text-pharaoh-400/70">{risk.asset}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium border ${badgeClass(risk.likelihood)}`}>{risk.likelihood}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium border ${badgeClass(risk.impact)}`}>{risk.impact}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'policies':
        return (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-pharaoh-500/10">
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Title</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Code</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Owner</th>
              <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Review Cycle</th>
              <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Content Preview</th>
            </tr></thead>
            <tbody>
              {policies.map(pol => (
                <tr key={pol.id} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                  <td className="py-3 px-3 text-xs text-pharaoh-300 font-medium">{pol.title}</td>
                  <td className="py-3 px-3 text-xs font-mono text-pharaoh-300">{pol.code}</td>
                  <td className="py-3 px-3 text-xs text-pharaoh-400/70">{pol.owner}</td>
                  <td className="py-3 px-3 text-center text-xs text-pharaoh-400/70">{pol.cycle}</td>
                  <td className="py-3 px-3 text-xs text-pharaoh-500/40 max-w-[200px] truncate">{pol.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'fleet':
        return (
          <div>
            {/* Fleet Status Overview */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Total Endpoints', value: fleet.length, color: '#b8860b' },
                { label: 'Online Agents', value: onlineCount, color: '#2d7d46' },
                { label: 'Offline Agents', value: offlineCount, color: '#c41e3a' },
                { label: 'Agent Coverage', value: `${Math.round((onlineCount / fleet.length) * 100)}%`, color: onlineCount / fleet.length >= 0.8 ? '#2d7d46' : '#c9a82e' },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[10px] text-pharaoh-500/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pharaoh-500/10">
                    <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Machine Name</th>
                    <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">IP Address</th>
                    <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Operating System</th>
                    <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Agent Status</th>
                    <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.map(machine => {
                    const isPushing = pushingMachines.includes(machine.name)
                    const isScanning = scanningMachines.includes(machine.name)
                    return (
                      <tr key={machine.name} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Monitor size="14" className={machine.status === 'online' ? 'text-egyptian-green' : 'text-pharaoh-500/30'} />
                            <span className="text-xs font-mono text-pharaoh-300 font-medium">{machine.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs font-mono text-pharaoh-400/70">{machine.ip}</td>
                        <td className="py-3 px-3 text-xs text-pharaoh-400/70">{machine.os}</td>
                        <td className="py-3 px-3 text-center">
                          {machine.status === 'online' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-zinc-600" />
                              <span className="text-[10px] text-zinc-500 font-medium">Offline</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {machine.status === 'online' && (
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => {
                                setPushingMachines(prev => [...prev, machine.name])
                                setTimeout(() => setPushingMachines(prev => prev.filter(n => n !== machine.name)), 2000)
                              }} disabled={isPushing}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 hover:bg-pharaoh-500/15 transition-all disabled:opacity-40">
                                {isPushing ? <><Radio size="10" className="animate-pulse-dot" /> Pushing...</> : <><FileText size="10" /> Push Policy Attestation</>}
                              </button>
                              <button onClick={() => {
                                setScanningMachines(prev => [...prev, machine.name])
                                setTimeout(() => setScanningMachines(prev => prev.filter(n => n !== machine.name)), 2500)
                              }} disabled={isScanning}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 hover:bg-pharaoh-500/15 transition-all disabled:opacity-40">
                                {isScanning ? <><Radio size="10" className="animate-pulse-dot" /> Scanning...</> : <><Shield size="10" /> Force System Scan</>}
                              </button>
                            </div>
                          )}
                          {machine.status === 'offline' && (
                            <span className="text-[9px] text-pharaoh-500/40 italic">Agent unreachable</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-pharaoh-500/8">
              <span className="text-[10px] text-pharaoh-500/40">{fleet.length} managed endpoints · Agent v4.2.x</span>
              <span className="text-[10px] text-egyptian-green font-medium">{onlineCount}/{fleet.length} agents reporting</span>
            </div>
          </div>
        )
    }
  }

  const tabCounts = { frameworks: frameworks.length, controls: controls.length, risks: risks.length, policies: policies.length, fleet: fleet.length }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-pharaoh-200">GRC Management Workspace</h1>
          <p className="text-sm text-pharaoh-400/70 mt-0.5">Create and manage frameworks, controls, risks, and policies</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-nile-900 rounded-xl p-1 border border-pharaoh-500/15 w-fit animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20' : 'text-pharaoh-500/40 hover:text-pharaoh-300'}`}>
              <Icon size="16" /><span>{tab.label}</span><span className="text-[10px] text-pharaoh-500/40 font-mono">({tabCounts[tab.id]})</span>
            </button>
          )
        })}
      </div>

      <div className="pharaoh-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-pharaoh-500/10">
          <h3 className="text-sm font-semibold text-pharaoh-200">
            {activeTab === 'frameworks' ? 'Framework Inventory' : activeTab === 'controls' ? 'Control Inventory' : activeTab === 'risks' ? 'Risk Register' : activeTab === 'fleet' ? 'Desktop Agent Fleet Management' : 'Policy Inventory'}
          </h3>
          {!auditorMode && activeTab !== 'fleet' && (
            <button onClick={() => openForm(activeTab === 'frameworks' ? 'framework' : activeTab === 'controls' ? 'control' : activeTab === 'risks' ? 'risk' : 'policy')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-nile-900 text-xs font-bold transition-all hover:opacity-90 shadow-sm">
              <Plus size="14" /> Add {activeTab === 'frameworks' ? 'Framework' : activeTab === 'controls' ? 'Control' : activeTab === 'risks' ? 'Risk' : 'Policy'}
            </button>
          )}
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">{renderTable()}</div>
          {activeTab === 'frameworks' && frameworks.length === 0 && <div className="text-center py-8 text-sm text-pharaoh-500/40">No frameworks added yet.</div>}
          {activeTab === 'controls' && controls.length === 0 && <div className="text-center py-8 text-sm text-pharaoh-500/40">No controls added yet.</div>}
          {activeTab === 'risks' && risks.length === 0 && <div className="text-center py-8 text-sm text-pharaoh-500/40">No risks registered yet.</div>}
          {activeTab === 'policies' && policies.length === 0 && <div className="text-center py-8 text-sm text-pharaoh-500/40">No policies created yet.</div>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-nile-900 rounded-2xl shadow-2xl border border-pharaoh-500/15 w-[520px] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-pharaoh-500/10">
              <div className="flex items-center gap-3">
                <Plus size="18" className="text-pharaoh-400" />
                <h3 className="text-sm font-bold text-pharaoh-200">Add {editingType === 'framework' ? 'Framework' : editingType === 'control' ? 'Control' : editingType === 'risk' ? 'Risk' : 'Policy'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-pharaoh-500/40 hover:text-pharaoh-300 transition-colors"><X size="16" /></button>
            </div>
            <div className="p-5">{renderForm()}</div>
            <div className="flex justify-end gap-2 p-5 border-t border-pharaoh-500/10">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs text-pharaoh-500/40 hover:text-pharaoh-300 border border-pharaoh-500/15 transition-all">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 rounded-xl text-xs font-bold gold-gradient text-nile-900 transition-all hover:opacity-90">{editingType === 'framework' ? 'Save Framework' : `Create ${editingType === 'control' ? 'Control' : editingType === 'risk' ? 'Risk' : 'Policy'}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
