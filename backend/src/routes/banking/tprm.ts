import { Router } from "express";
import { Vendor } from "@workspace/db";
import { asyncHandler, AppError } from "../../middleware/error-handler";
import { queryParamOptional, routeParam } from "../../lib/store-helpers";

const router = Router();

router.get("/tprm/vendors", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const tier = queryParamOptional(req.query.tier);
  const riskLevel = queryParamOptional(req.query.riskLevel);
  const status = queryParamOptional(req.query.status);
  if (tier) filter.tier = Number(tier);
  if (riskLevel) filter.riskLevel = riskLevel;
  if (status) filter.status = status;
  const items = await Vendor.find(filter).lean();
  res.json({ items });
}));

router.post("/tprm/vendors", asyncHandler(async (req, res) => {
  const { insertVendorSchema } = await import("@workspace/db");
  const parsed = insertVendorSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues.map(i => i.message).join("; "));
  const item = await Vendor.create(parsed.data);
  res.status(201).json({ item });
}));

router.patch("/tprm/vendors/:id", asyncHandler(async (req, res) => {
  const item = await Vendor.findByIdAndUpdate(routeParam(req.params.id), req.body);
  if (!item) throw new AppError(404, "Vendor not found");
  res.json({ item });
}));

export default router;
