import { z } from "zod";

export const insertFrameworkSchema = z.object({
  code: z.string().max(20),
  name: z.string().max(255),
  version: z.string().max(50),
  description: z.string().default(""),
  authority: z.string().max(255).default(""),
  domainCount: z.number().int().default(0),
  controlCount: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const insertDomainSchema = z.object({
  frameworkCode: z.string().max(20),
  code: z.string().max(20),
  name: z.string().max(255),
  description: z.string().default(""),
  order: z.number().int().default(0),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const insertControlSchema = z.object({
  frameworkCode: z.string().max(20),
  domainCode: z.string().max(20),
  controlId: z.string().max(20),
  name: z.string().max(255),
  description: z.string().default(""),
  purpose: z.string().default(""),
  guidance: z.string().default(""),
  weight: z.number().int().default(1),
  order: z.number().int().default(0),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const insertCrossMappingSchema = z.object({
  sourceFramework: z.string().max(20),
  sourceControlId: z.string().max(20),
  targetFramework: z.string().max(20),
  targetControlId: z.string().max(20),
  mappingType: z.enum(["Equivalent", "Related", "Partial", "Broader", "Narrower"]).default("Related"),
  notes: z.string().default(""),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const insertComplianceAssessmentSchema = z.object({
  controlId: z.string(),
  frameworkCode: z.string().max(20),
  status: z.enum(["Compliant", "Non-Compliant", "Partially Compliant", "Not Assessed", "Not Applicable"]).default("Not Assessed"),
  score: z.number().int().min(0).max(100).default(0),
  evidence: z.string().default(""),
  findings: z.string().default(""),
  remediation: z.string().default(""),
  assessedBy: z.string().default(""),
  assessedAt: z.string().default(""),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
  source: z.enum(['MANUAL', 'AUTOMATION', 'OVERRIDE']).default('MANUAL'),
  sourceRuleId: z.string().optional(),
  overrideReason: z.string().optional(),
  overrideExpiresAt: z.string().optional(),
});

// ── Evidence Vault Schemas ──
export const insertEvidenceSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  storagePath: z.string(),
  sha256Hash: z.string(),
  uploadedBy: z.string().default("system"),
  uploadedAt: z.string().default(() => new Date().toISOString()),
  status: z.enum(['PENDING', 'UPLOADED', 'VERIFIED']).default('UPLOADED'),
  isApproved: z.boolean().default(false),
  deletedAt: z.string().nullable().default(null),
});

export const insertEvidenceControlMapSchema = z.object({
  evidenceId: z.string(),
  controlId: z.string(),
  frameworkCode: z.string(),
  mappedBy: z.string(),
  mappedAt: z.string().default(() => new Date().toISOString()),
});

export const insertEvidenceAuditLogSchema = z.object({
  evidenceId: z.string(),
  action: z.enum(['UPLOAD', 'MAP', 'UNMAP', 'APPROVE', 'SOFT_DELETE']),
  userId: z.string(),
  timestamp: z.string().default(() => new Date().toISOString()),
  metadata: z.record(z.any()).default({}),
  previousHash: z.string().default(""),
  hash: z.string(),
});

// ── Automation Engine Schemas ──
export const conditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'CONTAINS']),
  value: z.any(),
});

export const insertAutomationRuleSchema = z.object({
  name: z.string(),
  description: z.string().default(""),
  frameworkCode: z.string(),
  controlId: z.string(),
  ruleType: z.enum(['CONNECTOR', 'SCHEDULED']).default('SCHEDULED'),
  isActive: z.boolean().default(true),
  condition: z.object({
    operator: z.enum(['AND', 'OR']).default('AND'),
    conditions: z.array(conditionSchema).default([]),
  }),
  action: z.object({
    compliantStatus: z.enum(['Compliant', 'Non-Compliant']).default('Non-Compliant'),
    score: z.number().int().min(0).max(100).default(0),
    notes: z.string().default(""),
  }),
  apiConnectorId: z.string().nullable().default(null),
  schedule: z.string().nullable().default(null),
  createdBy: z.string().default("system"),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const insertApiConnectorSchema = z.object({
  name: z.string(),
  provider: z.enum(['AWS', 'AZURE', 'OKTA', 'CUSTOM']),
  baseUrl: z.string().default(""),
  authType: z.enum(['OAUTH2', 'API_KEY']).default('API_KEY'),
  isActive: z.boolean().default(true),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const insertControlStatusAuditSchema = z.object({
  controlId: z.string(),
  frameworkCode: z.string(),
  source: z.enum(['MANUAL', 'AUTOMATION', 'OVERRIDE']).default('MANUAL'),
  automationRuleId: z.string().nullable().default(null),
  status: z.string(),
  score: z.number().default(0),
  overrideReason: z.string().nullable().default(null),
  overrideExpiresAt: z.string().nullable().default(null),
  assessedBy: z.string().default("system"),
  assessedAt: z.string().default(() => new Date().toISOString()),
  previousHash: z.string().default(""),
  hash: z.string(),
});

export const updateFrameworkSchema = insertFrameworkSchema.partial();
export const updateDomainSchema = insertDomainSchema.partial();
export const updateControlSchema = insertControlSchema.partial();
export const updateCrossMappingSchema = insertCrossMappingSchema.partial();
export const updateComplianceAssessmentSchema = insertComplianceAssessmentSchema.partial();
export const updateEvidenceSchema = insertEvidenceSchema.partial();
export const updateAutomationRuleSchema = insertAutomationRuleSchema.partial();
export const updateApiConnectorSchema = insertApiConnectorSchema.partial();

export type InsertFramework = z.infer<typeof insertFrameworkSchema>;
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type InsertControl = z.infer<typeof insertControlSchema>;
export type InsertCrossMapping = z.infer<typeof insertCrossMappingSchema>;
export type InsertComplianceAssessment = z.infer<typeof insertComplianceAssessmentSchema>;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type InsertEvidenceControlMap = z.infer<typeof insertEvidenceControlMapSchema>;
export type InsertEvidenceAuditLog = z.infer<typeof insertEvidenceAuditLogSchema>;
export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type InsertApiConnector = z.infer<typeof insertApiConnectorSchema>;
export type InsertControlStatusAudit = z.infer<typeof insertControlStatusAuditSchema>;
export type UpdateFramework = z.infer<typeof updateFrameworkSchema>;
export type UpdateDomain = z.infer<typeof updateDomainSchema>;
export type UpdateControl = z.infer<typeof updateControlSchema>;
export type UpdateEvidence = z.infer<typeof updateEvidenceSchema>;
export type UpdateAutomationRule = z.infer<typeof updateAutomationRuleSchema>;
export type UpdateApiConnector = z.infer<typeof updateApiConnectorSchema>;
