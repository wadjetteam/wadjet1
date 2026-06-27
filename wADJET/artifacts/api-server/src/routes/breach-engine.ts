import { Router, type IRouter } from "express";
import { BreachTask, KriCatalog, KriMeasurement, updateBreachTaskSchema } from "@workspace/db";
import { resolveBreachTask, runEscalationCheck } from "../services/breach-engine";

const router: IRouter = Router();

router.get("/breach-tasks", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.escalationLevel) filter.escalationLevel = req.query.escalationLevel;
    if (req.query.riskOwnerId) filter.riskOwnerId = req.query.riskOwnerId;
    const items = await BreachTask.find(filter).sort({ createdAt: -1 }).lean();
    const kriCatalogs = await KriCatalog.find().lean();
    const kriMap = new Map(kriCatalogs.map((k) => [k._id ?? "", k]));
    const enriched = items.map((t) => ({
      ...t,
      kriCatalog: kriMap.get(t.kriCatalogId) ?? null,
      isOverdue: new Date(t.dueBy).getTime() < Date.now(),
      overdueHours: Math.round(
        (Date.now() - new Date(t.dueBy).getTime()) / (1000 * 60 * 60) * 100
      ) / 100,
    }));
    res.json({ items: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch breach tasks" });
  }
});

router.get("/breach-tasks/:id", async (req, res) => {
  try {
    const items = await BreachTask.find({ _id: req.params.id } as any).lean();
    if (!items[0]) { res.status(404).json({ error: "Task not found" }); return; }
    const meas = await KriMeasurement.find({ _id: items[0].kriMeasurementId } as any).lean();
    res.json({
      item: {
        ...items[0],
        measurement: meas[0] ?? null,
        isOverdue: new Date(items[0].dueBy).getTime() < Date.now(),
        overdueHours: Math.round(
          (Date.now() - new Date(items[0].dueBy).getTime()) / (1000 * 60 * 60) * 100
        ) / 100,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

router.patch("/breach-tasks/:id", async (req, res) => {
  const parsed = updateBreachTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await BreachTask.findByIdAndUpdate(req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });
    if (!item) { res.status(404).json({ error: "Task not found" }); return; }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.post("/breach-tasks/:id/resolve", async (req, res) => {
  const { rootCauseAnalysis, evidenceFilePath } = req.body;
  if (!rootCauseAnalysis) {
    res.status(400).json({ error: "rootCauseAnalysis is required" });
    return;
  }
  try {
    const task = await resolveBreachTask(
      req.params.id,
      rootCauseAnalysis,
      evidenceFilePath ?? ""
    );
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    res.json({ item: task });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve task" });
  }
});

router.post("/breach-engine/run-escalation-check", async (_req, res) => {
  try {
    await runEscalationCheck();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Escalation check failed" });
  }
});

export default router;
