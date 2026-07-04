import { Router, type IRouter } from "express";
import {
  Framework, Domain, Control, CrossMapping, TripleMapping, ComplianceAssessment,
  insertComplianceAssessmentSchema, updateComplianceAssessmentSchema,
} from "@workspace/db";

const router: IRouter = Router();

// ── Frameworks ──
router.get("/frameworks", async (_req, res) => {
  try {
    const items = await Framework.find().lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch frameworks" });
  }
});

// ── Domains ──
router.get("/domains", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.frameworkCode) filter.frameworkCode = req.query.frameworkCode;
    const items = await Domain.find(filter).sort({ order: 1 }).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// ── Controls ──
router.get("/controls", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.frameworkCode) filter.frameworkCode = req.query.frameworkCode;
    if (req.query.domainCode) filter.domainCode = req.query.domainCode;
    const items = await Control.find(filter).sort({ order: 1 }).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch controls" });
  }
});

// ── Compliance Status (aggregated) — Optimized ──
router.get("/compliance/status", async (req, res) => {
  try {
    const frameworkCode = req.query.frameworkCode as string;
    if (!frameworkCode) {
      res.status(400).json({ error: "frameworkCode required" });
      return;
    }
    const allControls = await Control.find({ frameworkCode } as any).sort({ order: 1 }).lean();
    const controlIdSet = new Set(allControls.map((c: any) => c._id ?? "").filter(Boolean));
    const allAssessments = await ComplianceAssessment.find({} as any).lean();
    const assessmentMap = new Map<string, any>();
    for (const a of allAssessments) {
      if (controlIdSet.has(a.controlId)) {
        assessmentMap.set(a.controlId, a);
      }
    }

    const enriched = allControls.map((c) => ({
      ...c,
      assessment: assessmentMap.get(c._id ?? "") || null,
      status: assessmentMap.get(c._id ?? "")?.status || "Not Assessed",
      score: assessmentMap.get(c._id ?? "")?.score || 0,
    }));

    const total = enriched.length;
    let compliant = 0, nonCompliant = 0, partial = 0, notAssessed = 0, notApplicable = 0;
    for (const c of enriched) {
      if (c.status === "Compliant") compliant++
      else if (c.status === "Non-Compliant") nonCompliant++
      else if (c.status === "Partially Compliant") partial++
      else if (c.status === "Not Applicable") notApplicable++
      else notAssessed++
    }
    const denominator = total - notApplicable;
    const overallScore = denominator > 0
      ? Math.round((compliant + partial * 0.5) / denominator * 100 * 100) / 100
      : 100;

    res.json({ overallScore, total, compliant, nonCompliant, partial, notAssessed, notApplicable, controls: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch compliance status" });
  }
});

// ── Create/Update Assessment ──
router.post("/compliance/assess", async (req, res) => {
  const parsed = insertComplianceAssessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const existing = await ComplianceAssessment.find({
      controlId: parsed.data.controlId,
    } as any).lean();
    let item;
    if (existing.length > 0) {
      item = await ComplianceAssessment.findByIdAndUpdate(
        existing[0]._id ?? "",
        { ...parsed.data, updatedAt: new Date().toISOString() },
        { new: true }
      );
    } else {
      item = await ComplianceAssessment.create(parsed.data);
    }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to save assessment" });
  }
});

// ── Cross Mappings ──
router.get("/cross-mappings", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.sourceFramework) filter.sourceFramework = req.query.sourceFramework;
    if (req.query.targetFramework) filter.targetFramework = req.query.targetFramework;
    const items = await CrossMapping.find(filter).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cross-mappings" });
  }
});

// ── Triple Mappings (Excel format: ISO ↔ CBE ↔ PCI) — Optimized O(N) ──
router.get("/triple-mappings", async (_req, res) => {
  try {
    const [isoControls, cbeControls, pciControls, assessments, triples] = await Promise.all([
      Control.find({ frameworkCode: "ISO27001" } as any).lean(),
      Control.find({ frameworkCode: "CBE_CSF" } as any).lean(),
      Control.find({ frameworkCode: "PCI_DSS" } as any).lean(),
      ComplianceAssessment.find({} as any).lean(),
      TripleMapping.find().lean(),
    ]);

    // Build O(1) lookup maps BEFORE the loop
    const isoByControlId = new Map<string, any>()
    for (const c of isoControls) isoByControlId.set(c.controlId, c)

    const cbeByControlId = new Map<string, any>()
    for (const c of cbeControls) cbeByControlId.set(c.controlId, c)

    const pciByControlId = new Map<string, any>()
    for (const c of pciControls) pciByControlId.set(c.controlId, c)

    const assessByCtrlId = new Map<string, any>()
    for (const a of assessments) assessByCtrlId.set(a.controlId, a)

    // Single pass enrichment — O(N) total
    const enriched = triples.map((m: any) => {
      const isoCtrl = isoByControlId.get(m.isoDbControlId) ?? null
      const cbeCtrl = m.cbeDbControlId ? (cbeByControlId.get(m.cbeDbControlId) ?? null) : null
      const pciCtrl = m.pciDbControlId ? (pciByControlId.get(m.pciDbControlId) ?? null) : null

      const isoAss = isoCtrl ? assessByCtrlId.get(isoCtrl._id) ?? null : null
      const cbeAss = cbeCtrl ? assessByCtrlId.get(cbeCtrl._id) ?? null : null
      const pciAss = pciCtrl ? assessByCtrlId.get(pciCtrl._id) ?? null : null

      // Find latest assessment across the 3 without sorting
      let latest = null
      if (isoAss && (!latest || new Date(isoAss.assessedAt) > new Date(latest.assessedAt))) latest = isoAss
      if (cbeAss && (!latest || new Date(cbeAss.assessedAt) > new Date(latest.assessedAt))) latest = cbeAss
      if (pciAss && (!latest || new Date(pciAss.assessedAt) > new Date(latest.assessedAt))) latest = pciAss

      return {
        ...m,
        isoControlName: isoCtrl?.name ?? null,
        cbeControlName: cbeCtrl?.name ?? null,
        pciControlName: pciCtrl?.name ?? null,
        isoAssessment: isoAss ? { status: isoAss.status, score: isoAss.score } : null,
        cbeAssessment: cbeAss ? { status: cbeAss.status, score: cbeAss.score } : null,
        pciAssessment: pciAss ? { status: pciAss.status, score: pciAss.score } : null,
        assessmentStatus: latest?.status || "Not Assessed",
        assessmentScore: latest?.score || 0,
      }
    })

    res.json({ items: enriched })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch triple mappings" })
  }
})

// ── Create Triple Mapping ──
router.post("/triple-mappings", async (req, res) => {
  try {
    const { mapId, isoRef, category, isoTitle, cbeRef, cbeTitle, cbeStrength,
            pciRef, pciTitle, pciStrength, score, gapFlag, rationale } = req.body;
    if (!mapId || !isoRef) {
      res.status(400).json({ error: "mapId and isoRef required" });
      return;
    }
    const isoToDb = (ref: string) => { let r = ref; if (r.startsWith('A.')) r = r.slice(2); else if (r.startsWith('Cl.')) r = r.slice(3); return r; };
    const firstRef = (s: string) => s.split(' / ')[0].trim();
    const cbeToDb = (ref: string) => { if (ref === '—' || !ref) return ''; const p = firstRef(ref).split('.'); return `CTRL-${p[0]}-${p[1]}`; };
    const pciToDb = (ref: string) => { if (ref === '—' || !ref) return ''; return firstRef(ref).split('.')[0]; };
    const item = await TripleMapping.create({
      mapId, isoRef, category: category || '', isoTitle: isoTitle || '',
      cbeRef: cbeRef || '—', cbeTitle: cbeTitle || '—', cbeStrength: cbeStrength || '—',
      pciRef: pciRef || '—', pciTitle: pciTitle || '—', pciStrength: pciStrength || '—',
      score: score || '2/3', gapFlag: gapFlag || '⚠️ Partial Gap', rationale: rationale || '',
      isoDbControlId: isoToDb(isoRef),
      cbeDbControlId: cbeToDb(cbeRef || '—'),
      pciDbControlId: pciToDb(pciRef || '—'),
      isCustom: true, createdAt: new Date().toISOString(),
    });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create triple mapping" });
  }
});

// ── Update Triple Mapping ──
router.put("/triple-mappings/:id", async (req, res) => {
  try {
    const item = await TripleMapping.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update triple mapping" });
  }
});

// ── Delete Triple Mapping ──
router.delete("/triple-mappings/:id", async (req, res) => {
  try {
    const item = await TripleMapping.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete triple mapping" });
  }
});

// ── Latest Assessments (across all frameworks) ──
router.get("/latest-assessments", async (_req, res) => {
  try {
    const allAssessments = await ComplianceAssessment.find({} as any).lean();
    const allControls = await Control.find({} as any).lean();
    const ctrlMap = new Map<string, any>();
    for (const c of allControls) ctrlMap.set(c._id ?? "", c);
    const enriched = allAssessments
      .map((a: any) => ({
        _id: a._id,
        controlId: a.controlId,
        frameworkCode: a.frameworkCode,
        status: a.status,
        score: a.score,
        findings: a.findings,
        assessedBy: a.assessedBy,
        assessedAt: a.assessedAt,
        controlName: ctrlMap.get(a.controlId ?? "")?.name || "Unknown",
        controlRef: ctrlMap.get(a.controlId ?? "")?.controlId || "—",
      }))
      .sort((a: any, b: any) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())
      .slice(0, 20);
    res.json({ items: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch latest assessments" });
  }
});

export default router;
