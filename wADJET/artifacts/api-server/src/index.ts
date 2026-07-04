import {
  Risk, KpiCatalog, KriCatalog, waitForDB, calcRiskScore, scoreToLevel,
  calcResidualScore, ragStatus, mapOperationalCategory, deriveControlStatus,
  CapitalRatio, RWATrend, LiquidityRatio, Pillar2Item, CapitalTrend,
  LossCategory, LossEvent, MonthlyLoss,
  Vendor,
  Submission,
  Examination, Finding,
  PackTemplate, MaturityDimension, TopRisk, BKRIRecord,
  FATFRecommendation, SARMonthly, KYCException, HighRiskSegment,
} from "@workspace/db";
import { seedComplianceData } from "@workspace/db/seed/compliance-seed.ts";
import app from "./app";
import { logger } from "./lib/logger";
import { startSchedulers } from "./services/scheduler";
import path from "path";
import { fileURLToPath } from "url";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedRisks() {
  const existing = await Risk.find().lean();
  if (existing.length > 0) {
    logger.info({ count: existing.length }, "Risks already seeded — skipping");
    return;
  }

  const xlsxPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../attached_assets/Risk_Assessment_v3 (1).xlsx",
  );

  let rows: unknown[][];
  try {
    const xlsx = await import("xlsx");
    const workbook = xlsx.default.readFile(xlsxPath);
    const ws = workbook.Sheets["Risk Rigister"];
    if (!ws) { logger.warn("Sheet 'Risk Rigister' not found in workbook — skipping seed"); return; }
    const data: unknown[][] = xlsx.default.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
    rows = data.slice(3).filter((r: any) => r[0] && String(r[0]).startsWith("R-"));
    if (rows.length === 0) { logger.warn("No risk rows found — skipping seed"); return; }
  } catch (err) {
    logger.warn({ err, xlsxPath }, "Could not parse risk spreadsheet — seed skipped");
    return;
  }

  const excelDateToISO = (v: unknown): string | null => {
    if (!v || typeof v !== "number") return null;
    return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  };

  let count = 0;
  for (const r of rows!) {
    const riskId = String(r[0] ?? "");
    const rawRiskCategory = String(r[5] ?? "");

    const base = {
      riskId,
      process: String(r[1] ?? ""),
      subProcess: String(r[2] ?? ""),
      assetSystem: String(r[3] ?? ""),
      ownerTeam: String(r[4] ?? ""),
      riskCategory: rawRiskCategory,
      operationalCategory: mapOperationalCategory(rawRiskCategory),
      threat: String(r[6] ?? ""),
      vulnerability: String(r[7] ?? ""),
      severity: String(r[8] ?? ""),
      riskTitle: String(r[9] ?? ""),
      riskDescription: String(r[10] ?? ""),
      riskDate: excelDateToISO(r[11]) || String(r[11] ?? ""),
      riskRef: "",
      likelihood: Number(r[12]) || 1,
      impactFinance: Number(r[13]) || 1,
      impactRegulatory: Number(r[14]) || 1,
      impactReputational: Number(r[15]) || 1,
      impactSafety: Number(r[16]) || 1,
      impactOperational: Number(r[17]) || 1,
      impactC: Number(r[18]) || 1,
      impactI: Number(r[19]) || 1,
      impactA: Number(r[20]) || 1,
      existingControls: String(r[24] ?? "").replace(/\r\n/g, "; "),
      treatment: String(r[27] ?? ""),
      status: String(r[28] ?? "Open"),
      mitigationActions: String(r[29] ?? "").replace(/\r\n/g, "; "),
      deadline: excelDateToISO(r[30]),
      owner: String(r[31] ?? ""),
    };

    const riskScore = calcRiskScore(base);
    const inherentLevel = scoreToLevel(riskScore);
    const spreadsheetResidual = Number(r[25]) || 0;
    const controlStatus = deriveControlStatus(
      base.existingControls,
      riskScore,
      spreadsheetResidual > 0 ? spreadsheetResidual : riskScore,
    );
    const residualScore = calcResidualScore(riskScore, controlStatus);
    const overallRisk = scoreToLevel(residualScore);
    const rag = ragStatus(residualScore);

    const risk = {
      ...base,
      overallScore: riskScore,
      riskScore,
      inherentLevel,
      controlStatus,
      residualScore,
      overallRisk,
      ragStatus: rag,
      riskSource: "Internal",
      reviewFreq: "Quarterly",
      budget: String(r[23] ?? ""),
      issuesBlockers: "",
      createdAt: new Date().toISOString(),
    };

    try {
      await Risk.findOneAndUpdate(
        { riskId: risk.riskId },
        { $setOnInsert: risk },
        { upsert: true },
      );
      count++;
    } catch (err) {
      logger.warn({ riskId, err }, "Failed to seed individual risk — skipping");
    }
  }

  const total = await Risk.count();
  logger.info({ total, inserted: count }, "Risk register seeding complete");
}

async function seedKpiKriCatalogs() {
  const existingKpis = await KpiCatalog.find().lean();
  if (existingKpis.length > 0) {
    logger.info({ count: existingKpis.length }, "KPI catalogs already present");
    return;
  }

  const now = new Date().toISOString();

  type KpiFreq = "Monthly" | "Weekly" | "Quarterly" | "Daily" | "Annually";
  type KpiCalc = "Manual" | "Calculated" | "Integrated";

  interface KpiSeed { code: string; name: string; description: string; category: string; businessUnit: string; department: string; ownerId: string; frequency: KpiFreq; calculationType: KpiCalc; calculationFormula?: string; targetValue: number; warningThreshold?: number; criticalThreshold?: number; isActive: boolean; version: number; createdAt: string; updatedAt: string; }

  const kpis: KpiSeed[] = [
    { code: "KPI-IT-001", name: "System Uptime", description: "Percentage of core system uptime per month", category: "Cybersecurity", businessUnit: "IT Operations", department: "Infrastructure", ownerId: "IT Director", frequency: "Monthly", calculationType: "Calculated", calculationFormula: "(uptime_hours / total_hours) * 100", targetValue: 99.9, warningThreshold: 99.5, criticalThreshold: 99, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-IT-002", name: "Incident Response Time", description: "Average time to respond to security incidents", category: "Cybersecurity", businessUnit: "IT Operations", department: "SOC", ownerId: "SOC Manager", frequency: "Weekly", calculationType: "Manual", targetValue: 4, warningThreshold: 6, criticalThreshold: 8, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-CMP-001", name: "Compliance Training Completion", description: "Percentage of staff who completed mandatory compliance training", category: "Compliance", businessUnit: "Compliance", department: "Training", ownerId: "CCO", frequency: "Quarterly", calculationType: "Calculated", calculationFormula: "(completed / enrolled) * 100", targetValue: 100, warningThreshold: 90, criticalThreshold: 80, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-CMP-002", name: "Control Testing Coverage", description: "Percentage of controls tested within the review period", category: "Compliance", businessUnit: "Compliance", department: "Internal Audit", ownerId: "Head of Audit", frequency: "Quarterly", calculationType: "Calculated", calculationFormula: "(tested / total_controls) * 100", targetValue: 95, warningThreshold: 85, criticalThreshold: 75, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-TPR-001", name: "Third-Party Risk Assessments Completed", description: "Number of third-party risk assessments completed on time", category: "Third Party Risk", businessUnit: "Procurement", department: "Vendor Management", ownerId: "Procurement Director", frequency: "Monthly", calculationType: "Manual", targetValue: 10, warningThreshold: 7, criticalThreshold: 5, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-OPS-001", name: "Operational Loss Events", description: "Number of operational loss events exceeding threshold", category: "Operational", businessUnit: "Operations", department: "Risk Management", ownerId: "CRO", frequency: "Monthly", calculationType: "Manual", targetValue: 0, warningThreshold: 2, criticalThreshold: 5, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-FIN-001", name: "Regulatory Filing Accuracy", description: "Percentage of regulatory filings submitted without errors", category: "Financial", businessUnit: "Finance", department: "Regulatory Reporting", ownerId: "CFO", frequency: "Quarterly", calculationType: "Calculated", calculationFormula: "(error_free / total_filings) * 100", targetValue: 100, warningThreshold: 98, criticalThreshold: 95, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-LEG-001", name: "Contract Review SLA Compliance", description: "Percentage of contract reviews completed within SLA", category: "Legal", businessUnit: "Legal", department: "Contracts", ownerId: "General Counsel", frequency: "Monthly", calculationType: "Calculated", calculationFormula: "(on_time / total_reviews) * 100", targetValue: 95, warningThreshold: 85, criticalThreshold: 75, isActive: true, version: 1, createdAt: now, updatedAt: now },
    { code: "KPI-STR-001", name: "Risk Register Completeness", description: "Percentage of identified risks with documented controls", category: "Strategic", businessUnit: "Strategy", department: "Enterprise Risk", ownerId: "CRO", frequency: "Quarterly", calculationType: "Calculated", calculationFormula: "(with_controls / total_risks) * 100", targetValue: 90, warningThreshold: 80, criticalThreshold: 70, isActive: true, version: 1, createdAt: now, updatedAt: now },
  ];

  for (const kpi of kpis) {
    await KpiCatalog.create(kpi);
  }
  logger.info({ count: kpis.length }, "KPI catalogs seeded");

  const existingKris = await KriCatalog.find().lean();
  if (existingKris.length > 0) {
    logger.info({ count: existingKris.length }, "KRI catalogs already present");
    return;
  }

  type KriFreq = "Monthly" | "Weekly" | "Quarterly" | "Daily" | "Annually";
  interface KriSeed { code: string; name: string; description: string; riskCategory: string; riskOwnerId: string; frequency: KriFreq; greenMin?: number; greenMax?: number; amberMin?: number; amberMax?: number; redMin?: number; redMax?: number; isActive: boolean; createdAt: string; updatedAt: string; }
  const kris: KriSeed[] = [
    { code: "KRI-CYB-001", name: "Phishing Click Rate", description: "Percentage of employees who clicked on simulated phishing email", riskCategory: "Cybersecurity", riskOwnerId: "CISO", frequency: "Monthly", greenMin: 0, greenMax: 5, amberMin: 5, amberMax: 10, redMin: 10, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-CYB-002", name: "Unpatched Critical Vulnerabilities", description: "Number of critical CVEs exceeding patch SLA", riskCategory: "Cybersecurity", riskOwnerId: "IT Director", frequency: "Weekly", greenMin: 0, greenMax: 0, amberMin: 1, amberMax: 3, redMin: 3, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-CMP-001", name: "Regulatory Breaches", description: "Number of regulatory compliance breaches reported", riskCategory: "Compliance", riskOwnerId: "CCO", frequency: "Monthly", greenMin: 0, greenMax: 0, amberMin: 1, amberMax: 2, redMin: 2, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-CMP-002", name: "Overdue Remediation Actions", description: "Number of compliance remediation actions past due date", riskCategory: "Compliance", riskOwnerId: "CCO", frequency: "Weekly", greenMin: 0, greenMax: 3, amberMin: 3, amberMax: 8, redMin: 8, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-INF-001", name: "Data Breach Incidents", description: "Number of confirmed data breach incidents", riskCategory: "Information Security", riskOwnerId: "CISO", frequency: "Monthly", greenMin: 0, greenMax: 0, amberMin: 1, amberMax: 2, redMin: 2, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-INF-002", name: "Unauthorised Access Attempts", description: "Number of failed authentication attempts on critical systems", riskCategory: "Information Security", riskOwnerId: "SOC Manager", frequency: "Daily", greenMin: 0, greenMax: 10, amberMin: 10, amberMax: 50, redMin: 50, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-TPR-001", name: "Vendor Risk Score", description: "Average risk score of third-party vendors", riskCategory: "Third Party Risk", riskOwnerId: "Procurement Director", frequency: "Quarterly", greenMin: 0, greenMax: 3, amberMin: 3, amberMax: 7, redMin: 7, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-TPR-002", name: "Vendor Incidents", description: "Number of security incidents involving third-party vendors", riskCategory: "Third Party Risk", riskOwnerId: "Procurement Director", frequency: "Monthly", greenMin: 0, greenMax: 0, amberMin: 1, amberMax: 2, redMin: 2, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-OPS-001", name: "Operational Loss Amount", description: "Total operational loss amount in reporting period", riskCategory: "Operational", riskOwnerId: "CRO", frequency: "Monthly", greenMin: 0, greenMax: 10000, amberMin: 10000, amberMax: 50000, redMin: 50000, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-FIN-001", name: "Regulatory Capital Ratio", description: "Current capital adequacy ratio vs regulatory minimum", riskCategory: "Financial", riskOwnerId: "CFO", frequency: "Monthly", greenMin: 14, amberMin: 12, redMin: 10, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-LEG-001", name: "Active Litigation Cases", description: "Number of active legal cases or regulatory actions", riskCategory: "Legal", riskOwnerId: "General Counsel", frequency: "Quarterly", greenMin: 0, greenMax: 3, amberMin: 3, amberMax: 8, redMin: 8, isActive: true, createdAt: now, updatedAt: now },
    { code: "KRI-REP-001", name: "Negative Media Mentions", description: "Number of adverse media mentions or regulatory warnings", riskCategory: "Reputational", riskOwnerId: "Head of Communications", frequency: "Weekly", greenMin: 0, greenMax: 2, amberMin: 2, amberMax: 5, redMin: 5, isActive: true, createdAt: now, updatedAt: now },
  ];

  for (const kri of kris) {
    await KriCatalog.create(kri);
  }
  logger.info({ count: kris.length }, "KRI catalogs seeded");
}

async function seedBankingModules() {
  const existing = await CapitalRatio.find().lean();
  if (existing.length > 0) { logger.info("Banking data already present"); return; }

  /* ── Basel Capital ── */
  for (const r of [
    { name: "CET1 Ratio", value: 13.2, min: 7.0, buffer: 2.5, label: "Common Equity Tier 1", status: "strong" as const },
    { name: "Tier 1 Ratio", value: 14.1, min: 8.5, buffer: 1.5, label: "Tier 1 Capital", status: "strong" as const },
    { name: "Total Capital", value: 16.8, min: 10.5, buffer: 1.0, label: "Total Capital Ratio", status: "strong" as const },
    { name: "Leverage Ratio", value: 5.2, min: 4.0, buffer: 0, label: "Basel III Leverage", status: "adequate" as const },
  ]) { await CapitalRatio.create(r); }

  for (const r of [
    { q: "Q1 25", credit: 42.1, market: 8.3, operational: 12.4 },
    { q: "Q2 25", credit: 43.5, market: 8.7, operational: 12.8 },
    { q: "Q3 25", credit: 44.0, market: 9.1, operational: 13.1 },
    { q: "Q4 25", credit: 45.2, market: 9.4, operational: 13.5 },
    { q: "Q1 26", credit: 46.0, market: 9.6, operational: 13.8 },
    { q: "Q2 26", credit: 46.8, market: 9.9, operational: 14.2 },
  ]) { await RWATrend.create(r); }

  for (const r of [
    { name: "LCR", value: 138, min: 100 },
    { name: "NSFR", value: 112, min: 100 },
  ]) { await LiquidityRatio.create(r); }

  for (const r of [
    { id: "P2-IRRBB", name: "IRRBB — Interest Rate Risk", buffer: 1.2, status: "adequate" as const, last: "2026-03-15" },
    { id: "P2-CONC", name: "Concentration Risk", buffer: 0.8, status: "adequate" as const, last: "2026-03-15" },
    { id: "P2-OPR", name: "Operational Risk", buffer: 0.5, status: "adequate" as const, last: "2026-03-15" },
    { id: "P2-STRESS", name: "Stress Testing Shortfall", buffer: 0.3, status: "low" as const, last: "2026-03-15" },
    { id: "P2-CREDIT", name: "Credit Valuation Adjustment", buffer: 0.4, status: "review" as const, last: "2026-02-28" },
  ]) { await Pillar2Item.create(r); }

  for (const r of [
    { q: "Q1 25", cet1: 12.1, tier1: 13.5, total: 15.2 },
    { q: "Q2 25", cet1: 12.5, tier1: 13.8, total: 15.6 },
    { q: "Q3 25", cet1: 12.3, tier1: 13.6, total: 15.4 },
    { q: "Q4 25", cet1: 12.8, tier1: 14.0, total: 16.1 },
    { q: "Q1 26", cet1: 13.0, tier1: 14.2, total: 16.5 },
    { q: "Q2 26", cet1: 13.2, tier1: 14.1, total: 16.8 },
  ]) { await CapitalTrend.create(r); }

  /* ── Operational Loss ── */
  const lossCats = [
    { id: "EF", name: "External Fraud" },
    { id: "IF", name: "Internal Fraud" },
    { id: "EPWS", name: "Employment Practices & Workplace Safety" },
    { id: "CPBP", name: "Clients, Products & Business Practices" },
    { id: "DPA", name: "Damage to Physical Assets" },
    { id: "BDSF", name: "Business Disruption & System Failures" },
    { id: "EDPM", name: "Execution, Delivery & Process Management" },
  ];
  for (const c of lossCats) { await LossCategory.create(c); }

  const events = [
    { id: "LOS-2026-041", date: "2026-05-28", category: "EF", title: "Phishing Attack — Branch Staff Credentials Compromised", amount: 1850000, recovered: 920000, status: "closed" as const, severity: "high" as const, businessLine: "Retail Banking", rootCause: "Weak email filtering + lack of MFA awareness", nearMiss: false },
    { id: "LOS-2026-040", date: "2026-05-15", category: "EDPM", title: "SWIFT Payment Misrouting — Duplicate Settlement", amount: 1200000, recovered: 1200000, status: "closed" as const, severity: "critical" as const, businessLine: "Corporate Banking", rootCause: "Manual entry error in payment system", nearMiss: false },
    { id: "LOS-2026-039", date: "2026-05-02", category: "CPBP", title: "Inappropriate Investment Product Sale — Elderly Client", amount: 0, recovered: 0, status: "closed" as const, severity: "medium" as const, businessLine: "Wealth Management", rootCause: "Advisor override of suitability flags", nearMiss: true },
    { id: "LOS-2026-038", date: "2026-04-20", category: "BDSF", title: "Core Banking System Outage (4.2 hrs)", amount: 580000, recovered: 180000, status: "closed" as const, severity: "high" as const, businessLine: "Retail Banking", rootCause: "Database corruption during patch deployment", nearMiss: false },
    { id: "LOS-2026-037", date: "2026-04-08", category: "EF", title: "ATM Skimming Ring — 12 Terminals Compromised", amount: 720000, recovered: 310000, status: "open" as const, severity: "high" as const, businessLine: "Retail Banking", rootCause: "3rd-party ATM maintenance vendor access abused", nearMiss: false },
    { id: "LOS-2026-036", date: "2026-03-25", category: "EDPM", title: "Trade Finance Documentation Error — LC Mismatch", amount: 0, recovered: 0, status: "investigating" as const, severity: "medium" as const, businessLine: "Corporate Banking", rootCause: "Incorrect LC terms entered by trade ops", nearMiss: true },
    { id: "LOS-2026-035", date: "2026-03-10", category: "IF", title: "Unauthorised Overtime Claim — Operations Manager", amount: 45000, recovered: 45000, status: "closed" as const, severity: "low" as const, businessLine: "Operations", rootCause: "Manager override of timesheet approvals", nearMiss: false },
    { id: "LOS-2026-034", date: "2026-02-28", category: "DPA", title: "Branch Flood Damage — Nasr City Branch", amount: 620000, recovered: 480000, status: "closed" as const, severity: "medium" as const, businessLine: "Retail Banking", rootCause: "Plumbing failure in upper floor — no water detection", nearMiss: false },
  ];
  for (const e of events) { await LossEvent.create(e); }

  for (const r of [
    { month: "Jan", actual: 0.85, nearMiss: 1 },
    { month: "Feb", actual: 0.62, nearMiss: 0 },
    { month: "Mar", actual: 1.24, nearMiss: 2 },
    { month: "Apr", actual: 1.30, nearMiss: 1 },
    { month: "May", actual: 4.05, nearMiss: 1 },
  ]) { await MonthlyLoss.create(r); }

  /* ── TPRM ── */
  for (const v of [
    { id: "V-001", name: "Temenos T24 Core Banking", category: "Core Infrastructure", tier: 1 as const, country: "Switzerland", riskScore: 28, riskLevel: "low" as const, status: "active" as const, contractExpiry: "2027-06-30", lastAssessment: "2026-05-15", nextAssessment: "2026-11-15", concentration: 85, dataAccess: true, regulatoryApproved: true, controls: { security: 4.5, bcp: 4.0, dataPrivacy: 5.0, financial: 4.5, compliance: 5.0 }, findings: 3, openFindings: 1, subVendors: ["Amazon AWS (EU)", "Oracle DB"], spend: 18.5 },
    { id: "V-002", name: "AWS (EKS, RDS, S3)", category: "Cloud Infrastructure", tier: 1 as const, country: "USA", riskScore: 35, riskLevel: "low" as const, status: "active" as const, contractExpiry: "2027-12-31", lastAssessment: "2026-05-20", nextAssessment: "2026-11-20", concentration: 70, dataAccess: true, regulatoryApproved: true, controls: { security: 4.2, bcp: 4.5, dataPrivacy: 3.8, financial: 4.0, compliance: 4.5 }, findings: 5, openFindings: 2, subVendors: [], spend: 12.0 },
    { id: "V-003", name: "Murex MX.3 (Treasury & Risk)", category: "Core Infrastructure", tier: 1 as const, country: "France", riskScore: 42, riskLevel: "low" as const, status: "active" as const, contractExpiry: "2026-09-30", lastAssessment: "2026-04-10", nextAssessment: "2026-10-10", concentration: 60, dataAccess: true, regulatoryApproved: true, controls: { security: 3.8, bcp: 3.5, dataPrivacy: 4.0, financial: 4.2, compliance: 4.0 }, findings: 7, openFindings: 3, subVendors: ["Refinitiv"], spend: 8.2 },
    { id: "V-004", name: "PostaTrack (Courier & Statements)", category: "Logistics", tier: 2 as const, country: "Egypt", riskScore: 58, riskLevel: "medium" as const, status: "review" as const, contractExpiry: "2026-08-15", lastAssessment: "2026-03-01", nextAssessment: "2026-09-01", concentration: 25, dataAccess: false, regulatoryApproved: false, controls: { security: 2.5, bcp: 2.0, dataPrivacy: 2.8, financial: 3.0, compliance: 2.5 }, findings: 12, openFindings: 6, subVendors: [], spend: 1.8 },
    { id: "V-005", name: "Kaspersky EDR", category: "Cybersecurity", tier: 1 as const, country: "Russia", riskScore: 72, riskLevel: "high" as const, status: "remediation" as const, contractExpiry: "2026-12-31", lastAssessment: "2026-02-20", nextAssessment: "2026-08-20", concentration: 40, dataAccess: true, regulatoryApproved: false, controls: { security: 4.0, bcp: 3.0, dataPrivacy: 2.0, financial: 3.5, compliance: 2.0 }, findings: 15, openFindings: 9, subVendors: [], spend: 3.5 },
    { id: "V-006", name: "OnSolve — CrisisAlert", category: "Communications", tier: 2 as const, country: "USA", riskScore: 22, riskLevel: "low" as const, status: "active" as const, contractExpiry: "2027-03-31", lastAssessment: "2026-06-01", nextAssessment: "2026-12-01", concentration: 15, dataAccess: false, regulatoryApproved: true, controls: { security: 4.0, bcp: 4.5, dataPrivacy: 4.5, financial: 4.0, compliance: 4.5 }, findings: 1, openFindings: 0, subVendors: [], spend: 0.6 },
  ]) { await Vendor.create(v); }

  /* ── Regulatory Calendar ── */
  for (const s of [
    { id: "CBE-Q2-001", title: "CBE Capital Adequacy Report (CAR)", framework: "CBE Circular 7/2015", frequency: "Quarterly" as const, due: "2026-07-15", status: "in-progress" as const, priority: "critical" as const, owner: "Ahmed Abdullah", evidence: 3, desc: "Quarterly capital adequacy report including Basel III transitional arrangements, CET1, Tier 1, and Total Capital ratios as per CBE instructions." },
    { id: "CBE-Q2-002", title: "Liquidity Coverage Ratio (LCR)", framework: "CBE Liquidity Rules 2018", frequency: "Monthly" as const, due: "2026-07-10", status: "pending" as const, priority: "high" as const, owner: "Mariam Youssef", evidence: 2, desc: "Monthly LCR report demonstrating compliance with 100% minimum requirement including HQLA composition and net cash outflows." },
    { id: "CBE-Q2-003", title: "Large Exposures Report", framework: "CBE Circular 14/2012", frequency: "Quarterly" as const, due: "2026-07-20", status: "not-started" as const, priority: "high" as const, owner: "Khaled Hassan", evidence: 0, desc: "Report on all exposures exceeding 10% of eligible capital base as per CBE large exposure limits." },
    { id: "FRA-Q2-001", title: "FATCA/CRS Filing", framework: "OECD CRS / FATCA IGA", frequency: "Annual" as const, due: "2026-06-30", status: "submitted" as const, priority: "critical" as const, owner: "Compliance Team", evidence: 5, desc: "Annual filing of financial account information under FATCA and Common Reporting Standard (CRS) with tax authorities." },
    { id: "CBE-Q2-004", title: "Non-Performing Loans (NPL) Report", framework: "CBE Prudential Rules", frequency: "Monthly" as const, due: "2026-07-05", status: "not-started" as const, priority: "medium" as const, owner: "Hany Farid", evidence: 0, desc: "Monthly NPL ratios, provisions coverage, and movement schedules as per CBE prudential reporting requirements." },
    { id: "FRA-Q2-002", title: "Anti-Money Laundering (AML) Return", framework: "CBE AML Law 80/2002", frequency: "Monthly" as const, due: "2026-07-12", status: "pending" as const, priority: "critical" as const, owner: "AML Officer", evidence: 4, desc: "Monthly AML return including STR counts, SAR reports, suspicious transaction patterns, and KYC exception summaries." },
    { id: "CBE-Q2-005", title: "Financial Soundness Indicators (FSI)", framework: "CBE Prudential Rules", frequency: "Quarterly" as const, due: "2026-07-25", status: "not-started" as const, priority: "medium" as const, owner: "Nadia Kamel", evidence: 0, desc: "Quarterly FSI submission covering capital adequacy, asset quality, profitability, and liquidity metrics." },
    { id: "EGX-Q2-001", title: "Corporate Governance Report", framework: "EGX Listing Rules", frequency: "Annual" as const, due: "2026-08-31", status: "pending" as const, priority: "medium" as const, owner: "Board Secretary", evidence: 1, desc: "Annual corporate governance compliance report for EGX-listed entity including board composition, committees, and related-party transactions." },
    { id: "CBE-Q2-006", title: "Operational Risk Capital Charge", framework: "Basel II AMA / CBE Circular", frequency: "Quarterly" as const, due: "2026-07-30", status: "not-started" as const, priority: "low" as const, owner: "Risk Analytics", evidence: 0, desc: "Quarterly operational risk capital charge calculation under the Advanced Measurement Approach (AMA)." },
    { id: "CBE-Q2-007", title: "Stress Testing Results Pack", framework: "CBE Stress Testing Framework 2023", frequency: "Quarterly" as const, due: "2026-08-15", status: "pending" as const, priority: "high" as const, owner: "Stress Testing Unit", evidence: 2, desc: "Quarterly stress testing results including adverse and severely adverse scenarios, capital impact analysis, and management actions." },
  ]) { await Submission.create(s); }

  /* ── Examination Tracker ── */
  for (const e of [
    { id: "EX-CBE-2026-01", title: "CBE Full-Scope Examination 2026", examiner: "Central Bank of Egypt", startDate: "2026-03-01", endDate: "2026-05-15", type: "full-scope" as const, status: "completed" as const, findings: 5 },
    { id: "EX-CBE-2026-02", title: "CBE Targeted AML/CTF Review", examiner: "Central Bank of Egypt", startDate: "2026-06-01", endDate: "2026-07-15", type: "targeted" as const, status: "in-progress" as const, findings: 3 },
    { id: "EX-IA-2026-01", title: "Internal Audit — IT General Controls", examiner: "Internal Audit", startDate: "2026-04-01", endDate: "2026-04-30", type: "internal-audit" as const, status: "completed" as const, findings: 8 },
    { id: "EX-EXT-2026-01", title: "Ernst & Young — IFRS 9 Impairment Models", examiner: "Ernst & Young", startDate: "2026-05-01", endDate: "2026-06-15", type: "external-audit" as const, status: "completed" as const, findings: 0 },
  ]) { await Examination.create(e); }

  for (const f of [
    { id: "FND-2026-001", examId: "EX-CBE-2026-01", title: "Inadequate Board-level Risk Appetite Framework", category: "Governance", type: "MRA" as const, severity: "critical" as const, status: "open" as const, owner: "CRO", dueDate: "2026-08-01", raised: "2026-04-15", description: "Board risk appetite statement does not include quantitative tolerances for concentration risk and IRRBB.", remediationPlan: "Develop quantitative risk appetite metrics and present to Board Risk Committee for approval.", agingDays: 80, progressPct: 25 },
    { id: "FND-2026-002", examId: "EX-CBE-2026-01", title: "ICAAP Stress Testing Gaps", category: "Risk Management", type: "MRIA" as const, severity: "high" as const, status: "open" as const, owner: "Head of Risk Analytics", dueDate: "2026-09-01", raised: "2026-04-15", description: "ICAAP stress testing scenarios do not adequately cover climate risk and reverse stress testing.", remediationPlan: "Enhance ICAAP framework to include climate risk scenarios and reverse stress testing methodology.", agingDays: 80, progressPct: 40 },
    { id: "FND-2026-003", examId: "EX-CBE-2026-01", title: "AML Transaction Monitoring Tuning", category: "AML/CTF", type: "Requirement" as const, severity: "high" as const, status: "in-progress" as const, owner: "AML Officer", dueDate: "2026-08-15", raised: "2026-04-20", description: "Transaction monitoring rules generating excessive false positives; tuning required to improve detection effectiveness.", remediationPlan: "Engage external consultant to recalibrate monitoring scenarios and thresholds.", agingDays: 75, progressPct: 60 },
    { id: "FND-2026-004", examId: "EX-CBE-2026-01", title: "IT Disaster Recovery Testing Incomplete", category: "IT", type: "Observation" as const, severity: "medium" as const, status: "closed" as const, owner: "IT Director", dueDate: "2026-06-30", raised: "2026-04-15", description: "DR test results for core banking failover not documented for Q1 2026.", remediationPlan: "Complete Q2 DR test and document results by June 30.", agingDays: 0, progressPct: 100 },
    { id: "FND-2026-005", examId: "EX-CBE-2026-01", title: "Third-Party Risk Register Incomplete", category: "Vendor Management", type: "Observation" as const, severity: "medium" as const, status: "closed" as const, owner: "Procurement Director", dueDate: "2026-06-15", raised: "2026-04-15", description: "Risk register missing Tier 2 vendor assessments for 4 critical service providers.", remediationPlan: "Complete risk assessments for all Tier 2 vendors by June 15.", agingDays: 0, progressPct: 100 },
    { id: "FND-2026-006", examId: "EX-CBE-2026-02", title: "PEP Screening Timeliness", category: "AML/CTF", type: "MRA" as const, severity: "high" as const, status: "open" as const, owner: "AML Officer", dueDate: "2026-08-30", raised: "2026-06-10", description: "PEP screening for on-boarded clients exceeding 5-day SLA in 12% of cases.", remediationPlan: "Implement automated PEP screening workflow and reduce SLA to 48 hours.", agingDays: 24, progressPct: 15 },
    { id: "FND-2026-007", examId: "EX-CBE-2026-02", title: "Beneficial Ownership Data Quality", category: "KYC", type: "Requirement" as const, severity: "high" as const, status: "open" as const, owner: "Head of KYC", dueDate: "2026-09-15", raised: "2026-06-10", description: "Beneficial ownership data incomplete for 8% of high-risk corporate accounts.", remediationPlan: "Initiate remediation campaign for high-risk accounts with incomplete BO data.", agingDays: 24, progressPct: 30 },
    { id: "FND-2026-008", examId: "EX-IA-2026-01", title: "Privileged Access Review Not Performed", category: "Access Control", type: "MRA" as const, severity: "critical" as const, status: "open" as const, owner: "IT Security Manager", dueDate: "2026-07-30", raised: "2026-05-01", description: "Quarterly privileged access review not performed for Q1 2026 for 3 critical systems.", remediationPlan: "Perform immediate privileged access review and implement automated quarterly review process.", agingDays: 64, progressPct: 50 },
    { id: "FND-2026-009", examId: "EX-IA-2026-01", title: "Patch Management Gaps", category: "IT Operations", type: "MRIA" as const, severity: "high" as const, status: "in-progress" as const, owner: "IT Director", dueDate: "2026-08-15", raised: "2026-05-01", description: "3 critical security patches exceeded 30-day SLA on production servers.", remediationPlan: "Implement automated patch deployment pipeline with SLA tracking and escalation.", agingDays: 64, progressPct: 65 },
    { id: "FND-2026-010", examId: "EX-IA-2026-01", title: "Database Audit Logs Not Enabled", category: "Security", type: "Requirement" as const, severity: "high" as const, status: "open" as const, owner: "DBA Lead", dueDate: "2026-07-15", raised: "2026-05-01", description: "Database audit logging not enabled for 4 non-production databases containing production data.", remediationPlan: "Enable audit logging for all databases containing production data regardless of environment.", agingDays: 64, progressPct: 75 },
  ]) { await Finding.create(f); }

  /* ── Board Pack ── */
  for (const t of [
    { id: "board-risk", name: "Board Risk Committee Pack", audience: "Board of Directors", frequency: "Quarterly", sections: ["Executive Summary", "Capital Adequacy", "Risk Appetite Dashboard", "Top & Emerging Risks", "KRI Dashboard", "Regulatory Update", "ICAAP Summary"] },
    { id: "board-audit", name: "Board Audit Committee Pack", audience: "Audit Committee", frequency: "Quarterly", sections: ["Internal Audit Activity", "External Audit Update", "Financial Statements", "Regulatory Findings", "Internal Controls Assessment", "Fraud Risk Update"] },
    { id: "board-credit", name: "Credit Committee Pack", audience: "Credit Committee", frequency: "Monthly", sections: ["Credit Portfolio Overview", "Large Exposures", "NPL Movement", "Provisioning Status", "Concentration Analysis", "New Facilities Approved"] },
    { id: "board-brc", name: "Board Risk Committee Summarised Pack", audience: "Board of Directors", frequency: "Quarterly", sections: ["Key Risk Indicators", "Regulatory Capital", "Operational Risk", "Stress Test Results", "Third Party Risk", "Remediation Status"] },
  ]) { await PackTemplate.create(t); }

  for (const m of [
    { subject: "Governance", score: 3.8, target: 4.5 },
    { subject: "Risk Management", score: 4.0, target: 4.5 },
    { subject: "Controls", score: 3.5, target: 4.0 },
    { subject: "Compliance", score: 4.2, target: 4.5 },
    { subject: "Technology", score: 3.2, target: 4.0 },
    { subject: "Resilience", score: 3.6, target: 4.0 },
  ]) { await MaturityDimension.create(m); }

  for (const r of [
    { rank: 1, title: "Cybersecurity / Ransomware Attack", inherent: 80, residual: 52, trend: "up" as const },
    { rank: 2, title: "Credit Deterioration — Corporate Book", inherent: 72, residual: 45, trend: "stable" as const },
    { rank: 3, title: "Regulatory & Compliance — CBE / AML", inherent: 68, residual: 30, trend: "down" as const },
    { rank: 4, title: "Liquidity Stress — Market Volatility", inherent: 55, residual: 35, trend: "stable" as const },
    { rank: 5, title: "Third-Party Concentration Risk", inherent: 50, residual: 38, trend: "up" as const },
  ]) { await TopRisk.create(r); }

  for (const k of [
    { label: "Compliance Score", value: "94.7%", target: "≥ 95%", status: "green" as const, trend: "+2.3%" },
    { label: "Open Regulatory Findings", value: "8", target: "0", status: "red" as const, trend: "+2" },
    { label: "Risk Appetite Utilisation", value: "68%", target: "≤ 75%", status: "green" as const, trend: "+5%" },
    { label: "Capital Adequacy Ratio", value: "16.8%", target: "≥ 12.5%", status: "green" as const, trend: "+0.3%" },
    { label: "Operational Losses (YTD)", value: "EGP 4.05M", target: "≤ EGP 3.0M", status: "red" as const, trend: "+35%" },
    { label: "IT System Availability", value: "99.92%", target: "≥ 99.95%", status: "warning" as const, trend: "-0.02%" },
  ]) { await BKRIRecord.create(k); }

  /* ── AML ── */
  for (const r of [
    { id: "FATF-1", title: "Risk Assessment & Risk-Based Approach (RBA)", category: "General Framework", status: "compliant" as const, risk: "high" as const, controls: 8, tested: 8, lastTest: "2026-05-20", gaps: 0, notes: "Comprehensive entity-wide risk assessment completed Q1 2026." },
    { id: "FATF-2", title: "National Cooperation & Coordination", category: "Institutional Framework", status: "partial" as const, risk: "medium" as const, controls: 5, tested: 3, lastTest: "2026-04-10", gaps: 1, notes: "Information-sharing MOU with EGP not yet finalised." },
    { id: "FATF-3", title: "Money Laundering Offences", category: "Legal Framework", status: "compliant" as const, risk: "medium" as const, controls: 4, tested: 4, lastTest: "2026-03-01", gaps: 0, notes: "All predicate offences covered under AML Law 80/2002 amendments." },
    { id: "FATF-4", title: "Confiscation & Provisional Measures", category: "Legal Framework", status: "compliant" as const, risk: "low" as const, controls: 3, tested: 3, lastTest: "2026-02-15", gaps: 0, notes: "Court orders executed within required timelines." },
    { id: "FATF-5", title: "Terrorist Financing Offences", category: "Legal Framework", status: "compliant" as const, risk: "high" as const, controls: 6, tested: 6, lastTest: "2026-05-01", gaps: 0, notes: "TF offences criminalised in line with international standards." },
    { id: "FATF-6", title: "Targeted Financial Sanctions (TF)", category: "Preventive Measures", status: "partial" as const, risk: "high" as const, controls: 7, tested: 5, lastTest: "2026-04-20", gaps: 2, notes: "Automated sanctions screening in place; manual override process needs strengthening." },
    { id: "FATF-7", title: "Targeted Financial Sanctions (PF)", category: "Preventive Measures", status: "non-compliant" as const, risk: "critical" as const, controls: 4, tested: 1, lastTest: "2026-01-15", gaps: 3, notes: "No dedicated framework for proliferation financing screening." },
    { id: "FATF-8", title: "Non-Profit Organisations (NPO)", category: "Preventive Measures", status: "partial" as const, risk: "high" as const, controls: 5, tested: 3, lastTest: "2026-03-30", gaps: 1, notes: "NPO risk assessment conducted; outreach programme not yet implemented." },
    { id: "FATF-9", title: "Financial Institution Secrecy Laws", category: "Preventive Measures", status: "compliant" as const, risk: "low" as const, controls: 2, tested: 2, lastTest: null, gaps: 0, notes: "No bank secrecy impediment to information sharing." },
    { id: "FATF-10", title: "Customer Due Diligence (CDD)", category: "Preventive Measures", status: "compliant" as const, risk: "high" as const, controls: 12, tested: 11, lastTest: "2026-05-25", gaps: 1, notes: "CDD procedures in place; ongoing CDD for low-risk clients needs automation." },
  ]) { await FATFRecommendation.create(r); }

  for (const s of [
    { month: "Jan", filed: 28, rejected: 3, pending: 5 },
    { month: "Feb", filed: 22, rejected: 2, pending: 4 },
    { month: "Mar", filed: 35, rejected: 5, pending: 7 },
    { month: "Apr", filed: 30, rejected: 4, pending: 6 },
    { month: "May", filed: 42, rejected: 6, pending: 8 },
  ]) { await SARMonthly.create(s); }

  for (const e of [
    { id: "KYC-2026-011", customer: "Corporate Client — Al Nour Trading Co.", risk: "high" as const, issue: "Beneficial ownership documentation incomplete — 3 layers of offshore entities", owner: "Mona A.", raised: "2026-05-10", due: "2026-07-10", status: "in-progress" as const },
    { id: "KYC-2026-012", customer: "High Net Worth Individual — Foreign PEP", risk: "critical" as const, issue: "Source of wealth not adequately documented for real estate portfolio", owner: "KYC Team Lead", raised: "2026-04-20", due: "2026-06-20", status: "overdue" as const },
    { id: "KYC-2026-013", customer: "SME — Delta Agricultural Supplies", risk: "medium" as const, issue: "UBO identified but no supporting ID document on file", owner: "Mona A.", raised: "2026-06-01", due: "2026-08-01", status: "open" as const },
    { id: "KYC-2026-014", customer: "Correspondent Bank — Global Trade Finance Inc.", risk: "high" as const, issue: "Correspondent bank due diligence questionnaire outdated (>18 months)", owner: "Correspondent Banking Team", raised: "2026-05-15", due: "2026-07-15", status: "closed" as const },
  ]) { await KYCException.create(e); }

  for (const s of [
    { segment: "Politically Exposed Persons (PEPs)", count: 47, edd: 47, pending: 2, risk: "high" as const },
    { segment: "High-Risk Jurisdictions (FATF Grey/Black)", count: 23, edd: 23, pending: 1, risk: "critical" as const },
    { segment: "Cash-Intensive Businesses", count: 156, edd: 142, pending: 14, risk: "high" as const },
    { segment: "Non-Resident Accounts", count: 312, edd: 278, pending: 34, risk: "medium" as const },
    { segment: "Correspondent Banking Relationships", count: 28, edd: 28, pending: 3, risk: "high" as const },
  ]) { await HighRiskSegment.create(s); }

  logger.info("Banking modules seeded (Basel, OpLoss, TPRM, RegulatoryCalendar, Examinations, BoardPack, AML)");
}

async function main() {
  await waitForDB();
  await Promise.all([
    seedRisks().catch(e => logger.warn({ err: e }, "Risk seed failed — continuing")),
    seedComplianceData().catch(e => logger.warn({ err: e }, "Compliance seed failed — continuing")),
    seedKpiKriCatalogs().catch(e => logger.warn({ err: e }, "KPI/KRI seed failed — continuing")),
    seedBankingModules().catch(e => logger.warn({ err: e }, "Banking seed failed — continuing")),
  ]);
  logger.info("Database ready");

  startSchedulers();
  logger.info("Background schedulers started");

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error — server may not be fully functional");
});
