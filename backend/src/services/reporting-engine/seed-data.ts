import type { ComponentType, ComponentDefinition, RoleDefinition, PermissionEntry } from "./types";

export const COMPONENT_TYPES: ComponentType[] = [
  { typeCode: "risk_heatmap",       displayName: "Risk Heatmap",       renderer: "RiskHeatmap",       defaultWidth: 12, defaultHeight: 6 },
  { typeCode: "compliance_gauge",   displayName: "Compliance Gauge",   renderer: "ComplianceGauge",   defaultWidth: 4,  defaultHeight: 4 },
  { typeCode: "evidence_table",     displayName: "Evidence Table",     renderer: "EvidenceTable",     defaultWidth: 12, defaultHeight: 8 },
  { typeCode: "control_coverage",   displayName: "Control Coverage",   renderer: "ControlCoverage",   defaultWidth: 6,  defaultHeight: 4 },
  { typeCode: "risk_register_table",displayName: "Risk Register",      renderer: "RiskRegisterTable", defaultWidth: 12, defaultHeight: 10 },
  { typeCode: "breach_summary",     displayName: "Breach Summary",     renderer: "BreachSummary",     defaultWidth: 4,  defaultHeight: 4 },
  { typeCode: "audit_trail_viewer", displayName: "Audit Trail",        renderer: "AuditTrailViewer",  defaultWidth: 12, defaultHeight: 8 },
  { typeCode: "org_scorecard",      displayName: "Org Scorecard",      renderer: "OrgScorecard",      defaultWidth: 6,  defaultHeight: 6 },
];

export const COMPONENTS: ComponentDefinition[] = [
  // --- RISK DOMAIN ---
  {
    code: "risk-heatmap-all",
    typeCode: "risk_heatmap",
    name: "Enterprise Risk Heatmap",
    description: "5x5 heatmap of all risks by likelihood and impact",
    dataDomain: "risk",
    queryTemplate: `SELECT risk_category, COUNT(*) as count, AVG(inherent_likelihood) as avg_l,
AVG(inherent_impact) as avg_i FROM risks :scopeCondition GROUP BY risk_category`,
    queryTemplateNeo4j: `MATCH (r:Risk) WHERE r.status <> 'Closed' :scopeCondition
RETURN r.category AS risk_category, count(r) AS count, avg(r.inherentLikelihood) AS avg_l, avg(r.inherentImpact) AS avg_i`,
    queryParams: [],
  },
  {
    code: "risk-register-detailed",
    typeCode: "risk_register_table",
    name: "Detailed Risk Register",
    description: "Full risk register with scores, owners, and treatment status",
    dataDomain: "risk",
    queryTemplate: `SELECT risk_id, code, title, category, inherent_risk_score, residual_risk_score,
status, owner, treatment_strategy FROM risks :scopeCondition ORDER BY residual_risk_score DESC`,
    queryTemplateNeo4j: `MATCH (r:Risk) :scopeCondition
RETURN r.uid AS risk_id, r.code, r.title, r.category, r.inherentScore, r.residualScore, r.status, r.owner, r.treatmentStrategy
ORDER BY r.residualScore DESC`,
    queryParams: [],
  },

  // --- COMPLIANCE DOMAIN ---
  {
    code: "compliance-overall-gauge",
    typeCode: "compliance_gauge",
    name: "Overall Compliance %",
    description: "Percentage of controls assessed as Compliant across all frameworks",
    dataDomain: "compliance",
    queryTemplate: `SELECT
COUNT(*) FILTER (WHERE status = 'Compliant') * 100.0 / NULLIF(COUNT(*), 0) AS compliance_pct
FROM compliance_assessments :scopeCondition`,
    queryTemplateNeo4j: `MATCH (a:ComplianceAssessment) :scopeCondition
RETURN sum(CASE WHEN a.status = 'Compliant' THEN 1 ELSE 0 END) * 100.0 / count(a) AS compliance_pct`,
    queryParams: [],
  },
  {
    code: "control-coverage-matrix",
    typeCode: "control_coverage",
    name: "Control Coverage by Framework",
    description: "Number of requirements satisfied per control, grouped by framework",
    dataDomain: "compliance",
    queryTemplate: `SELECT f.code AS framework, COUNT(DISTINCT cr.requirement_id) AS req_covered,
COUNT(DISTINCT cr.control_id) AS controls_used
FROM frameworks f JOIN requirements req ON req.framework_id = f.framework_id
LEFT JOIN control_requirements cr ON cr.requirement_id = req.requirement_id
:scopeCondition
GROUP BY f.code ORDER BY f.code`,
    queryTemplateNeo4j: `MATCH (f:Framework)-[:CONTAINS]->(req:Requirement)
OPTIONAL MATCH (c:Control)-[:SATISFIES]->(req) :scopeCondition
RETURN f.code AS framework, count(DISTINCT req) AS req_covered, count(DISTINCT c) AS controls_used
ORDER BY f.code`,
    queryParams: [],
  },

  // --- EVIDENCE DOMAIN ---
  {
    code: "evidence-pending-table",
    typeCode: "evidence_table",
    name: "Pending Evidence Review",
    description: "Evidence records awaiting verification, grouped by control",
    dataDomain: "evidence",
    queryTemplate: `SELECT e.evidence_id, e.file_name, e.mime_type, e.uploaded_by, e.uploaded_at,
e.status, ce.control_id, c.code AS control_code
FROM evidence e JOIN control_evidence ce ON ce.evidence_id = e.evidence_id
JOIN controls c ON c.control_id = ce.control_id
WHERE e.status = 'Uploaded' :scopeCondition
ORDER BY e.uploaded_at DESC`,
    queryTemplateNeo4j: `MATCH (e:Evidence {status: 'Uploaded'})-[:EVIDENCED_BY]-(c:Control) :scopeCondition
RETURN e.uid AS evidence_id, e.fileName, e.mimeType, e.uploadedBy, e.uploadedAt, e.status,
c.uid AS control_id, c.code AS control_code
ORDER BY e.uploadedAt DESC`,
    queryParams: [],
  },
  {
    code: "evidence-audit-trail",
    typeCode: "audit_trail_viewer",
    name: "Evidence Audit Trail",
    description: "Immutable audit log for all evidence operations",
    dataDomain: "evidence",
    queryTemplate: `SELECT log_id, evidence_id, action, performed_by, timestamp, current_hash
FROM evidence_audit_log :scopeCondition
ORDER BY timestamp DESC LIMIT :limit`,
    queryTemplateNeo4j: "",
    queryParams: [{ name: "limit", type: "integer", default: 200 }],
  },

  // --- BREACH DOMAIN ---
  {
    code: "breach-summary-stats",
    typeCode: "breach_summary",
    name: "Breach Summary",
    description: "Open breach tasks by severity and SLA status",
    dataDomain: "breach",
    queryTemplate: `SELECT severity, COUNT(*) AS count,
COUNT(*) FILTER (WHERE due_by < NOW()) AS overdue
FROM breach_tasks WHERE status IN ('Open','In Progress') :scopeCondition
GROUP BY severity`,
    queryTemplateNeo4j: "",
    queryParams: [],
  },

  // --- ORG SCORECARD ---
  {
    code: "org-scorecard-exec",
    typeCode: "org_scorecard",
    name: "Executive Scorecard",
    description: "High-level GRC posture summary for executive leadership",
    dataDomain: "compliance",
    queryTemplate: `SELECT 'Overall Compliance' AS metric, ROUND(AVG(score), 1) AS value FROM compliance_assessments
UNION ALL SELECT 'Open Risks', COUNT(*) FROM risks WHERE status NOT IN ('Closed','Accepted')
UNION ALL SELECT 'Open Findings', COUNT(*) FROM findings WHERE status NOT IN ('closed')
UNION ALL SELECT 'Controls Tested', ROUND(
  COUNT(*) FILTER (WHERE last_reviewed_at IS NOT NULL) * 100.0 / NULLIF(COUNT(*),0), 1)
FROM controls :scopeCondition`,
    queryTemplateNeo4j: "",
    queryParams: [],
  },
];

export const ROLES: RoleDefinition[] = [
  { roleCode: "EXECUTIVE",     displayName: "Executive C-Level",      priority: 10, description: "C-Suite / Board members" },
  { roleCode: "CRO",           displayName: "Chief Risk Officer",     priority: 50, description: "Enterprise risk ownership" },
  { roleCode: "RISK_OFFICER",  displayName: "Risk Officer",           priority: 40, description: "Operational risk management" },
  { roleCode: "COMPLIANCE_MGR",displayName: "Compliance Manager",     priority: 30, description: "Regulatory compliance team" },
  { roleCode: "IT_AUDITOR",    displayName: "IT Auditor",             priority: 35, description: "Technical audit & evidence verification" },
  { roleCode: "DEPARTMENT_OWNER",displayName: "Department Owner",     priority: 20, description: "Business unit / asset owner" },
];

export const PERMISSIONS: PermissionEntry[] = [
  // EXECUTIVE sees only aggregates
  { roleCode: "EXECUTIVE", componentCode: "org-scorecard-exec",      visible: true,  dataScope: "ALL_READ",       maxRows: 20,   allowExport: true  },
  { roleCode: "EXECUTIVE", componentCode: "risk-heatmap-all",        visible: true,  dataScope: "AGGREGATE_ONLY", maxRows: null, allowExport: false },
  { roleCode: "EXECUTIVE", componentCode: "compliance-overall-gauge",visible: true,  dataScope: "AGGREGATE_ONLY", maxRows: null, allowExport: false },
  { roleCode: "EXECUTIVE", componentCode: "breach-summary-stats",    visible: true,  dataScope: "ALL_READ",       maxRows: null, allowExport: false },

  // CRO sees all risk data
  { roleCode: "CRO", componentCode: "risk-heatmap-all",         visible: true, dataScope: "ALL_READ",       maxRows: null, allowExport: true },
  { roleCode: "CRO", componentCode: "risk-register-detailed",   visible: true, dataScope: "ALL_READ",       maxRows: null, allowExport: true },
  { roleCode: "CRO", componentCode: "compliance-overall-gauge", visible: true, dataScope: "ALL_READ",       maxRows: null, allowExport: true },
  { roleCode: "CRO", componentCode: "org-scorecard-exec",       visible: true, dataScope: "ALL_READ",       maxRows: null, allowExport: true },
  { roleCode: "CRO", componentCode: "breach-summary-stats",     visible: true, dataScope: "ALL_READ",       maxRows: null, allowExport: true },

  // Risk Officer — full granularity, own dept filter
  { roleCode: "RISK_OFFICER", componentCode: "risk-heatmap-all",         visible: true, dataScope: "ALL_DEPT",  maxRows: null, allowExport: true },
  { roleCode: "RISK_OFFICER", componentCode: "risk-register-detailed",   visible: true, dataScope: "ALL_DEPT",  maxRows: null, allowExport: true },
  { roleCode: "RISK_OFFICER", componentCode: "compliance-overall-gauge", visible: true, dataScope: "ALL_DEPT",  maxRows: null, allowExport: false },
  { roleCode: "RISK_OFFICER", componentCode: "evidence-pending-table",   visible: true, dataScope: "ALL_DEPT",  maxRows: 200,  allowExport: true },

  // Compliance Manager
  { roleCode: "COMPLIANCE_MGR", componentCode: "compliance-overall-gauge", visible: true, dataScope: "ALL_DEPT",  maxRows: null, allowExport: true },
  { roleCode: "COMPLIANCE_MGR", componentCode: "control-coverage-matrix",  visible: true, dataScope: "ALL_DEPT",  maxRows: null, allowExport: true },
  { roleCode: "COMPLIANCE_MGR", componentCode: "evidence-pending-table",   visible: true, dataScope: "ALL_DEPT",  maxRows: 500,  allowExport: true },
  // IT Auditor — sees all technical detail, can export
  { roleCode: "IT_AUDITOR", componentCode: "evidence-pending-table",   visible: true, dataScope: "ALL_READ", maxRows: null, allowExport: true },
  { roleCode: "IT_AUDITOR", componentCode: "evidence-audit-trail",     visible: true, dataScope: "ALL_READ", maxRows: null, allowExport: true },
  { roleCode: "IT_AUDITOR", componentCode: "control-coverage-matrix",  visible: true, dataScope: "ALL_READ", maxRows: null, allowExport: true },
  { roleCode: "IT_AUDITOR", componentCode: "risk-register-detailed",   visible: true, dataScope: "ALL_READ", maxRows: null, allowExport: true },
  { roleCode: "IT_AUDITOR", componentCode: "compliance-overall-gauge", visible: true, dataScope: "ALL_READ", maxRows: null, allowExport: true },
  { roleCode: "IT_AUDITOR", componentCode: "risk-heatmap-all",         visible: true, dataScope: "ALL_READ", maxRows: null, allowExport: true },
  { roleCode: "IT_AUDITOR", componentCode: "breach-summary-stats",     visible: true, dataScope: "ALL_READ", maxRows: null, allowExport: true },

  // Department Owner — only own records
  { roleCode: "DEPARTMENT_OWNER", componentCode: "risk-register-detailed", visible: true, dataScope: "OWN_DEPT", maxRows: 200, allowExport: false },
  { roleCode: "DEPARTMENT_OWNER", componentCode: "evidence-pending-table", visible: true, dataScope: "OWN_DEPT", maxRows: 100, allowExport: false },
  { roleCode: "DEPARTMENT_OWNER", componentCode: "compliance-overall-gauge",visible: false, dataScope: "OWN_DEPT", maxRows: null, allowExport: false },
];

export const DASHBOARD_TEMPLATES = [
  {
    roleCode: "EXECUTIVE",
    name: "Executive Dashboard",
    isDefault: true,
    layout: [
      { componentCode: "org-scorecard-exec",       x: 0, y: 0, w: 12, h: 3 },
      { componentCode: "risk-heatmap-all",         x: 0, y: 3, w: 8,  h: 5 },
      { componentCode: "compliance-overall-gauge", x: 8, y: 3, w: 4,  h: 5 },
      { componentCode: "breach-summary-stats",     x: 0, y: 8, w: 12, h: 4 },
    ],
  },
  {
    roleCode: "CRO",
    name: "CRO Dashboard",
    isDefault: true,
    layout: [
      { componentCode: "risk-heatmap-all",         x: 0, y: 0, w: 8,  h: 5 },
      { componentCode: "breach-summary-stats",     x: 8, y: 0, w: 4,  h: 5 },
      { componentCode: "risk-register-detailed",   x: 0, y: 5, w: 12, h: 6 },
      { componentCode: "compliance-overall-gauge", x: 6, y: 11, w: 6, h: 4 },
    ],
  },
  {
    roleCode: "IT_AUDITOR",
    name: "Auditor Workspace",
    isDefault: true,
    layout: [
      { componentCode: "evidence-pending-table",   x: 0, y: 0, w: 12, h: 6 },
      { componentCode: "evidence-audit-trail",     x: 0, y: 6, w: 12, h: 6 },
      { componentCode: "control-coverage-matrix",  x: 0, y: 12, w: 8, h: 4 },
      { componentCode: "risk-register-detailed",   x: 8, y: 12, w: 4, h: 4 },
    ],
  },
  {
    roleCode: "RISK_OFFICER",
    name: "Risk Officer Desk",
    isDefault: true,
    layout: [
      { componentCode: "risk-register-detailed",   x: 0, y: 0, w: 12, h: 7 },
      { componentCode: "risk-heatmap-all",         x: 0, y: 7, w: 6,  h: 5 },
      { componentCode: "evidence-pending-table",   x: 0, y: 12, w: 12, h: 6 },
    ],
  },
];
