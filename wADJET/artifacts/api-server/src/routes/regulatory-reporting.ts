import { Router, type IRouter } from "express";
import {
  getAppetiteComplianceReport,
  getOverdueBreachSummary,
} from "../services/regulatory-reporting";

const router: IRouter = Router();

router.get("/regulatory/appetite-compliance", async (_req, res) => {
  try {
    const report = await getAppetiteComplianceReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate appetite compliance report" });
  }
});

router.get("/regulatory/overdue-breaches", async (_req, res) => {
  try {
    const summary = await getOverdueBreachSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate overdue breach summary" });
  }
});

export default router;
