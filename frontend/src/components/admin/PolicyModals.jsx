import { Save } from 'lucide-react'
import { GOLD, SILVER, WHITE, CRIMSON, EMERALD, BORDER, GRADIENT, nextId } from './PolicyData'

const modalBase = { background:'rgba(20,20,20,0.85)', border:BORDER, color:WHITE, fontSize:11, padding:'7px 10px', borderRadius:6, outline:'none', width:'100%' }
const selectBase = { ...modalBase, cursor:'pointer' }

function Modal({ show, onClose, title, children, wide }) {
  if (!show) return null
  return <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',backdropFilter:'blur(2px)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:'#0a0a0a',borderRadius:14,border:BORDER,width:'90%',maxWidth:wide?700:500,maxHeight:'90vh',overflowY:'auto'}}>
      <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(212,168,50,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 style={{fontSize:14,fontWeight:700,color:WHITE}}>{title}</h3>
        <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'rgba(206,212,218,0.4)',padding:4,lineHeight:1}}>✕</button>
      </div>
      <div style={{padding:22}}>{children}</div>
    </div>
  </div>
}

function FormGroup({ label, children }) {
  return <div style={{display:'flex',flexDirection:'column',gap:3}}>
    <label style={{fontSize:10,fontWeight:600,color:GOLD}}>{label}</label>
    {children}
  </div>
}

export default function PolicyModals({
  // Create
  showCreate, onCloseCreate, cName, setCName, cOwner, setCOwner, cDept, setCDept, cStatus, setCStatus, cDesc, setCDesc, onCreatePolicy,
  // Edit
  editingId, onCloseEdit, eName, setEName, eOwner, setEOwner, eDept, setEDept, eStatus, setEStatus, eDesc, setEDesc, eComment, setEComment, onSaveEdit,
  // Publish
  showPublishConfirm, onClosePublish, onConfirmPublish,
  // Approval
  approvalPolId, onCloseApproval, data, onSubmitApproval,
  // Workflow History
  showWfHist, onCloseWfHist,
  // Import CSV
  showImport, onCloseImport, csvInput, setCsvInput, csvDelim, setCsvDelim, onImportCSV,
  // Control
  showCtrl, onCloseCtrl, ctrlPol, setCtrlPol, ctrlName, setCtrlName, ctrlFreq, setCtrlFreq, onSaveCtrl,
  // Risk
  showRisk, onCloseRisk, riskPol, setRiskPol, riskDesc, setRiskDesc, riskSev, setRiskSev, onSaveRisk,
  // Regulation
  showReg, onCloseReg, regPol, setRegPol, regFw, setRegFw, regArt, setRegArt, regStat, setRegStat, onSaveReg,
  // Audit
  showAudit, onCloseAudit, auditPol, setAuditPol, auditSev, setAuditSev, auditDesc, setAuditDesc, auditDue, setAuditDue, auditStat, setAuditStat, onSaveAudit,
  // Acknowledgment
  showAck, onCloseAck, ackPol, setAckPol, ackEmp, setAckEmp, ackDept, setAckDept, ackStat, setAckStat, onSaveAck,
  // Policy Viewer
  showPolicyViewer, onCloseViewer, getPol,
}) {
  const DEPTS = ['IT Security','Legal','HR','Finance','Operations','Compliance','Risk Management']

  return <>
    {/* Create Policy */}
    <Modal show={showCreate} onClose={onCloseCreate} title="Create New Policy">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormGroup label="Policy Name *"><input value={cName} onChange={e=>setCName(e.target.value)} placeholder="e.g. Access Control Policy" style={modalBase} /></FormGroup>
        <FormGroup label="Owner *"><input value={cOwner} onChange={e=>setCOwner(e.target.value)} placeholder="e.g. John Smith" style={modalBase} /></FormGroup>
        <FormGroup label="Department"><select value={cDept} onChange={e=>setCDept(e.target.value)} style={selectBase}>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select></FormGroup>
        <FormGroup label="Initial Status"><select value={cStatus} onChange={e=>setCStatus(e.target.value)} style={selectBase}><option value="Draft">Draft</option><option value="Under Review">Under Review</option></select></FormGroup>
      </div>
      <div style={{marginTop:8}}><FormGroup label="Description"><textarea value={cDesc} onChange={e=>setCDesc(e.target.value)} rows={3} placeholder="Policy purpose and scope..." style={{...modalBase,resize:'vertical',minHeight:50}} /></FormGroup></div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseCreate} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onCreatePolicy} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Save size={11}/> Create Policy</button>
      </div>
    </Modal>

    {/* Edit Policy */}
    <Modal show={!!editingId} onClose={onCloseEdit} title={`Edit Policy — ${editingId||''}`}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormGroup label="Policy Name *"><input value={eName} onChange={e=>setEName(e.target.value)} style={modalBase} /></FormGroup>
        <FormGroup label="Owner *"><input value={eOwner} onChange={e=>setEOwner(e.target.value)} style={modalBase} /></FormGroup>
        <FormGroup label="Department"><select value={eDept} onChange={e=>setEDept(e.target.value)} style={selectBase}>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select></FormGroup>
        <FormGroup label="Status"><select value={eStatus} onChange={e=>setEStatus(e.target.value)} style={selectBase}>{['Draft','Under Review','Approved','Published','Archived'].map(s => <option key={s} value={s}>{s}</option>)}</select></FormGroup>
      </div>
      <div style={{marginTop:8}}><FormGroup label="Description"><textarea value={eDesc} onChange={e=>setEDesc(e.target.value)} rows={3} style={{...modalBase,resize:'vertical',minHeight:50}} /></FormGroup></div>
      <div style={{marginTop:8}}><FormGroup label="Change Comment (creates new version)"><input value={eComment} onChange={e=>setEComment(e.target.value)} placeholder="e.g. Updated scope and owner" style={modalBase} /></FormGroup></div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseEdit} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onSaveEdit} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Save size={11}/> Save Changes</button>
      </div>
    </Modal>

    {/* Publish Confirm */}
    <Modal show={!!showPublishConfirm} onClose={onClosePublish} title="Publish Policy">
      <p style={{fontSize:12,color:SILVER,marginBottom:12}}>Publishing <strong style={{color:WHITE}}>{showPublishConfirm}</strong> will transition it from <strong style={{color:EMERALD}}>Approved</strong> → <strong style={{color:GOLD}}>Published</strong> with a major version bump.</p>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onClosePublish} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={()=>onConfirmPublish(showPublishConfirm)} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:'rgba(32,201,151,0.1)',border:'1px solid rgba(32,201,151,0.3)',color:EMERALD}}>📢 Confirm Publish</button>
      </div>
    </Modal>

    {/* Approval Action */}
    <Modal show={!!approvalPolId} onClose={onCloseApproval} title="Approval Action">
      {(() => {
        const wf = data.workflow.find(w => w.polId === approvalPolId)
        if (!wf) return null
        return <>
          <p style={{fontSize:12,color:SILVER,marginBottom:10}}><strong style={{color:WHITE}}>{approvalPolId}</strong> — {wf.polName}<br />Step: <strong style={{color:GOLD}}>{wf.step}</strong> · Assigned: {wf.assignedTo}</p>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => onSubmitApproval('Approve','')} className="flex items-center gap-1 px-4 py-2 rounded-lg text-[10px] font-medium" style={{flex:1,background:'rgba(32,201,151,0.1)',border:'1px solid rgba(32,201,151,0.3)',color:EMERALD}}>✅ Approve</button>
            <button onClick={() => onSubmitApproval('Reject','')} className="flex items-center gap-1 px-4 py-2 rounded-lg text-[10px] font-medium" style={{flex:1,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.3)',color:CRIMSON}}>❌ Reject</button>
          </div>
        </>
      })()}
    </Modal>

    {/* Workflow History */}
    <Modal show={!!showWfHist} onClose={onCloseWfHist} title={`History: ${showWfHist||''}`}>
      {(() => {
        const wf = data.workflow.find(w => w.polId === showWfHist)
        if (!wf) return <p style={{color:SILVER,fontSize:11}}>No history</p>
        const hist = wf.history || []
        return <div style={{paddingLeft:18}}>
          {hist.length === 0 && <p style={{color:SILVER,fontSize:11}}>No history</p>}
          {hist.map((h,i) => <div key={i} style={{position:'relative',marginBottom:12,paddingLeft:16,borderLeft:'2px solid rgba(212,168,50,0.15)'}}>
            <div style={{fontSize:9,color:'rgba(206,212,218,0.55)'}}>{h.date}</div>
            <div style={{fontSize:11,fontWeight:600,color:WHITE}}>{h.step}: {h.decision} {h.decision==='Approve'?'✅':h.decision==='Reject'?'❌':'📤'}</div>
            <div style={{fontSize:10,color:SILVER}}>By {h.by}{h.comment?' — "'+h.comment+'"':''}</div>
          </div>)}
        </div>
      })()}
    </Modal>

    {/* Import CSV */}
    <Modal show={showImport} onClose={onCloseImport} title="Import Policies from CSV" wide={true}>
      <p style={{fontSize:10,color:SILVER,marginBottom:8}}>Paste CSV rows (one per line): <code style={{color:GOLD}}>name, owner, dept, status, description</code></p>
      <FormGroup label="CSV Data *">
        <textarea value={csvInput} onChange={e=>setCsvInput(e.target.value)} rows={8} style={{...modalBase,fontFamily:'Consolas,monospace',fontSize:10,resize:'vertical',minHeight:120}} placeholder="Access Control Policy, John Smith, IT Security, Draft, Controls user access" />
      </FormGroup>
      <div style={{marginTop:6}}><FormGroup label="Delimiter">
        <select value={csvDelim} onChange={e=>setCsvDelim(e.target.value)} style={{...selectBase,maxWidth:100}}><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option></select>
      </FormGroup></div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseImport} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onImportCSV} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>📥 Import</button>
      </div>
    </Modal>

    {/* Controls Map */}
    <Modal show={showCtrl} onClose={onCloseCtrl} title="Map Control">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormGroup label="Policy *"><select value={ctrlPol} onChange={e=>setCtrlPol(e.target.value)} style={selectBase}>{data.policies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
        <FormGroup label="Control Name *"><input value={ctrlName} onChange={e=>setCtrlName(e.target.value)} placeholder="e.g. Quarterly Access Review" style={modalBase} /></FormGroup>
        <FormGroup label="Control ID"><input value={nextId(data.controls,'CTRL-','mapId')} readOnly style={{...modalBase,background:'rgba(30,30,30,0.5)',fontFamily:'Consolas,monospace'}} /></FormGroup>
        <FormGroup label="Frequency"><select value={ctrlFreq} onChange={e=>setCtrlFreq(e.target.value)} style={selectBase}><option>Monthly</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></select></FormGroup>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseCtrl} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onSaveCtrl} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
      </div>
    </Modal>

    {/* Risk Map */}
    <Modal show={showRisk} onClose={onCloseRisk} title="Map Risk">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormGroup label="Policy *"><select value={riskPol} onChange={e=>setRiskPol(e.target.value)} style={selectBase}>{data.policies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
        <FormGroup label="Risk Description *"><input value={riskDesc} onChange={e=>setRiskDesc(e.target.value)} placeholder="e.g. Excessive access" style={modalBase} /></FormGroup>
        <FormGroup label="Risk ID"><input value={nextId(data.risks,'RISK-','mapId')} readOnly style={{...modalBase,background:'rgba(30,30,30,0.5)',fontFamily:'Consolas,monospace'}} /></FormGroup>
        <FormGroup label="Severity"><select value={riskSev} onChange={e=>setRiskSev(e.target.value)} style={selectBase}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></FormGroup>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseRisk} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onSaveRisk} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
      </div>
    </Modal>

    {/* Regulation Map */}
    <Modal show={showReg} onClose={onCloseReg} title="Map Regulation">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormGroup label="Policy *"><select value={regPol} onChange={e=>setRegPol(e.target.value)} style={selectBase}>{data.policies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
        <FormGroup label="Framework *"><select value={regFw} onChange={e=>setRegFw(e.target.value)} style={selectBase}><option>ISO 27001</option><option>CBE</option><option>PCI DSS</option><option>SOC 2</option><option>GDPR</option><option>NIST CSF</option></select></FormGroup>
        <FormGroup label="Article / Clause"><input value={regArt} onChange={e=>setRegArt(e.target.value)} placeholder="e.g. A.9.1.2" style={modalBase} /></FormGroup>
        <FormGroup label="Status"><select value={regStat} onChange={e=>setRegStat(e.target.value)} style={selectBase}><option>Compliant</option><option>Partially Compliant</option><option>Non-Compliant</option><option>Not Assessed</option></select></FormGroup>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseReg} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onSaveReg} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
      </div>
    </Modal>

    {/* Audit Finding */}
    <Modal show={showAudit} onClose={onCloseAudit} title="New Audit Finding">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormGroup label="Policy *"><select value={auditPol} onChange={e=>setAuditPol(e.target.value)} style={selectBase}>{data.policies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
        <FormGroup label="Severity"><select value={auditSev} onChange={e=>setAuditSev(e.target.value)} style={selectBase}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></FormGroup>
      </div>
      <div style={{marginTop:8}}><FormGroup label="Finding *"><textarea value={auditDesc} onChange={e=>setAuditDesc(e.target.value)} rows={3} placeholder="Describe finding..." style={{...modalBase,resize:'vertical',minHeight:50}} /></FormGroup></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
        <FormGroup label="Due Date *"><input type="date" value={auditDue} onChange={e=>setAuditDue(e.target.value)} style={modalBase} /></FormGroup>
        <FormGroup label="Status"><select value={auditStat} onChange={e=>setAuditStat(e.target.value)} style={selectBase}><option>Open</option><option>In Progress</option><option>Closed</option></select></FormGroup>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseAudit} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onSaveAudit} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
      </div>
    </Modal>

    {/* Acknowledgment */}
    <Modal show={showAck} onClose={onCloseAck} title="Record Acknowledgment">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormGroup label="Policy *"><select value={ackPol} onChange={e=>setAckPol(e.target.value)} style={selectBase}>{data.policies.filter(p => p.status==='Published'||p.status==='Approved').map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
        <FormGroup label="Employee *"><input value={ackEmp} onChange={e=>setAckEmp(e.target.value)} placeholder="e.g. Sarah Johnson" style={modalBase} /></FormGroup>
        <FormGroup label="Department"><select value={ackDept} onChange={e=>setAckDept(e.target.value)} style={selectBase}>{['IT Security','Legal','HR','Finance','Operations','Compliance','Risk Management','Engineering'].map(d => <option key={d} value={d}>{d}</option>)}</select></FormGroup>
        <FormGroup label="Status"><select value={ackStat} onChange={e=>setAckStat(e.target.value)} style={selectBase}><option>Accepted</option><option>Pending</option></select></FormGroup>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
        <button onClick={onCloseAck} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
        <button onClick={onSaveAck} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Record</button>
      </div>
    </Modal>

    {/* Policy Viewer */}
    <Modal show={!!showPolicyViewer} onClose={onCloseViewer} title={showPolicyViewer ? (()=>{const p=getPol(showPolicyViewer); return p ? `${p.id} — ${p.name}` : 'Policy'})() : 'Policy'} wide={true}>
      {(() => {
        const p = showPolicyViewer ? getPol(showPolicyViewer) : null
        if (!p) return <p style={{color:SILVER,fontSize:11}}>Policy not found</p>
        return <div>
          <div style={{display:'flex',gap:10,marginBottom:14,padding:'10px 14px',borderRadius:10,border:BORDER,background:'rgba(212,168,50,0.03)'}}>
            {[
              {label:'Version',value:p.ver||'v1.0',color:GOLD},
              {label:'Owner',value:p.owner,color:WHITE},
              {label:'Department',value:p.dept||'—',color:SILVER},
              {label:'Status',value:p.status,color:p.status==='Published'?EMERALD:p.status==='Approved'?'#20c997':p.status==='Draft'?'#868e96':p.status==='Under Review'?'#fd7e14':GOLD},
              {label:'Updated',value:p.updated||'—',color:SILVER},
            ].map((m,i) => <div key={i} style={{textAlign:'center'}}>
              <div style={{fontSize:8,textTransform:'uppercase',letterSpacing:0.5,color:'rgba(206,212,218,0.55)',marginBottom:2}}>{m.label}</div>
              <div style={{fontSize:11,fontWeight:700,fontFamily:'monospace',color:m.color}}>{m.value}</div>
            </div>)}
          </div>
          {p.desc && <div style={{marginBottom:12,padding:'8px 14px',borderRadius:8,background:'rgba(212,168,50,0.04)',border:BORDER}}>
            <span style={{fontSize:9,color:GOLD,textTransform:'uppercase',letterSpacing:0.5}}>Description</span>
            <p style={{fontSize:11,color:SILVER,marginTop:4}}>{p.desc}</p>
          </div>}
          <div style={{maxHeight:'50vh',overflowY:'auto',padding:'14px 18px',borderRadius:10,border:BORDER,background:'rgba(5,5,5,0.6)',whiteSpace:'pre-wrap',fontSize:11,lineHeight:1.6,color:SILVER,fontFamily:'Inter,sans-serif'}}>
            {p.content || <span style={{color:'rgba(206,212,218,0.3)'}}>No content available for this policy. Upload or edit the policy to add content.</span>}
          </div>
        </div>
      })()}
    </Modal>
  </>
}
