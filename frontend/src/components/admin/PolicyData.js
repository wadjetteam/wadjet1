import { FileText, CheckCircle, Clock, User, Shield, AlertTriangle, Search, Flag } from 'lucide-react'

export const GOLD = '#d4a832'
export const SILVER = '#ced4da'
export const WHITE = '#f8f9fa'
export const CRIMSON = '#dc3545'
export const AMBER = '#fd7e14'
export const EMERALD = '#20c997'
export const DARK_BG = 'rgba(5,5,5,0.85)'
export const BORDER = '1px solid rgba(212,168,50,0.12)'
export const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'
export const STORAGE_KEY = 'wadjet-polman-data'
export const WF_STEPS = ['Author','Reviewer','Legal','CISO']
export const WF_ORDER = { Author:0, Reviewer:1, Legal:2, CISO:3 }
export const today = () => new Date().toISOString().slice(0,10)
export const timeStr = () => new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
const pid = i => 'POL-'+String(i).padStart(3,'0')
export const daysAgo = n => { let d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10) }
export const nextId = (arr, prefix, field) => {
  if (!arr.length) return prefix+'001'
  const nums = arr.map(a => { const v = a[field]||''; return parseInt(v.replace(prefix,''))||0 }).filter(n => n > 0)
  return prefix + String(Math.max(0, ...nums) + 1).padStart(3,'0')
}

export function seedData() {
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

export const TABS = [
  { id:'repo', label:'Repository', icon:FileText },
  { id:'wf', label:'Approvals', icon:CheckCircle },
  { id:'ver', label:'Versions', icon:Clock },
  { id:'ctrl', label:'Controls', icon:Shield },
  { id:'risk', label:'Risks', icon:AlertTriangle },
  { id:'reg', label:'Regulations', icon:Flag },
  { id:'audit', label:'Audit', icon:Search },
  { id:'ack', label:'Acknowledgment', icon:User },
]

export function sb(s) {
  const colors = { 'Draft':'#868e96','Under Review':'#fd7e14','Approved':'#20c997','Published':'#d4a832','Archived':'#6c757d','Rejected':'#dc3545','Open':'#dc3545','Closed':'#20c997','In Progress':'#fd7e14','Compliant':'#20c997','Partially Compliant':'#fd7e14','Non-Compliant':'#dc3545','Not Assessed':'#868e96' }
  return `<span style="display:inline-block;padding:2px 9px;border-radius:12px;font-size:9px;font-weight:600;background:${colors[s]||'#868e96'}15;color:${colors[s]||'#868e96'}">${s}</span>`
}
