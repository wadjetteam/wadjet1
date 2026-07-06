import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";

const router = Router();

router.get("/healthz", asyncHandler(async (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
}));

export default router;
