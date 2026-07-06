import { Router } from "express";
import { Submission } from "@workspace/db";
import { asyncHandler, AppError } from "../../middleware/error-handler";
import { queryParamOptional, routeParam } from "../../lib/store-helpers";

const router = Router();

router.get("/regulatory-calendar/submissions", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const status = queryParamOptional(req.query.status);
  const priority = queryParamOptional(req.query.priority);
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  const items = await Submission.find(filter).sort({ due: 1 }).lean();
  res.json({ items });
}));

router.patch("/regulatory-calendar/submissions/:id", asyncHandler(async (req, res) => {
  const item = await Submission.findByIdAndUpdate(routeParam(req.params.id), req.body);
  if (!item) throw new AppError(404, "Submission not found");
  res.json({ item });
}));

export default router;
