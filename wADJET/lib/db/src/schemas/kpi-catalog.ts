import { z } from "zod";

export const insertKpiCatalogSchema = z.object({
  code: z.string().max(50),
  name: z.string().max(255),
  description: z.string().optional().default(""),
  category: z.string().max(100),
  businessUnit: z.string().max(100),
  department: z.string().max(100),
  ownerId: z.string(),
  reviewerId: z.string().optional().default(""),
  frequency: z.enum(["Daily", "Weekly", "Monthly", "Quarterly", "Annually"]).default("Monthly"),
  calculationType: z.enum(["Manual", "Calculated", "Integrated"]).default("Manual"),
  calculationFormula: z.string().optional().default(""),
  apiEndpoint: z.string().max(500).optional().default(""),
  apiJsonKey: z.string().max(255).optional().default(""),
  targetValue: z.number().default(0),
  warningThreshold: z.number().optional().nullable().default(null),
  criticalThreshold: z.number().optional().nullable().default(null),
  isActive: z.boolean().default(true),
  version: z.number().int().default(1),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const updateKpiCatalogSchema = insertKpiCatalogSchema.partial();

export type InsertKpiCatalog = z.infer<typeof insertKpiCatalogSchema>;
export type UpdateKpiCatalog = z.infer<typeof updateKpiCatalogSchema>;
