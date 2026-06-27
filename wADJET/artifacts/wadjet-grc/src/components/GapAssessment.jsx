import { useState, Fragment } from 'react'
import { downloadGapAssessmentPDF } from '../lib/downloadUtils'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Target, TrendingUp, CheckCircle, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Plus, Zap, ArrowUpRight, Shield, X, Download, DollarSign, Lock } from 'lucide-react'
import { useGRC } from '../context/GRCContext'

const maturityLevels = [
  { level: 1, label: 'Initial', desc: 'Ad-hoc processes', color: '#c41e3a' },
  { level: 2, label: 'Repeatable', desc: 'Basic discipline', color: '#c9a82e' },
  { level: 3, label: 'Defined', desc: 'Standardized processes', color: '#b8860b' },
  { level: 4, label: 'Managed', desc: 'Quantitative mgmt', color: '#2d7d46', target: true },
  { level: 5, label: 'Optimizing', desc: 'Continuous improvement', color: '#1a6b3c' },
]

const frameworks = ['Law 151/2020 PDPL', 'CBE Cyber Framework', 'ISO 27001']

const penaltyMap = {
  'ART-12-S1': '8,000,000 EGP (Per Egyptian Law 151/2020)',
  'ART-12-S2': '6,000,000 EGP (Per Egyptian Law 151/2020)',
  'ART-18-S1': '5,000,000 EGP (Per Egyptian Law 151/2020)',
  'CBE-CF-AC-01': '3,500,000 EGP (Per CBE Cybersecurity Framework)',
  'CBE-CF-IR-02': '4,500,000 EGP (Per CBE Cybersecurity Framework)',
  'CBE-CF-CR-03': '4,000,000 EGP (Per CBE Cybersecurity Framework)',
  'ISO-A.9.1.1': '2,500,000 EGP (Per ISO 27001)',
  'ISO-A.12.6.1': '3,000,000 EGP (Per ISO 27001)',
  'ISO-A.16.1.1': '2,500,000 EGP (Per ISO 27001)',
  'ART-24': '10,000,000 EGP (Per Egyptian Law 151/2020)',
  'CBE-CF-BC-01': '3,500,000 EGP (Per CBE Cybersecurity Framework)',
  'CBE-CF-AU-04': '4,000,000 EGP (Per CBE Cybersecurity Framework)',
  'L175-ART-2':  '3,000,000 EGP (Per Egyptian Law 175/2018)',
  'L175-ART-14': '7,000,000 EGP (Per Egyptian Law 175/2018)',
  'L175-ART-15': '12,000,000 EGP (Per Egyptian Law 175/2018)',
  'L175-ART-8':  '5,000,000 EGP (Per Egyptian Law 175/2018)',
}

const clauseRegText = {
  'ART-12-S1': { law: 'Law 151/2020 — PDPL', article: 'Art. 12 §1 — Explicit Consent', text: 'Personal data shall only be processed where the data subject has given explicit, specific, and informed consent for one or more defined purposes. Consent must be freely given and separate from other agreements.', risk: 'High — Regulatory investigation, processing suspension', remediation: ['Update all consent forms to PDPL Art. 12 standards', 'Implement a Consent Management Platform (CMP)', 'Train customer-facing staff on consent withdrawal procedures'], effort: '3–5 weeks', owner: 'Data Protection Officer' },
  'ART-12-S2': { law: 'Law 151/2020 — PDPL', article: 'Art. 12 §2 — Contractual Necessity', text: 'Processing is lawful without consent where necessary for the performance of a contract to which the data subject is party, or to take pre-contractual steps at the data subject\'s request.', risk: 'Medium — Legacy contracts may lack PDPL-compliant data clauses', remediation: ['Audit all legacy contracts for PDPL compliance', 'Update contract templates with data processing addenda', 'Establish contract review SOP with Legal team'], effort: '4–6 weeks', owner: 'Legal & Compliance' },
  'ART-18-S1': { law: 'Law 151/2020 — PDPL', article: 'Art. 18 §1 — Encryption Standards', text: 'Controllers must implement appropriate technical measures to protect personal data, including encryption at rest and in transit using approved cryptographic standards approved by NTRA.', risk: 'Critical — Data exposure liability, fine up to EGP 5M', remediation: ['Encrypt all databases at rest (AES-256)', 'Enable TLS 1.3 on all customer-facing endpoints', 'Deploy HSM for cryptographic key management', 'Audit storage bucket and backup encryption policies'], effort: '6–8 weeks', owner: 'CISO / Infrastructure' },
  'ART-24': { law: 'Law 151/2020 — PDPL', article: 'Art. 24 — Data Breach Notification (72h)', text: 'In the event of a personal data breach, the controller must notify the competent authority within 72 hours of becoming aware, including: nature of the breach, categories of data subjects affected, likely consequences, and measures taken or proposed.', risk: 'Critical — Fine up to EGP 10M + criminal liability for DPO', remediation: ['Implement SIEM-automated breach detection with 72h SLA alert', 'Draft and tabletop-test breach notification procedures', 'Appoint a qualified Data Protection Officer (DPO)', 'Map all data stores for breach impact assessment'], effort: '4–6 weeks', owner: 'DPO / Legal' },
  'CBE-CF-AC-01': { law: 'CBE Cybersecurity Framework 2021', article: 'Domain AC — Access Control Policy Enforcement', text: 'Financial institutions must enforce documented access control policies covering: principle of least privilege, RBAC, Privileged Access Management (PAM), and quarterly access certification reviews for all critical systems.', risk: 'High — CBE examination finding, potential sanction', remediation: ['Deploy PAM solution for all privileged accounts', 'Complete Q2 2026 access certification cycle', 'Document RBAC matrix for all systems', 'Implement JIT access for production environments'], effort: '2–4 weeks', owner: 'IT Security' },
  'CBE-CF-IR-02': { law: 'CBE Cybersecurity Framework 2021', article: 'Domain IR — Incident Response Procedures', text: 'Banks must maintain documented and tested incident response procedures including: forensic capability, evidence preservation chain, CERT-EG coordination, and post-incident review report within 30 days of any material security incident.', risk: 'Critical — CBE mandatory reporting obligation, reputational risk', remediation: ['Acquire forensic imaging capability (EnCase or equivalent)', 'Tabletop-test IR playbooks with SOC and Legal', 'Establish CERT-EG reporting channel and contact', 'Update IR procedures to cover cloud and SaaS environments'], effort: '4–6 weeks', owner: 'CISO / SOC' },
  'CBE-CF-CR-03': { law: 'CBE Cybersecurity Framework 2021', article: 'Domain CR — Cryptographic Key Management', text: 'All cryptographic keys protecting customer and transactional data must be managed through a Hardware Security Module (HSM) with automated rotation policies documented in a key management lifecycle procedure reviewed annually.', risk: 'Medium-High — Key exposure, audit finding, PCI DSS co-violation', remediation: ['Complete HSM deployment to all production systems', 'Implement automated 90-day key rotation', 'Document key custodian responsibilities', 'Test key recovery and escrow procedures'], effort: '5–8 weeks', owner: 'Infrastructure / Security' },
  'ISO-A.9.1.1': { law: 'ISO/IEC 27001:2022', article: 'A.9.1.1 — Access Control Policy Review', text: 'An access control policy shall be established, documented, and reviewed at regular intervals and when significant changes occur. The policy shall address data classification, regulatory obligations, and consistency of access rights across the organisation.', risk: 'Medium — ISO surveillance nonconformity', remediation: ['Schedule quarterly access review cycle via IGA tooling', 'Automate access recertification workflow', 'Update access control policy document (annual review)', 'Remediate all orphaned and dormant accounts'], effort: '2–3 weeks', owner: 'IT / ISMS Manager' },
  'ISO-A.12.6.1': { law: 'ISO/IEC 27001:2022', article: 'A.12.6.1 — Technical Vulnerability Management', text: 'Information about technical vulnerabilities of systems in use shall be obtained in a timely fashion, the organisation\'s exposure evaluated, and appropriate measures taken. CVSS scoring must guide remediation priority and SLA.', risk: 'High — Active exploitation risk, ISO nonconformity, CBE finding', remediation: ['Establish weekly authenticated vulnerability scans', 'Implement CVSS-based SLA (Critical 48h, High 96h)', 'Deploy automated patch management for endpoints', 'Integrate vulnerability data into the risk register'], effort: '3–5 weeks', owner: 'SOC / Infrastructure' },
  'ISO-A.16.1.1': { law: 'ISO/IEC 27001:2022', article: 'A.16.1.1 — Incident Management Responsibilities', text: 'Management responsibilities and procedures shall be established to ensure quick, effective, and orderly response to security incidents. All personnel must know reporting channels and their personal obligations.', risk: 'Medium — ISO finding, delayed escalation, CBE reportable delay', remediation: ['Complete SIEM rule deployment to all branch segments', 'Train all staff on incident reporting procedure', 'Publish escalation matrix on intranet', 'Conduct bi-annual incident response drills'], effort: '3–4 weeks', owner: 'SOC / HR' },
  'CBE-CF-BC-01': { law: 'CBE Cybersecurity Framework 2021', article: 'Domain BC — Business Continuity Planning', text: 'Banks must maintain a documented BCP and DRP, tested at minimum annually. RTO and RPO targets must be defined, validated against live architecture, and reported to the Board Risk Committee each cycle.', risk: 'Low (currently compliant) — Maintain testing cadence to preserve status', remediation: ['Schedule next BCP tabletop exercise (Q3 2026)', 'Validate RTO/RPO against current cloud architecture', 'Update DRP for SaaS-hosted systems'], effort: 'Ongoing', owner: 'IT / BCM Officer' },
  'CBE-CF-AU-04': { law: 'CBE Cybersecurity Framework 2021', article: 'Domain AU §4 — Audit Logging & Real-Time Monitoring', text: 'All critical systems must generate tamper-proof audit logs capturing user actions, access attempts, and configuration changes. Logs must be retained for minimum 5 years (WORM storage) and monitored in real-time via SIEM with alerting on anomalous patterns.', risk: 'High — CBE §12.4 examination finding, evidence chain failure', remediation: ['Expand SIEM coverage to 100% of critical systems', 'Enable WORM (Write Once Read Many) log immutability', 'Set real-time alerts for privileged access events', 'Conduct quarterly log integrity verification'], effort: '4–6 weeks', owner: 'SOC / Audit' },
  'L175-ART-2': { law: 'Law 175/2018 — Anti-Cybercrime', article: 'Art. 2 — Unauthorized System Access', text: 'Any person who accesses or uses an information system or network without authorisation, or exceeds their authorised access, is liable to imprisonment and fine. Financial institutions that fail to prevent such access through negligence bear civil and criminal liability.', risk: 'Medium — Criminal liability, fine EGP 50K–200K per incident', remediation: ['Complete privileged access review for all admin accounts', 'Implement network segmentation to limit lateral movement', 'Deploy UBA (User Behavior Analytics) for anomaly detection', 'Establish documented access authorisation workflows'], effort: '3–5 weeks', owner: 'IT Security / CISO' },
  'L175-ART-14': { law: 'Law 175/2018 — Anti-Cybercrime', article: 'Art. 14 — Data Interception & Disclosure', text: 'Interception, monitoring, recording, or disclosure of electronic communications or data without authorisation is a criminal offence. Organisations must implement technical controls preventing unauthorised interception of customer or transactional data.', risk: 'Critical — Criminal 3–10 years, civil EGP 500K–2M', remediation: ['Deploy enterprise DLP (Data Loss Prevention) across all egress', 'Enable email encryption and endpoint DLP policies', 'Implement SSL inspection for outbound web traffic', 'Classify and tag all sensitive data assets for DLP policy scope'], effort: '6–10 weeks', owner: 'CISO / Data Protection' },
  'L175-ART-15': { law: 'Law 175/2018 — Anti-Cybercrime', article: 'Art. 15 — Critical Infrastructure Protection', text: 'Critical infrastructure operators (including licensed banks) must implement enhanced cybersecurity controls against cyberattacks. Senior management is criminally liable for failure to maintain required controls. Coordination with NCSC is mandatory for major incidents.', risk: 'High — Criminal 10+ years for officers, unlimited civil liability', remediation: ['Complete branch-to-core network segmentation', 'Achieve NCSC critical infrastructure alignment', 'Segment OT/IT networks for ATM and payment switch', 'Establish NCSC incident reporting channel and test it'], effort: '8–12 weeks', owner: 'CISO / Operations' },
  'L175-ART-8': { law: 'Law 175/2018 — Anti-Cybercrime', article: 'Art. 8 — DDoS & Service Disruption Prevention', text: 'Any deliberate act that disrupts, degrades, or prevents access to an information system or network is a criminal offence. Banks are required to implement preventive controls against denial-of-service attacks as part of CBE operational continuity requirements.', risk: 'High — Criminal 2–7 years, CBE operational continuity failure', remediation: ['Procure enterprise anti-DDoS service (Cloudflare / Akamai / F5 Silverline)', 'Implement ISP-level traffic scrubbing agreement', 'Test DDoS response playbook with upstream ISP', 'Document NCSC and CBE escalation path for DDoS events'], effort: '4–6 weeks', owner: 'Infrastructure / CISO' },
}

export default function GapAssessment() {
  const {
    clauses, setClauses, auditLog, pushedIds, pushToFollowUp,
    maturity, totalPenalty, stats,
  } = useGRC()
  const { radarData, currentLevel } = maturity
  const { totalClauses, compliantCount, partialCount, nonCompliantCount, readiness, criticalBlockers } = stats
  const currentLevelInt = Math.floor(currentLevel)

  const [selectedFramework, setSelectedFramework] = useState(frameworks[0])
  const [showFwDropdown, setShowFwDropdown] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [expandedClauseInfo, setExpandedClauseInfo] = useState(null)

  const stateBtn = (clause, stateVal, label) => {
    const active = clause.state === stateVal
    const base = 'px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all duration-200 border'
    if (stateVal === 'compliant') {
      return `${base} ${active ? 'bg-emerald-600/80 border-emerald-500/40 text-emerald-100 shadow-sm' : 'bg-transparent border-zinc-700/50 text-zinc-500 hover:text-pharaoh-300 hover:border-pharaoh-500/30'}`
    }
    if (stateVal === 'partial') {
      return `${base} ${active ? 'bg-amber-600/80 border-amber-500/40 text-amber-100 shadow-sm' : 'bg-transparent border-zinc-700/50 text-zinc-500 hover:text-pharaoh-300 hover:border-pharaoh-500/30'}`
    }
    return `${base} ${active ? 'bg-red-600/80 border-red-500/40 text-red-100 shadow-sm' : 'bg-transparent border-zinc-700/50 text-zinc-500 hover:text-pharaoh-300 hover:border-pharaoh-500/30'}`
  }

  const setState = (id, newState) => {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, state: newState, expanded: newState === 'non-compliant' } : c))
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <Target size="18" className="text-pharaoh-500" />
            <h1 className="page-title">Gap Assessment & Maturity Level</h1>
          </div>
          <p className="page-subtitle">Strategic compliance auditing and long-term maturity scoring</p>
        </div>
        <button onClick={() => downloadGapAssessmentPDF(clauses, currentLevel, { ...stats, totalPenalty })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold gold-gradient text-nile-900 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all shadow-lg shadow-pharaoh-500/20">
          <Download size="14" /> Export CBE Official Report
        </button>
      </div>

      {/* CMMI Stepper + Radar Chart */}
      <div className="grid grid-cols-3 gap-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {/* Stepper */}
        <div className="col-span-2 pharaoh-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size="16" className="text-pharaoh-400" />
              <span className="text-sm font-semibold text-pharaoh-200">CMMI Maturity Progression</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-pharaoh-800/30 rounded-full" />
            <div className="absolute top-5 left-0 h-1 rounded-full bg-gradient-to-r from-pharaoh-600 via-pharaoh-400 to-pharaoh-300 transition-all duration-700" style={{ width: `${(currentLevel / 5) * 100}%` }} />
            <div className="absolute top-5 h-1 border-t-2 border-dashed border-pharaoh-400/30 transition-all duration-700" style={{ left: `${(currentLevel / 5) * 100}%`, width: `${((4 - currentLevel) / 5) * 100}%` }} />

            <div className="relative flex items-center justify-between">
              {maturityLevels.map((ml) => {
                const isCompleted = ml.level <= currentLevelInt
                const isCurrent = ml.level === currentLevelInt
                const isTarget = ml.target
                return (
                  <div key={ml.level} className="flex flex-col items-center relative z-10" style={{ width: '18%' }}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isCompleted ? 'border-pharaoh-400 bg-pharaoh-500/20 shadow-lg shadow-pharaoh-500/20' :
                      isTarget ? 'border-pharaoh-300/60 bg-nile-900 border-dashed' :
                      'border-pharaoh-500/20 bg-nile-900'
                    }`}>
                      {isCompleted ? <CheckCircle size="18" className="text-pharaoh-400" /> : <span className={`text-xs font-bold ${isTarget ? 'text-pharaoh-300' : 'text-pharaoh-500/40'}`}>{ml.level}</span>}
                    </div>
                    {isCurrent && (
                      <div className="absolute -top-3 right-0 px-2 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap gold-gradient text-nile-900 shadow-lg" style={{ transform: 'translateX(60%)' }}>
                        {currentLevel}
                      </div>
                    )}
                    {isTarget && (
                      <div className="absolute -top-3 left-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap bg-pharaoh-400/10 border border-pharaoh-400/30 text-pharaoh-300" style={{ transform: 'translateX(-60%)' }}>
                        <Target size="8" />Target
                      </div>
                    )}
                    <div className="mt-2 text-center">
                      <div className={`text-[11px] font-bold tracking-wide ${isCompleted ? 'text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : isTarget ? 'text-pharaoh-300' : 'text-pharaoh-500/40'}`}>
                        {ml.label}
                      </div>
                      <div className="text-[8px] text-pharaoh-500/30 mt-0.5">{ml.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl p-5 rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Target size="14" className="text-pharaoh-400" />
            <span className="text-xs font-semibold text-pharaoh-200">Compliance Posture Radar</span>
          </div>
          <div className="flex-1 min-h-0 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="rgba(161,161,170,0.25)" strokeWidth={0.5} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#e4e4e7', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em' }} tickLine={false} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                {/* Crimson gap overlay between polygons */}
                <Radar name="Gap Fill" dataKey="gap" stroke="none" fill="#7f1d1d" fillOpacity={0.08} />
                <Radar name="Target" dataKey="target" stroke="#D4AF37" strokeWidth={2.5} fill="none" dot={false} className="transition-all duration-500" style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                <Radar name="Current" dataKey="current" stroke="#34d399" strokeWidth={2} fill="#34d399" fillOpacity={0.25} dot={{ r: 3, fill: '#34d399', stroke: '#34d399', strokeWidth: 1 }}
                  className="transition-all duration-500" style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/5">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              <span className="text-[9px] text-zinc-300 tracking-wide">👑 Target Benchmark (Level 4.0)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
              <span className="text-[9px] text-zinc-300 tracking-wide">📈 Live Audited Posture (Active Score)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Bar + Framework Selector */}
      <div className="pharaoh-card p-4 animate-fade-in" style={{ animationDelay: '0.08s' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pharaoh-400" />
              <span className="text-xs text-pharaoh-400/70">Overall Readiness: <strong className="text-pharaoh-300">{readiness}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-egyptian-red" />
              <span className="text-xs text-pharaoh-400/70">Total Discovered Gaps: <strong className="text-pharaoh-300">{nonCompliantCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle size="12" className="text-egyptian-red" />
              <span className="text-xs text-pharaoh-400/70">Critical Maturity Blockers: <strong className="text-egyptian-red">{criticalBlockers}</strong></span>
            </div>
          </div>
          {/* Framework Dropdown */}
          <div className="relative">
            <button onClick={() => setShowFwDropdown(p => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 hover:bg-pharaoh-500/15 transition-all">
              <Shield size="12" />
              <span>{selectedFramework}</span>
              <ChevronDown size="10" />
            </button>
            {showFwDropdown && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-nile-900 border border-pharaoh-500/15 rounded-xl shadow-2xl py-1 z-50 animate-fade-in" onMouseLeave={() => setShowFwDropdown(false)}>
                {frameworks.map(fw => (
                  <button key={fw} onClick={() => { setSelectedFramework(fw); setShowFwDropdown(false) }}
                    className={`w-full text-left px-4 py-2 text-xs transition-all ${selectedFramework === fw ? 'bg-pharaoh-500/10 text-pharaoh-300 border-l-2 border-pharaoh-400' : 'text-pharaoh-400/60 hover:bg-pharaoh-500/5 hover:text-pharaoh-300'}`}>
                    {fw}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Readiness Bar */}
        <div className="mt-3 w-full h-1.5 rounded-full bg-pharaoh-800/30 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-egyptian-red via-pharaoh-400 to-egyptian-green transition-all duration-700" style={{ width: `${readiness}%` }} />
        </div>
      </div>

      {/* Assessment Checklist Data Grid */}
      <div className="pharaoh-card animate-fade-in" style={{ animationDelay: '0.12s' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-pharaoh-500/10">
          <div className="flex items-center gap-2">
            <Shield size="14" className="text-pharaoh-400" />
            <span className="text-sm font-semibold text-pharaoh-200">Clause-by-Clause Assessment — {selectedFramework}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-pharaoh-500/40">{compliantCount} Compliant</span></span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-pharaoh-500/40">{partialCount} Partial</span></span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-pharaoh-500/40">{nonCompliantCount} Gaps</span></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pharaoh-500/10">
                <th className="text-left py-3 px-4 text-[10px] text-pharaoh-400/60 font-medium w-[130px]">Clause ID</th>
                <th className="text-left py-3 px-4 text-[10px] text-pharaoh-400/60 font-medium">Regulatory Requirement</th>
                <th className="text-center py-3 px-4 text-[10px] text-pharaoh-400/60 font-medium w-[320px]">Assessment State</th>
                <th className="text-left py-3 px-4 text-[10px] text-pharaoh-400/60 font-medium">Gap Justification</th>
              </tr>
            </thead>
            <tbody>
              {clauses.map(clause => (
                <Fragment key={clause.id}>
                  <tr className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-pharaoh-300 font-medium">{clause.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-pharaoh-200">{clause.name}</span>
                          {clauseRegText[clause.id] && (
                            <button
                              onClick={() => setExpandedClauseInfo(prev => prev === clause.id ? null : clause.id)}
                              className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all ${expandedClauseInfo === clause.id ? 'bg-pharaoh-500/20 border-pharaoh-400/50 text-pharaoh-300' : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-500 hover:border-pharaoh-500/30 hover:text-pharaoh-400'}`}
                              title="View regulatory detail"
                            >ℹ</button>
                          )}
                        </div>
                        {clause.state === 'non-compliant' && penaltyMap[clause.id] && (
                          <div className="text-rose-400 font-mono text-[11px] mt-1 tracking-wide flex items-center gap-1">
                            <span>⚠️ Projected Legal Penalty: {penaltyMap[clause.id]}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1 bg-zinc-900/60 rounded-lg p-0.5 border border-zinc-800 w-fit mx-auto">
                        <button onClick={() => setState(clause.id, 'compliant')} className={stateBtn(clause, 'compliant', 'C')}>
                          Compliant
                        </button>
                        <button onClick={() => setState(clause.id, 'partial')} className={stateBtn(clause, 'partial', 'P')}>
                          Partial
                        </button>
                        <button onClick={() => setState(clause.id, 'non-compliant')} className={stateBtn(clause, 'non-compliant', 'N')}>
                          {clause.state === 'non-compliant' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse-dot mr-1" />}
                          Non-Compliant (GAP)
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] ${clause.justification ? 'text-pharaoh-400/70' : 'text-pharaoh-500/30 italic'}`}>
                        {clause.justification || 'No justification recorded'}
                      </span>
                    </td>
                  </tr>
                  {/* Expanded regulatory info row */}
                  {expandedClauseInfo === clause.id && clauseRegText[clause.id] && (() => {
                    const info = clauseRegText[clause.id]
                    return (
                      <tr key={`${clause.id}-info`} className="bg-pharaoh-500/3 border-b border-pharaoh-500/10 animate-fade-in">
                        <td colSpan={4} className="py-4 px-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/50">{info.law}</span>
                                <span className="text-[9px] text-pharaoh-400/40">·</span>
                                <span className="text-[10px] font-semibold text-pharaoh-300">{info.article}</span>
                              </div>
                              <p className="text-[10px] text-pharaoh-400/70 leading-relaxed border-l-2 border-pharaoh-500/20 pl-3 italic">{info.text}</p>
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-2">Remediation Steps</div>
                                <div className="space-y-1">
                                  {info.remediation.map((step, i) => (
                                    <div key={i} className="flex items-start gap-2 text-[10px] text-pharaoh-300/80">
                                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-pharaoh-500/10 border border-pharaoh-500/20 flex items-center justify-center text-[8px] font-bold text-pharaoh-400 mt-0.5">{i+1}</span>
                                      {step}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3 border-l border-pharaoh-500/10 pl-4">
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-1">Risk Level</div>
                                <p className="text-[10px] text-rose-300/80">{info.risk}</p>
                              </div>
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-1">Estimated Effort</div>
                                <span className="text-[10px] font-semibold text-amber-300">{info.effort}</span>
                              </div>
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-1">Recommended Owner</div>
                                <span className="text-[10px] text-pharaoh-300">{info.owner}</span>
                              </div>
                              {penaltyMap[clause.id] && (
                                <div>
                                  <div className="text-[9px] font-bold uppercase tracking-widest text-pharaoh-500/40 mb-1">Max Penalty</div>
                                  <span className="text-[10px] font-mono text-rose-400">{penaltyMap[clause.id]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })()}
                  {/* Expanded sub-row for non-compliant */}
                  {clause.expanded && clause.state === 'non-compliant' && (
                    <tr key={`${clause.id}-sub`} className="bg-egyptian-red/5 border-b border-pharaoh-500/8 animate-fade-in">
                      <td colSpan={4} className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-[10px] text-pharaoh-400/60 mb-1 block">Root Cause Analysis</label>
                            <input type="text" placeholder="Describe the root cause of this gap..."
                              value={clause.justification}
                              onChange={(e) => setClauses(prev => prev.map(c => c.id === clause.id ? { ...c, justification: e.target.value } : c))}
                              className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg py-2 px-3 text-xs text-pharaoh-200 placeholder-pharaoh-500/40 focus:border-pharaoh-500/30 focus:outline-none transition-all" />
                          </div>
                          <button onClick={() => pushToFollowUp(clause.id, clause.name)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold gold-gradient text-nile-900 hover:opacity-90 transition-all shadow-lg shadow-pharaoh-500/20 whitespace-nowrap">
                            {pushedIds.includes(clause.id) ? (
                              <><CheckCircle size="12" /> Pushed ✓</>
                            ) : (
                              <><Plus size="12" /> Push to Follow-Up Stream</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-pharaoh-500/8">
          <span className="text-[10px] text-pharaoh-500/40">{totalClauses} requirements assessed under {selectedFramework}</span>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-pharaoh-400/70">{pushedIds.filter(id => clauses.find(c => c.id === id)).length > 0 ? `${pushedIds.filter(id => clauses.find(c => c.id === id)).length} gap(s) pushed to follow-up` : ''}</span>
          </div>
        </div>
      </div>

      {/* Total Regulatory Exposure KPI */}
      {totalPenalty > 0 && (
        <div className="grc-card p-5 animate-fade-in flex items-center justify-between" style={{ animationDelay: '0.14s' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20">
              <DollarSign size="18" className="text-rose-400" />
            </div>
            <div>
              <span className="text-xs text-pharaoh-400/70 font-medium">Total Regulatory Exposure</span>
              <div className="text-xl font-bold font-mono text-rose-300 mt-0.5">{totalPenalty.toLocaleString('en-US')} EGP</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/30 text-[10px] font-medium">
              {clauses.filter(c => c.state === 'non-compliant').length} Non-Compliant
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[10px] font-medium">
              {clauses.filter(c => c.state === 'partial').length} Partial
            </span>
          </div>
        </div>
      )}

      {/* Audit Trail Component */}
      <div className="grc-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <button onClick={() => setShowAuditLog(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 transition-all hover:bg-pharaoh-500/5">
          <div className="flex items-center gap-2">
            <Shield size="14" className="text-pharaoh-400" />
            <span className="text-sm font-semibold text-pharaoh-200">🔒 Immutable Audit Trail (CBE §12.4)</span>
            <span className="text-[10px] text-pharaoh-500/40 font-mono">({auditLog.length} events)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-pharaoh-500/40">{showAuditLog ? 'Click to collapse' : 'Click to expand'}</span>
            {showAuditLog ? <ChevronUp size="14" className="text-pharaoh-400" /> : <ChevronDown size="14" className="text-pharaoh-400" />}
          </div>
        </button>
        {showAuditLog && (
          <div className="border-t border-pharaoh-500/10 animate-fade-in">
            <div className="divide-y divide-pharaoh-500/8">
              {auditLog.slice().reverse().map((entry, idx) => (
                <div key={idx} className="px-5 py-3 flex items-start gap-3 hover:bg-pharaoh-500/5 transition-colors">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-pharaoh-500/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] font-mono text-pharaoh-500/40 flex-shrink-0">🕒 {entry.time}</span>
                      <span className="text-[10px] font-semibold text-pharaoh-300">{entry.user}</span>
                    </div>
                    <p className="text-[10px] text-pharaoh-400/70 mt-0.5 font-mono leading-relaxed">
                      {entry.action}
                    </p>
                    <p className="text-[9px] text-pharaoh-500/40 mt-0.5 italic select-none">
                      Reason: {entry.reason}
                    </p>
                  </div>
                  <div className="text-[8px] text-pharaoh-500/30 font-mono flex-shrink-0 select-none">ENTRY-{(auditLog.length - idx).toString().padStart(3, '0')}</div>
                </div>
              ))}
            </div>
            <div className="px-5 py-2 border-t border-pharaoh-500/8 flex items-center justify-center gap-2 text-[9px] text-pharaoh-500/30 font-mono tracking-wide">
              <Lock size="10" />
              IMMUTABLE AUDIT TRAIL — SYSTEM LOCKED · ALL CHANGES ARE PERMANENTLY LOGGED
            </div>
          </div>
        )}
      </div>

      <div className="ankh-divider" />
    </div>
  )
}
