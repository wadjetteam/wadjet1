import { Router, type IRouter } from "express";
import {
  MetricMapping,
  insertMetricMappingSchema,
  Risk,
  KpiCatalog,
  KriCatalog,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/metric-mappings", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.riskId) filter.riskId = req.query.riskId;
    if (req.query.metricType) filter.metricType = req.query.metricType;
    const items = await MetricMapping.find(filter).sort({ createdAt: -1 }).lean();
    const risks = await Risk.find().lean();
    const riskMap = new Map(risks.map((r) => [r._id ?? "", r]));
    const kpis = await KpiCatalog.find().lean();
    const kpiMap = new Map(kpis.map((k) => [k._id ?? "", k]));
    const kris = await KriCatalog.find().lean();
    const kriMap = new Map(kris.map((k) => [k._id ?? "", k]));
    const enriched = items.map((m) => ({
      ...m,
      risk: riskMap.get(m.riskId) ?? null,
      metric:
        m.metricType === "KPI"
          ? kpiMap.get(m.metricCatalogId) ?? null
          : kriMap.get(m.metricCatalogId) ?? null,
    }));
    res.json({ items: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mappings" });
  }
});

router.post("/metric-mappings", async (req, res) => {
  const parsed = insertMetricMappingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await MetricMapping.create({
      ...parsed.data,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ item });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: "Mapping already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create mapping" });
  }
});

router.post("/metric-mappings/batch", async (req, res) => {
  const { riskId, mappings } = req.body;
  if (!riskId || !Array.isArray(mappings)) {
    res.status(400).json({ error: "riskId and mappings array required" });
    return;
  }
  try {
    const existing = await MetricMapping.find({ riskId } as any).lean();
    for (const e of existing) {
      await MetricMapping.findByIdAndDelete(e._id ?? "");
    }
    for (const m of mappings) {
      await MetricMapping.create({
        riskId,
        metricType: m.metricType,
        metricCatalogId: m.metricCatalogId,
        mappingType: m.mappingType ?? "Primary",
        createdAt: new Date().toISOString(),
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save batch mappings" });
  }
});

router.delete("/metric-mappings/:id", async (req, res) => {
  try {
    const item = await MetricMapping.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "Mapping not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete mapping" });
  }
});

export default router;
