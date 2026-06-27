import { Router, type IRouter } from "express";
import {
  KriMeasurement,
  KriCatalog,
  insertKriMeasurementSchema,
  updateKriMeasurementSchema,
} from "@workspace/db";
import { runManualCollectionForCatalog } from "../services/collection-engine";
import { handleMeasurementApproved } from "../services/breach-engine";
import { buildReviewAlert, sendNotification } from "../services/notification-service";

const router: IRouter = Router();

router.get("/kri-measurements", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.catalogId) filter.catalogId = req.query.catalogId;
    if (req.query.period) filter.period = req.query.period;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.appetiteStatus) filter.appetiteStatus = req.query.appetiteStatus;
    const items = await KriMeasurement.find(filter).sort({ period: -1 }).lean();
    const catalogs = await KriCatalog.find().lean();
    const catMap = new Map(catalogs.map((c) => [c._id ?? "", c]));
    const enriched = items.map((m) => ({ ...m, catalog: catMap.get(m.catalogId) ?? null }));
    res.json({ items: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KRI measurements" });
  }
});

router.get("/kri-measurements/trend/:catalogId", async (req, res) => {
  try {
    const items = await KriMeasurement.find({
      catalogId: req.params.catalogId,
      status: "Approved",
    } as any).sort({ period: 1 }).lean();
    const catalogs = await KriCatalog.find({ _id: req.params.catalogId } as any).lean();
    const cat = catalogs[0] ?? null;
    res.json({
      measurements: items,
      thresholds: cat
        ? {
            warningThreshold: cat.amberMin,
            criticalThreshold: cat.redMin,
            greenMin: cat.greenMin,
            greenMax: cat.greenMax,
            amberMin: cat.amberMin,
            amberMax: cat.amberMax,
            redMin: cat.redMin,
            redMax: cat.redMax,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KRI trend data" });
  }
});

router.get("/kri-measurements/:id", async (req, res) => {
  try {
    const items = await KriMeasurement.find({ _id: req.params.id } as any).lean();
    if (!items[0]) { res.status(404).json({ error: "Measurement not found" }); return; }
    res.json({ item: items[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch measurement" });
  }
});

router.post("/kri-measurements", async (req, res) => {
  const parsed = insertKriMeasurementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await KriMeasurement.create({
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create measurement" });
  }
});

router.post("/kri-measurements/collect/:catalogId", async (req, res) => {
  try {
    const item = await runManualCollectionForCatalog(req.params.catalogId, "KRI");
    if (!item) { res.status(404).json({ error: "Catalog item not found" }); return; }
    res.status(201).json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Collection failed" });
  }
});

router.patch("/kri-measurements/:id", async (req, res) => {
  const parsed = updateKriMeasurementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const update: any = { ...parsed.data, updatedAt: new Date().toISOString() };
    if (update.status === "Approved") {
      update.approvedAt = new Date().toISOString();
    }
    const item = await KriMeasurement.findByIdAndUpdate(req.params.id, update);
    if (!item) { res.status(404).json({ error: "Measurement not found" }); return; }
    if (parsed.data.status === "Approved") {
      await handleMeasurementApproved(req.params.id, "KRI").catch(() => {});
    }
    if (parsed.data.status === "Pending Review") {
      try {
        const catalogs = await KriCatalog.find({ _id: item.catalogId } as any).lean();
        const cat = catalogs[0];
        if (cat?.riskOwnerId) {
          const alert = buildReviewAlert({
            metricCode: cat.code,
            metricName: cat.name,
            period: item.period,
            currentValue: String(item.currentValue ?? ""),
            submittedBy: item.submittedBy ?? "Unknown",
            recipientAddress: `${cat.riskOwnerId}@bank.eg`,
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

router.delete("/kri-measurements/:id", async (req, res) => {
  try {
    const item = await KriMeasurement.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "Measurement not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete measurement" });
  }
});

export default router;
