import { Router } from "express";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { DashboardEngine, UnauthorizedComponentError } from "../services/reporting-engine";
import type { UserContext } from "../services/reporting-engine";

const router = Router();
const engine = new DashboardEngine();

router.get("/components", asyncHandler(async (_req, res) => {
  const components = engine.getComponentLibrary();
  res.json({ components });
}));

router.get("/types", asyncHandler(async (_req, res) => {
  const types = engine.getComponentTypes();
  res.json({ types });
}));

router.get("/roles", asyncHandler(async (_req, res) => {
  const roles = engine.getRoles();
  res.json({ roles });
}));

router.get("/dashboard", asyncHandler(async (req, res) => {
  const roleCode = req.query.role || "CRO";
  const user: UserContext = { userId: "default", roleCode: roleCode as string, department: "" };
  const components = engine.resolveDashboard(user);
  res.json({ components });
}));

export default router;
