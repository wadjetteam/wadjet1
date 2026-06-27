import { Router, type IRouter } from "express";
import { KpiCatalog, insertKpiCatalogSchema, updateKpiCatalogSchema } from "@workspace/db";

const router: IRouter = Router();

router.get("/kpi-catalog", async (_req, res) => {
  try {
    const items = await KpiCatalog.find().sort({ code: 1 }).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KPI catalog" });
  }
});

router.get("/kpi-catalog/:id", async (req, res) => {
  try {
    const items = await KpiCatalog.find({ _id: req.params.id } as any).lean();
    if (!items[0]) { res.status(404).json({ error: "KPI not found" }); return; }
    res.json({ item: items[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KPI" });
  }
});

router.post("/kpi-catalog", async (req, res) => {
  const parsed = insertKpiCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await KpiCatalog.create(parsed.data);
    res.status(201).json({ item });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: "KPI with this code already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create KPI" });
  }
});

router.patch("/kpi-catalog/:id", async (req, res) => {
  const parsed = updateKpiCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await KpiCatalog.findByIdAndUpdate(req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });
    if (!item) { res.status(404).json({ error: "KPI not found" }); return; }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update KPI" });
  }
});

router.delete("/kpi-catalog/:id", async (req, res) => {
  try {
    const item = await KpiCatalog.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "KPI not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete KPI" });
  }
});

export default router;
