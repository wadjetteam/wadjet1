import {
  Risk,
  calcRiskScore, scoreToLevel, calcResidualScore, ragStatus,
  mapOperationalCategory, deriveControlStatus,
  CapitalRatio, RWATrend, LiquidityRatio, Pillar2Item, CapitalTrend,
  LossCategory, LossEvent, MonthlyLoss,
  Vendor, Submission, Examination, Finding,
} from "@workspace/db";
import { logger } from "./config/logger";
import path from "path";
import { fileURLToPath } from "url";

function excelDateToISO(v: unknown): string | null {
  if (!v || typeof v !== "number") return null;
  return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
}

function parseRiskRow(r: unknown[]) {
  const rawRiskCategory = String(r[5] ?? "");
  return {
    riskId: String(r[0] ?? ""),
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
}

async function upsertRisk(base: ReturnType<typeof parseRiskRow>, spreadsheetResidual: number) {
  const riskScore = calcRiskScore(base);
  const inherentLevel = scoreToLevel(riskScore);
  const residualRef = spreadsheetResidual > 0 ? spreadsheetResidual : riskScore;
  const controlStatus = deriveControlStatus(base.existingControls, riskScore, residualRef);
  const residualScore = calcResidualScore(riskScore, controlStatus);

  try {
    await Risk.findOneAndUpdate(
      { riskId: base.riskId },
      { $setOnInsert: {
        ...base, overallScore: riskScore, riskScore, inherentLevel, controlStatus,
        residualScore, overallRisk: scoreToLevel(residualScore), ragStatus: ragStatus(residualScore),
        riskSource: "Internal", reviewFreq: "Quarterly", budget: "",
        issuesBlockers: "", createdAt: new Date().toISOString(),
      }},
      { upsert: true },
    );
    return true;
  } catch (err) {
    logger.warn({ riskId: base.riskId, err }, "Failed to seed risk");
    return false;
  }
}

export async function seedRisks() {
  const existing = await Risk.find().lean();
  if (existing.length > 0) {
    logger.info({ count: existing.length }, "Risks already seeded");
    return;
  }

  const xlsxPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../attached_assets/Risk_Assessment_v3 (1).xlsx",
  );

  let rows: unknown[][];
  try {
    const xlsx = await import("xlsx");
    const workbook = xlsx.default.readFile(xlsxPath);
    const ws = workbook.Sheets["Risk Rigister"];
    if (!ws) { logger.warn("Sheet not found"); return; }
    const data: unknown[][] = xlsx.default.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
    rows = data.slice(3).filter((r: any) => r[0] && String(r[0]).startsWith("R-"));
    if (rows.length === 0) { logger.warn("No risk rows found"); return; }
  } catch (err) {
    logger.warn({ err }, "Could not parse risk spreadsheet");
    return;
  }

  let count = 0;
  for (const r of rows) {
    const base = parseRiskRow(r);
    const spreadsheetResidual = Number(r[25]) || 0;
    const inserted = await upsertRisk(base, spreadsheetResidual);
    if (inserted) count++;
  }

  logger.info({ total: await Risk.count(), inserted: count }, "Risk seeding complete");
}

async function seedCapitalRatios() {
  const data = [
    { name: "CET1 Ratio", value: 13.2, min: 7.0, buffer: 2.5, label: "Common Equity Tier 1", status: "strong" as const },
    { name: "Tier 1 Ratio", value: 14.1, min: 8.5, buffer: 1.5, label: "Tier 1 Capital", status: "strong" as const },
    { name: "Total Capital", value: 16.8, min: 10.5, buffer: 1.0, label: "Total Capital Ratio", status: "strong" as const },
  ];
  for (const r of data) await CapitalRatio.create(r);
}

async function seedRWATrends() {
  const data = [
    { q: "Q1 25", credit: 42.1, market: 8.3, operational: 12.4 },
    { q: "Q2 25", credit: 43.5, market: 8.7, operational: 12.8 },
    { q: "Q3 25", credit: 44.0, market: 9.1, operational: 13.1 },
    { q: "Q4 25", credit: 45.2, market: 9.4, operational: 13.5 },
    { q: "Q1 26", credit: 46.0, market: 9.6, operational: 13.8 },
    { q: "Q2 26", credit: 46.8, market: 9.9, operational: 14.2 },
  ];
  for (const r of data) await RWATrend.create(r);
}

async function seedLiquidityRatios() {
  for (const r of [{ name: "LCR", value: 138, min: 100 }, { name: "NSFR", value: 112, min: 100 }])
    await LiquidityRatio.create(r);
}

async function seedPillar2() {
  const data = [
    { id: "P2-IRRBB", name: "IRRBB — Interest Rate Risk", buffer: 1.2, status: "adequate" as const, last: "2026-03-15" },
    { id: "P2-CONC", name: "Concentration Risk", buffer: 0.8, status: "adequate" as const, last: "2026-03-15" },
  ];
  for (const r of data) await Pillar2Item.create(r);
}

async function seedCapitalTrends() {
  const data = [
    { q: "Q1 25", cet1: 12.1, tier1: 13.5, total: 15.2 },
    { q: "Q2 25", cet1: 12.5, tier1: 13.8, total: 15.6 },
  ];
  for (const r of data) await CapitalTrend.create(r);
}

async function seedLossCategories() {
  const data = [
    { id: "EF", name: "External Fraud" },
    { id: "IF", name: "Internal Fraud" },
    { id: "CPBP", name: "Clients, Products & Business Practices" },
    { id: "BDSF", name: "Business Disruption & System Failures" },
    { id: "EDPM", name: "Execution, Delivery & Process Management" },
  ];
  for (const c of data) await LossCategory.create(c);
}

async function seedLossEvents() {
  const data = [
    { id: "LOS-2026-041", date: "2026-05-28", category: "EF", title: "Phishing Attack — Branch Staff Credentials Compromised", amount: 1_850_000, recovered: 920_000, status: "closed" as const, severity: "high" as const, businessLine: "Retail Banking", rootCause: "Weak email filtering", nearMiss: false },
    { id: "LOS-2026-040", date: "2026-05-15", category: "EDPM", title: "SWIFT Payment Misrouting", amount: 1_200_000, recovered: 1_200_000, status: "closed" as const, severity: "critical" as const, businessLine: "Corporate Banking", rootCause: "Manual entry error", nearMiss: false },
    { id: "LOS-2026-038", date: "2026-04-20", category: "BDSF", title: "Core Banking System Outage (4.2 hrs)", amount: 580_000, recovered: 180_000, status: "closed" as const, severity: "high" as const, businessLine: "Retail Banking", rootCause: "Database corruption", nearMiss: false },
    { id: "LOS-2026-037", date: "2026-04-08", category: "EF", title: "ATM Skimming Ring — 12 Terminals Compromised", amount: 720_000, recovered: 310_000, status: "open" as const, severity: "high" as const, businessLine: "Retail Banking", rootCause: "3rd-party vendor access abused", nearMiss: false },
  ];
  for (const e of data) await LossEvent.create(e);
}

async function seedMonthlyLosses() {
  const data = [
    { month: "Apr", actual: 1.30, nearMiss: 1 },
    { month: "May", actual: 4.05, nearMiss: 1 },
  ];
  for (const r of data) await MonthlyLoss.create(r);
}

async function seedVendors() {
  const data = [
    { id: "V-001", name: "Temenos T24 Core Banking", category: "Core Infrastructure", tier: 1 as const, country: "Switzerland", riskScore: 28, riskLevel: "low" as const, status: "active" as const, contractExpiry: "2027-06-30", lastAssessment: "2026-05-15", nextAssessment: "2026-11-15", concentration: 85, dataAccess: true, regulatoryApproved: true, controls: { security: 4.5, bcp: 4.0, dataPrivacy: 5.0, financial: 4.5, compliance: 5.0 }, findings: 3, openFindings: 1, spend: 18.5 },
    { id: "V-002", name: "AWS (EKS, RDS, S3)", category: "Cloud Infrastructure", tier: 1 as const, country: "USA", riskScore: 35, riskLevel: "low" as const, status: "active" as const, contractExpiry: "2027-12-31", lastAssessment: "2026-05-20", nextAssessment: "2026-11-20", concentration: 70, dataAccess: true, regulatoryApproved: true, controls: { security: 4.2, bcp: 4.5, dataPrivacy: 3.8, financial: 4.0, compliance: 4.5 }, findings: 5, openFindings: 2, spend: 12.0 },
    { id: "V-003", name: "Murex MX.3 (Treasury & Risk)", category: "Core Infrastructure", tier: 1 as const, country: "France", riskScore: 42, riskLevel: "low" as const, status: "active" as const, contractExpiry: "2026-09-30", lastAssessment: "2026-04-10", nextAssessment: "2026-10-10", concentration: 60, dataAccess: true, regulatoryApproved: true, controls: { security: 3.8, bcp: 3.5, dataPrivacy: 4.0, financial: 4.2, compliance: 4.0 }, findings: 7, openFindings: 3, spend: 8.2 },
  ];
  for (const v of data) await Vendor.create(v);
}

async function seedSubmissions() {
  const data = [
    { id: "CBE-Q2-001", title: "CBE Capital Adequacy Report (CAR)", framework: "CBE Circular 7/2015", frequency: "Quarterly" as const, due: "2026-07-15", status: "in-progress" as const, priority: "critical" as const, owner: "Ahmed Abdullah", evidence: 3, desc: "Quarterly capital adequacy report." },
    { id: "CBE-Q2-002", title: "Liquidity Coverage Ratio (LCR)", framework: "CBE Liquidity Rules 2018", frequency: "Monthly" as const, due: "2026-07-10", status: "pending" as const, priority: "high" as const, owner: "Mariam Youssef", evidence: 2, desc: "Monthly LCR report." },
  ];
  for (const s of data) await Submission.create(s);
}

async function seedExaminations() {
  const data = [
    { id: "EX-CBE-2026-01", title: "CBE Full-Scope Examination 2026", examiner: "Central Bank of Egypt", startDate: "2026-03-01", endDate: "2026-05-15", type: "full-scope" as const, status: "completed" as const, findings: 5 },
    { id: "EX-CBE-2026-02", title: "CBE Targeted AML/CTF Review", examiner: "Central Bank of Egypt", startDate: "2026-06-01", endDate: "2026-07-15", type: "targeted" as const, status: "in-progress" as const, findings: 3 },
  ];
  for (const e of data) await Examination.create(e);
}

async function seedFindings() {
  const data = [
    { id: "FND-2026-001", examId: "EX-CBE-2026-01", title: "Inadequate Board-level Risk Appetite Framework", category: "Governance", type: "MRA" as const, severity: "critical" as const, status: "open" as const, owner: "CRO", dueDate: "2026-08-01", raised: "2026-04-15", description: "Board risk appetite statement lacks quantitative tolerances.", remediationPlan: "Develop quantitative risk appetite metrics.", agingDays: 80, progressPct: 25 },
    { id: "FND-2026-002", examId: "EX-CBE-2026-01", title: "ICAAP Stress Testing Gaps", category: "Risk Management", type: "MRIA" as const, severity: "high" as const, status: "open" as const, owner: "Head of Risk Analytics", dueDate: "2026-09-01", raised: "2026-04-15", description: "ICAAP scenarios lack climate risk coverage.", remediationPlan: "Enhance ICAAP framework.", agingDays: 80, progressPct: 40 },
  ];
  for (const f of data) await Finding.create(f);
}

export async function seedBankingModules() {
  const existing = await CapitalRatio.find().lean();
  if (existing.length > 0) { logger.info("Banking data already present"); return; }

  await seedCapitalRatios();
  await seedRWATrends();
  await seedLiquidityRatios();
  await seedPillar2();
  await seedCapitalTrends();
  await seedLossCategories();
  await seedLossEvents();
  await seedMonthlyLosses();
  await seedVendors();
  await seedSubmissions();
  await seedExaminations();
  await seedFindings();

  logger.info("Banking modules seeded (capital, op-loss, TPRM, calendar, examinations)");
}
