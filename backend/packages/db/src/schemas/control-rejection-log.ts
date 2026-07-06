import { z } from "zod";

export const insertControlRejectionLogSchema = z.object({
  riskId: z.string().min(1),
  controlId: z.string().min(1),
  frameworkCode: z.string().default(""),
  controlRef: z.string().default(""),
  count: z.number().int().default(1),
  lastRejectedAt: z.string().default(() => new Date().toISOString()),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const updateControlRejectionLogSchema = insertControlRejectionLogSchema.partial();

export type InsertControlRejectionLog = z.infer<typeof insertControlRejectionLogSchema>;
export type UpdateControlRejectionLog = z.infer<typeof updateControlRejectionLogSchema>;
