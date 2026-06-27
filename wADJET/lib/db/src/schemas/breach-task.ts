import { z } from "zod";

export const insertBreachTaskSchema = z.object({
  kriMeasurementId: z.string(),
  kriCatalogId: z.string(),
  riskOwnerId: z.string(),
  deptHeadId: z.string().optional().default(""),
  croId: z.string().optional().default(""),
  ceoId: z.string().optional().default(""),
  escalationLevel: z.enum(["Level0_Owner", "Level1_DeptHead", "Level2_CRO_CEO"]).default("Level0_Owner"),
  title: z.string().max(255),
  description: z.string().optional().default(""),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).default("High"),
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]).default("Open"),
  dueBy: z.string(),
  resolvedAt: z.string().optional().default(""),
  rootCauseAnalysis: z.string().optional().default(""),
  evidenceFilePath: z.string().optional().default(""),
  level0EscalatedAt: z.string().optional().default(""),
  level1EscalatedAt: z.string().optional().default(""),
  level2EscalatedAt: z.string().optional().default(""),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const updateBreachTaskSchema = insertBreachTaskSchema.partial();

export type InsertBreachTask = z.infer<typeof insertBreachTaskSchema>;
export type UpdateBreachTask = z.infer<typeof updateBreachTaskSchema>;
