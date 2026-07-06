import { Plus, Upload, Search } from 'lucide-react'
import { GOLD, SILVER, WHITE, CRIMSON, EMERALD, BORDER, GRADIENT } from './PolicyData'
import { StatusBadge, SevBadge, ApprovalChain } from './StatusBadge'
const modalBase = { background:'rgba(20,20,20,0.85)', border:BORDER, color:WHITE, fontSize:11, padding:'7px 10px', borderRadius:6, outline:'none', width:'100%' }
const selectBase = { ...modalBase, cursor:'pointer' }

export function PolicyRepository({ repoQ, setRepoQ, repoF, setRepoF, filteredPolicies, onOpenImport, onOpenCreate, onResetCreateForm, onEdit, onSubmitWf, onSetPublishConfirm, onViewPolicy }) {
  return <div className="animate-fade-in">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <input placeholder="Search ID, name, owner..." value={repoQ} onChange={e=>setRepoQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
        <select value={repoF} onChange={e=>setRepoF(e.target.value)} style={{...selectBase,width:120,fontSize:10}}>
          <option value="">All Statuses</option>
          {['Draft','Under Review','Approved','Published','Archived'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{display:'flex',gap:6}}>
        <button onClick={onOpenImport} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:'rgba(212,168,50,0.06)',border:BORDER,color:GOLD}}><Upload size={11}/> Import CSV</button>
        <button onClick={()=>{onResetCreateForm();onOpenCreate()}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> New Policy</button>
      </div>
    </div>
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['ID','Policy Name','v','Owner','Dept','Status','Updated',''].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredPolicies.map(p => <tr key={p.id} style={{borderBottom:'1px solid rgba(212,168,50,0.04)'}}>
            <td style={{padding:'8px 10px'}}><strong style={{fontFamily:'Consolas,monospace',color:GOLD}}>{p.id}</strong></td>
            <td style={{padding:'8px 10px'}}><strong style={{color:GOLD,cursor:'pointer',textDecoration:'underline',textDecorationColor:'rgba(212,168,50,0.3)'}} onClick={()=>onViewPolicy(p.id)} title="Click to view full policy text">{p.name}</strong><br /><span style={{fontSize:9,color:SILVER}}>{(p.desc||'').slice(0,50)}</span></td>
            <td style={{padding:'8px 10px'}}><span style={{fontFamily:'monospace',fontWeight:700,fontSize:10,color:GOLD}}>{p.ver||'v1.0'}</span></td>
            <td style={{padding:'8px 10px',color:SILVER}}>{p.owner}</td>
            <td style={{padding:'8px 10px',color:SILVER}}>{p.dept||'—'}</td>
            <td style={{padding:'8px 10px'}}><StatusBadge s={p.status} /></td>
            <td style={{padding:'8px 10px',fontSize:9,color:SILVER}}>{p.updated||'—'}</td>
            <td style={{padding:'8px 10px'}}>
              <button onClick={()=>onEdit(p.id)} style={{padding:'3px 7px',borderRadius:6,border:`1px solid rgba(212,168,50,0.15)`,background:'transparent',color:SILVER,fontSize:9,cursor:'pointer'}}>✏️</button>
              {(p.status==='Draft'||p.status==='Under Review') && <button onClick={()=>{onSetPublishConfirm(null);onSubmitWf(p.id)}} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(212,168,50,0.25)',background:'rgba(212,168,50,0.1)',color:GOLD,fontSize:9,cursor:'pointer',marginLeft:3}}>🚀</button>}
              {p.status==='Approved' && <button onClick={()=>onSetPublishConfirm(p.id)} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(32,201,151,0.3)',background:'rgba(32,201,151,0.1)',color:EMERALD,fontSize:9,cursor:'pointer',marginLeft:3}}>📢 Publish</button>}
            </td>
          </tr>)}
          {filteredPolicies.length===0 && <tr><td colSpan={8} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No policies match your search</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
export function WorkflowApprovals({ wfQ, setWfQ, wfF, setWfF, filteredWf, onWfSubmit, onOpenApproval, onViewWfHist }) {
  return <div className="animate-fade-in">
    <div style={{display:'flex',gap:6,marginBottom:10}}>
      <input placeholder="Search..." value={wfQ} onChange={e=>setWfQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
      <select value={wfF} onChange={e=>setWfF(e.target.value)} style={{...selectBase,width:140,fontSize:10}}>
        <option value="">All</option><option>Pending</option><option>In Progress</option><option>Approved</option><option>Rejected</option>
      </select>
    </div>
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['Policy','Chain','Status','Assigned','Last Action',''].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredWf.map(w => {
            const isPending = w.status==='Pending' && w.step==='Author'
            return <tr key={w.polId} style={{borderBottom:'1px solid rgba(212,168,50,0.04)',background:isPending?'rgba(220,53,69,0.03)':'transparent'}}>
              <td style={{padding:'8px 10px'}}><span style={{fontFamily:'Consolas,monospace',color:GOLD}}>{w.polId}</span><br /><span style={{fontSize:9,color:SILVER}}>{w.polName}</span></td>
              <td style={{padding:'8px 10px'}}><ApprovalChain wf={w} /></td>
              <td style={{padding:'8px 10px'}}><StatusBadge s={w.status==='Approved'?'Approved':w.status==='Rejected'?'Rejected':w.status==='In Progress'?'Under Review':'Draft'} /></td>
              <td style={{padding:'8px 10px',fontSize:10,color:SILVER}}>{w.assignedTo||'—'}</td>
              <td style={{padding:'8px 10px',fontSize:10,color:SILVER}}>{w.lastAction||'—'}</td>
              <td style={{padding:'8px 10px'}}>
                {isPending && <button onClick={()=>onWfSubmit(w.polId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(212,168,50,0.1)',border:'1px solid rgba(212,168,50,0.25)',color:GOLD,fontSize:9,cursor:'pointer'}}>📤 Submit</button>}
                {w.status==='In Progress' && <button onClick={()=>onOpenApproval(w.polId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(212,168,50,0.1)',border:'1px solid rgba(212,168,50,0.25)',color:GOLD,fontSize:9,cursor:'pointer'}}>✍️ Review</button>}
                <button onClick={()=>onViewWfHist(w.polId)} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(212,168,50,0.15)',background:'transparent',color:SILVER,fontSize:9,cursor:'pointer',marginLeft:3}}>📜</button>
              </td>
            </tr>
          })}
          {filteredWf.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No workflows</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
export function VersionsHistory({ verQ, setVerQ, filteredVersions }) {
  return <div className="animate-fade-in">
    <input placeholder="Search by policy ID, name, comment..." value={verQ} onChange={e=>setVerQ(e.target.value)} style={{...modalBase,width:300,fontSize:10,marginBottom:10}} />
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['Policy','Name','Version','Change','By','Date','Comment'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredVersions.map((v,i) => <tr key={i} style={{borderBottom:'1px solid rgba(212,168,50,0.04)'}}>
            <td style={{padding:'8px 10px',fontFamily:'Consolas,monospace',color:GOLD}}>{v.polId}</td>
            <td style={{padding:'8px 10px',color:WHITE}}>{v.polName}</td>
            <td style={{padding:'8px 10px'}}><span style={{fontFamily:'monospace',fontWeight:700,fontSize:10,color:GOLD}}>{v.ver}</span></td>
            <td style={{padding:'8px 10px',color:SILVER}}>{v.change||'Update'}</td>
            <td style={{padding:'8px 10px',color:SILVER}}>{v.by}</td>
            <td style={{padding:'8px 10px',fontSize:9,color:SILVER}}>{v.date}</td>
            <td style={{padding:'8px 10px',fontSize:9,color:SILVER}}>{v.comment||'—'}</td>
          </tr>)}
          {filteredVersions.length===0 && <tr><td colSpan={7} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No version history</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
export function ControlsMapping({ ctrlQ, setCtrlQ, filteredCtrl, data, onOpenMapCtrl, onSetCtrlPol, onDeleteCtrl }) {
  return <div className="animate-fade-in">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <input placeholder="Search..." value={ctrlQ} onChange={e=>setCtrlQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
      <button onClick={()=>{onSetCtrlPol(data.policies[0]?.id||'');onOpenMapCtrl()}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Map Control</button>
    </div>
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['Map ID','Policy','Control ID','Control Name','Frequency',''].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredCtrl.map(c => <tr key={c.mapId} style={{borderBottom:'1px solid rgba(212,168,50,0.04)'}}>
            <td style={{padding:'8px 10px',fontFamily:'Consolas,monospace',color:GOLD}}>{c.mapId}</td>
            <td style={{padding:'8px 10px'}}><span style={{fontFamily:'Consolas,monospace',color:GOLD}}>{c.polId}</span> <span style={{color:SILVER}}>{c.polName}</span></td>
            <td style={{padding:'8px 10px',fontFamily:'Consolas,monospace',color:GOLD}}>{c.ctrlId}</td>
            <td style={{padding:'8px 10px',color:WHITE}}>{c.ctrlName}</td>
            <td style={{padding:'8px 10px'}}><StatusBadge s={c.freq} /></td>
            <td style={{padding:'8px 10px'}}><button onClick={()=>onDeleteCtrl(c.mapId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer'}}>🗑️</button></td>
          </tr>)}
          {filteredCtrl.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No controls mapped</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
export function RisksMapping({ riskQ, setRiskQ, filteredRisk, data, onOpenMapRisk, onSetRiskPol, onDeleteRisk }) {
  return <div className="animate-fade-in">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <input placeholder="Search..." value={riskQ} onChange={e=>setRiskQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
      <button onClick={()=>{onSetRiskPol(data.policies[0]?.id||'');onOpenMapRisk()}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Map Risk</button>
    </div>
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['Map ID','Policy','Risk ID','Risk Description','Severity',''].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredRisk.map(r => <tr key={r.mapId} style={{borderBottom:'1px solid rgba(212,168,50,0.04)'}}>
            <td style={{padding:'8px 10px',fontFamily:'Consolas,monospace',color:GOLD}}>{r.mapId}</td>
            <td style={{padding:'8px 10px'}}><span style={{fontFamily:'Consolas,monospace',color:GOLD}}>{r.polId}</span> <span style={{color:SILVER}}>{r.polName}</span></td>
            <td style={{padding:'8px 10px',fontFamily:'Consolas,monospace',color:GOLD}}>{r.riskId}</td>
            <td style={{padding:'8px 10px',color:WHITE}}>{r.riskDesc}</td>
            <td style={{padding:'8px 10px'}}><SevBadge s={r.sev} /></td>
            <td style={{padding:'8px 10px'}}><button onClick={()=>onDeleteRisk(r.mapId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer'}}>🗑️</button></td>
          </tr>)}
          {filteredRisk.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No risks mapped</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
export function RegulationsMapping({ regQ, setRegQ, filteredReg, data, onOpenMapReg, onSetRegPol, onDeleteReg }) {
  return <div className="animate-fade-in">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <input placeholder="Search..." value={regQ} onChange={e=>setRegQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
      <button onClick={()=>{onSetRegPol(data.policies[0]?.id||'');onOpenMapReg()}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Map Regulation</button>
    </div>
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['Map ID','Policy','Framework','Article','Status',''].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredReg.map(r => <tr key={r.mapId} style={{borderBottom:'1px solid rgba(212,168,50,0.04)',background:r.stat==='Non-Compliant'?'rgba(220,53,69,0.03)':'transparent'}}>
            <td style={{padding:'8px 10px',fontFamily:'Consolas,monospace',color:GOLD}}>{r.mapId}</td>
            <td style={{padding:'8px 10px'}}><span style={{fontFamily:'Consolas,monospace',color:GOLD}}>{r.polId}</span> <span style={{color:SILVER}}>{r.polName}</span></td>
            <td style={{padding:'8px 10px',color:WHITE,fontWeight:600}}>{r.fw}</td>
            <td style={{padding:'8px 10px',fontSize:10,color:SILVER}}>{r.art||'—'}</td>
            <td style={{padding:'8px 10px'}}><StatusBadge s={r.stat} /></td>
            <td style={{padding:'8px 10px'}}><button onClick={()=>onDeleteReg(r.mapId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer'}}>🗑️</button></td>
          </tr>)}
          {filteredReg.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No regulations mapped</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
export function AuditFindings({ auditQ, setAuditQ, auditSevF, setAuditSevF, auditStatF, setAuditStatF, filteredAudit, auditScanResults, setAuditScanResults, data, now, onScanAudit, onOpenFinding, onSetAuditPol, onSetAuditDesc, onSetAuditDue, onNextAuditStat, onDeleteAudit }) {
  return <div className="animate-fade-in">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <input placeholder="Search..." value={auditQ} onChange={e=>setAuditQ(e.target.value)} style={{...modalBase,width:160,fontSize:10}} />
        <select value={auditSevF} onChange={e=>setAuditSevF(e.target.value)} style={{...selectBase,width:100,fontSize:10}}>
          <option value="">All Severities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select value={auditStatF} onChange={e=>setAuditStatF(e.target.value)} style={{...selectBase,width:110,fontSize:10}}>
          <option value="">All Statuses</option><option>Open</option><option>In Progress</option><option>Closed</option>
        </select>
      </div>
      <div style={{display:'flex',gap:6}}>
        <button onClick={onScanAudit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:'rgba(212,168,50,0.06)',border:BORDER,color:GOLD}}><Search size={11}/> Scan</button>
        <button onClick={()=>{onSetAuditPol(data.policies[0]?.id||'');onSetAuditDesc('');onSetAuditDue('');onOpenFinding()}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Finding</button>
      </div>
    </div>
    {auditScanResults.length > 0 && <div style={{marginBottom:10}}>
      {auditScanResults.map((r,i) => <div key={i} style={{padding:'8px 14px',borderRadius:8,fontSize:10,marginBottom:4,background:r.type==='danger'?'rgba(220,53,69,0.06)':'rgba(253,126,14,0.06)',border:`1px solid ${r.type==='danger'?'rgba(220,53,69,0.15)':'rgba(253,126,14,0.15)'}`,color:r.type==='danger'?'#dc3545':'#fd7e14'}}>{r.msg}</div>)}
      <button onClick={()=>setAuditScanResults([])} style={{fontSize:9,color:SILVER,background:'none',border:'none',cursor:'pointer',padding:'4px 0'}}>Clear results</button>
    </div>}
    {auditScanResults.length === 0 && <div style={{marginBottom:10,padding:'8px 14px',borderRadius:8,fontSize:10,background:'rgba(32,201,151,0.06)',border:'1px solid rgba(32,201,151,0.15)',color:EMERALD}}>✅ Click "Scan" to run audit checks</div>}
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['Finding ID','Policy','Finding','Severity','Status','Detected','Due',''].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredAudit.map(a => {
            const od = a.status!=='Closed' && new Date(a.due) < now
            return <tr key={a.id} style={{borderBottom:'1px solid rgba(212,168,50,0.04)',background:od?'rgba(220,53,69,0.03)':'transparent'}}>
              <td style={{padding:'8px 10px',fontFamily:'Consolas,monospace',color:GOLD}}>{a.id}</td>
              <td style={{padding:'8px 10px'}}><span style={{fontFamily:'Consolas,monospace',color:GOLD}}>{a.polId}</span> <span style={{color:SILVER}}>{a.polName}</span></td>
              <td style={{padding:'8px 10px',color:WHITE}}>{a.finding}</td>
              <td style={{padding:'8px 10px'}}><SevBadge s={a.sev} /></td>
              <td style={{padding:'8px 10px'}}><StatusBadge s={a.status} />{od && <span style={{display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:3,fontSize:8,fontWeight:600,background:'rgba(220,53,69,0.12)',color:'#dc3545',marginLeft:4}}>OVERDUE</span>}</td>
              <td style={{padding:'8px 10px',fontSize:9,color:SILVER}}>{a.detected}</td>
              <td style={{padding:'8px 10px',fontSize:9,color:od?CRIMSON:SILVER,fontWeight:od?600:400}}>{a.due}</td>
              <td style={{padding:'8px 10px'}}>
                <button onClick={()=>onNextAuditStat(a.id)} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(212,168,50,0.15)',background:'transparent',color:SILVER,fontSize:9,cursor:'pointer'}}>⏭</button>
                <button onClick={()=>onDeleteAudit(a.id)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer',marginLeft:3}}>🗑️</button>
              </td>
            </tr>
          })}
          {filteredAudit.length===0 && <tr><td colSpan={8} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No findings</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
export function AcknowledgmentTracking({ ackQ, setAckQ, ackF, setAckF, filteredAck, data, onOpenRecord, onSetAckPol, onSetAckEmp }) {
  return <div className="animate-fade-in">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <input placeholder="Search..." value={ackQ} onChange={e=>setAckQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
        <select value={ackF} onChange={e=>setAckF(e.target.value)} style={{...selectBase,width:110,fontSize:10}}>
          <option value="">All</option><option>Accepted</option><option>Pending</option>
        </select>
      </div>
      <button onClick={()=>{onSetAckPol(data.policies.find(p=>p.status==='Published'||p.status==='Approved')?.id||data.policies[0]?.id||'');onSetAckEmp('');onOpenRecord()}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Record</button>
    </div>
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{borderBottom:'1px solid rgba(212,168,50,0.08)'}}>
          {['Policy','Employee','Department','Status','Accepted Date'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:GOLD,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {filteredAck.map((a,i) => <tr key={i} style={{borderBottom:'1px solid rgba(212,168,50,0.04)',background:a.status==='Pending'?'rgba(220,53,69,0.03)':'transparent'}}>
            <td style={{padding:'8px 10px'}}><span style={{fontFamily:'Consolas,monospace',color:GOLD}}>{a.polId}</span> <span style={{color:SILVER}}>{a.polName}</span></td>
            <td style={{padding:'8px 10px',color:WHITE}}>{a.emp}</td>
            <td style={{padding:'8px 10px',color:SILVER}}>{a.dept}</td>
            <td style={{padding:'8px 10px'}}><StatusBadge s={a.status} /></td>
            <td style={{padding:'8px 10px',fontSize:10,color:SILVER}}>{a.date||'—'}</td>
          </tr>)}
          {filteredAck.length===0 && <tr><td colSpan={5} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No acknowledgments</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
