import { Router } from "express";
import { RiskControlMap, Risk, Control } from "@workspace/db";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { queryParamOptional } from "../lib/store-helpers";
import { logger } from "../config/logger";

const router = Router();

router.get("/risk-control-maps", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const riskId = queryParamOptional(req.query.riskId);
  const controlId = queryParamOptional(req.query.controlId);
  const status = queryParamOptional(req.query.status);
  if (riskId) filter.riskId = riskId;
  if (controlId) filter.controlId = controlId;
  if (status) filter.status = status;
  const maps = await RiskControlMap.find(filter).lean();
  res.json({ maps });
}));

router.post("/risk-control-maps", asyncHandler(async (req, res) => {
  const map = await RiskControlMap.create({
    ...req.body,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ map });
}));

router.post("/risk-control-maps/suggest", asyncHandler(async (_req, res) => {
  const risks = await Risk.find().lean();
  const controls = await Control.find().lean();
  const suggestions: Array<{ riskId: string; controlId: string; confidence: number }> = [];
  for (const risk of risks) {
    const riskKeywords = (risk.riskTitle + " " + (risk.riskCategory || "")).toLowerCase().split(/\s+/);
    for (const control of controls) {
      const controlKeywords = (control.name + " " + (control.description || "")).toLowerCase().split(/\s+/);
      const matchCount = riskKeywords.filter(kw => controlKeywords.includes(kw)).length;
      if (matchCount >= 2) {
        suggestions.push({ riskId: risk._id ?? "", controlId: control._id ?? "", confidence: Math.min(matchCount / 5, 1) });
      }
    }
  }
  logger.info({ count: suggestions.length }, "Control suggestions generated");
  res.json({ suggestions });
}));

router.patch("/risk-control-maps/:id/approve", asyncHandler(async (req, res) => {
  const update: Record<string, unknown> = { approvedAt: new Date().toISOString() };
  const map = await RiskControlMap.findByIdAndUpdate(req.params.id as string, update as any);
  if (!map) throw new AppError(404, "Risk-control map not found");
  res.json({ map });
}));

router.patch("/risk-control-maps/:id/reject", asyncHandler(async (req, res) => {
  const update: Record<string, unknown> = { rejectionReason: req.body.reason };
  const map = await RiskControlMap.findByIdAndUpdate(req.params.id as string, update as any);
  if (!map) throw new AppError(404, "Risk-control map not found");
  res.json({ map });
}));

export default router;
