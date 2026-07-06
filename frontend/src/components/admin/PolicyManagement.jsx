import { useState, useEffect, useMemo, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { GOLD, SILVER, WHITE, CRIMSON, EMERALD, BORDER, GRADIENT, STORAGE_KEY, today, nextId } from './PolicyData'
import { seedData, TABS, WF_ORDER, WF_STEPS } from './PolicyData'
import {
  PolicyRepository, WorkflowApprovals, VersionsHistory,
  ControlsMapping, RisksMapping, RegulationsMapping,
  AuditFindings, AcknowledgmentTracking
} from './TabViews'
import PolicyModals from './PolicyModals'

export default function PolicyManagement() {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('repo')
  const [alertMsg, setAlertMsg] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [approvalPolId, setApprovalPolId] = useState(null)
  const [showWfHist, setShowWfHist] = useState(null)
  const [showCtrl, setShowCtrl] = useState(false)
  const [showRisk, setShowRisk] = useState(false)
  const [showReg, setShowReg] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [showAck, setShowAck] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(null)
  const [showPolicyViewer, setShowPolicyViewer] = useState(null)

  const [repoQ, setRepoQ] = useState('')
  const [repoF, setRepoF] = useState('')
  const [wfQ, setWfQ] = useState('')
  const [wfF, setWfF] = useState('')
  const [verQ, setVerQ] = useState('')
  const [ctrlQ, setCtrlQ] = useState('')
  const [riskQ, setRiskQ] = useState('')
  const [regQ, setRegQ] = useState('')
  const [auditQ, setAuditQ] = useState('')
  const [auditSevF, setAuditSevF] = useState('')
  const [auditStatF, setAuditStatF] = useState('')
  const [ackQ, setAckQ] = useState('')
  const [ackF, setAckF] = useState('')
  const [auditScanResults, setAuditScanResults] = useState([])
  const [csvInput, setCsvInput] = useState('')
  const [csvDelim, setCsvDelim] = useState(',')

  const [cName, setCName] = useState('')
  const [cOwner, setCOwner] = useState('')
  const [cDept, setCDept] = useState('IT Security')
  const [cStatus, setCStatus] = useState('Draft')
  const [cDesc, setCDesc] = useState('')
  const [eName, setEName] = useState('')
  const [eOwner, setEOwner] = useState('')
  const [eDept, setEDept] = useState('IT Security')
  const [eStatus, setEStatus] = useState('Draft')
  const [eDesc, setEDesc] = useState('')
  const [eComment, setEComment] = useState('')
  const [ctrlPol, setCtrlPol] = useState('')
  const [ctrlName, setCtrlName] = useState('')
  const [ctrlFreq, setCtrlFreq] = useState('Quarterly')
  const [riskPol, setRiskPol] = useState('')
  const [riskDesc, setRiskDesc] = useState('')
  const [riskSev, setRiskSev] = useState('Medium')
  const [regPol, setRegPol] = useState('')
  const [regFw, setRegFw] = useState('ISO 27001')
  const [regArt, setRegArt] = useState('')
  const [regStat, setRegStat] = useState('Not Assessed')
  const [auditPol, setAuditPol] = useState('')
  const [auditDesc, setAuditDesc] = useState('')
  const [auditDue, setAuditDue] = useState('')
  const [auditSev, setAuditSev] = useState('Medium')
  const [auditStat, setAuditStat] = useState('Open')
  const [ackPol, setAckPol] = useState('')
  const [ackEmp, setAckEmp] = useState('')
  const [ackDept, setAckDept] = useState('IT Security')
  const [ackStat, setAckStat] = useState('Accepted')

  const loadData = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (p && p.policies && p.policies.length) { setData(p); return }
      }
    } catch(e) { console.warn('Load failed:', e) }
    const seeded = seedData()
    setData(seeded)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch(e) {}
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const persist = useCallback((d) => {
    setData(d)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch(e) { console.warn('Persist failed:', e) }
  }, [])

  const alert = (msg, type='info') => {
    setAlertMsg({ msg, type })
    setTimeout(() => setAlertMsg(null), 6000)
  }

  const getPol = (id) => data?.policies.find(p => p.id === id)

  const filteredPolicies = useMemo(() => {
    if (!data) return []
    let list = data.policies
    if (repoQ) { const q = repoQ.toLowerCase(); list = list.filter(p => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)) }
    if (repoF) list = list.filter(p => p.status === repoF)
    return list
  }, [data, repoQ, repoF])

  const filteredWf = useMemo(() => {
    if (!data) return []
    let list = data.workflow
    if (wfQ) { const q = wfQ.toLowerCase(); list = list.filter(w => w.polId.toLowerCase().includes(q) || w.polName.toLowerCase().includes(q) || (w.assignedTo||'').toLowerCase().includes(q)) }
    if (wfF) list = list.filter(w => w.status === wfF)
    return list
  }, [data, wfQ, wfF])

  const filteredVersions = useMemo(() => {
    if (!data) return []
    let list = [...data.versions].sort((a,b)=>new Date(b.date)-new Date(a.date))
    if (verQ) { const q = verQ.toLowerCase(); list = list.filter(v => v.polId.toLowerCase().includes(q) || v.polName.toLowerCase().includes(q) || (v.comment||'').toLowerCase().includes(q)) }
    return list
  }, [data, verQ])

  const filteredCtrl = useMemo(() => {
    if (!data) return []
    let list = data.controls
    if (ctrlQ) { const q = ctrlQ.toLowerCase(); list = list.filter(c => c.mapId.toLowerCase().includes(q) || c.polId.toLowerCase().includes(q) || c.ctrlName.toLowerCase().includes(q)) }
    return list
  }, [data, ctrlQ])

  const filteredRisk = useMemo(() => {
    if (!data) return []
    let list = data.risks
    if (riskQ) { const q = riskQ.toLowerCase(); list = list.filter(r => r.mapId.toLowerCase().includes(q) || r.polId.toLowerCase().includes(q) || r.riskDesc.toLowerCase().includes(q)) }
    return list
  }, [data, riskQ])

  const filteredReg = useMemo(() => {
    if (!data) return []
    let list = data.regs
    if (regQ) { const q = regQ.toLowerCase(); list = list.filter(r => r.mapId.toLowerCase().includes(q) || r.polId.toLowerCase().includes(q) || r.fw.toLowerCase().includes(q)) }
    return list
  }, [data, regQ])

  const filteredAudit = useMemo(() => {
    if (!data) return []
    let list = data.audits
    if (auditQ) { const q = auditQ.toLowerCase(); list = list.filter(a => a.id.toLowerCase().includes(q) || a.finding.toLowerCase().includes(q) || a.polId.toLowerCase().includes(q)) }
    if (auditSevF) list = list.filter(a => a.sev === auditSevF)
    if (auditStatF) list = list.filter(a => a.status === auditStatF)
    return list
  }, [data, auditQ, auditSevF, auditStatF])

  const filteredAck = useMemo(() => {
    if (!data) return []
    let list = data.acks
    if (ackQ) { const q = ackQ.toLowerCase(); list = list.filter(a => a.polId.toLowerCase().includes(q) || a.polName.toLowerCase().includes(q) || a.emp.toLowerCase().includes(q)) }
    if (ackF) list = list.filter(a => a.status === ackF)
    return list
  }, [data, ackQ, ackF])

  const createPolicy = () => {
    if (!cName.trim()) return alert('Policy name required', 'danger')
    if (!cOwner.trim()) return alert('Owner required', 'danger')
    const d = {...data}
    const id = nextId(d.policies, 'POL-', 'id')
    const v = 'v1.0'
    d.policies.push({ id, name:cName.trim(), ver:v, owner:cOwner.trim(), dept:cDept, status:cStatus, desc:cDesc.trim(), updated:today() })
    d.versions.push({ polId:id, polName:cName.trim(), ver:v, change:'Initial', by:cOwner.trim(), date:today(), comment:'Policy created' })
    d.workflow.push({ polId:id, polName:cName.trim(), step:'Author', status:'Pending', assignedTo:cOwner.trim(), lastAction:'Not submitted', updated:today(), history:[] })
    persist(d)
    setShowCreate(false)
    resetCreateForm()
    alert(`✅ ${id} "${cName}" created (${v})`, 'success')
  }

  const resetCreateForm = () => { setCName(''); setCOwner(''); setCDept('IT Security'); setCStatus('Draft'); setCDesc('') }

  const openEdit = (id) => {
    const p = getPol(id)
    if (!p) return
    setEditingId(id)
    setEName(p.name); setEOwner(p.owner); setEDept(p.dept||'IT Security'); setEStatus(p.status); setEDesc(p.desc||''); setEComment('')
  }

  const saveEdit = () => {
    const d = {...data}
    const p = d.policies.find(x => x.id === editingId)
    if (!p) return
    if (!eName.trim()) return alert('Policy name required', 'danger')
    if (!eOwner.trim()) return alert('Owner required', 'danger')
    const oldV = p.ver || 'v1.0'
    const parts = oldV.replace('v','').split('.').map(Number)
    const newV = eStatus === 'Approved' || eStatus === 'Published' ? `v${parts[0]+1}.0` : `v${parts[0]}.${(parts[1]||0)+1}`
    const changed = p.name !== eName.trim() || p.owner !== eOwner.trim() || p.dept !== eDept || p.desc !== eDesc.trim()
    if (changed || eStatus !== p.status) {
      d.versions.push({ polId:editingId, polName:eName.trim(), ver:newV, change: eStatus !== p.status ? `Status: ${p.status}→${eStatus}` : 'Update', by:eOwner.trim(), date:today(), comment:eComment.trim()||'Updated' })
    }
    p.name = eName.trim(); p.owner = eOwner.trim(); p.dept = eDept; p.status = eStatus; p.desc = eDesc.trim(); p.ver = newV; p.updated = today()
    d.versions.forEach(v => { if (v.polId === editingId) v.polName = eName.trim() })
    d.controls.forEach(c => { if (c.polId === editingId) c.polName = eName.trim() })
    d.risks.forEach(r => { if (r.polId === editingId) r.polName = eName.trim() })
    d.regs.forEach(r => { if (r.polId === editingId) r.polName = eName.trim() })
    const wf = d.workflow.find(w => w.polId === editingId)
    if (wf) wf.polName = eName.trim()
    persist(d)
    setEditingId(null)
    alert(`💾 ${editingId} updated → ${newV}`, 'success')
  }

  const publishPolicy = (polId) => {
    const d = {...data}
    const p = d.policies.find(x => x.id === polId)
    if (!p || p.status !== 'Approved') return
    p.status = 'Published'; p.updated = today()
    const parts = (p.ver||'v1.0').replace('v','').split('.').map(Number)
    p.ver = `v${parts[0]+1}.0`
    d.versions.push({ polId, polName: p.name, ver: p.ver, change: 'Published', by: 'System', date: today(), comment: 'Policy published' })
    persist(d)
    setShowPublishConfirm(null)
    alert(`📢 ${polId} Published → ${p.ver}`, 'success')
  }

  const submitWf = (polId) => {
    const d = {...data}
    const p = d.policies.find(x => x.id === polId)
    if (!p) return
    p.status = 'Under Review'; p.updated = today()
    const wf = d.workflow.find(w => w.polId === polId)
    if (wf) { wf.step = 'Author'; wf.status = 'Pending'; wf.assignedTo = p.owner; wf.lastAction = 'Ready'; wf.updated = today() }
    persist(d)
    alert(`📋 ${polId} ready for workflow`, 'info')
  }

  const wfSubmit = (polId) => {
    const d = {...data}
    const wf = d.workflow.find(w => w.polId === polId)
    if (!wf) return
    wf.step = 'Reviewer'; wf.status = 'In Progress'; wf.assignedTo = 'Ahmed Al-Rashid'
    wf.lastAction = 'Submitted by Author'; wf.updated = today()
    if (!wf.history) wf.history = []
    wf.history.push({ step:'Author', by: wf.assignedTo, decision:'Submit', date:today(), comment:'Submitted for review' })
    persist(d)
    alert(`📤 ${polId} → awaiting Reviewer (Ahmed Al-Rashid)`, 'success')
  }

  const openApproval = (polId) => setApprovalPolId(polId)

  const submitApproval = (decision, comment) => {
    const d = {...data}
    const wf = d.workflow.find(w => w.polId === approvalPolId)
    if (!wf) return
    const stepIdx = WF_ORDER[wf.step]
    if (!wf.history) wf.history = []
    if (decision === 'Reject') {
      wf.status = 'Rejected'
      wf.lastAction = `Rejected at ${wf.step}`
      wf.history.push({ step:wf.step, by:wf.assignedTo, decision:'Reject', date:today(), comment:comment||'Rejected' })
      const p = d.policies.find(x => x.id === approvalPolId)
      if (p) { p.status = 'Draft'; p.updated = today() }
      persist(d); setApprovalPolId(null)
      alert(`❌ ${approvalPolId} REJECTED at ${wf.step}`, 'danger'); return
    }
    wf.history.push({ step:wf.step, by:wf.assignedTo, decision:'Approve', date:today(), comment:comment||'Approved' })
    if (stepIdx >= 3) {
      wf.status = 'Approved'; wf.lastAction = 'Fully approved'
      const p = d.policies.find(x => x.id === approvalPolId)
      if (p) {
        p.status = 'Approved'; p.updated = today()
        const parts = (p.ver||'v1.0').replace('v','').split('.').map(Number)
        p.ver = `v${parts[0]+1}.0`
        d.versions.push({ polId:approvalPolId, polName: p.name, ver:p.ver, change:'Approved', by:wf.assignedTo, date:today(), comment:'Policy fully approved' })
      }
      persist(d); setApprovalPolId(null)
      alert(`✅ ${approvalPolId} FULLY APPROVED by all 4 stages!`, 'success')
    } else {
      const next = WF_STEPS[stepIdx + 1]
      const assignees = { 'Reviewer':'Ahmed Al-Rashid', 'Legal':'Sarah Johnson', 'CISO':'Omar Farouk' }
      wf.step = next; wf.assignedTo = assignees[next]||'System'
      wf.lastAction = `${WF_STEPS[stepIdx]} approved → ${next}`; wf.updated = today()
      persist(d); setApprovalPolId(null)
      alert(`✅ ${approvalPolId} approved by ${WF_STEPS[stepIdx]} → now with ${next}`, 'success')
    }
  }

  const viewWfHist = (polId) => setShowWfHist(polId)

  const saveCtrl = () => {
    if (!ctrlName.trim()) return alert('Control name required', 'danger')
    const p = getPol(ctrlPol); if (!p) return
    const d = {...data}
    d.controls.push({ mapId:nextId(d.controls,'CTRL-','mapId'), polId:ctrlPol, polName:p.name, ctrlId:nextId(d.controls,'CTRL-','ctrlId'), ctrlName:ctrlName.trim(), freq:ctrlFreq })
    persist(d); setShowCtrl(false); setCtrlName('')
    alert(`✅ Control "${ctrlName}" → ${ctrlPol}`, 'success')
  }
  const delCtrl = (mid) => { if (!confirm('Delete?')) return; const d={...data}; d.controls=d.controls.filter(c=>c.mapId!==mid); persist(d) }

  const saveRisk = () => {
    if (!riskDesc.trim()) return alert('Risk description required', 'danger')
    const p = getPol(riskPol); if (!p) return
    const d = {...data}
    d.risks.push({ mapId:nextId(d.risks,'RISK-','mapId'), polId:riskPol, polName:p.name, riskId:nextId(d.risks,'RISK-','riskId'), riskDesc:riskDesc.trim(), sev:riskSev })
    persist(d); setShowRisk(false); setRiskDesc('')
    alert(`✅ Risk "${riskDesc}" → ${riskPol}`, 'success')
  }
  const delRisk = (mid) => { if (!confirm('Delete?')) return; const d={...data}; d.risks=d.risks.filter(r=>r.mapId!==mid); persist(d) }

  const saveReg = () => {
    const p = getPol(regPol); if (!p) return
    const d = {...data}
    d.regs.push({ mapId:nextId(d.regs,'REG-','mapId'), polId:regPol, polName:p.name, fw:regFw, art:regArt.trim()||'—', stat:regStat })
    persist(d); setShowReg(false); setRegArt('')
    alert(`✅ Regulation mapped to ${regPol}`, 'success')
  }
  const delReg = (mid) => { if (!confirm('Delete?')) return; const d={...data}; d.regs=d.regs.filter(r=>r.mapId!==mid); persist(d) }

  const saveAudit = () => {
    if (!auditDesc.trim()) return alert('Finding required', 'danger')
    if (!auditDue) return alert('Due date required', 'danger')
    const p = getPol(auditPol); if (!p) return
    const d = {...data}
    d.audits.push({ id:nextId(d.audits,'FIND-','id'), polId:auditPol, polName:p.name, finding:auditDesc.trim(), sev:auditSev, status:auditStat, detected:today(), due:auditDue })
    persist(d); setShowAudit(false); setAuditDesc(''); setAuditDue('')
    alert(`🔍 Finding created for ${auditPol}`, 'success')
  }
  const nextAuditStat = (id) => {
    const d = {...data}; const a = d.audits.find(x => x.id === id)
    if (!a) return; const opts = ['Open','In Progress','Closed']
    a.status = opts[(opts.indexOf(a.status) + 1) % 3]; persist(d)
  }
  const delAudit = (id) => { if (!confirm('Delete?')) return; const d={...data}; d.audits=d.audits.filter(a=>a.id!==id); persist(d) }

  const scanAudit = () => {
    const now = new Date()
    const results = []
    const d = data
    d.audits.filter(a => a.status !== 'Closed' && new Date(a.due) < now).forEach(a => {
      results.push({ type:'danger', msg:`🚨 ${a.id} — ${a.finding} (due ${a.due}) — OVERDUE` })
    })
    d.workflow.filter(w => w.status === 'In Progress' && w.updated && (new Date() - new Date(w.updated))/(1000*60*60*24) > 14).forEach(w => {
      results.push({ type:'warning', msg:`⚠️ ${w.polId} stuck at "${w.step}" for >14 days` })
    })
    d.policies.filter(p => p.status === 'Published' && !d.controls.find(c => c.polId === p.id)).forEach(p => {
      results.push({ type:'warning', msg:`⚠️ ${p.id} Published but NO controls mapped` })
    })
    d.policies.filter(p => p.status === 'Published' && !d.risks.find(r => r.polId === p.id)).forEach(p => {
      results.push({ type:'warning', msg:`⚠️ ${p.id} Published but NO risks mapped` })
    })
    d.regs.filter(r => r.stat === 'Non-Compliant').forEach(r => {
      results.push({ type:'danger', msg:`🔴 ${r.mapId} ${r.polName} non-compliant with ${r.fw}` })
    })
    setAuditScanResults(results)
  }

  const saveAck = () => {
    if (!ackEmp.trim()) return alert('Employee name required', 'danger')
    const p = getPol(ackPol); if (!p) return
    const d = {...data}
    d.acks.push({ polId:ackPol, polName:p.name, emp:ackEmp.trim(), dept:ackDept, status:ackStat, date:ackStat==='Accepted'?today():null })
    persist(d); setShowAck(false); setAckEmp('')
    alert(`✅ ${ackEmp} recorded for ${ackPol}`, 'success')
  }

  const importCSV = () => {
    const raw = csvInput.trim()
    if (!raw) return alert('Paste CSV data first', 'danger')
    const delim = csvDelim === '\\t' ? '\t' : csvDelim
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l)
    let count = 0
    const VALID_STAT = { 'Draft':1,'Under Review':1,'Approved':1,'Published':1,'Archived':1 }
    const DEPTS = ['IT Security','Legal','HR','Finance','Operations','Compliance','Risk Management']
    const d = {...data}
    lines.forEach(line => {
      const parts = line.split(delim).map(p => p.trim().replace(/^"|"$/g,''))
      if (parts.length < 2) return
      const [name, owner, dept, status, ...descParts] = parts
      if (!name || !owner) return
      const id = nextId(d.policies, 'POL-', 'id')
      const v = 'v1.0'
      const s = VALID_STAT[status] ? status : 'Draft'
      const dd = DEPTS.includes(dept) ? dept : 'IT Security'
      d.policies.push({ id, name, ver:v, owner, dept:dd, status:s, desc: descParts.join(', ')||'', updated: today() })
      d.versions.push({ polId:id, polName:name, ver:v, change:'Imported', by:owner, date:today(), comment:'Imported from CSV' })
      d.workflow.push({ polId:id, polName:name, step:'Author', status:s==='Published'?'Approved':'Pending', assignedTo:owner, lastAction:s==='Published'?'Auto-approved':'Not submitted', updated:today(), history:s==='Published'?[{ step:'Author', by:owner, decision:'Approve', date:today(), comment:'Imported as Published' }]:[] })
      count++
    })
    if (!count) return alert('No valid rows. Use: name, owner, dept, status', 'danger')
    persist(d); setShowImport(false)
    alert(`📥 Imported ${count} polic${count>1?'ies':'y'} from CSV`, 'success')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `policy-management-export-${today()}.json`; a.click()
  }

  const resetAllData = () => {
    if (!confirm('⚠️ This will DELETE ALL your data and restore the original 12 seeded policies. Are you sure?')) return
    try { localStorage.removeItem(STORAGE_KEY) } catch(e) {}
    const seeded = seedData()
    setData(seeded)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch(e) {}
    alert('🔄 Data reset to original 12 seeded policies', 'info')
  }

  if (!data) return <div className="h-full flex items-center justify-center"><div className="flex gap-1"><span className="w-2 h-2 rounded-full animate-pulse-dot" style={{background:GOLD,animationDelay:'0s'}}/><span className="w-2 h-2 rounded-full animate-pulse-dot" style={{background:GOLD,animationDelay:'0.15s'}}/><span className="w-2 h-2 rounded-full animate-pulse-dot" style={{background:GOLD,animationDelay:'0.3s'}}/></div></div>

  const now = new Date()

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
              <FileText size={16} style={{ color: GOLD }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: WHITE, fontFamily: "'Inter', sans-serif" }}>Policy Management</h1>
            <span style={{fontSize:10,color:'rgba(206,212,218,0.3)',padding:'2px 8px',borderRadius:12,background:'rgba(212,168,50,0.08)'}}>
              {data.policies.length} policies
            </span>
          </div>
          <p className="text-xs" style={{ color: GOLD }}>Full Lifecycle · Approval Workflow · Version Control · Audit · Acknowledgment</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button onClick={exportData} style={{padding:'4px 10px',borderRadius:8,border:BORDER,background:'rgba(212,168,50,0.06)',color:GOLD,fontSize:9,cursor:'pointer'}} title="Export JSON">📥</button>
          <button onClick={resetAllData} style={{padding:'4px 10px',borderRadius:8,border:BORDER,background:'rgba(220,53,69,0.06)',color:CRIMSON,fontSize:9,cursor:'pointer'}} title="Reset data">🔄</button>
        </div>
      </div>

      {/* Alert */}
      {alertMsg && <div style={{padding:'10px 16px',borderRadius:8,fontSize:11,background:alertMsg.type==='danger'?'rgba(220,53,69,0.06)':alertMsg.type==='warning'?'rgba(212,168,50,0.06)':'rgba(32,201,151,0.06)',border:`1px solid ${alertMsg.type==='danger'?'rgba(220,53,69,0.12)':alertMsg.type==='warning'?'rgba(212,168,50,0.12)':'rgba(32,201,151,0.12)'}`,color:alertMsg.type==='danger'?'#dc3545':alertMsg.type==='warning'?'#d4a832':'#20c997'}}>{alertMsg.msg}</div>}

      {/* Tabs */}
      <div style={{display:'flex',gap:2,background:'rgba(30,30,30,0.6)',padding:3,borderRadius:10,flexWrap:'wrap'}}>
        {TABS.map(tab => {
          const TabIcon = tab.icon
          const counts = { repo:data.policies.length, wf:data.workflow.length, ver:data.versions.length, ctrl:data.controls.length, risk:data.risks.length, reg:data.regs.length, audit:data.audits.length, ack:data.acks.length }
          return <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding:'8px 14px', borderRadius:8, fontSize:10, fontWeight:600, cursor:'pointer', border:'none', whiteSpace:'nowrap',
              background: activeTab===tab.id ? 'rgba(212,168,50,0.1)' : 'transparent',
              color: activeTab===tab.id ? GOLD : SILVER,
              borderBottom: activeTab===tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
            }}>
            <TabIcon size={11} style={{display:'inline',marginRight:4}} />
            {tab.label}
            <span style={{background:GOLD+'20',color:GOLD,padding:'1px 6px',borderRadius:10,fontSize:8,marginLeft:4,fontWeight:700}}>{counts[tab.id]}</span>
          </button>
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'repo' && <PolicyRepository
        repoQ={repoQ} setRepoQ={setRepoQ} repoF={repoF} setRepoF={setRepoF}
        filteredPolicies={filteredPolicies}
        onOpenImport={() => setShowImport(true)}
        onOpenCreate={() => setShowCreate(true)}
        onResetCreateForm={resetCreateForm}
        onEdit={openEdit}
        onSubmitWf={submitWf}
        onSetPublishConfirm={setShowPublishConfirm}
        onViewPolicy={setShowPolicyViewer}
      />}

      {activeTab === 'wf' && <WorkflowApprovals
        wfQ={wfQ} setWfQ={setWfQ} wfF={wfF} setWfF={setWfF}
        filteredWf={filteredWf}
        onWfSubmit={wfSubmit}
        onOpenApproval={openApproval}
        onViewWfHist={viewWfHist}
      />}

      {activeTab === 'ver' && <VersionsHistory
        verQ={verQ} setVerQ={setVerQ}
        filteredVersions={filteredVersions}
      />}

      {activeTab === 'ctrl' && <ControlsMapping
        ctrlQ={ctrlQ} setCtrlQ={setCtrlQ}
        filteredCtrl={filteredCtrl}
        data={data}
        onOpenMapCtrl={() => { setCtrlName(''); setShowCtrl(true) }}
        onSetCtrlPol={setCtrlPol}
        onDeleteCtrl={delCtrl}
      />}

      {activeTab === 'risk' && <RisksMapping
        riskQ={riskQ} setRiskQ={setRiskQ}
        filteredRisk={filteredRisk}
        data={data}
        onOpenMapRisk={() => { setRiskDesc(''); setShowRisk(true) }}
        onSetRiskPol={setRiskPol}
        onDeleteRisk={delRisk}
      />}

      {activeTab === 'reg' && <RegulationsMapping
        regQ={regQ} setRegQ={setRegQ}
        filteredReg={filteredReg}
        data={data}
        onOpenMapReg={() => { setRegArt(''); setShowReg(true) }}
        onSetRegPol={setRegPol}
        onDeleteReg={delReg}
      />}

      {activeTab === 'audit' && <AuditFindings
        auditQ={auditQ} setAuditQ={setAuditQ}
        auditSevF={auditSevF} setAuditSevF={setAuditSevF}
        auditStatF={auditStatF} setAuditStatF={setAuditStatF}
        filteredAudit={filteredAudit}
        auditScanResults={auditScanResults} setAuditScanResults={setAuditScanResults}
        data={data}
        now={now}
        onScanAudit={scanAudit}
        onOpenFinding={() => setShowAudit(true)}
        onSetAuditPol={setAuditPol}
        onSetAuditDesc={setAuditDesc}
        onSetAuditDue={setAuditDue}
        onNextAuditStat={nextAuditStat}
        onDeleteAudit={delAudit}
      />}

      {activeTab === 'ack' && <AcknowledgmentTracking
        ackQ={ackQ} setAckQ={setAckQ} ackF={ackF} setAckF={setAckF}
        filteredAck={filteredAck}
        data={data}
        onOpenRecord={() => setShowAck(true)}
        onSetAckPol={setAckPol}
        onSetAckEmp={setAckEmp}
      />}

      {/* Modals */}
      <PolicyModals
        showCreate={showCreate} onCloseCreate={() => setShowCreate(false)}
        cName={cName} setCName={setCName}
        cOwner={cOwner} setCOwner={setCOwner}
        cDept={cDept} setCDept={setCDept}
        cStatus={cStatus} setCStatus={setCStatus}
        cDesc={cDesc} setCDesc={setCDesc}
        onCreatePolicy={createPolicy}

        editingId={editingId} onCloseEdit={() => setEditingId(null)}
        eName={eName} setEName={setEName}
        eOwner={eOwner} setEOwner={setEOwner}
        eDept={eDept} setEDept={setEDept}
        eStatus={eStatus} setEStatus={setEStatus}
        eDesc={eDesc} setEDesc={setEDesc}
        eComment={eComment} setEComment={setEComment}
        onSaveEdit={saveEdit}

        showPublishConfirm={showPublishConfirm}
        onClosePublish={() => setShowPublishConfirm(null)}
        onConfirmPublish={publishPolicy}

        approvalPolId={approvalPolId}
        onCloseApproval={() => setApprovalPolId(null)}
        data={data}
        onSubmitApproval={submitApproval}

        showWfHist={showWfHist}
        onCloseWfHist={() => setShowWfHist(null)}

        showImport={showImport} onCloseImport={() => setShowImport(false)}
        csvInput={csvInput} setCsvInput={setCsvInput}
        csvDelim={csvDelim} setCsvDelim={setCsvDelim}
        onImportCSV={importCSV}

        showCtrl={showCtrl} onCloseCtrl={() => setShowCtrl(false)}
        ctrlPol={ctrlPol} setCtrlPol={setCtrlPol}
        ctrlName={ctrlName} setCtrlName={setCtrlName}
        ctrlFreq={ctrlFreq} setCtrlFreq={setCtrlFreq}
        onSaveCtrl={saveCtrl}

        showRisk={showRisk} onCloseRisk={() => setShowRisk(false)}
        riskPol={riskPol} setRiskPol={setRiskPol}
        riskDesc={riskDesc} setRiskDesc={setRiskDesc}
        riskSev={riskSev} setRiskSev={setRiskSev}
        onSaveRisk={saveRisk}

        showReg={showReg} onCloseReg={() => setShowReg(false)}
        regPol={regPol} setRegPol={setRegPol}
        regFw={regFw} setRegFw={setRegFw}
        regArt={regArt} setRegArt={setRegArt}
        regStat={regStat} setRegStat={setRegStat}
        onSaveReg={saveReg}

        showAudit={showAudit} onCloseAudit={() => setShowAudit(false)}
        auditPol={auditPol} setAuditPol={setAuditPol}
        auditSev={auditSev} setAuditSev={setAuditSev}
        auditDesc={auditDesc} setAuditDesc={setAuditDesc}
        auditDue={auditDue} setAuditDue={setAuditDue}
        auditStat={auditStat} setAuditStat={setAuditStat}
        onSaveAudit={saveAudit}

        showAck={showAck} onCloseAck={() => setShowAck(false)}
        ackPol={ackPol} setAckPol={setAckPol}
        ackEmp={ackEmp} setAckEmp={setAckEmp}
        ackDept={ackDept} setAckDept={setAckDept}
        ackStat={ackStat} setAckStat={setAckStat}
        onSaveAck={saveAck}

        showPolicyViewer={showPolicyViewer}
        onCloseViewer={() => setShowPolicyViewer(null)}
        getPol={getPol}
      />
    </div>
  )
}
