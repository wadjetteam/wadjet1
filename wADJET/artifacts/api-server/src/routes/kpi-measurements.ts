import { Router, type IRouter } from "express";
import {
  KpiMeasurement,
  KpiCatalog,
  insertKpiMeasurementSchema,
  updateKpiMeasurementSchema,
} from "@workspace/db";
import { runManualCollectionForCatalog } from "../services/collection-engine";
import { handleMeasurementApproved } from "../services/breach-engine";
import { buildReviewAlert, sendNotification } from "../services/notification-service";

const router: IRouter = Router();

router.get("/kpi-measurements", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.catalogId) filter.catalogId = req.query.catalogId;
    if (req.query.period) filter.period = req.query.period;
    if (req.query.status) filter.status = req.query.status;
    const items = await KpiMeasurement.find(filter).sort({ period: -1 }).lean();
    const catalogs = await KpiCatalog.find().lean();
    const catMap = new Map(catalogs.map((c) => [c._id ?? "", c]));
    const enriched = items.map((m) => ({ ...m, catalog: catMap.get(m.catalogId) ?? null }));
    res.json({ items: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KPI measurements" });
  }
});

router.get("/kpi-measurements/:id", async (req, res) => {
  try {
    const items = await KpiMeasurement.find({ _id: req.params.id } as any).lean();
    if (!items[0]) { res.status(404).json({ error: "Measurement not found" }); return; }
    res.json({ item: items[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch measurement" });
  }
});

router.post("/kpi-measurements", async (req, res) => {
  const parsed = insertKpiMeasurementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await KpiMeasurement.create({
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create measurement" });
  }
});

router.post("/kpi-measurements/collect/:catalogId", async (req, res) => {
  try {
    const item = await runManualCollectionForCatalog(req.params.catalogId, "KPI");
    if (!item) { res.status(404).json({ error: "Catalog item not found" }); return; }
    res.status(201).json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Collection failed" });
  }
});

router.patch("/kpi-measurements/:id", async (req, res) => {
  const parsed = updateKpiMeasurementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const update: any = { ...parsed.data, updatedAt: new Date().toISOString() };
    if (update.status === "Approved") {
      update.approvedAt = new Date().toISOString();
    }
    const item = await KpiMeasurement.findByIdAndUpdate(req.params.id, update);
    if (!item) { res.status(404).json({ error: "Measurement not found" }); return; }
    if (parsed.data.status === "Approved") {
      await handleMeasurementApproved(req.params.id, "KPI").catch(() => {});
    }
    if (parsed.data.status === "Pending Review") {
      try {
        const catalogs = await KpiCatalog.find({ _id: item.catalogId } as any).lean();
        const cat = catalogs[0];
        if (cat?.reviewerId) {
          const alert = buildReviewAlert({
            metricCode: cat.code,
            metricName: cat.name,
            period: item.period,
            currentValue: String(item.currentValue ?? ""),
            submittedBy: item.submittedBy ?? "Unknown",
            recipientAddress: `${cat.reviewerId}@bank.eg`,
          });
          await sendNotification(alert);
        }
      } catch {}
    }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update measurement" });
  }
});

router.delete("/kpi-measurements/:id", async (req, res) => {
  try {
    const item = await KpiMeasurement.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "Measurement not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete measurement" });
  }
});

export default router;
