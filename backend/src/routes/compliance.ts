import { Router } from "express";
import { Framework, Domain, Control, CrossMapping, TripleMapping, ComplianceAssessment } from "@workspace/db";
import type { IComplianceAssessment } from "@workspace/db";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { findById, queryParamOptional, routeParam } from "../lib/store-helpers";

const router = Router();

router.get("/controls", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const frameworkCode = queryParamOptional(req.query.frameworkCode);
  const domainId = queryParamOptional(req.query.domainId);
  const status = queryParamOptional(req.query.status);
  if (frameworkCode) filter.frameworkCode = frameworkCode;
  if (domainId) filter.domainId = domainId;
  if (status) filter.status = status;
  const controls = await Control.find(filter).lean();
  res.json({ controls });
}));

router.get("/controls/:id", asyncHandler(async (req, res) => {
  const control = await findById(Control, req.params.id);
  if (!control) throw new AppError(404, "Control not found");
  res.json({ control });
}));

router.get("/cross-mappings", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const sourceId = queryParamOptional(req.query.sourceId);
  const targetFramework = queryParamOptional(req.query.targetFramework);
  if (sourceId) filter.sourceId = sourceId;
  if (targetFramework) filter.targetFramework = targetFramework;
  const mappings = await CrossMapping.find(filter).lean();
  res.json({ mappings });
}));

router.get("/triple-mappings", asyncHandler(async (_req, res) => {
  const mappings = await TripleMapping.find().lean();
  res.json({ mappings });
}));

router.get("/assessments", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const controlId = queryParamOptional(req.query.controlId);
  const frameworkCode = queryParamOptional(req.query.frameworkCode);
  const status = queryParamOptional(req.query.status);
  if (controlId) filter.controlId = controlId;
  if (frameworkCode) filter.frameworkCode = frameworkCode;
  if (status) filter.status = status;
  const assessments = await ComplianceAssessment.find(filter).sort({ assessedAt: -1 }).lean();
  res.json({ assessments });
}));

router.post("/assessments", asyncHandler(async (req, res) => {
  const assessment = await ComplianceAssessment.create({
    ...req.body,
    assessedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  res.status(201).json({ assessment });
}));

router.get("/compliance/status", asyncHandler(async (req, res) => {
  const frameworkCode = queryParamOptional(req.query.frameworkCode);
  if (!frameworkCode) throw new AppError(400, "frameworkCode is required");
  const controls = await Control.find({ frameworkCode }).lean();
  const assessments = await ComplianceAssessment.find({ frameworkCode }).lean();
  const statusMap: Record<string, IComplianceAssessment> = {};
  for (const a of assessments) {
    if (a.controlId && (!statusMap[a.controlId] || new Date(a.assessedAt) > new Date(statusMap[a.controlId].assessedAt))) {
      statusMap[a.controlId] = a;
    }
  }
  const enriched = controls.map(c => ({
    ...c,
    status: statusMap[c.controlId]?.status ?? "Not Assessed",
    score: statusMap[c.controlId]?.score ?? 0,
    assessment: statusMap[c.controlId],
  }));
  const compliant = enriched.filter(c => c.status === "Compliant").length;
  const nonCompliant = enriched.filter(c => c.status === "Non-Compliant").length;
  const partial = enriched.filter(c => c.status === "Partially Compliant").length;
  const notAssessed = enriched.filter(c => c.status === "Not Assessed").length;
  const notApplicable = enriched.filter(c => c.status === "Not Applicable").length;
  const total = controls.length;
  const overallScore = total > 0 ? Math.round(((compliant * 100 + partial * 50) / (total - notApplicable)) * 100) / 100 : 0;
  res.json({ controls: enriched, compliant, nonCompliant, partial, notAssessed, notApplicable, overallScore, total });
}));

router.post("/compliance/assess", asyncHandler(async (req, res) => {
  const { controlId, frameworkCode, status, score, findings, assessedBy, source } = req.body;
  if (!controlId || !frameworkCode || !status) throw new AppError(400, "controlId, frameworkCode, and status are required");
  const assessment = await ComplianceAssessment.create({
    controlId,
    frameworkCode,
    status,
    score: score ?? 0,
    findings: findings ?? "",
    assessedBy: assessedBy ?? "system",
    assessedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: source ?? "MANUAL",
  });
  res.status(201).json({ assessment });
}));

router.post("/compliance/override", asyncHandler(async (req, res) => {
  const { controlId, frameworkCode, status, score, overrideReason } = req.body;
  if (!controlId || !frameworkCode || !status || !overrideReason) throw new AppError(400, "controlId, frameworkCode, status, and overrideReason are required");
  const assessment = await ComplianceAssessment.create({
    controlId,
    frameworkCode,
    status,
    score: score ?? 0,
    assessedBy: "override",
    assessedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "OVERRIDE",
    overrideReason,
  });
  res.status(201).json({ assessment });
}));

router.get("/frameworks", asyncHandler(async (req, res) => {
  const frameworks = await Framework.find().lean();
  res.json({ frameworks });
}));

router.get("/domains", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const frameworkCode = queryParamOptional(req.query.frameworkCode);
  if (frameworkCode) filter.frameworkCode = frameworkCode;
  const items = await Domain.find(filter).sort({ order: 1 }).lean();
  res.json({ items });
}));

export default router;
