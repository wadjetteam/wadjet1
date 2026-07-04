import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export interface IFramework {
  _id?: string;
  code: string;
  name: string;
  version: string;
  description: string;
  authority: string;
  domainCount: number;
  controlCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDomain {
  _id?: string;
  frameworkCode: string;
  code: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IControl {
  _id?: string;
  frameworkCode: string;
  domainCode: string;
  controlId: string;
  name: string;
  description: string;
  purpose: string;
  guidance: string;
  weight: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICrossMapping {
  _id?: string;
  sourceFramework: string;
  sourceControlId: string;
  targetFramework: string;
  targetControlId: string;
  mappingType: "Equivalent" | "Related" | "Partial" | "Broader" | "Narrower";
  notes: string;
  createdAt: string;
}

export interface ITripleMapping {
  _id?: string;
  mapId: string;
  isoRef: string;
  category: string;
  isoTitle: string;
  cbeRef: string;
  cbeTitle: string;
  cbeStrength: string;
  pciRef: string;
  pciTitle: string;
  pciStrength: string;
  score: string;
  gapFlag: string;
  rationale: string;
  isoDbControlId: string;
  cbeDbControlId: string;
  pciDbControlId: string;
  isCustom: boolean;
  createdAt: string;
}

export interface IComplianceAssessment {
  _id?: string;
  controlId: string;
  frameworkCode: string;
  status: "Compliant" | "Non-Compliant" | "Partially Compliant" | "Not Assessed" | "Not Applicable";
  score: number;
  evidence: string;
  findings: string;
  remediation: string;
  assessedBy: string;
  assessedAt: string;
  createdAt: string;
  updatedAt: string;
  source?: 'MANUAL' | 'AUTOMATION' | 'OVERRIDE';
  sourceRuleId?: string;
  overrideReason?: string;
  overrideExpiresAt?: string;
}

// ── Evidence Vault ──
export interface IEvidence {
  _id?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  sha256Hash: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED';
  isApproved: boolean;
  deletedAt: string | null;
}

export interface IEvidenceControlMap {
  _id?: string;
  evidenceId: string;
  controlId: string;
  frameworkCode: string;
  mappedBy: string;
  mappedAt: string;
}

export interface IEvidenceAuditLog {
  _id?: string;
  evidenceId: string;
  action: 'UPLOAD' | 'MAP' | 'UNMAP' | 'APPROVE' | 'SOFT_DELETE';
  userId: string;
  timestamp: string;
  metadata: Record<string, any>;
  previousHash: string;
  hash: string;
}

// ── Automation Engine ──
export interface IAutomationRule {
  _id?: string;
  name: string;
  description: string;
  frameworkCode: string;
  controlId: string;
  ruleType: 'CONNECTOR' | 'SCHEDULED';
  isActive: boolean;
  condition: {
    operator: 'AND' | 'OR';
    conditions: Array<{
      field: string;
      operator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN' | 'CONTAINS';
      value: any;
    }>;
  };
  action: {
    compliantStatus: 'Compliant' | 'Non-Compliant';
    score: number;
    notes: string;
  };
  apiConnectorId: string | null;
  schedule: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IApiConnector {
  _id?: string;
  name: string;
  provider: 'AWS' | 'AZURE' | 'OKTA' | 'CUSTOM';
  baseUrl: string;
  authType: 'OAUTH2' | 'API_KEY';
  isActive: boolean;
  createdAt: string;
}

export interface IControlStatusAudit {
  _id?: string;
  controlId: string;
  frameworkCode: string;
  source: 'MANUAL' | 'AUTOMATION' | 'OVERRIDE';
  automationRuleId: string | null;
  status: string;
  score: number;
  overrideReason: string | null;
  overrideExpiresAt: string | null;
  assessedBy: string;
  assessedAt: string;
  previousHash: string;
  hash: string;
}

const frameworkCollection = getCollection<IFramework>("frameworks");
const domainCollection = getCollection<IDomain>("domains");
const controlCollection = getCollection<IControl>("controls");
const crossMappingCollection = getCollection<ICrossMapping>("cross_mappings");
const tripleMappingCollection = getCollection<ITripleMapping>("triple_mappings");
const assessmentCollection = getCollection<IComplianceAssessment>("compliance_assessments");
const evidenceCollection = getCollection<IEvidence>("evidences");
const evidenceMapCollection = getCollection<IEvidenceControlMap>("evidence_control_maps");
const evidenceAuditCollection = getCollection<IEvidenceAuditLog>("evidence_audit_logs");
const automationRuleCollection = getCollection<IAutomationRule>("automation_rules");
const apiConnectorCollection = getCollection<IApiConnector>("api_connectors");
const controlStatusAuditCollection = getCollection<IControlStatusAudit>("control_status_audits");

export const Framework = {
  find: (filter?: Partial<IFramework>) => frameworkCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IFramework>, options?: { new?: boolean }) =>
    frameworkCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => frameworkCollection.findByIdAndDelete(id),
  findOneAndUpdate: (filter: Partial<IFramework>, updateOp: { $setOnInsert: Partial<IFramework> }, options?: { upsert?: boolean }) =>
    frameworkCollection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IFramework>) => frameworkCollection.create(data),
};

export const Domain = {
  find: (filter?: Partial<IDomain>) => domainCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IDomain>, options?: { new?: boolean }) =>
    domainCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => domainCollection.findByIdAndDelete(id),
  findOneAndUpdate: (filter: Partial<IDomain>, updateOp: { $setOnInsert: Partial<IDomain> }, options?: { upsert?: boolean }) =>
    domainCollection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IDomain>) => domainCollection.create(data),
};

export const Control = {
  find: (filter?: Partial<IControl>) => controlCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IControl>, options?: { new?: boolean }) =>
    controlCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => controlCollection.findByIdAndDelete(id),
  findOneAndUpdate: (filter: Partial<IControl>, updateOp: { $setOnInsert: Partial<IControl> }, options?: { upsert?: boolean }) =>
    controlCollection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IControl>) => controlCollection.create(data),
};

export const CrossMapping = {
  find: (filter?: Partial<ICrossMapping>) => crossMappingCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<ICrossMapping>, options?: { new?: boolean }) =>
    crossMappingCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => crossMappingCollection.findByIdAndDelete(id),
  findOneAndUpdate: (filter: Partial<ICrossMapping>, updateOp: { $setOnInsert: Partial<ICrossMapping> }, options?: { upsert?: boolean }) =>
    crossMappingCollection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<ICrossMapping>) => crossMappingCollection.create(data),
};

export const TripleMapping = {
  find: (filter?: Partial<ITripleMapping>) => tripleMappingCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<ITripleMapping>, options?: { new?: boolean }) =>
    tripleMappingCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => tripleMappingCollection.findByIdAndDelete(id),
  create: (data: Partial<ITripleMapping>) => tripleMappingCollection.create(data),
};

export const ComplianceAssessment = {
  find: (filter?: Partial<IComplianceAssessment>) => assessmentCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IComplianceAssessment>, options?: { new?: boolean }) =>
    assessmentCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => assessmentCollection.findByIdAndDelete(id),
  findOneAndUpdate: (filter: Partial<IComplianceAssessment>, updateOp: { $setOnInsert: Partial<IComplianceAssessment> }, options?: { upsert?: boolean }) =>
    assessmentCollection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IComplianceAssessment>) => assessmentCollection.create(data),
};

export const Evidence = {
  find: (filter?: Partial<IEvidence>) => evidenceCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IEvidence>, options?: { new?: boolean }) =>
    evidenceCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => evidenceCollection.findByIdAndDelete(id),
  create: (data: Partial<IEvidence>) => evidenceCollection.create(data),
};

export const EvidenceControlMap = {
  find: (filter?: Partial<IEvidenceControlMap>) => evidenceMapCollection.find(filter),
  create: (data: Partial<IEvidenceControlMap>) => evidenceMapCollection.create(data),
};

export const EvidenceAuditLog = {
  find: (filter?: Partial<IEvidenceAuditLog>) => evidenceAuditCollection.find(filter),
  create: (data: Partial<IEvidenceAuditLog>) => evidenceAuditCollection.create(data),
};

export const AutomationRule = {
  find: (filter?: Partial<IAutomationRule>) => automationRuleCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IAutomationRule>, options?: { new?: boolean }) =>
    automationRuleCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => automationRuleCollection.findByIdAndDelete(id),
  create: (data: Partial<IAutomationRule>) => automationRuleCollection.create(data),
};

export const ApiConnector = {
  find: (filter?: Partial<IApiConnector>) => apiConnectorCollection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IApiConnector>, options?: { new?: boolean }) =>
    apiConnectorCollection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => apiConnectorCollection.findByIdAndDelete(id),
  create: (data: Partial<IApiConnector>) => apiConnectorCollection.create(data),
};

export const ControlStatusAudit = {
  find: (filter?: Partial<IControlStatusAudit>) => controlStatusAuditCollection.find(filter),
  create: (data: Partial<IControlStatusAudit>) => controlStatusAuditCollection.create(data),
};
