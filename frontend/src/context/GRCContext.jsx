import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const initialClauses = [
  { id: 'ART-12-S1', name: 'Explicit Consent Requirements', axis: 'Data Privacy', state: 'compliant', justification: '', expanded: false },
  { id: 'ART-12-S2', name: 'Contractual Necessity Processing', axis: 'Data Privacy', state: 'partial', justification: 'Partial documentation for legacy contracts', expanded: false },
  { id: 'ART-18-S1', name: 'Data Encryption Standards', axis: 'Data Privacy', state: 'non-compliant', justification: '', expanded: false },
  { id: 'CBE-CF-AC-01', name: 'Access Control Policy Enforcement', axis: 'Cyber Governance', state: 'compliant', justification: '', expanded: false },
  { id: 'CBE-CF-IR-02', name: 'Incident Response Procedures', axis: 'Threat Management', state: 'non-compliant', justification: '', expanded: false },
  { id: 'CBE-CF-CR-03', name: 'Cryptographic Key Management', axis: 'Infrastructure', state: 'partial', justification: 'HSM deployment in progress, key rotation not automated', expanded: false },
  { id: 'ISO-A.9.1.1', name: 'Access Control Review Cycle', axis: 'Cyber Governance', state: 'compliant', justification: '', expanded: false },
  { id: 'ISO-A.12.6.1', name: 'Vulnerability Management', axis: 'Threat Management', state: 'non-compliant', justification: '', expanded: false },
  { id: 'ISO-A.16.1.1', name: 'Incident Management Responsibilities', axis: 'Policy Attestation', state: 'partial', justification: 'SIEM rules defined but not fully deployed to all branches', expanded: false },
  { id: 'ART-24', name: 'Data Breach Notification', axis: 'Data Privacy', state: 'non-compliant', justification: '', expanded: false },
  { id: 'CBE-CF-BC-01', name: 'Business Continuity Planning', axis: 'Infrastructure', state: 'compliant', justification: '', expanded: false },
  { id: 'CBE-CF-AU-04', name: 'Audit Logging & Monitoring', axis: 'Policy Attestation', state: 'non-compliant', justification: '', expanded: false },
  // Law 175/2018 — Egyptian Anti-Cybercrime Law
  { id: 'L175-ART-2', name: 'Unauthorized Access Prevention', axis: 'Cybercrime', state: 'partial', justification: 'IAM controls in place; privileged access review incomplete', expanded: false },
  { id: 'L175-ART-14', name: 'Data Interception & Disclosure Controls', axis: 'Cybercrime', state: 'non-compliant', justification: '', expanded: false },
  { id: 'L175-ART-15', name: 'Critical Infrastructure Cyber Protection', axis: 'Cybercrime', state: 'partial', justification: 'SWIFT & core banking hardened; branch segment pending', expanded: false },
  { id: 'L175-ART-8', name: 'DDoS & Service Disruption Prevention', axis: 'Cybercrime', state: 'non-compliant', justification: '', expanded: false },
]

const penaltyValues = {
  'ART-12-S1': 8000000, 'ART-12-S2': 6000000, 'ART-18-S1': 5000000,
  'CBE-CF-AC-01': 3500000, 'CBE-CF-IR-02': 4500000, 'CBE-CF-CR-03': 4000000,
  'ISO-A.9.1.1': 2500000, 'ISO-A.12.6.1': 3000000, 'ISO-A.16.1.1': 2500000,
  'ART-24': 10000000, 'CBE-CF-BC-01': 3500000, 'CBE-CF-AU-04': 4000000,
  // Law 175/2018 penalties (criminal + civil exposure in EGP equivalent)
  'L175-ART-2': 3000000, 'L175-ART-14': 7000000, 'L175-ART-15': 12000000, 'L175-ART-8': 5000000,
}

const axisMap = {
  'Data Privacy': ['ART-12-S1', 'ART-12-S2', 'ART-18-S1', 'ART-24'],
  'Cyber Governance': ['CBE-CF-AC-01', 'ISO-A.9.1.1'],
  'Threat Management': ['CBE-CF-IR-02', 'ISO-A.12.6.1'],
  'Policy Attestation': ['ISO-A.16.1.1', 'CBE-CF-AU-04'],
  'Infrastructure': ['CBE-CF-CR-03', 'CBE-CF-BC-01'],
  'Cybercrime': ['L175-ART-2', 'L175-ART-14', 'L175-ART-15', 'L175-ART-8'],
}

const axisLabels = {
  'Data Privacy': 'Data Privacy\n(Law 151)',
  'Cyber Governance': 'Cyber Governance\n(CBE)',
  'Threat Management': 'Threat Management\n(Vulnerabilities)',
  'Policy Attestation': 'Policy Attestation\n(Employees)',
  'Infrastructure': 'Infrastructure\nHardening',
  'Cybercrime': 'Cybercrime\n(Law 175)',
}

export function computeMaturity(clauses) {
  const axisScores = {}
  for (const [axis, ids] of Object.entries(axisMap)) {
    const relevant = clauses.filter(c => ids.includes(c.id))
    if (relevant.length === 0) { axisScores[axis] = 0; continue }
    const total = relevant.reduce((s, c) => s + (c.state === 'compliant' ? 5 : c.state === 'partial' ? 3 : 1), 0)
    axisScores[axis] = Math.round((total / (relevant.length * 5)) * 5 * 10) / 10
  }
  const radarData = Object.entries(axisLabels).map(([axis, label]) => ({
    axis: label,
    current: axisScores[axis] || 0,
    target: 4.0,
    gap: 4.0,
  }))
  const allScores = Object.values(axisScores)
  const currentLevel = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0
  return { radarData, currentLevel }
}

const GRCContext = createContext()

export function GRCProvider({ children }) {
  const [clauses, setClausesRaw] = useState(initialClauses)
  const [auditLog, setAuditLog] = useState([
    { time: '10:45 AM', user: 'Ahmed Abdullah', action: 'initialized compliance assessment across all frameworks', reason: 'CBE Q2 2026 audit cycle' },
  ])
  const [followUpTasks, setFollowUpTasks] = useState([
    { id: 1, title: 'Implement On-Premises Logging for Law 151', level: 3, levelLabel: 'Level 3 Blocker', assignee: 'Mona A.', sla: 48, status: 'open', breached: false },
    { id: 2, title: 'Encrypt Database Backups at Rest', level: 4, levelLabel: 'Level 4 Goal', assignee: 'Karim S.', sla: 24, status: 'open', breached: false },
    { id: 3, title: 'Deploy SIEM Correlation Rules for CBE', level: 3, levelLabel: 'Level 3 Blocker', assignee: 'Nadia H.', sla: 0, status: 'open', breached: true },
    { id: 4, title: 'Quarterly Access Review - Q2 2026', level: 2, levelLabel: 'Level 2 Goal', assignee: 'Ahmed R.', sla: 72, status: 'in-progress', breached: false },
    { id: 5, title: 'Update BCP/DRP Documentation', level: 4, levelLabel: 'Level 4 Goal', assignee: 'Laila M.', sla: 96, status: 'in-progress', breached: false },
    { id: 6, title: 'MFA Rollout - Branch Network Access', level: 3, levelLabel: 'Level 3 Blocker', assignee: 'Tamer K.', sla: 0, status: 'in-progress', breached: true },
    { id: 7, title: 'Penetration Test Report - Q2 Findings', level: 4, levelLabel: 'Level 4 Goal', assignee: 'External Vendor', sla: 168, status: 'review', breached: false },
    { id: 8, title: 'Vulnerability Scan Compliance - CBE CF', level: 3, levelLabel: 'Level 3 Blocker', assignee: 'Mona A.', sla: 48, status: 'review', breached: false },
    { id: 9, title: 'SWIFT CSP Assessment 2026', level: 4, levelLabel: 'Level 4 Goal', assignee: 'Karim S.', sla: 0, status: 'closed', breached: false },
    { id: 10, title: 'ISMS Internal Audit - ISO 27001', level: 3, levelLabel: 'Level 3 Blocker', assignee: 'Nadia H.', sla: 0, status: 'closed', breached: false },
    { id: 11, title: 'Law 175 Art.14 — DLP & Interception Controls', level: 3, levelLabel: 'Level 3 Blocker', assignee: 'Mona A.', sla: 48, status: 'open', breached: false },
    { id: 12, title: 'Law 175 Art.8 — Anti-DDoS Architecture Review', level: 3, levelLabel: 'Level 3 Blocker', assignee: 'Tamer K.', sla: 0, status: 'open', breached: true },
    { id: 13, title: 'Law 175 Art.15 — Branch Network Segmentation', level: 4, levelLabel: 'Level 4 Goal', assignee: 'Karim S.', sla: 120, status: 'in-progress', breached: false },
  ])

  const [pushedIds, setPushedIds] = useState([])

  const setClauses = useCallback((updater) => {
    setClausesRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const diff = next.find((n, i) => n.state !== prev[i]?.state)
      if (diff) {
        const entry = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          user: 'Ahmed Abdullah',
          action: `changed ${diff.id} to [${diff.state.charAt(0).toUpperCase() + diff.state.slice(1)}]`,
          reason: diff.justification || 'Manual compliance assessment update',
        }
        setAuditLog(prevLog => [...prevLog, entry])
      }
      return next
    })
  }, [])

  const pushToFollowUp = useCallback((clauseId, clauseName) => {
    setPushedIds(prev => [...prev, clauseId])
    setFollowUpTasks(prev => {
      if (prev.find(t => t.title.includes(clauseId))) return prev
      const newTask = {
        id: Date.now(),
        title: `Remediate: ${clauseName} (${clauseId})`,
        level: 3,
        levelLabel: 'Level 3 Blocker',
        assignee: 'Unassigned',
        sla: 72,
        status: 'open',
        breached: false,
      }
      return [newTask, ...prev]
    })
    setTimeout(() => setPushedIds(prev => prev.filter(pid => pid !== clauseId)), 2000)
  }, [])

  const maturity = useMemo(() => computeMaturity(clauses), [clauses])

  const totalPenalty = clauses
    .filter(c => (c.state === 'non-compliant' || c.state === 'partial') && penaltyValues[c.id])
    .reduce((sum, c) => sum + penaltyValues[c.id], 0)

  const stats = useMemo(() => {
    const totalClauses = clauses.length
    const compliantCount = clauses.filter(c => c.state === 'compliant').length
    const partialCount = clauses.filter(c => c.state === 'partial').length
    const nonCompliantCount = clauses.filter(c => c.state === 'non-compliant').length
    const readiness = Math.round((compliantCount / totalClauses) * 100)
    const criticalBlockers = clauses.filter(c => c.state === 'non-compliant' && ['ART-18-S1', 'CBE-CF-IR-02', 'ISO-A.12.6.1', 'ART-24', 'CBE-CF-AU-04', 'L175-ART-14', 'L175-ART-8'].includes(c.id)).length
    return { totalClauses, compliantCount, partialCount, nonCompliantCount, readiness, criticalBlockers }
  }, [clauses])

  const followUpStats = useMemo(() => ({
    open: followUpTasks.filter(t => t.status === 'open').length,
    inProgress: followUpTasks.filter(t => t.status === 'in-progress').length,
    breached: followUpTasks.filter(t => t.breached).length,
  }), [followUpTasks])

  return (
    <GRCContext.Provider value={{
      clauses, setClauses, auditLog, pushedIds, pushToFollowUp,
      followUpTasks, setFollowUpTasks,
      maturity, totalPenalty, stats, followUpStats,
    }}>
      {children}
    </GRCContext.Provider>
  )
}

export function useGRC() {
  const ctx = useContext(GRCContext)
  if (!ctx) throw new Error('useGRC must be used within GRCProvider')
  return ctx
}
