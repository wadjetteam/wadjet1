import { z } from "zod";

export const insertKriCatalogSchema = z.object({
  code: z.string().max(50),
  name: z.string().max(255),
  riskCategory: z.string().max(100),
  linkedRiskId: z.string().optional().default(""),
  riskOwnerId: z.string(),
  frequency: z.enum(["Daily", "Weekly", "Monthly", "Quarterly", "Annually"]).default("Monthly"),
  greenMin: z.number().optional().nullable().default(null),
  greenMax: z.number().optional().nullable().default(null),
  amberMin: z.number().optional().nullable().default(null),
  amberMax: z.number().optional().nullable().default(null),
  redMin: z.number().optional().nullable().default(null),
  redMax: z.number().optional().nullable().default(null),
  isIntegrated: z.boolean().default(false),
  apiEndpoint: z.string().max(500).optional().default(""),
  apiJsonKey: z.string().max(255).optional().default(""),
  isActive: z.boolean().default(true),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const updateKriCatalogSchema = insertKriCatalogSchema.partial();

export type InsertKriCatalog = z.infer<typeof insertKriCatalogSchema>;
export type UpdateKriCatalog = z.infer<typeof updateKriCatalogSchema>;
