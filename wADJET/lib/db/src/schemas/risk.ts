import { z } from "zod";

export const insertRiskSchema = z.object({
  riskId: z.string(),
  process: z.string().default(""),
  subProcess: z.string().default(""),
  assetSystem: z.string().default(""),
  ownerTeam: z.string().default(""),
  riskCategory: z.string().default(""),
  threat: z.string().default(""),
  vulnerability: z.string().default(""),
  severity: z.string().default(""),
  riskTitle: z.string().default(""),
  riskDescription: z.string().default(""),
  riskRef: z.string().default(""),
  likelihood: z.number().int().default(1),
  impactFinance: z.number().int().default(1),
  impactRegulatory: z.number().int().default(1),
  impactReputational: z.number().int().default(1),
  impactSafety: z.number().int().default(1),
  impactOperational: z.number().int().default(1),
  impactC: z.number().int().default(1),
  impactI: z.number().int().default(1),
  impactA: z.number().int().default(1),
  overallScore: z.number().int().default(0),
  riskScore: z.number().int().default(0),
  inherentLevel: z.string().default(""),
  existingControls: z.string().default(""),
  residualScore: z.number().int().default(0),
  overallRisk: z.string().default(""),
  treatment: z.string().default(""),
  status: z.string().default("Open"),
  mitigationActions: z.string().default(""),
  deadline: z.string().nullable().default(null),
  owner: z.string().default(""),
});

export const updateRiskSchema = insertRiskSchema.partial();

export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type UpdateRisk = z.infer<typeof updateRiskSchema>;
