import { Router, type IRouter } from "express";
import { KriCatalog, insertKriCatalogSchema, updateKriCatalogSchema, Risk } from "@workspace/db";

const router: IRouter = Router();

router.get("/kri-catalog", async (_req, res) => {
  try {
    const items = await KriCatalog.find().sort({ code: 1 }).lean();
    const risks = await Risk.find().sort({ riskId: 1 }).lean();
    const riskMap = new Map(risks.map((r) => [r._id ?? "", r]));
    const enriched = items.map((kri) => ({
      ...kri,
      linkedRisk: kri.linkedRiskId ? riskMap.get(kri.linkedRiskId) ?? null : null,
    }));
    res.json({ items: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KRI catalog" });
  }
});

router.get("/kri-catalog/:id", async (req, res) => {
  try {
    const items = await KriCatalog.find({ _id: req.params.id } as any).lean();
    if (!items[0]) { res.status(404).json({ error: "KRI not found" }); return; }
    const risk = items[0].linkedRiskId
      ? (await Risk.find({ _id: items[0].linkedRiskId } as any).lean())[0]
      : null;
    res.json({ item: { ...items[0], linkedRisk: risk ?? null } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KRI" });
  }
});

router.post("/kri-catalog", async (req, res) => {
  const parsed = insertKriCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await KriCatalog.create(parsed.data);
    res.status(201).json({ item });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: "KRI with this code already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create KRI" });
  }
});

router.patch("/kri-catalog/:id", async (req, res) => {
  const parsed = updateKriCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await KriCatalog.findByIdAndUpdate(req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });
    if (!item) { res.status(404).json({ error: "KRI not found" }); return; }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update KRI" });
  }
});

router.delete("/kri-catalog/:id", async (req, res) => {
  try {
    const item = await KriCatalog.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "KRI not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete KRI" });
  }
});

export default router;
