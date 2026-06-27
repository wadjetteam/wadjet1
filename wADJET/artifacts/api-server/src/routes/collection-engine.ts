import { Router, type IRouter } from "express";
import { runMonthlyCollection } from "../services/collection-engine";

const router: IRouter = Router();

router.post("/collection/run-monthly", async (_req, res) => {
  try {
    await runMonthlyCollection();
    res.json({ ok: true, message: "Monthly collection cycle completed" });
  } catch (err) {
    res.status(500).json({ error: "Collection cycle failed" });
  }
});

export default router;
