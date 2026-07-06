import { z } from "zod";
import { BASEL_EVENT_TYPES } from "../models/banking-models";

export const insertCapitalRatioSchema = z.object({
  name: z.string().max(100),
  value: z.number(),
  min: z.number(),
  buffer: z.number(),
  label: z.string().max(200),
  status: z.enum(["strong", "adequate", "review", "breach", "low"]),
});
export const insertRWATrendSchema = z.object({
  q: z.string().max(10),
  credit: z.number(),
  market: z.number(),
  operational: z.number(),
});
export const insertLiquidityRatioSchema = z.object({
  name: z.string().max(100),
  value: z.number(),
  min: z.number(),
});
export const insertPillar2ItemSchema = z.object({
  id: z.string().max(20),
  name: z.string().max(200),
  buffer: z.number(),
  status: z.enum(["adequate", "low", "review"]),
  last: z.string(),
});
export const insertCapitalTrendSchema = z.object({
  q: z.string().max(10),
  cet1: z.number(),
  tier1: z.number(),
  total: z.number(),
});

export const insertLossCategorySchema = z.object({
  id: z.string().max(10),
  name: z.string().max(100),
});
export const insertLossEventSchema = z.object({
  id: z.string().max(20),
  date: z.string(),
  category: z.string().max(10),
  title: z.string().max(300),
  currency: z.string().max(3).default("EGP"),
  amount: z.number(),
  recovered: z.number(),
  netLoss: z.number(),
  status: z.enum(["open", "closed", "remediated"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  eventType: z.enum(BASEL_EVENT_TYPES),
  businessLine: z.string().max(100),
  rootCause: z.string().max(500),
  nearMiss: z.boolean(),
  dateOccurred: z.string(),
  dateDetected: z.string(),
  grossLoss: z.number(),
  riskId: z.string().default(""),
  kriId: z.string().default(""),
  remediationTaskId: z.string().default(""),
  autoLinkedRiskIds: z.string().default(""),
});
export const updateLossEventSchema = insertLossEventSchema.partial();
export const insertMonthlyLossSchema = z.object({
  month: z.string().max(10),
  actual: z.number(),
  nearMiss: z.number(),
});

export const insertVendorSchema = z.object({
  id: z.string().max(10),
  name: z.string().max(200),
  category: z.string().max(100),
  tier: z.union([z.literal(1), z.literal(2)]),
  country: z.string().max(100),
  riskScore: z.number(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["active", "review", "remediation", "offboarding"]),
  contractExpiry: z.string(),
  lastAssessment: z.string(),
  nextAssessment: z.string(),
  concentration: z.number().min(0).max(100),
  dataAccess: z.boolean(),
  regulatoryApproved: z.boolean(),
  controls: z.object({
    security: z.number(),
    bcp: z.number(),
    dataPrivacy: z.number(),
    financial: z.number(),
    compliance: z.number(),
  }),
  findings: z.number(),
  openFindings: z.number(),
  subVendors: z.array(z.string()),
  spend: z.number(),
});
export const updateVendorSchema = insertVendorSchema.partial();

export const insertSubmissionSchema = z.object({
  id: z.string().max(20),
  title: z.string().max(300),
  framework: z.string().max(200),
  frequency: z.enum(["Quarterly", "Monthly", "Annual"]),
  due: z.string(),
  status: z.enum(["pending", "in-progress", "submitted", "not-started"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  owner: z.string().max(100),
  evidence: z.number(),
  desc: z.string().max(1000),
});
export const updateSubmissionSchema = insertSubmissionSchema.partial();

export const insertExaminationSchema = z.object({
  id: z.string().max(20),
  title: z.string().max(300),
  examiner: z.string().max(200),
  startDate: z.string(),
  endDate: z.string(),
  type: z.enum(["full-scope", "targeted", "external-audit", "internal-audit"]),
  status: z.enum(["completed", "in-progress"]),
  findings: z.number(),
});
export const insertFindingSchema = z.object({
  id: z.string().max(20),
  examId: z.string().max(20),
  title: z.string().max(300),
  category: z.string().max(100),
  type: z.enum(["MRA", "MRIA", "Requirement", "Observation", "Action Point"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum(["open", "in-progress", "closed"]),
  owner: z.string().max(100),
  dueDate: z.string(),
  raised: z.string(),
  description: z.string().max(2000),
  remediationPlan: z.string().max(2000),
  agingDays: z.number(),
  progressPct: z.number().min(0).max(100),
});
export const updateFindingSchema = insertFindingSchema.partial();

export const insertPackTemplateSchema = z.object({
  id: z.string().max(20),
  name: z.string().max(200),
  audience: z.string().max(200),
  frequency: z.string().max(50),
  sections: z.array(z.string()),
});
export const insertMaturityDimensionSchema = z.object({
  subject: z.string().max(100),
  score: z.number(),
  target: z.number(),
});
export const insertTopRiskSchema = z.object({
  rank: z.number(),
  title: z.string().max(300),
  inherent: z.number(),
  residual: z.number(),
  trend: z.enum(["up", "stable", "down"]),
});
export const insertBKRIRecordSchema = z.object({
  label: z.string().max(200),
  value: z.string().max(50),
  target: z.string().max(50),
  status: z.enum(["green", "warning", "red"]),
  trend: z.string().max(20),
});

export const insertFATFRecommendationSchema = z.object({
  id: z.string().max(20),
  title: z.string().max(300),
  category: z.string().max(100),
  status: z.enum(["compliant", "partial", "non-compliant"]),
  risk: z.enum(["critical", "high", "medium", "low"]),
  controls: z.number(),
  tested: z.number(),
  lastTest: z.string().nullable(),
  gaps: z.number(),
  notes: z.string().max(1000),
});
export const updateFATFRecommendationSchema = insertFATFRecommendationSchema.partial();
export const insertSARMonthlySchema = z.object({
  month: z.string().max(10),
  filed: z.number(),
  rejected: z.number(),
  pending: z.number(),
});
export const insertKYCExceptionSchema = z.object({
  id: z.string().max(20),
  customer: z.string().max(200),
  issue: z.string().max(500),
  risk: z.enum(["critical", "high", "medium", "low"]),
  owner: z.string().max(100),
  raised: z.string(),
  due: z.string(),
  status: z.enum(["in-progress", "overdue", "open", "closed"]),
});
export const updateKYCExceptionSchema = insertKYCExceptionSchema.partial();
export const insertHighRiskSegmentSchema = z.object({
  segment: z.string().max(200),
  count: z.number(),
  edd: z.number(),
  pending: z.number(),
  risk: z.enum(["critical", "high", "medium", "low"]),
});
