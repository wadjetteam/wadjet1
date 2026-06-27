import { z } from "zod";

export const insertMetricMappingSchema = z.object({
  riskId: z.string(),
  metricType: z.enum(["KPI", "KRI"]),
  metricCatalogId: z.string(),
  mappingType: z.string().optional().default("Primary"),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const updateMetricMappingSchema = insertMetricMappingSchema.partial();

export type InsertMetricMapping = z.infer<typeof insertMetricMappingSchema>;
export type UpdateMetricMapping = z.infer<typeof updateMetricMappingSchema>;
