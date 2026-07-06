import { Router } from "express";
import { Risk, calcRiskScore, calcResidualScore, scoreToLevel, ragStatus } from "@workspace/db";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { findById, queryParamOptional, routeParam } from "../lib/store-helpers";

const router = Router();

router.get("/risks", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const category = queryParamOptional(req.query.category);
  const status = queryParamOptional(req.query.status);
  const owner = queryParamOptional(req.query.owner);
  const severity = queryParamOptional(req.query.severity);
  if (category) filter.riskCategory = category;
  if (status) filter.status = status;
  if (owner) filter.owner = owner;
  if (severity) filter.severity = severity;
  const risks = await Risk.find(filter).lean();
  res.json({ risks, total: risks.length });
}));

router.get("/risks/:id", asyncHandler(async (req, res) => {
  const risk = await findById(Risk, req.params.id);
  if (!risk) throw new AppError(404, "Risk not found");
  res.json({ risk });
}));

router.post("/risks", asyncHandler(async (req, res) => {
  const base = req.body;
  const riskScore = calcRiskScore(base);
  const residualScore = calcResidualScore(riskScore, base.controlStatus);
  const risk = await Risk.create({
    ...base,
    overallScore: riskScore,
    riskScore,
    inherentLevel: scoreToLevel(riskScore),
    residualScore,
    overallRisk: scoreToLevel(residualScore),
    ragStatus: ragStatus(residualScore),
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ risk });
}));

router.put("/risks/:id", asyncHandler(async (req, res) => {
  const existing = await findById(Risk, req.params.id);
  if (!existing) throw new AppError(404, "Risk not found");
  const updated = { ...existing, ...req.body };
  const riskScore = calcRiskScore(updated);
  const residualScore = calcResidualScore(riskScore, updated.controlStatus);
  const risk = await Risk.findByIdAndUpdate(routeParam(req.params.id), {
    ...req.body,
    riskScore,
    inherentLevel: scoreToLevel(riskScore),
    residualScore,
    overallRisk: scoreToLevel(residualScore),
    ragStatus: ragStatus(residualScore),
  });
  res.json({ risk });
}));

router.delete("/risks/:id", asyncHandler(async (req, res) => {
  const risk = await Risk.findByIdAndUpdate(routeParam(req.params.id), { status: "Archived" });
  if (!risk) throw new AppError(404, "Risk not found");
  res.json({ success: true });
}));

export default router;
