import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export const CONTROL_STATUSES = [
  "Implemented",
  "Partially Implemented",
  "Planned",
  "None",
] as const;

export const CONTROL_EFFECTIVENESS_MAP: Record<string, number> = {
  "Implemented": 0.95,
  "Partially Implemented": 0.50,
  "Planned": 0.20,
  "None": 0.00,
};

export type ControlStatus = (typeof CONTROL_STATUSES)[number];

/* ── Basel III Operational Loss Taxonomy Map ── */
export const TAXONOMY_MAP: Record<string, string> = {
  "Cybersecurity": "External Fraud",
  "Information Security": "External Fraud",
  "Cloud Security": "External Fraud",
  "Application Security": "External Fraud",
  "Application Security / Mobile": "External Fraud",
  "Third Party Risk / Cybersecurity": "External Fraud",
  "Cybersecurity / Fraud": "External Fraud",
  "Physical Security / Fraud": "External Fraud",
  "Compliance": "Clients, Products & Business Practices",
  "Compliance / Legal": "Clients, Products & Business Practices",
  "Compliance / Cybersecurity": "Clients, Products & Business Practices",
  "Operational": "Business Disruption & System Failures",
  "Operational / Third Party": "Business Disruption & System Failures",
  "Operational / BCP": "Business Disruption & System Failures",
  "Business Continuity": "Business Disruption & System Failures",
  "Risk Management": "Business Disruption & System Failures",
  "Emerging Technology / AI": "Business Disruption & System Failures",
  "Human Risk": "Employment Practices & Workplace Safety",
  "Human Risk / Security Monitoring": "Employment Practices & Workplace Safety",
  "Human Risk / Emerging Technology": "Employment Practices & Workplace Safety",
  "Physical Security": "Damage to Physical Assets",
  "Third Party Risk": "Execution, Delivery & Process Management",
};

export function mapOperationalCategory(riskCategory: string): string {
  const normalized = riskCategory.trim();
  return TAXONOMY_MAP[normalized] ?? "Execution, Delivery & Process Management";
}

export function deriveControlStatus(existingControls: string, riskScore: number, residualScore: number): ControlStatus {
  if (!existingControls || existingControls === "") return "None";
  if (residualScore <= 1) return "Implemented";
  let closest: ControlStatus = CONTROL_STATUSES[0];
  let closestDiff = Infinity;
  for (const status of CONTROL_STATUSES) {
    const computed = calcResidualScore(riskScore, status);
    const diff = Math.abs(computed - residualScore);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = status as ControlStatus;
    }
  }
  return closest;
}

export interface IRisk {
  _id?: string;
  riskId: string;
  process: string;
  subProcess: string;
  assetSystem: string;
  ownerTeam: string;
  riskCategory: string;
  operationalCategory: string;
  threat: string;
  vulnerability: string;
  severity: string;
  riskTitle: string;
  riskDescription: string;
  riskRef: string;
  likelihood: number;
  impactFinance: number;
  impactRegulatory: number;
  impactReputational: number;
  impactSafety: number;
  impactOperational: number;
  impactC: number;
  impactI: number;
  impactA: number;
  overallScore: number;
  riskScore: number;
  inherentLevel: string;
  controlStatus: ControlStatus;
  existingControls: string;
  residualScore: number;
  overallRisk: string;
  ragStatus: string;
  treatment: string;
  status: string;
  mitigationActions: string;
  deadline: string | null;
  owner: string;
  riskDate: string;
  riskSource: string;
  reviewFreq: string;
  budget: string;
  issuesBlockers: string;
  createdAt: string;
}

const collection: StoreCollection<IRisk> = getCollection<IRisk>("risks");

/* ── Equation 1: Max Impact (Weighted Blend: 70% Max + 30% Avg) ── */
export function calcMaxImpact(f: {
  impactFinance?: number; impactRegulatory?: number; impactReputational?: number;
  impactSafety?: number; impactOperational?: number; impactC?: number;
  impactI?: number; impactA?: number;
}): number {
  const values = [
    f.impactFinance, f.impactRegulatory, f.impactReputational,
    f.impactSafety, f.impactOperational,
    f.impactC, f.impactI, f.impactA,
  ].filter((v): v is number => v !== undefined);
  if (values.length === 0) return 1;
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(0.7 * max + 0.3 * avg);
}

/* ── Equation 2: Inherent Risk Score ── */
export function calcRiskScore(f: {
  likelihood?: number;
  impactFinance?: number; impactRegulatory?: number; impactReputational?: number;
  impactSafety?: number; impactOperational?: number; impactC?: number;
  impactI?: number; impactA?: number;
}): number {
  return Math.round((f.likelihood ?? 1) * calcMaxImpact(f));
}

/* ── Equation 3: Inherent Level ── */
export function scoreToLevel(s: number): string {
  return s >= 15 ? 'Critical' : s >= 10 ? 'High' : s >= 5 ? 'Medium' : 'Low';
}

/* ── Equation 6: Scientific Residual Risk ── */
export function calcResidualScore(riskScore: number, controlStatus?: string): number {
  const effectiveness = CONTROL_EFFECTIVENESS_MAP[controlStatus ?? "None"] ?? 0.0;
  return Math.round(Math.max(1, riskScore * (1 - effectiveness)));
}

/* ── Equation 4: RAG Status ── */
export function ragStatus(s: number): string {
  return s >= 15 ? '🔴' : s >= 10 ? '🟡' : '🟢';
}

export const Risk = {
  find: (filter?: Partial<IRisk>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IRisk>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IRisk>,
    updateOp: { $setOnInsert: Partial<IRisk> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IRisk>) => collection.create(data),
  count: () => collection.count(),
};
