import { useState, useEffect, useMemo, useCallback } from 'react'
import { FileText, CheckCircle, Clock, User, Shield, AlertTriangle, Search, Download, Upload, Plus, X, Edit3, Trash2, Save, RefreshCw, Eye, Activity, Zap, ChevronDown, Bell, Flag, BarChart3, Link, FileSearch, Target } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const AMBER = '#fd7e14'
const EMERALD = '#20c997'
const DARK_BG = 'rgba(5,5,5,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'
const STORAGE_KEY = 'wadjet-polman-data'
const WF_STEPS = ['Author','Reviewer','Legal','CISO']
const WF_ORDER = { Author:0, Reviewer:1, Legal:2, CISO:3 }
const today = () => new Date().toISOString().slice(0,10)
const timeStr = () => new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
const pid = i => 'POL-'+String(i).padStart(3,'0')
const daysAgo = n => { let d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10) }
const nextId = (arr, prefix, field) => {
  if (!arr.length) return prefix+'001'
  const nums = arr.map(a => { const v = a[field]||''; return parseInt(v.replace(prefix,''))||0 }).filter(n => n > 0)
  return prefix + String(Math.max(0, ...nums) + 1).padStart(3,'0')
}

function seedData() {
  const pols = [
    {id:pid(1),name:'Access Control Policy',ver:'v2.1',owner:'John Smith',dept:'IT Security',status:'Published',desc:'Controls user access to systems',updated:daysAgo(5),content:`[THE BANK LOGO / NAME]
INFORMATION SECURITY MANAGEMENT SYSTEM (ISMS)
Access Control Policy

DOCUMENT CONTROL & APPROVALS

DOCUMENT REVISION HISTORY

1.  Purpose & Scope
This policy defines the mandatory requirements for establishing, implementing, and maintaining access controls within [The Bank]. The primary objective is to prevent unauthorized access to banking information assets, infrastructure, and the Customer Data Environment (CDE), while adopting Zero Trust principles and Defense-in-Depth strategies.

This policy applies to all on-premises, hybrid, and cloud-hosted systems processing or storing Bank or customer data, and governs all employees, contractors, third-party vendors, and any entity accessing the Bank's systems, networks, applications, and cloud environments.
Compliance is maintained in strict alignment with ISO/IEC 27001:2022, PCI-DSS v4.0, and Central Bank of Egypt (CBE) regulations.

2.  Policy Statement & Core Principles
2.1.  Least Privilege & Need-to-Know
Access rights are strictly limited to authorized personnel based on documented business needs.
The principle of Least Privilege shall be enforced across all systems.
Access must adhere to the "Need-to-Know" principle.
All access rights shall be governed by a formally approved Access Control Matrix (ACM).

2.2.  Separation of Duties & Dual Control (Maker-Checker)
Strict Separation of Duties (SoD) and Dual Control / Maker-Checker must be enforced for all critical operations and financial transactions.

2.3.  Role-Based Access Control (RBAC)
RBAC shall be deployed across all systems.
Permissions are bound to job roles/functions, not individuals.
Changes to role templates require approval from the line manager and Information Security Department.

3.  Account Provisioning and Management
3.1.  Onboarding & Provisioning
Access requests follow the Joiner-Mover-Leaver (JML) lifecycle via approved IAM tools.
Mandatory prerequisites: Cybersecurity awareness training + formal acknowledgment of security policies.

3.2.  User Identifications (IDs)
Unique, non-shared Employee IDs are mandatory.
Shared, generic, or group accounts are strictly prohibited for interactive access.
Service and machine accounts must follow least privilege and be assigned to system owners.

3.3.  Formal Access Approval Process
All access requires approval from System Owner and Information Security Department.

3.4.  Deprovisioning & Immediate Revocation (CBE & PCI Aligned)
Termination/Suspension (Leaver phase): Access rights must be revoked immediately, and under no circumstances shall revocation exceed two (2) hours from the official termination time. In case of technical limitations, manual revocation must be completed within 2 hours with documented justification and CISO notification.
Role Changes (Mover phase): Unneeded access must be removed within the same business day.
Inactive accounts: Disabled after 90 days of non-use; permanently deleted/archived after 180 days.
Pre-Deletion Notification: The IT Operations Department must notify the employee's Line Manager and HR at least fifteen (15) calendar days prior to permanent deletion of any dormant account, to confirm the account is no longer required.
Reactivation of disabled accounts requires manager approval + multi-factor identity verification.

3.5.  Temporary, Emergency, and Service Account Management
Temporary access must have explicit expiration dates and automatic revocation.
Emergency "Break-Glass" accounts shall be monitored in real-time with immediate alerts.
Just-In-Time (JIT) access is encouraged for privileged operations where technically feasible.

3.6.  Vendor and Third-Party Access Management
Vendors receive unique IDs with time-bound access, least privilege, and continuous monitoring.
Access is revoked immediately upon contract end.

4.  Identification & Authentication Standards
4.1.  Multi-Factor Authentication (MFA)
MFA is mandatory for all access to corporate systems, production environments, cloud platforms, and CDE (internal or remote).
Remote and administrative access must enforce MFA without bypass capability.
Factors: Something you know + Something you have or Something you are.

4.2.  Password Complexity Requirements
The Bank enforces the following Active Directory rules:

4.3.  Invalid Password Lockouts
Lockout after 6 consecutive invalid attempts.
Lockout duration: Minimum 30 minutes or manual reset by authorized administrator.

5.  Privileged Access Management (PAM)
Privileged users must use dedicated admin accounts.
All privileged credentials managed in a central Password Vault with automated rotation. Privileged account passwords must be rotated at least every sixty (60) days, or immediately upon suspected compromise or personnel change. In the event of a Password Vault outage, emergency access procedures must be invoked, documented, and reported to the CISO within four (4) hours.
Real-time session monitoring and recording for all privileged sessions.
Administrative actions logged to SIEM.

6.  Access Reviews and Audits
Standard & CDE access: Quarterly review.
Privileged access: Monthly review.
Formal recertification by Department Managers and System Owners.
Records retained for 5 years.

7.  Remote Access & Perimeter Security
7.1.  Remote Access Control
Remote access restricted to business-justified cases and must use MFA + encrypted VPN (IPSec or TLS 1.3) + Bastion Hosts.

7.2.  Device Restrictions
Only corporate-managed devices are allowed; BYOD is strictly prohibited. All corporate endpoints must be enrolled in the Bank's Mobile Device Management (MDM) / Endpoint Management platform and comply with current EDR, patch, and configuration baseline requirements. Refer to the Endpoint Security Policy for detailed technical standards.

7.3.  Automated Session Locks
Standard systems: 15 minutes inactivity.
High-risk systems: 5 minutes inactivity.
Re-authentication required to unlock.

8.  In-Scope Asset Categorization
Access controls apply to all components within the Bank's infrastructure ecosystem, categorized as follows:

Organizational Networks: Internal LANs, segmented production VLANs, and external DMZs.
Applications & Banking Platforms: Core banking systems, financial processing nodes, API gateways.
Operating Systems (OS): Server environments (Linux, Windows Server) and end-user endpoints.
Data Stores & CDE: Relational databases, unstructured storage, and credit card data segments.
Cloud Service Providers (CSP): Cloud infrastructure consoles, orchestrators, and subscription-level identity providers. Cloud environments must enforce centralized Federated Identity Management, Privileged Identity Management (PIM), Conditional Access Policies, and Continuous Access Evaluation (CAE).
Key Management Systems (KMS): Hardware Security Modules (HSMs), tokenization tables, encryption keys.
Network Security Devices: Physical and virtual Firewalls, Routers, and Network Security Groups (NSGs).
Logging Infrastructures: Log data, audit trails, and SIEM repositories.

9.  Logging, Monitoring, and SIEM Integration

The Bank mandates the continuous logging, centralization, and auditing of all identity and access management operations across the ecosystem. Audit log records must capture:

Successful user and system logins.
Failed login attempts and authentication anomalies.
Account creation, onboarding, and configuration actions.
Account deletion, deprovisioning, and termination events.
Password changes, resets, and self-service credential modifications.
MFA enrollment, synchronization, validation, and step-up authentication events.
Privilege changes, role reassignments, and group membership updates.
Administrative commands and superuser transactions within production assets.
Access control policy modifications and changes to the Access Control Matrix.

All security log repositories must be protected against unauthorized modification using WORM configurations, digital signatures, and central aggregation.
The enterprise SIEM platform must perform real-time correlation, automatically generating high-priority alerts upon detecting anomalous behaviors or unauthorized privilege elevations.

10.  Responsibilities

11.  Policy Exceptions
Any deviation from the controls in this policy must follow the formal Exception Management Process.
Exceptions must be formally documented with a justified risk assessment, approved by the Chief Information Security Officer (CISO), and tracked with a defined expiration date not exceeding one year.

12.  Compliance and Monitoring
The Cyber Security Compliance team shall continuously verify alignment through automated technical audits, configuration reviews, and access log inspections.
Non-compliance will be reported directly to senior risk committees and must be remediated immediately.

13.  Enforcement & Policy Violations
Any employee found to have violated this policy (e.g., credential sharing, bypassing MFA, unauthorized remote connections) will be subject to disciplinary action, up to and including immediate termination of employment.
Incidents related to access violations will be handled according to the Bank's Security Incident Management Process.

14.  Policy Review
This policy shall be formally reviewed at minimum annually.
Ad-hoc reviews must be executed immediately whenever significant changes occur across regulatory frameworks, organizational structures, technology stacks, or the threat landscape.
All modifications must follow the Bank's formal document management and executive approval process prior to distribution.

15.  Related Documents
Identity and Access Management (IAM) Standard Operating Procedure
Privileged Access Management (PAM) Standard
Password Policy & Technical Standard
Third-Party Security Risk Management Policy
Security Incident Management Process Document
Information Security Policy
Information Classification Policy
Acceptable Use Policy
Endpoint Security Policy

16.  References
ISO/IEC 27001:2022 - Information security, cybersecurity and privacy protection
ISO/IEC 27002:2022 - Information security controls guidance
PCI Security Standards Council - PCI DSS Version 4.0
Central Bank of Egypt (CBE) Cybersecurity Framework
Central Bank of Egypt (CBE) Information Security Regulations for Banks
NIST SP 800-63B - Digital Identity Guidelines: Authentication and Lifecycle Management
The Bank Password Standard
The Bank Identity and Access Management (IAM) Standard

17.  Compliance Mapping Table`},
    {id:pid(2),name:'Data Protection Policy',ver:'v1.2',owner:'Sarah Johnson',dept:'Legal',status:'Published',desc:'Personal and sensitive data protection',updated:daysAgo(12)},
    {id:pid(3),name:'Information Security Policy',ver:'v3.0',owner:'Ahmed Al-Rashid',dept:'IT Security',status:'Published',desc:'Information security framework',updated:daysAgo(3)},
    {id:pid(4),name:'Acceptable Use Policy',ver:'v1.0',owner:'John Smith',dept:'IT Security',status:'Draft',desc:'Acceptable use of IT resources',updated:daysAgo(1)},
    {id:pid(5),name:'Business Continuity Policy',ver:'v2.0',owner:'Layla Hassan',dept:'Operations',status:'Under Review',desc:'BCP and disaster recovery',updated:daysAgo(2)},
    {id:pid(6),name:'Third Party Risk Policy',ver:'v1.1',owner:'Omar Farouk',dept:'Risk Management',status:'Under Review',desc:'Vendor risk management',updated:daysAgo(0)},
    {id:pid(7),name:'Incident Response Policy',ver:'v2.3',owner:'Ahmed Al-Rashid',dept:'IT Security',status:'Published',desc:'Incident response procedures',updated:daysAgo(7)},
    {id:pid(8),name:'Password Policy',ver:'v1.0',owner:'John Smith',dept:'IT Security',status:'Approved',desc:'Password complexity and rotation',updated:daysAgo(10)},
    {id:pid(9),name:'Record Management Policy',ver:'v1.0',owner:'Sarah Johnson',dept:'Legal',status:'Draft',desc:'Records retention and disposal',updated:daysAgo(4)},
    {id:pid(10),name:'Anti-Bribery Policy',ver:'v1.2',owner:'Layla Hassan',dept:'Compliance',status:'Published',desc:'Anti-bribery compliance',updated:daysAgo(20)},
    {id:pid(11),name:'Remote Work Policy',ver:'v1.0',owner:'Omar Farouk',dept:'HR',status:'Draft',desc:'Remote and hybrid work guidelines',updated:daysAgo(1)},
    {id:pid(12),name:'Change Management Policy',ver:'v2.0',owner:'Ahmed Al-Rashid',dept:'IT Security',status:'Archived',desc:'IT change management',updated:daysAgo(60)},
  ]
  const versions = pols.map(p => {
    const vs = []
    const [mj,mn] = (p.ver||'v1.0').replace('v','').split('.').map(Number)
    vs.push({polId:p.id,polName:p.name,ver:p.ver,change:'Initial',by:p.owner,date:daysAgo(30),comment:'Policy created'})
    if (mj>1||mn>0) vs.push({polId:p.id,polName:p.name,ver:`v${mj}.${Math.max(0,mn-1)}`,change:'Update',by:p.owner,date:daysAgo(45),comment:'Previous version'})
    return vs
  }).flat()
  const workflow = [
    {polId:pid(5),polName:'Business Continuity Policy',step:'Reviewer',status:'In Progress',assignedTo:'Ahmed Al-Rashid',lastAction:'Pending review',updated:daysAgo(1),history:[{step:'Author',by:'Layla Hassan',decision:'Submit',date:daysAgo(3),comment:'Ready for review'}]},
    {polId:pid(6),polName:'Third Party Risk Policy',step:'Legal',status:'In Progress',assignedTo:'Sarah Johnson',lastAction:'Reviewer approved',updated:daysAgo(1),history:[{step:'Author',by:'Omar Farouk',decision:'Submit',date:daysAgo(5),comment:'Initial'},{step:'Reviewer',by:'Ahmed Al-Rashid',decision:'Approve',date:daysAgo(2),comment:'Forwarding to Legal'}]},
    {polId:pid(4),polName:'Acceptable Use Policy',step:'Author',status:'Pending',assignedTo:'John Smith',lastAction:'Not submitted',updated:daysAgo(1),history:[]},
    {polId:pid(9),polName:'Record Management Policy',step:'Author',status:'Pending',assignedTo:'Sarah Johnson',lastAction:'Not submitted',updated:daysAgo(4),history:[]},
    {polId:pid(11),polName:'Remote Work Policy',step:'Author',status:'Pending',assignedTo:'Omar Farouk',lastAction:'Not submitted',updated:daysAgo(1),history:[]},
  ]
  const controls = [
    {mapId:'CTRL-001',polId:pid(1),polName:'Access Control Policy',ctrlId:'CTRL-001',ctrlName:'Quarterly Access Review',freq:'Quarterly'},
    {mapId:'CTRL-002',polId:pid(1),polName:'Access Control Policy',ctrlId:'CTRL-002',ctrlName:'Privileged Access Management',freq:'Monthly'},
    {mapId:'CTRL-003',polId:pid(2),polName:'Data Protection Policy',ctrlId:'CTRL-003',ctrlName:'Data Classification Review',freq:'Annual'},
    {mapId:'CTRL-004',polId:pid(3),polName:'Information Security Policy',ctrlId:'CTRL-004',ctrlName:'Security Awareness Training',freq:'Quarterly'},
    {mapId:'CTRL-005',polId:pid(7),polName:'Incident Response Policy',ctrlId:'CTRL-005',ctrlName:'Tabletop Exercise',freq:'Semi-Annual'},
    {mapId:'CTRL-006',polId:pid(8),polName:'Password Policy',ctrlId:'CTRL-006',ctrlName:'Password Audit',freq:'Monthly'},
  ]
  const risks = [
    {mapId:'RISK-001',polId:pid(1),polName:'Access Control Policy',riskId:'RISK-001',riskDesc:'Excessive access privileges',sev:'High'},
    {mapId:'RISK-002',polId:pid(1),polName:'Access Control Policy',riskId:'RISK-002',riskDesc:'Unauthorized system access',sev:'Critical'},
    {mapId:'RISK-003',polId:pid(2),polName:'Data Protection Policy',riskId:'RISK-003',riskDesc:'Data leakage via insiders',sev:'High'},
    {mapId:'RISK-004',polId:pid(2),polName:'Data Protection Policy',riskId:'RISK-004',riskDesc:'Personal data breach',sev:'Critical'},
    {mapId:'RISK-005',polId:pid(3),polName:'Information Security Policy',riskId:'RISK-005',riskDesc:'Security control gaps',sev:'High'},
    {mapId:'RISK-006',polId:pid(7),polName:'Incident Response Policy',riskId:'RISK-006',riskDesc:'Delayed incident containment',sev:'Medium'},
    {mapId:'RISK-007',polId:pid(8),polName:'Password Policy',riskId:'RISK-007',riskDesc:'Weak password compromise',sev:'High'},
  ]
  const regs = [
    {mapId:'REG-001',polId:pid(1),polName:'Access Control Policy',fw:'ISO 27001',art:'A.9.1.2',stat:'Compliant'},
    {mapId:'REG-002',polId:pid(2),polName:'Data Protection Policy',fw:'GDPR',art:'Art. 32',stat:'Compliant'},
    {mapId:'REG-003',polId:pid(2),polName:'Data Protection Policy',fw:'CBE',art:'ECD-2.1',stat:'Partially Compliant'},
    {mapId:'REG-004',polId:pid(3),polName:'Information Security Policy',fw:'ISO 27001',art:'A.5.1',stat:'Compliant'},
    {mapId:'REG-005',polId:pid(7),polName:'Incident Response Policy',fw:'PCI DSS',art:'Req 12.10',stat:'Compliant'},
    {mapId:'REG-006',polId:pid(10),polName:'Anti-Bribery Policy',fw:'CBE',art:'GCF-1',stat:'Compliant'},
    {mapId:'REG-007',polId:pid(8),polName:'Password Policy',fw:'ISO 27001',art:'A.9.2.4',stat:'Non-Compliant'},
  ]
  const audits = [
    {id:'FIND-001',polId:pid(1),polName:'Access Control Policy',finding:'Q2 access review not performed',sev:'High',status:'Open',detected:daysAgo(14),due:daysAgo(7)},
    {id:'FIND-002',polId:pid(5),polName:'Business Continuity Policy',finding:'BCP drill not conducted in 12mo',sev:'Medium',status:'In Progress',detected:daysAgo(30),due:daysAgo(10)},
    {id:'FIND-003',polId:pid(2),polName:'Data Protection Policy',finding:'Missing classification labels on shared drives',sev:'High',status:'Open',detected:daysAgo(7),due:daysAgo(14)},
    {id:'FIND-004',polId:pid(8),polName:'Password Policy',finding:'Password rotation not enforced legacy systems',sev:'Critical',status:'Open',detected:daysAgo(3),due:daysAgo(21)},
    {id:'FIND-005',polId:pid(3),polName:'Information Security Policy',finding:'Awareness training below 70%',sev:'Medium',status:'Closed',detected:daysAgo(60),due:daysAgo(30)},
  ]
  const acks = [
    {polId:pid(1),polName:'Access Control Policy',emp:'Ahmed Al-Rashid',dept:'IT Security',status:'Accepted',date:daysAgo(10)},
    {polId:pid(1),polName:'Access Control Policy',emp:'Layla Hassan',dept:'Operations',status:'Accepted',date:daysAgo(8)},
    {polId:pid(2),polName:'Data Protection Policy',emp:'Sarah Johnson',dept:'Legal',status:'Accepted',date:daysAgo(15)},
    {polId:pid(3),polName:'Information Security Policy',emp:'Ahmed Al-Rashid',dept:'IT Security',status:'Accepted',date:daysAgo(5)},
    {polId:pid(3),polName:'Information Security Policy',emp:'Omar Farouk',dept:'Risk Management',status:'Pending',date:null},
    {polId:pid(7),polName:'Incident Response Policy',emp:'John Smith',dept:'IT Security',status:'Accepted',date:daysAgo(12)},
    {polId:pid(10),polName:'Anti-Bribery Policy',emp:'Layla Hassan',dept:'Compliance',status:'Accepted',date:daysAgo(20)},
  ]
  return { policies:pols, versions, workflow, controls, risks, regs, audits, acks }
}

const TABS = [
  { id:'repo', label:'Repository', icon:FileText },
  { id:'wf', label:'Approvals', icon:CheckCircle },
  { id:'ver', label:'Versions', icon:Clock },
  { id:'ctrl', label:'Controls', icon:Shield },
  { id:'risk', label:'Risks', icon:AlertTriangle },
  { id:'reg', label:'Regulations', icon:Flag },
  { id:'audit', label:'Audit', icon:Search },
  { id:'ack', label:'Acknowledgment', icon:User },
]

function sb(s) {
  const m = { 'Draft':'','Under Review':'','Approved':'','Published':'','Archived':'','Rejected':'','Open':'','Closed':'','In Progress':'','Compliant':'','Partially Compliant':'','Non-Compliant':'','Not Assessed':'' }
  const colors = { 'Draft':'#868e96','Under Review':'#fd7e14','Approved':'#20c997','Published':'#d4a832','Archived':'#6c757d','Rejected':'#dc3545','Open':'#dc3545','Closed':'#20c997','In Progress':'#fd7e14','Compliant':'#20c997','Partially Compliant':'#fd7e14','Non-Compliant':'#dc3545','Not Assessed':'#868e96' }
  return `<span style="display:inline-block;padding:2px 9px;border-radius:12px;font-size:9px;font-weight:600;background:${colors[s]||'#868e96'}15;color:${colors[s]||'#868e96'}">${s}</span>`
}

function StatusBadge({ s }) {
  const colors = { 'Draft':'#868e96','Under Review':'#fd7e14','Approved':'#20c997','Published':'#d4a832','Archived':'#6c757d','Rejected':'#dc3545','Open':'#dc3545','Closed':'#20c997','In Progress':'#fd7e14','Compliant':'#20c997','Partially Compliant':'#fd7e14','Non-Compliant':'#dc3545','Not Assessed':'#868e96' }
  const c = colors[s]||'#868e96'
  return <span style={{display:'inline-block',padding:'2px 9px',borderRadius:12,fontSize:9,fontWeight:600,background:c+'15',color:c}}>{s}</span>
}

function SevBadge({ s }) {
  const c = (s==='Critical'||s==='High')?'#dc3545':s==='Medium'?'#fd7e14':'#20c997'
  return <span style={{display:'inline-block',padding:'2px 9px',borderRadius:12,fontSize:9,fontWeight:600,background:c+'15',color:c}}>{s}</span>
}

function ApprovalChain({ wf }) {
  return <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
    {WF_STEPS.map((s,i)=>{
      const h = wf.history?wf.history.filter(x=>x.step===s):[]
      const done = h.length>0 && h[h.length-1].decision==='Approve'
      const rej = h.length>0 && h[h.length-1].decision==='Reject'
      const cur = s===wf.step && wf.status==='In Progress'
      if (rej) return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'#f8d7da',color:'#721c24'}}>✕ {s}</span>
      if (done) return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'#d4edda',color:'#155724'}}>✓ {s}</span>
      if (cur) return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'#fff3cd',border:'1px solid #d4a832',color:'#856404'}}>⏳ {s}</span>
      return <span key={s} style={{padding:'3px 8px',borderRadius:5,fontSize:9,background:'#f7f8fa',opacity:0.5,color:'#5a5a7a'}}>{s}</span>
    }).reduce((acc,el,i,arr)=>i<arr.length-1?[...acc,el,<span key={`s${i}`} style={{color:'#d0d3da',fontSize:10}}>→</span>]:[...acc,el],[])}
  </div>
}

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
  const [showTimeline, setShowTimeline] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(null)
  const [showPolicyViewer, setShowPolicyViewer] = useState(null)

  // Search/filter states
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


  // Form states
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

  // CRUD operations
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

  // Workflow
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

  // Controls CRUD
  const saveCtrl = () => {
    if (!ctrlName.trim()) return alert('Control name required', 'danger')
    const p = getPol(ctrlPol); if (!p) return
    const d = {...data}
    d.controls.push({ mapId:nextId(d.controls,'CTRL-','mapId'), polId:ctrlPol, polName:p.name, ctrlId:nextId(d.controls,'CTRL-','ctrlId'), ctrlName:ctrlName.trim(), freq:ctrlFreq })
    persist(d); setShowCtrl(false); setCtrlName('')
    alert(`✅ Control "${ctrlName}" → ${ctrlPol}`, 'success')
  }
  const delCtrl = (mid) => { if (!confirm('Delete?')) return; const d={...data}; d.controls=d.controls.filter(c=>c.mapId!==mid); persist(d) }

  // Risks CRUD
  const saveRisk = () => {
    if (!riskDesc.trim()) return alert('Risk description required', 'danger')
    const p = getPol(riskPol); if (!p) return
    const d = {...data}
    d.risks.push({ mapId:nextId(d.risks,'RISK-','mapId'), polId:riskPol, polName:p.name, riskId:nextId(d.risks,'RISK-','riskId'), riskDesc:riskDesc.trim(), sev:riskSev })
    persist(d); setShowRisk(false); setRiskDesc('')
    alert(`✅ Risk "${riskDesc}" → ${riskPol}`, 'success')
  }
  const delRisk = (mid) => { if (!confirm('Delete?')) return; const d={...data}; d.risks=d.risks.filter(r=>r.mapId!==mid); persist(d) }

  // Regulations CRUD
  const saveReg = () => {
    const p = getPol(regPol); if (!p) return
    const d = {...data}
    d.regs.push({ mapId:nextId(d.regs,'REG-','mapId'), polId:regPol, polName:p.name, fw:regFw, art:regArt.trim()||'—', stat:regStat })
    persist(d); setShowReg(false); setRegArt('')
    alert(`✅ Regulation mapped to ${regPol}`, 'success')
  }
  const delReg = (mid) => { if (!confirm('Delete?')) return; const d={...data}; d.regs=d.regs.filter(r=>r.mapId!==mid); persist(d) }

  // Audit CRUD
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

  // Acknowledgment
  const saveAck = () => {
    if (!ackEmp.trim()) return alert('Employee name required', 'danger')
    const p = getPol(ackPol); if (!p) return
    const d = {...data}
    d.acks.push({ polId:ackPol, polName:p.name, emp:ackEmp.trim(), dept:ackDept, status:ackStat, date:ackStat==='Accepted'?today():null })
    persist(d); setShowAck(false); setAckEmp('')
    alert(`✅ ${ackEmp} recorded for ${ackPol}`, 'success')
  }

  // Import CSV
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

  // Export
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

  const Modal = ({ show, onClose, title, children, wide }) => show ? <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',backdropFilter:'blur(2px)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:'#0a0a0a',borderRadius:14,border:BORDER,width:'90%',maxWidth:wide?700:500,maxHeight:'90vh',overflowY:'auto'}}>
      <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(212,168,50,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 style={{fontSize:14,fontWeight:700,color:WHITE}}>{title}</h3>
        <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'rgba(206,212,218,0.4)',padding:4,lineHeight:1}}>✕</button>
      </div>
      <div style={{padding:22}}>{children}</div>
    </div>
  </div> : null

  const FormGroup = ({ label, children }) => <div style={{display:'flex',flexDirection:'column',gap:3}}>
    <label style={{fontSize:10,fontWeight:600,color:GOLD}}>{label}</label>
    {children}
  </div>

  const modalBase = { background:'rgba(20,20,20,0.85)', border:BORDER, color:WHITE, fontSize:11, padding:'7px 10px', borderRadius:6, outline:'none', width:'100%' }
  const selectBase = {...modalBase, cursor:'pointer'}
  const textareaBase = {...modalBase, resize:'vertical', minHeight:50, fontFamily:'Consolas,monospace'}

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
      {alertMsg && <div style={{padding:'10px 16px',borderRadius:8,fontSize:11,background:alertMsg.type==='danger'?'#fff5f5':alertMsg.type==='warning'?'#fffcf0':'#f0faf0',border:`1px solid ${alertMsg.type==='danger'?'#f8d7da':alertMsg.type==='warning'?'#fff3cd':'#d4edda'}`,color:alertMsg.type==='danger'?'#721c24':alertMsg.type==='warning'?'#856404':'#155724'}}>{alertMsg.msg}</div>}

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

      {/* ──── REPOSITORY ──── */}
      {activeTab === 'repo' && <div className="animate-fade-in">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input placeholder="Search ID, name, owner..." value={repoQ} onChange={e=>setRepoQ(e.target.value)}
              style={{...modalBase,width:200,fontSize:10}} />
            <select value={repoF} onChange={e=>setRepoF(e.target.value)} style={{...selectBase,width:120,fontSize:10}}>
              <option value="">All Statuses</option>
              {['Draft','Under Review','Approved','Published','Archived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setShowImport(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:'rgba(212,168,50,0.06)',border:BORDER,color:GOLD}}><Upload size={11}/> Import CSV</button>
            <button onClick={()=>{resetCreateForm();setShowCreate(true)}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> New Policy</button>
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
                <td style={{padding:'8px 10px'}}><strong style={{color:GOLD,cursor:'pointer',textDecoration:'underline',textDecorationColor:'rgba(212,168,50,0.3)'}} onClick={()=>setShowPolicyViewer(p.id)} title="Click to view full policy text">{p.name}</strong><br /><span style={{fontSize:9,color:SILVER}}>{(p.desc||'').slice(0,50)}</span></td>
                <td style={{padding:'8px 10px'}}><span style={{fontFamily:'monospace',fontWeight:700,fontSize:10,color:GOLD}}>{p.ver||'v1.0'}</span></td>
                <td style={{padding:'8px 10px',color:SILVER}}>{p.owner}</td>
                <td style={{padding:'8px 10px',color:SILVER}}>{p.dept||'—'}</td>
                <td style={{padding:'8px 10px'}}><StatusBadge s={p.status} /></td>
                <td style={{padding:'8px 10px',fontSize:9,color:SILVER}}>{p.updated||'—'}</td>
                <td style={{padding:'8px 10px'}}>
                  <button onClick={()=>openEdit(p.id)} style={{padding:'3px 7px',borderRadius:6,border:`1px solid rgba(212,168,50,0.15)`,background:'transparent',color:SILVER,fontSize:9,cursor:'pointer'}}>✏️</button>
                  {(p.status==='Draft'||p.status==='Under Review') && <button onClick={()=>{setShowPublishConfirm(null);submitWf(p.id)}} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(212,168,50,0.25)',background:'rgba(212,168,50,0.1)',color:GOLD,fontSize:9,cursor:'pointer',marginLeft:3}}>🚀</button>}
                  {p.status==='Approved' && <button onClick={()=>setShowPublishConfirm(p.id)} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(32,201,151,0.3)',background:'rgba(32,201,151,0.1)',color:EMERALD,fontSize:9,cursor:'pointer',marginLeft:3}}>📢 Publish</button>}
                </td>
              </tr>)}
              {filteredPolicies.length===0 && <tr><td colSpan={8} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No policies match your search</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ──── APPROVALS ──── */}
      {activeTab === 'wf' && <div className="animate-fade-in">
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
                    {isPending && <button onClick={()=>wfSubmit(w.polId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(212,168,50,0.1)',border:'1px solid rgba(212,168,50,0.25)',color:GOLD,fontSize:9,cursor:'pointer'}}>📤 Submit</button>}
                    {w.status==='In Progress' && <button onClick={()=>openApproval(w.polId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(212,168,50,0.1)',border:'1px solid rgba(212,168,50,0.25)',color:GOLD,fontSize:9,cursor:'pointer'}}>✍️ Review</button>}
                    <button onClick={()=>viewWfHist(w.polId)} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(212,168,50,0.15)',background:'transparent',color:SILVER,fontSize:9,cursor:'pointer',marginLeft:3}}>📜</button>
                  </td>
                </tr>
              })}
              {filteredWf.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No workflows</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ──── VERSIONS ──── */}
      {activeTab === 'ver' && <div className="animate-fade-in">
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
      </div>}

      {/* ──── CONTROLS ──── */}
      {activeTab === 'ctrl' && <div className="animate-fade-in">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <input placeholder="Search..." value={ctrlQ} onChange={e=>setCtrlQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
          <button onClick={()=>{setCtrlPol(data.policies[0]?.id||'');setCtrlName('');setShowCtrl(true)}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Map Control</button>
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
                <td style={{padding:'8px 10px'}}><button onClick={()=>delCtrl(c.mapId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer'}}>🗑️</button></td>
              </tr>)}
              {filteredCtrl.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No controls mapped</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ──── RISKS ──── */}
      {activeTab === 'risk' && <div className="animate-fade-in">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <input placeholder="Search..." value={riskQ} onChange={e=>setRiskQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
          <button onClick={()=>{setRiskPol(data.policies[0]?.id||'');setRiskDesc('');setShowRisk(true)}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Map Risk</button>
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
                <td style={{padding:'8px 10px'}}><button onClick={()=>delRisk(r.mapId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer'}}>🗑️</button></td>
              </tr>)}
              {filteredRisk.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No risks mapped</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ──── REGULATIONS ──── */}
      {activeTab === 'reg' && <div className="animate-fade-in">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <input placeholder="Search..." value={regQ} onChange={e=>setRegQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
          <button onClick={()=>{setRegPol(data.policies[0]?.id||'');setRegArt('');setShowReg(true)}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Map Regulation</button>
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
                <td style={{padding:'8px 10px'}}><button onClick={()=>delReg(r.mapId)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer'}}>🗑️</button></td>
              </tr>)}
              {filteredReg.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No regulations mapped</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ──── AUDIT ──── */}
      {activeTab === 'audit' && <div className="animate-fade-in">
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
            <button onClick={scanAudit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:'rgba(212,168,50,0.06)',border:BORDER,color:GOLD}}><Search size={11}/> Scan</button>
            <button onClick={()=>{setAuditPol(data.policies[0]?.id||'');setAuditDesc('');setAuditDue('');setShowAudit(true)}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Finding</button>
          </div>
        </div>

        {/* Scan results */}
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
                  <td style={{padding:'8px 10px'}}><StatusBadge s={a.status} />{od && <span style={{display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:3,fontSize:8,fontWeight:600,background:'#f8d7da',color:'#721c24',marginLeft:4}}>OVERDUE</span>}</td>
                  <td style={{padding:'8px 10px',fontSize:9,color:SILVER}}>{a.detected}</td>
                  <td style={{padding:'8px 10px',fontSize:9,color:od?CRIMSON:SILVER,fontWeight:od?600:400}}>{a.due}</td>
                  <td style={{padding:'8px 10px'}}>
                    <button onClick={()=>nextAuditStat(a.id)} style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(212,168,50,0.15)',background:'transparent',color:SILVER,fontSize:9,cursor:'pointer'}}>⏭</button>
                    <button onClick={()=>delAudit(a.id)} style={{padding:'3px 7px',borderRadius:6,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.2)',color:CRIMSON,fontSize:9,cursor:'pointer',marginLeft:3}}>🗑️</button>
                  </td>
                </tr>
              })}
              {filteredAudit.length===0 && <tr><td colSpan={8} style={{textAlign:'center',padding:28,color:SILVER,fontSize:11}}>No findings</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ──── ACKNOWLEDGMENT ──── */}
      {activeTab === 'ack' && <div className="animate-fade-in">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input placeholder="Search..." value={ackQ} onChange={e=>setAckQ(e.target.value)} style={{...modalBase,width:200,fontSize:10}} />
            <select value={ackF} onChange={e=>setAckF(e.target.value)} style={{...selectBase,width:110,fontSize:10}}>
              <option value="">All</option><option>Accepted</option><option>Pending</option>
            </select>
          </div>
          <button onClick={()=>{setAckPol(data.policies.find(p=>p.status==='Published'||p.status==='Approved')?.id||data.policies[0]?.id||'');setAckEmp('');setShowAck(true)}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Plus size={11}/> Record</button>
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
      </div>}

      {/* ──── MODALS ──── */}

      {/* Create Policy */}
      <Modal show={showCreate} onClose={()=>setShowCreate(false)} title="Create New Policy">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormGroup label="Policy Name *"><input value={cName} onChange={e=>setCName(e.target.value)} placeholder="e.g. Access Control Policy" style={modalBase} /></FormGroup>
          <FormGroup label="Owner *"><input value={cOwner} onChange={e=>setCOwner(e.target.value)} placeholder="e.g. John Smith" style={modalBase} /></FormGroup>
          <FormGroup label="Department"><select value={cDept} onChange={e=>setCDept(e.target.value)} style={selectBase}>{['IT Security','Legal','HR','Finance','Operations','Compliance','Risk Management'].map(d => <option key={d} value={d}>{d}</option>)}</select></FormGroup>
          <FormGroup label="Initial Status"><select value={cStatus} onChange={e=>setCStatus(e.target.value)} style={selectBase}><option value="Draft">Draft</option><option value="Under Review">Under Review</option></select></FormGroup>
        </div>
        <div style={{marginTop:8}}><FormGroup label="Description"><textarea value={cDesc} onChange={e=>setCDesc(e.target.value)} rows={3} placeholder="Policy purpose and scope..." style={{...modalBase,resize:'vertical',minHeight:50}} /></FormGroup></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setShowCreate(false)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={createPolicy} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Save size={11}/> Create Policy</button>
        </div>
      </Modal>

      {/* Edit Policy */}
      <Modal show={!!editingId} onClose={()=>setEditingId(null)} title={`Edit Policy — ${editingId||''}`}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormGroup label="Policy Name *"><input value={eName} onChange={e=>setEName(e.target.value)} style={modalBase} /></FormGroup>
          <FormGroup label="Owner *"><input value={eOwner} onChange={e=>setEOwner(e.target.value)} style={modalBase} /></FormGroup>
          <FormGroup label="Department"><select value={eDept} onChange={e=>setEDept(e.target.value)} style={selectBase}>{['IT Security','Legal','HR','Finance','Operations','Compliance','Risk Management'].map(d => <option key={d} value={d}>{d}</option>)}</select></FormGroup>
          <FormGroup label="Status"><select value={eStatus} onChange={e=>setEStatus(e.target.value)} style={selectBase}>{['Draft','Under Review','Approved','Published','Archived'].map(s => <option key={s} value={s}>{s}</option>)}</select></FormGroup>
        </div>
        <div style={{marginTop:8}}><FormGroup label="Description"><textarea value={eDesc} onChange={e=>setEDesc(e.target.value)} rows={3} style={{...modalBase,resize:'vertical',minHeight:50}} /></FormGroup></div>
        <div style={{marginTop:8}}><FormGroup label="Change Comment (creates new version)"><input value={eComment} onChange={e=>setEComment(e.target.value)} placeholder="e.g. Updated scope and owner" style={modalBase} /></FormGroup></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setEditingId(null)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}><Save size={11}/> Save Changes</button>
        </div>
      </Modal>

      {/* Publish Confirm */}
      <Modal show={!!showPublishConfirm} onClose={()=>setShowPublishConfirm(null)} title="Publish Policy" wide={false}>
        <p style={{fontSize:12,color:SILVER,marginBottom:12}}>Publishing <strong style={{color:WHITE}}>{showPublishConfirm}</strong> will transition it from <strong style={{color:EMERALD}}>Approved</strong> → <strong style={{color:GOLD}}>Published</strong> with a major version bump.</p>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setShowPublishConfirm(null)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={()=>showPublishConfirm && publishPolicy(showPublishConfirm)} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:'rgba(32,201,151,0.1)',border:'1px solid rgba(32,201,151,0.3)',color:EMERALD}}>📢 Confirm Publish</button>
        </div>
      </Modal>

      {/* Approval Action */}
      <Modal show={!!approvalPolId} onClose={()=>setApprovalPolId(null)} title="Approval Action">
        {(() => {
          const wf = data.workflow.find(w => w.polId === approvalPolId)
          if (!wf) return null
          return <>
            <p style={{fontSize:12,color:SILVER,marginBottom:10}}><strong style={{color:WHITE}}>{approvalPolId}</strong> — {wf.polName}<br />Step: <strong style={{color:GOLD}}>{wf.step}</strong> · Assigned: {wf.assignedTo}</p>
            <div style={{display:'flex',gap:8}}>
              <button onClick={() => submitApproval('Approve','')} className="flex items-center gap-1 px-4 py-2 rounded-lg text-[10px] font-medium" style={{flex:1,background:'rgba(32,201,151,0.1)',border:'1px solid rgba(32,201,151,0.3)',color:EMERALD}}>✅ Approve</button>
              <button onClick={() => submitApproval('Reject','')} className="flex items-center gap-1 px-4 py-2 rounded-lg text-[10px] font-medium" style={{flex:1,background:'rgba(220,53,69,0.1)',border:'1px solid rgba(220,53,69,0.3)',color:CRIMSON}}>❌ Reject</button>
            </div>
          </>
        })()}
      </Modal>

      {/* Workflow History */}
      <Modal show={!!showWfHist} onClose={()=>setShowWfHist(null)} title={`History: ${showWfHist||''}`}>
        {(() => {
          const wf = data.workflow.find(w => w.polId === showWfHist)
          if (!wf) return <p style={{color:SILVER,fontSize:11}}>No history</p>
          const hist = wf.history || []
          return <div style={{paddingLeft:18}}>
            {hist.length === 0 && <p style={{color:SILVER,fontSize:11}}>No history</p>}
            {hist.map((h,i) => <div key={i} style={{position:'relative',marginBottom:12,paddingLeft:16,borderLeft:'2px solid rgba(212,168,50,0.15)'}}>
              <div style={{fontSize:9,color:'rgba(206,212,218,0.35)'}}>{h.date}</div>
              <div style={{fontSize:11,fontWeight:600,color:WHITE}}>{h.step}: {h.decision} {h.decision==='Approve'?'✅':h.decision==='Reject'?'❌':'📤'}</div>
              <div style={{fontSize:10,color:SILVER}}>By {h.by}{h.comment?' — "'+h.comment+'"':''}</div>
            </div>)}
          </div>
        })()}
      </Modal>

      {/* Import CSV */}
      <Modal show={showImport} onClose={()=>setShowImport(false)} title="Import Policies from CSV" wide={true}>
        <p style={{fontSize:10,color:SILVER,marginBottom:8}}>Paste CSV rows (one per line): <code style={{color:GOLD}}>name, owner, dept, status, description</code></p>
        <FormGroup label="CSV Data *">
          <textarea value={csvInput} onChange={e=>setCsvInput(e.target.value)} rows={8} style={{...modalBase,fontFamily:'Consolas,monospace',fontSize:10,resize:'vertical',minHeight:120}} placeholder="Access Control Policy, John Smith, IT Security, Draft, Controls user access" />
        </FormGroup>
        <div style={{marginTop:6}}><FormGroup label="Delimiter">
          <select value={csvDelim} onChange={e=>setCsvDelim(e.target.value)} style={{...selectBase,maxWidth:100}}><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option></select>
        </FormGroup></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setShowImport(false)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={importCSV} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>📥 Import</button>
        </div>
      </Modal>

      {/* Controls Map */}
      <Modal show={showCtrl} onClose={()=>setShowCtrl(false)} title="Map Control">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormGroup label="Policy *"><select value={ctrlPol} onChange={e=>setCtrlPol(e.target.value)} style={selectBase}>{data.policies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
          <FormGroup label="Control Name *"><input value={ctrlName} onChange={e=>setCtrlName(e.target.value)} placeholder="e.g. Quarterly Access Review" style={modalBase} /></FormGroup>
          <FormGroup label="Control ID"><input value={nextId(data.controls,'CTRL-','mapId')} readOnly style={{...modalBase,background:'rgba(30,30,30,0.5)',fontFamily:'Consolas,monospace'}} /></FormGroup>
          <FormGroup label="Frequency"><select value={ctrlFreq} onChange={e=>setCtrlFreq(e.target.value)} style={selectBase}><option>Monthly</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></select></FormGroup>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setShowCtrl(false)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={saveCtrl} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
        </div>
      </Modal>

      {/* Risk Map */}
      <Modal show={showRisk} onClose={()=>setShowRisk(false)} title="Map Risk">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormGroup label="Policy *"><select value={riskPol} onChange={e=>setRiskPol(e.target.value)} style={selectBase}>{data.policies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
          <FormGroup label="Risk Description *"><input value={riskDesc} onChange={e=>setRiskDesc(e.target.value)} placeholder="e.g. Excessive access" style={modalBase} /></FormGroup>
          <FormGroup label="Risk ID"><input value={nextId(data.risks,'RISK-','mapId')} readOnly style={{...modalBase,background:'rgba(30,30,30,0.5)',fontFamily:'Consolas,monospace'}} /></FormGroup>
          <FormGroup label="Severity"><select value={riskSev} onChange={e=>setRiskSev(e.target.value)} style={selectBase}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></FormGroup>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setShowRisk(false)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={saveRisk} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
        </div>
      </Modal>

      {/* Regulation Map */}
      <Modal show={showReg} onClose={()=>setShowReg(false)} title="Map Regulation">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormGroup label="Policy *"><select value={regPol} onChange={e=>setRegPol(e.target.value)} style={selectBase}>{data.policies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
          <FormGroup label="Framework *"><select value={regFw} onChange={e=>setRegFw(e.target.value)} style={selectBase}><option>ISO 27001</option><option>CBE</option><option>PCI DSS</option><option>SOC 2</option><option>GDPR</option><option>NIST CSF</option></select></FormGroup>
          <FormGroup label="Article / Clause"><input value={regArt} onChange={e=>setRegArt(e.target.value)} placeholder="e.g. A.9.1.2" style={modalBase} /></FormGroup>
          <FormGroup label="Status"><select value={regStat} onChange={e=>setRegStat(e.target.value)} style={selectBase}><option>Compliant</option><option>Partially Compliant</option><option>Non-Compliant</option><option>Not Assessed</option></select></FormGroup>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setShowReg(false)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={saveReg} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
        </div>
      </Modal>

      {/* Audit Finding */}
      <Modal show={showAudit} onClose={()=>setShowAudit(false)} title="New Audit Finding">
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
          <button onClick={()=>setShowAudit(false)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={saveAudit} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Create</button>
        </div>
      </Modal>

      {/* Acknowledgment */}
      <Modal show={showAck} onClose={()=>setShowAck(false)} title="Record Acknowledgment">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormGroup label="Policy *"><select value={ackPol} onChange={e=>setAckPol(e.target.value)} style={selectBase}>{data.policies.filter(p => p.status==='Published'||p.status==='Approved').map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}</select></FormGroup>
          <FormGroup label="Employee *"><input value={ackEmp} onChange={e=>setAckEmp(e.target.value)} placeholder="e.g. Sarah Johnson" style={modalBase} /></FormGroup>
          <FormGroup label="Department"><select value={ackDept} onChange={e=>setAckDept(e.target.value)} style={selectBase}>{['IT Security','Legal','HR','Finance','Operations','Compliance','Risk Management','Engineering'].map(d => <option key={d} value={d}>{d}</option>)}</select></FormGroup>
          <FormGroup label="Status"><select value={ackStat} onChange={e=>setAckStat(e.target.value)} style={selectBase}><option>Accepted</option><option>Pending</option></select></FormGroup>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(212,168,50,0.08)'}}>
          <button onClick={()=>setShowAck(false)} style={{padding:'6px 14px',borderRadius:7,border:BORDER,background:'transparent',color:SILVER,fontSize:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={saveAck} className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{background:GRADIENT,border:BORDER,color:GOLD}}>Record</button>
        </div>
      </Modal>

      {/* Policy Viewer */}
      <Modal show={!!showPolicyViewer} onClose={()=>setShowPolicyViewer(null)} title={showPolicyViewer ? (()=>{const p=getPol(showPolicyViewer); return p ? `${p.id} — ${p.name}` : 'Policy'})() : 'Policy'} wide={true}>
        {(() => {
          const p = showPolicyViewer ? getPol(showPolicyViewer) : null
          if (!p) return <p style={{color:SILVER,fontSize:11}}>Policy not found</p>
          return <div>
            {/* Metadata bar */}
            <div style={{display:'flex',gap:10,marginBottom:14,padding:'10px 14px',borderRadius:10,border:BORDER,background:'rgba(212,168,50,0.03)'}}>
              {[
                {label:'Version',value:p.ver||'v1.0',color:GOLD},
                {label:'Owner',value:p.owner,color:WHITE},
                {label:'Department',value:p.dept||'—',color:SILVER},
                {label:'Status',value:p.status,color:p.status==='Published'?EMERALD:p.status==='Approved'?'#20c997':p.status==='Draft'?'#868e96':p.status==='Under Review'?'#fd7e14':GOLD},
                {label:'Updated',value:p.updated||'—',color:SILVER},
              ].map((m,i) => <div key={i} style={{textAlign:'center'}}>
                <div style={{fontSize:8,textTransform:'uppercase',letterSpacing:0.5,color:'rgba(206,212,218,0.35)',marginBottom:2}}>{m.label}</div>
                <div style={{fontSize:11,fontWeight:700,fontFamily:'monospace',color:m.color}}>{m.value}</div>
              </div>)}
            </div>
            {/* Description */}
            {p.desc && <div style={{marginBottom:12,padding:'8px 14px',borderRadius:8,background:'rgba(212,168,50,0.04)',border:BORDER}}>
              <span style={{fontSize:9,color:GOLD,textTransform:'uppercase',letterSpacing:0.5}}>Description</span>
              <p style={{fontSize:11,color:SILVER,marginTop:4}}>{p.desc}</p>
            </div>}
            {/* Full Content */}
            <div style={{maxHeight:'50vh',overflowY:'auto',padding:'14px 18px',borderRadius:10,border:BORDER,background:'rgba(5,5,5,0.6)',whiteSpace:'pre-wrap',fontSize:11,lineHeight:1.6,color:SILVER,fontFamily:'Inter,sans-serif'}}>
              {p.content || <span style={{color:'rgba(206,212,218,0.3)'}}>No content available for this policy. Upload or edit the policy to add content.</span>}
            </div>
          </div>
        })()}
      </Modal>
    </div>
  )
}
