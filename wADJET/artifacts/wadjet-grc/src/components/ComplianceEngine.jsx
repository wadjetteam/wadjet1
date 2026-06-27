import { useState, useRef } from 'react'
import { Upload, Shield, FileText, CheckCircle, X, Database, ArrowLeftRight, Layers, Clock, User, Tag, Calendar, Download, ToggleLeft, ToggleRight } from 'lucide-react'
import { downloadCompliancePDF, downloadComplianceCSV } from '../lib/downloadUtils'

const defaultFrameworks = [
  { id: 'cbe', name: 'CBE Cybersecurity Framework', authority: 'Central Bank of Egypt', color: '#b8860b', percent: 92, controls: 115, active: true },
  { id: 'iso', name: 'ISO/IEC 27001:2022', authority: 'International Organization for Standardization', color: '#c9a82e', percent: 88, controls: 93, active: true },
  { id: 'pci', name: 'PCI DSS v4.0', authority: 'PCI Security Standards Council', color: '#d4af37', percent: 79, controls: 84, active: true },
  { id: 'law151', name: 'Law 151/2020 (PDPL)', authority: 'Egyptian Government', color: '#a08040', percent: 94, controls: 42, active: true },
  { id: 'law175', name: 'Law 175/2018 (Cybercrime)', authority: 'Egyptian Government', color: '#5b8db8', percent: 71, controls: 38, active: true },
]

const fullMappingMatrix = [
  { control: 'AC-1: Access Control Management', cbe: { mapped: true, ref: 'CBE-CF-AC-01' }, iso: { mapped: true, ref: 'A.9.1.1' }, pci: { mapped: true, ref: 'Req 7.1.1' }, law151: { mapped: true, ref: 'Art 12-S2' }, law175: { mapped: true, ref: 'Art 2-S1' } },
  { control: 'AE-2: Encryption & Data Protection', cbe: { mapped: true, ref: 'CBE-CF-CR-03' }, iso: { mapped: true, ref: 'A.10.1.1' }, pci: { mapped: true, ref: 'Req 3.4.1' }, law151: { mapped: true, ref: 'Art 18-S1' }, law175: { mapped: true, ref: 'Art 14-S2' } },
  { control: 'IR-3: Incident Response', cbe: { mapped: true, ref: 'CBE-CF-IR-02' }, iso: { mapped: true, ref: 'A.16.1.1' }, pci: { mapped: true, ref: 'Req 12.10.1' }, law151: { mapped: true, ref: 'Art 24' }, law175: { mapped: true, ref: 'Art 14-S1' } },
  { control: 'BC-4: Business Continuity', cbe: { mapped: true, ref: 'CBE-CF-BC-01' }, iso: { mapped: true, ref: 'A.17.1.1' }, pci: { mapped: true, ref: 'Req 12.10' }, law151: { mapped: true, ref: 'Art 31' }, law175: { mapped: true, ref: 'Art 15-S3' } },
  { control: 'AU-5: Audit & Logging', cbe: { mapped: true, ref: 'CBE-CF-AU-04' }, iso: { mapped: true, ref: 'A.12.4.1' }, pci: { mapped: true, ref: 'Req 10.2.1' }, law151: { mapped: true, ref: 'Art 45' }, law175: { mapped: true, ref: 'Art 25-S1' } },
  { control: 'PM-6: Risk Management', cbe: { mapped: true, ref: 'CBE-CF-RM-01' }, iso: { mapped: true, ref: 'A.5.1.1' }, pci: { mapped: true, ref: 'Req 12.2' }, law151: { mapped: true, ref: 'Art 8' }, law175: { mapped: true, ref: 'Art 8-S2' } },
  { control: 'CI-7: Critical Infrastructure Protection', cbe: { mapped: true, ref: 'CBE-CF-CI-01' }, iso: { mapped: true, ref: 'A.11.2.1' }, pci: { mapped: false, ref: '—' }, law151: { mapped: false, ref: '—' }, law175: { mapped: true, ref: 'Art 15-S1' } },
  { control: 'UA-8: Unauthorized Access Prevention', cbe: { mapped: true, ref: 'CBE-CF-AC-03' }, iso: { mapped: true, ref: 'A.9.4.1' }, pci: { mapped: true, ref: 'Req 7.2.1' }, law151: { mapped: false, ref: '—' }, law175: { mapped: true, ref: 'Art 2-S2' } },
]

export default function ComplianceEngine({ auditorMode }) {
  const [frameworks, setFrameworks] = useState(defaultFrameworks)
  const [activeTab, setActiveTab] = useState('matrix')
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [evidenceForm, setEvidenceForm] = useState({ title: '', owner: '', framework: '', expiry: '' })
  const [showPipeline, setShowPipeline] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(0)
  const fileInputRef = useRef(null)

  const activeFrameworks = frameworks.filter(f => f.active)
  const activeScore = Math.round(activeFrameworks.reduce((s, f) => s + f.percent, 0) / activeFrameworks.length)
  const activeControls = activeFrameworks.reduce((s, f) => s + f.controls, 0)

  const toggleFramework = (id) => {
    setFrameworks(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f))
  }

  const getFramework = (id) => frameworks.find(f => f.id === id)

  const pipelineSteps = [
    { label: 'Upload Evidence', sub: 'File ingestion', icon: Upload, color: '#b8860b' },
    { label: 'Control Mapping', sub: 'Analyzing controls', icon: ArrowLeftRight, color: '#c9a82e' },
    ...activeFrameworks.map(fw => ({ label: `Populating ${fw.name.split(' ')[0]}`, sub: fw.name.substring(0, 24), icon: Shield, color: fw.color })),
  ]

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) setUploadedFile({ name: file.name, size: file.size, type: file.type, hash: generateHash() }) }
  const generateHash = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  const handleFileSelect = (e) => { const file = e.target.files[0]; if (file) setUploadedFile({ name: file.name, size: file.size, type: file.type, hash: generateHash() }) }

  const handleUploadEvidence = () => {
    if (!uploadedFile || !evidenceForm.title) return
    setShowPipeline(true); setPipelineStep(0)
    const interval = setInterval(() => {
      setPipelineStep(p => {
        if (p >= pipelineSteps.length - 1) { clearInterval(interval); setTimeout(() => { setShowPipeline(false); setUploadedFile(null); setEvidenceForm({ title: '', owner: '', framework: '', expiry: '' }) }, 1000); return p }
        return p + 1
      })
    }, 600)
  }

  const formatSize = (bytes) => { if (!bytes) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i] }

  const tabs = [
    { id: 'matrix', label: 'Framework Matrix', icon: Layers },
    { id: 'evidence', label: 'Evidence Vault', icon: Database },
  ]

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Cross-Framework Compliance Engine</h1>
          <p className="page-subtitle">Unified compliance mapping across regulatory frameworks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCompliancePDF(frameworks, fullMappingMatrix)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${auditorMode ? 'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20' : 'bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300'}`}>
            <Download size="12" /> Export PDF
          </button>
          <button onClick={() => downloadComplianceCSV(frameworks, fullMappingMatrix)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${auditorMode ? 'bg-egyptian-green/15 text-egyptian-green border border-egyptian-green/20' : 'bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green'}`}>
            <Download size="12" /> Export Excel
          </button>
        </div>
      </div>

      {/* Framework Activation Cards */}
      <div className="grid grid-cols-5 gap-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {frameworks.map(fw => (
          <div key={fw.id} className={`pharaoh-card p-4 transition-all duration-300 ${!fw.active ? 'opacity-40 grayscale' : ''}`} style={{ borderColor: fw.active ? fw.color + '30' : undefined }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-pharaoh-400/60">{fw.authority.split(' ')[0]}</span>
              {!auditorMode ? (
                <button onClick={() => toggleFramework(fw.id)} className="transition-all hover:scale-105">
                  {fw.active ? <ToggleRight size="20" style={{ color: fw.color }} /> : <ToggleLeft size="20" className="text-pharaoh-500/40" />}
                </button>
              ) : (
                <span className={`text-[9px] font-medium ${fw.active ? 'text-egyptian-green' : 'text-pharaoh-500/40'}`}>{fw.active ? 'Active' : 'Inactive'}</span>
              )}
            </div>
            <div className="text-xs font-semibold text-pharaoh-200 mb-1">{fw.name}</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold font-mono text-pharaoh-200">{fw.active ? fw.percent : '--'}%</span>
              <span className="text-[10px] text-pharaoh-500/40 font-mono">{fw.controls} controls</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-pharaoh-500/5 overflow-hidden">
              {fw.active && <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fw.percent}%`, backgroundColor: fw.color }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Active Compliance Score Bar */}
      <div className="pharaoh-card p-4 animate-fade-in" style={{ animationDelay: '0.08s' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size="16" className="text-pharaoh-400" />
            <span className="text-sm font-semibold text-pharaoh-200">Active Compliance Score</span>
            <span className="text-[10px] text-pharaoh-500/40">({activeFrameworks.length} of {frameworks.length} frameworks active · {activeControls} controls)</span>
          </div>
          <span className="text-lg font-bold font-mono text-pharaoh-400">{activeScore}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-pharaoh-500/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-pharaoh-600 via-pharaoh-400 to-pharaoh-300 transition-all duration-500" style={{ width: `${activeScore}%` }} />
        </div>
      </div>

      {/* Module Tabs */}
      <div className="flex items-center gap-2 pharaoh-card rounded-xl p-1 w-fit animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20' : 'text-pharaoh-500/40 hover:text-pharaoh-300'}`}>
              <Icon size="16" /><span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'matrix' && (
        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="pharaoh-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-pharaoh-200">Inter-Regulatory Control Mapping Matrix</h3>
              <span className="text-[10px] text-pharaoh-400/60">Cross-framework control alignment</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pharaoh-500/10">
                    <th className="text-left py-3 px-4 text-xs text-pharaoh-400/60 font-medium w-[220px]">Control / Requirement</th>
                    {activeFrameworks.map(fw => (
                      <th key={fw.id} className="text-center py-3 px-3 text-xs font-medium" style={{ color: fw.color }}>{fw.name.split(' ')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fullMappingMatrix.map((row, idx) => {
                    const fwKeys = activeFrameworks.map(f => f.id)
                    return (
                      <tr key={idx} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="text-xs text-pharaoh-200 font-medium">{row.control}</div>
                        </td>
                        {fwKeys.map(fwKey => {
                          const item = row[fwKey]
                          if (!item) return <td key={fwKey} className="py-4 px-3 text-center"><span className="text-[10px] text-pharaoh-500/40">N/A</span></td>
                          return (
                            <td key={fwKey} className="py-4 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <CheckCircle size="12" className={item.mapped ? 'text-egyptian-green' : 'text-pharaoh-500/40'} />
                                <span className={`text-[10px] font-mono ${item.mapped ? 'text-emerald-400 font-medium bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20' : 'text-pharaoh-500/40'}`}>{item.ref}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-pharaoh-500/8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><CheckCircle size="12" className="text-egyptian-green" /><span className="text-[10px] text-pharaoh-500/40">Mapped</span></div>
                <span className="text-[10px] text-pharaoh-500/40">|</span>
                <span className="text-[10px] text-pharaoh-500/40">Total controls: {fullMappingMatrix.length}</span>
              </div>
              <span className="text-[10px] text-egyptian-green font-medium">Coverage: {activeFrameworks.length > 0 ? `${Math.round(activeFrameworks.reduce((s, f) => s + (f.percent >= 80 ? 1 : 0), 0) / activeFrameworks.length * 100)}%` : '0%'}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="grid grid-cols-2 gap-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="pharaoh-card p-5">
            <h3 className="text-sm font-semibold text-pharaoh-200 mb-1">Single-Upload Evidence Vault</h3>
            <p className="text-xs text-pharaoh-400/70 mb-5">Upload one file to automatically populate controls across all active frameworks</p>
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-pharaoh-400 bg-pharaoh-500/10' : 'border-pharaoh-500/20 hover:border-pharaoh-500/40'}`}>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xlsx,.png,.jpg" />
              <Upload size="36" className={`mx-auto mb-4 ${dragOver ? 'text-pharaoh-400' : 'text-pharaoh-500/40'}`} />
              <p className="text-sm text-pharaoh-400/60 font-medium mb-1">{dragOver ? 'Drop file here' : 'Drag & drop your evidence file here'}</p>
              <p className="text-xs text-pharaoh-500/40">or click to browse · PDF, DOC, XLSX, PNG (max 25 MB)</p>
            </div>
            {uploadedFile && (
              <div className="mt-4 p-3 rounded-xl bg-egyptian-green/10 border border-egyptian-green/20">
                <div className="flex items-center gap-3">
                  <FileText size="16" className="text-egyptian-green flex-shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-xs text-pharaoh-300 font-medium truncate">{uploadedFile.name}</p><p className="text-[10px] text-pharaoh-500/40">{formatSize(uploadedFile.size)}</p></div>
                  <button onClick={() => setUploadedFile(null)} className="text-pharaoh-500/40 hover:text-red-500"><X size="14" /></button>
                </div>
                <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-pharaoh-500/5 border border-pharaoh-500/10">
                  <Shield size="10" className="text-pharaoh-400 flex-shrink-0" />
                  <span className="text-[9px] font-mono text-pharaoh-400/60 truncate">SHA-256: {uploadedFile.hash.substring(0, 10)}...</span>
                </div>
              </div>
            )}
            <div className="mt-5 space-y-3">
              <div className="relative"><Tag size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
                <input type="text" placeholder="Evidence Title" value={evidenceForm.title} onChange={e => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  className="w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 pl-10 pr-3 text-xs text-pharaoh-300 placeholder-pharaoh-500/40 focus:border-pharaoh-400/50 focus:outline-none transition-all" /></div>
              <div className="flex gap-3">
                <div className="relative flex-1"><User size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
                  <input type="text" placeholder="Owner" value={evidenceForm.owner} onChange={e => setEvidenceForm({ ...evidenceForm, owner: e.target.value })}
                    className="w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 pl-10 pr-3 text-xs text-pharaoh-300 placeholder-pharaoh-500/40 focus:border-pharaoh-400/50 focus:outline-none transition-all" /></div>
                <div className="relative flex-1"><Calendar size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
                  <input type="date" value={evidenceForm.expiry} onChange={e => setEvidenceForm({ ...evidenceForm, expiry: e.target.value })}
                    className="w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 pl-10 pr-3 text-xs text-pharaoh-300 focus:border-pharaoh-400/50 focus:outline-none transition-all" /></div>
              </div>
              <div className="relative"><Shield size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
                <select value={evidenceForm.framework} onChange={e => setEvidenceForm({ ...evidenceForm, framework: e.target.value })}
                  className="w-full bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-xl py-2.5 pl-10 pr-3 text-xs text-pharaoh-300 focus:border-pharaoh-400/50 focus:outline-none transition-all appearance-none">
                  <option value="" disabled>Framework Association</option>
                  <option value="all">All Active Frameworks</option>
                  {activeFrameworks.map(fw => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
                </select></div>
              <button onClick={handleUploadEvidence} disabled={!uploadedFile || !evidenceForm.title || auditorMode}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed gold-gradient text-nile-900 font-bold hover:opacity-90">
                {auditorMode ? 'Upload Disabled - Auditor View' : 'Upload & Auto-Map Evidence'}
              </button>
            </div>
          </div>

          {/* Pipeline */}
          <div className="pharaoh-card p-5">
            <h3 className="text-sm font-semibold text-pharaoh-200 mb-1">Mapping Pipeline</h3>
            <p className="text-xs text-pharaoh-400/70 mb-5">Visual evidence-to-control distribution path</p>
            {!showPipeline ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Layers size="48" className="text-pharaoh-500/40 mb-4" />
                <p className="text-sm text-pharaoh-400/70">Upload evidence to see the</p>
                <p className="text-sm text-pharaoh-400/70">auto-mapping pipeline in action</p>
                <div className="mt-6 flex gap-2">
                  {activeFrameworks.map(fw => (
                    <div key={fw.id} className="px-3 py-2 rounded-lg bg-pharaoh-900/30 border border-pharaoh-500/15 text-center">
                      <Shield size="14" className="mx-auto mb-1" style={{ color: fw.color }} />
                      <span className="text-[10px] text-pharaoh-400/70">{fw.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pipelineSteps.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = pipelineStep >= idx
                  const isCurrent = pipelineStep === idx
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={`flex flex-col items-center ${idx < pipelineSteps.length - 1 ? 'h-14' : ''}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${isActive ? 'shadow-md' : 'bg-pharaoh-500/5'}`} style={{ backgroundColor: isActive ? `${step.color}15` : undefined, border: isActive ? `1px solid ${step.color}30` : undefined }}>
                          <Icon size="15" style={{ color: isActive ? step.color : '#94a3b8' }} />
                        </div>
                        {idx < pipelineSteps.length - 1 && <div className={`w-0.5 flex-1 transition-all duration-700 delay-200 ${pipelineStep > idx ? '' : 'bg-pharaoh-500/10'}`} style={{ backgroundColor: pipelineStep > idx ? step.color : undefined }} />}
                      </div>
                      <div className={`transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="text-sm font-medium text-pharaoh-200">{step.label}</div>
                        <div className="text-[10px] text-pharaoh-400/70">{step.sub}</div>
                      </div>
                      {isCurrent && <div className="flex gap-0.5 ml-auto"><span className="w-1 h-1 rounded-full animate-pulse-dot" style={{ backgroundColor: step.color, animationDelay: '0s' }} /><span className="w-1 h-1 rounded-full animate-pulse-dot" style={{ backgroundColor: step.color, animationDelay: '0.2s' }} /><span className="w-1 h-1 rounded-full animate-pulse-dot" style={{ backgroundColor: step.color, animationDelay: '0.4s' }} /></div>}
                    </div>
                  )
                })}
                {pipelineStep >= pipelineSteps.length - 1 && (
                  <div className="mt-4 p-4 rounded-xl bg-egyptian-green/10 border border-egyptian-green/20 text-center">
                    <CheckCircle size="20" className="mx-auto mb-1 text-egyptian-green" />
                    <p className="text-xs text-egyptian-green font-medium">Mapping complete · {activeControls} controls populated across {activeFrameworks.length} frameworks</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
