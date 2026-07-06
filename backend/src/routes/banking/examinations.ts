import { Router } from "express";
import { Examination, Finding } from "@workspace/db";
import { asyncHandler, AppError } from "../../middleware/error-handler";
import { queryParamOptional, routeParam } from "../../lib/store-helpers";

const router = Router();

router.get("/examinations", asyncHandler(async (_req, res) => {
  const items = await Examination.find().lean();
  res.json({ items });
}));

router.get("/findings", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const examId = queryParamOptional(req.query.examId);
  const severity = queryParamOptional(req.query.severity);
  const status = queryParamOptional(req.query.status);
  const type = queryParamOptional(req.query.type);
  if (examId) filter.examId = examId;
  if (severity) filter.severity = severity;
  if (status) filter.status = status;
  if (type) filter.type = type;
  const items = await Finding.find(filter).sort({ raised: -1 }).lean();
  res.json({ items });
}));

router.get("/findings/aging", asyncHandler(async (_req, res) => {
  const items = await Finding.find().lean();
  const ranges = [
    { range: "0-30d", min: 0, max: 30, fill: "#2d7d46" },
    { range: "31-60d", min: 31, max: 60, fill: "#d4af37" },
    { range: "61-90d", min: 61, max: 90, fill: "#b8860b" },
    { range: "90+d", min: 91, max: Infinity, fill: "#c41e3a" },
  ];
  const aging = ranges.map(r => ({
    range: r.range,
    count: items.filter(f => f.status !== "closed" && f.agingDays >= r.min && f.agingDays <= r.max).length,
    fill: r.fill,
  }));
  res.json({ items: aging });
}));

router.patch("/findings/:id", asyncHandler(async (req, res) => {
  const item = await Finding.findByIdAndUpdate(routeParam(req.params.id), req.body);
  if (!item) throw new AppError(404, "Finding not found");
  res.json({ item });
}));

export default router;
