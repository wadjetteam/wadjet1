import { z } from "zod";

export const insertKriMeasurementSchema = z.object({
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
  previousValue: z.number().optional().nullable().default(null),
  percentageChange: z.number().optional().nullable().default(null),
  trendDirection: z.enum(["Increasing", "Stable", "Decreasing"]).optional().nullable().default(null),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const updateKriMeasurementSchema = insertKriMeasurementSchema.partial();

export type InsertKriMeasurement = z.infer<typeof insertKriMeasurementSchema>;
export type UpdateKriMeasurement = z.infer<typeof updateKriMeasurementSchema>;
