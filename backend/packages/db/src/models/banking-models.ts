import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

/* Basel Capital */
export interface ICapitalRatio {
  _id?: string;
  name: string;
  value: number;
  min: number;
  buffer: number;
  label: string;
  status: "strong" | "adequate" | "review" | "breach" | "low";
}
export interface IRWATrend {
  _id?: string;
  q: string;
  credit: number;
  market: number;
  operational: number;
}
export interface ILiquidityRatio {
  _id?: string;
  name: string;
  value: number;
  min: number;
}
export interface IPillar2Item {
  _id?: string;
  id: string;
  name: string;
  buffer: number;
  status: "adequate" | "low" | "review";
  last: string;
}
export interface ICapitalTrend {
  _id?: string;
  q: string;
  cet1: number;
  tier1: number;
  total: number;
}

export const BASEL_EVENT_TYPES = [
  "Internal Fraud",
  "External Fraud",
  "Employment Practices & Workplace Safety",
  "Clients, Products & Business Practices",
  "Damage to Physical Assets",
  "Business Disruption & System Failures",
  "Execution, Delivery & Process Management",
] as const;

export type BaselEventType = (typeof BASEL_EVENT_TYPES)[number];

/* Operational Loss */
export interface ILossCategory {
  _id?: string;
  id: string;
  name: string;
}
export interface ILossEvent {
  _id?: string;
  id: string;
  date: string;
  category: string;
  title: string;
  currency: string;
  amount: number;
  recovered: number;
  netLoss: number;
  status: "open" | "closed" | "remediated";
  severity: "critical" | "high" | "medium" | "low";
  eventType: BaselEventType;
  businessLine: string;
  rootCause: string;
  nearMiss: boolean;
  dateOccurred: string;
  dateDetected: string;
  grossLoss: number;
  riskId: string;
  kriId: string;
  remediationTaskId: string;
  autoLinkedRiskIds: string;
}
export interface IMonthlyLoss {
  _id?: string;
  month: string;
  actual: number;
  nearMiss: number;
}

/* TPRM */
export interface IVendor {
  _id?: string;
  id: string;
  name: string;
  category: string;
  tier: 1 | 2;
  country: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  status: "active" | "review" | "remediation" | "offboarding";
  contractExpiry: string;
  lastAssessment: string;
  nextAssessment: string;
  concentration: number;
  dataAccess: boolean;
  regulatoryApproved: boolean;
  controls: { security: number; bcp: number; dataPrivacy: number; financial: number; compliance: number };
  findings: number;
  openFindings: number;
  subVendors: string[];
  spend: number;
}

/* Regulatory Calendar */
export interface ISubmission {
  _id?: string;
  id: string;
  title: string;
  framework: string;
  frequency: "Quarterly" | "Monthly" | "Annual";
  due: string;
  status: "pending" | "in-progress" | "submitted" | "not-started";
  priority: "critical" | "high" | "medium" | "low";
  owner: string;
  evidence: number;
  desc: string;
}

/* Examination Tracker */
export interface IExamination {
  _id?: string;
  id: string;
  title: string;
  examiner: string;
  startDate: string;
  endDate: string;
  type: "full-scope" | "targeted" | "external-audit" | "internal-audit";
  status: "completed" | "in-progress";
  findings: number;
}
export interface IFinding {
  _id?: string;
  id: string;
  examId: string;
  title: string;
  category: string;
  type: "MRA" | "MRIA" | "Requirement" | "Observation" | "Action Point";
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "closed";
  owner: string;
  dueDate: string;
  raised: string;
  description: string;
  remediationPlan: string;
  agingDays: number;
  progressPct: number;
}

/* Board Pack */
export interface IPackTemplate {
  _id?: string;
  id: string;
  name: string;
  audience: string;
  frequency: string;
  sections: string[];
}
export interface IMaturityDimension {
  _id?: string;
  subject: string;
  score: number;
  target: number;
}
export interface ITopRisk {
  _id?: string;
  rank: number;
  title: string;
  inherent: number;
  residual: number;
  trend: "up" | "stable" | "down";
}
export interface IBKRIRecord {
  _id?: string;
  label: string;
  value: string;
  target: string;
  status: "green" | "warning" | "red";
  trend: string;
}

/* AML */
export interface IFATFRecommendation {
  _id?: string;
  id: string;
  title: string;
  category: string;
  status: "compliant" | "partial" | "non-compliant";
  risk: "critical" | "high" | "medium" | "low";
  controls: number;
  tested: number;
  lastTest: string | null;
  gaps: number;
  notes: string;
}
export interface ISARMonthly {
  _id?: string;
  month: string;
  filed: number;
  rejected: number;
  pending: number;
}
export interface IKYCException {
  _id?: string;
  id: string;
  customer: string;
  issue: string;
  risk: "critical" | "high" | "medium" | "low";
  owner: string;
  raised: string;
  due: string;
  status: "in-progress" | "overdue" | "open" | "closed";
}
export interface IHighRiskSegment {
  _id?: string;
  segment: string;
  count: number;
  edd: number;
  pending: number;
  risk: "critical" | "high" | "medium" | "low";
}

const capitalRatiosCol: StoreCollection<ICapitalRatio> = getCollection<ICapitalRatio>("capital_ratios");
export const CapitalRatio = {
  find: (f?: Partial<ICapitalRatio>) => capitalRatiosCol.find(f),
  create: (d: Partial<ICapitalRatio>) => capitalRatiosCol.create(d),
  findByIdAndUpdate: (id: string, u: Partial<ICapitalRatio>) => capitalRatiosCol.findByIdAndUpdate(id, u),
  findByIdAndDelete: (id: string) => capitalRatiosCol.findByIdAndDelete(id),
};

const rwaTrendCol: StoreCollection<IRWATrend> = getCollection<IRWATrend>("rwa_trend");
export const RWATrend = {
  find: (f?: Partial<IRWATrend>) => rwaTrendCol.find(f),
  create: (d: Partial<IRWATrend>) => rwaTrendCol.create(d),
};

const liquidityRatioCol: StoreCollection<ILiquidityRatio> = getCollection<ILiquidityRatio>("liquidity_ratios");
export const LiquidityRatio = {
  find: (f?: Partial<ILiquidityRatio>) => liquidityRatioCol.find(f),
  create: (d: Partial<ILiquidityRatio>) => liquidityRatioCol.create(d),
};

const pillar2Col: StoreCollection<IPillar2Item> = getCollection<IPillar2Item>("pillar2_items");
export const Pillar2Item = {
  find: (f?: Partial<IPillar2Item>) => pillar2Col.find(f),
  create: (d: Partial<IPillar2Item>) => pillar2Col.create(d),
};

const capitalTrendCol: StoreCollection<ICapitalTrend> = getCollection<ICapitalTrend>("capital_trend");
export const CapitalTrend = {
  find: (f?: Partial<ICapitalTrend>) => capitalTrendCol.find(f),
  create: (d: Partial<ICapitalTrend>) => capitalTrendCol.create(d),
};

const lossCategoryCol: StoreCollection<ILossCategory> = getCollection<ILossCategory>("loss_categories");
export const LossCategory = {
  find: (f?: Partial<ILossCategory>) => lossCategoryCol.find(f),
  create: (d: Partial<ILossCategory>) => lossCategoryCol.create(d),
};

const lossEventCol: StoreCollection<ILossEvent> = getCollection<ILossEvent>("loss_events");
export const LossEvent = {
  find: (f?: Partial<ILossEvent>) => lossEventCol.find(f),
  create: (d: Partial<ILossEvent>) => lossEventCol.create(d),
  findByIdAndUpdate: (id: string, u: Partial<ILossEvent>) => lossEventCol.findByIdAndUpdate(id, u),
  findByIdAndDelete: (id: string) => lossEventCol.findByIdAndDelete(id),
};

const monthlyLossCol: StoreCollection<IMonthlyLoss> = getCollection<IMonthlyLoss>("monthly_losses");
export const MonthlyLoss = {
  find: (f?: Partial<IMonthlyLoss>) => monthlyLossCol.find(f),
  create: (d: Partial<IMonthlyLoss>) => monthlyLossCol.create(d),
};

const vendorCol: StoreCollection<IVendor> = getCollection<IVendor>("vendors");
export const Vendor = {
  find: (f?: Partial<IVendor>) => vendorCol.find(f),
  create: (d: Partial<IVendor>) => vendorCol.create(d),
  findByIdAndUpdate: (id: string, u: Partial<IVendor>) => vendorCol.findByIdAndUpdate(id, u),
  findByIdAndDelete: (id: string) => vendorCol.findByIdAndDelete(id),
};

const submissionCol: StoreCollection<ISubmission> = getCollection<ISubmission>("submissions");
export const Submission = {
  find: (f?: Partial<ISubmission>) => submissionCol.find(f),
  create: (d: Partial<ISubmission>) => submissionCol.create(d),
  findByIdAndUpdate: (id: string, u: Partial<ISubmission>) => submissionCol.findByIdAndUpdate(id, u),
};

const examinationCol: StoreCollection<IExamination> = getCollection<IExamination>("examinations");
export const Examination = {
  find: (f?: Partial<IExamination>) => examinationCol.find(f),
  create: (d: Partial<IExamination>) => examinationCol.create(d),
};

const findingCol: StoreCollection<IFinding> = getCollection<IFinding>("findings");
export const Finding = {
  find: (f?: Partial<IFinding>) => findingCol.find(f),
  create: (d: Partial<IFinding>) => findingCol.create(d),
  findByIdAndUpdate: (id: string, u: Partial<IFinding>) => findingCol.findByIdAndUpdate(id, u),
};

const packTemplateCol: StoreCollection<IPackTemplate> = getCollection<IPackTemplate>("pack_templates");
export const PackTemplate = {
  find: (f?: Partial<IPackTemplate>) => packTemplateCol.find(f),
  create: (d: Partial<IPackTemplate>) => packTemplateCol.create(d),
};

const maturityDimensionCol: StoreCollection<IMaturityDimension> = getCollection<IMaturityDimension>("maturity_dimensions");
export const MaturityDimension = {
  find: (f?: Partial<IMaturityDimension>) => maturityDimensionCol.find(f),
  create: (d: Partial<IMaturityDimension>) => maturityDimensionCol.create(d),
};

const topRiskCol: StoreCollection<ITopRisk> = getCollection<ITopRisk>("top_risks");
export const TopRisk = {
  find: (f?: Partial<ITopRisk>) => topRiskCol.find(f),
  create: (d: Partial<ITopRisk>) => topRiskCol.create(d),
};

const bkriRecordCol: StoreCollection<IBKRIRecord> = getCollection<IBKRIRecord>("bkri_records");
export const BKRIRecord = {
  find: (f?: Partial<IBKRIRecord>) => bkriRecordCol.find(f),
  create: (d: Partial<IBKRIRecord>) => bkriRecordCol.create(d),
};

const fatfRecCol: StoreCollection<IFATFRecommendation> = getCollection<IFATFRecommendation>("fatf_recommendations");
export const FATFRecommendation = {
  find: (f?: Partial<IFATFRecommendation>) => fatfRecCol.find(f),
  create: (d: Partial<IFATFRecommendation>) => fatfRecCol.create(d),
  findByIdAndUpdate: (id: string, u: Partial<IFATFRecommendation>) => fatfRecCol.findByIdAndUpdate(id, u),
};

const sarMonthlyCol: StoreCollection<ISARMonthly> = getCollection<ISARMonthly>("sar_monthly");
export const SARMonthly = {
  find: (f?: Partial<ISARMonthly>) => sarMonthlyCol.find(f),
  create: (d: Partial<ISARMonthly>) => sarMonthlyCol.create(d),
};

const kycExceptionCol: StoreCollection<IKYCException> = getCollection<IKYCException>("kyc_exceptions");
export const KYCException = {
  find: (f?: Partial<IKYCException>) => kycExceptionCol.find(f),
  create: (d: Partial<IKYCException>) => kycExceptionCol.create(d),
  findByIdAndUpdate: (id: string, u: Partial<IKYCException>) => kycExceptionCol.findByIdAndUpdate(id, u),
};

const highRiskSegmentCol: StoreCollection<IHighRiskSegment> = getCollection<IHighRiskSegment>("high_risk_segments");
export const HighRiskSegment = {
  find: (f?: Partial<IHighRiskSegment>) => highRiskSegmentCol.find(f),
  create: (d: Partial<IHighRiskSegment>) => highRiskSegmentCol.create(d),
};
