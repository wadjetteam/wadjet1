import { z } from "zod";

export const insertRiskControlMapSchema = z.object({
  riskId: z.string().min(1),
  controlId: z.string().min(1),
  frameworkCode: z.string().min(1),
  controlRef: z.string().default(""),
  mappingType: z.enum(["Primary", "Supporting"]).default("Primary"),
  notes: z.string().default(""),
  approvedBy: z.string().default("system"),
  source: z.enum(["seed", "manual"]).default("seed"),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const approveRiskControlMapSchema = z.object({
  riskId: z.string().min(1),
  controlId: z.string().min(1),
  frameworkCode: z.string().min(1),
  controlRef: z.string().default(""),
  mappingType: z.enum(["Primary", "Supporting"]).default("Primary"),
  notes: z.string().min(1, "Audit justification is required"),
  approvedBy: z.string().default("user"),
});

export const rejectSuggestionSchema = z.object({
  riskId: z.string().min(1),
  controlId: z.string().min(1),
});

export const updateRiskControlMapSchema = insertRiskControlMapSchema.partial();

export type InsertRiskControlMap = z.infer<typeof insertRiskControlMapSchema>;
export type UpdateRiskControlMap = z.infer<typeof updateRiskControlMapSchema>;
export type ApproveRiskControlMap = z.infer<typeof approveRiskControlMapSchema>;
export type RejectSuggestion = z.infer<typeof rejectSuggestionSchema>;
