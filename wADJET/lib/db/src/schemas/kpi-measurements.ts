import { z } from "zod";

export const insertKpiMeasurementSchema = z.object({
  catalogId: z.string(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be YYYY-MM format"),
  currentValue: z.number().optional().nullable().default(null),
  status: z.enum(["Draft", "Pending Review", "Approved"]).default("Draft"),
  appetiteStatus: z.enum(["Green", "Amber", "Red"]).optional().nullable().default(null),
  evidenceFilePath: z.string().optional().default(""),
  comments: z.string().optional().default(""),
  submittedBy: z.string().optional().default(""),
  approvedBy: z.string().optional().default(""),
  approvedAt: z.string().optional().default(""),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const updateKpiMeasurementSchema = insertKpiMeasurementSchema.partial();

export type InsertKpiMeasurement = z.infer<typeof insertKpiMeasurementSchema>;
export type UpdateKpiMeasurement = z.infer<typeof updateKpiMeasurementSchema>;
