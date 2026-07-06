import { WF_STEPS } from './PolicyData'

export function StatusBadge({ s }) {
  const colors = { 'Draft':'#868e96','Under Review':'#fd7e14','Approved':'#20c997','Published':'#d4a832','Archived':'#6c757d','Rejected':'#dc3545','Open':'#dc3545','Closed':'#20c997','In Progress':'#fd7e14','Compliant':'#20c997','Partially Compliant':'#fd7e14','Non-Compliant':'#dc3545','Not Assessed':'#868e96' }
  const c = colors[s]||'#868e96'
  return <span style={{display:'inline-block',padding:'2px 9px',borderRadius:12,fontSize:9,fontWeight:600,background:c+'15',color:c}}>{s}</span>
}

export function SevBadge({ s }) {
  const c = (s==='Critical'||s==='High')?'#dc3545':s==='Medium'?'#fd7e14':'#20c997'
  return <span style={{display:'inline-block',padding:'2px 9px',borderRadius:12,fontSize:9,fontWeight:600,background:c+'15',color:c}}>{s}</span>
}

export function ApprovalChain({ wf }) {
  return <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
    {WF_STEPS.map((s,i)=>{
      const h = wf.history?wf.history.filter(x=>x.step===s):[]
      const done = h.length>0 && h[h.length-1].decision==='Approve'
      const rej = h.length>0 && h[h.length-1].decision==='Reject'
      const cur = s===wf.step && wf.status==='In Progress'
      if (rej) return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'rgba(220,53,69,0.12)',color:'#dc3545'}}>✕ {s}</span>
      if (done) return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'rgba(32,201,151,0.12)',color:'#20c997'}}>✓ {s}</span>
      if (cur) return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'rgba(212,168,50,0.12)',border:'1px solid #d4a832',color:'#d4a832'}}>⏳ {s}</span>
      return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'rgba(206,212,218,0.04)',opacity:0.5,color:'rgba(206,212,218,0.60)'}}>{s}</span>
    }).reduce((acc,el,i,arr)=>i<arr.length-1?[...acc,el,<span key={`s${i}`} style={{color:'rgba(206,212,218,0.30)',fontSize:10}}>→</span>]:[...acc,el],[])}
  </div>
}
