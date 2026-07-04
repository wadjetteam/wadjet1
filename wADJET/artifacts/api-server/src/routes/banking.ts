import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  CapitalRatio, RWATrend, LiquidityRatio, Pillar2Item, CapitalTrend,
  LossCategory, LossEvent, MonthlyLoss,
  Vendor,
  Submission,
  Examination, Finding,
  PackTemplate, MaturityDimension, TopRisk, BKRIRecord,
  FATFRecommendation, SARMonthly, KYCException, HighRiskSegment,
  Risk, BreachTask,
  calcRiskScore, calcResidualScore, scoreToLevel, ragStatus,
  BASEL_EVENT_TYPES,
} from "@workspace/db";

const CURRENCY_RATES: Record<string, number> = {
  EGP: 1,
  USD: 48.5,
  EUR: 52.8,
  GBP: 61.2,
  SAR: 12.9,
  AED: 13.2,
};

function toEGP(amount: number, currency: string = "EGP"): number {
  const rate = CURRENCY_RATES[currency.toUpperCase()];
  if (!rate) {
    logger.warn({ currency }, "Unknown currency — defaulting to 1:1 with EGP");
    return amount;
  }
  return amount * rate;
}

const router: IRouter = Router();

/* ─── Basel Capital ─── */
router.get("/capital/ratios", async (_req, res) => {
  try {
    const items = await CapitalRatio.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch capital ratios" }); }
});
router.get("/capital/rwa-trend", async (_req, res) => {
  try {
    const items = await RWATrend.find().sort({ q: 1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch RWA trend" }); }
});
router.get("/capital/liquidity", async (_req, res) => {
  try {
    const items = await LiquidityRatio.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch liquidity ratios" }); }
});
router.get("/capital/pillar2", async (_req, res) => {
  try {
    const items = await Pillar2Item.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch Pillar 2 items" }); }
});
router.get("/capital/trend", async (_req, res) => {
  try {
    const items = await CapitalTrend.find().sort({ q: 1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch capital trend" }); }
});

/* ─── Operational Loss ─── */
router.get("/operational-loss/config", async (_req, res) => {
  res.json({
    eventTypes: [...BASEL_EVENT_TYPES],
    businessLines: ["Retail", "Corporate", "Treasury", "SME", "Wealth"],
    statuses: ["open", "closed", "remediated"],
  });
});
router.get("/operational-loss/categories", async (_req, res) => {
  try {
    const items = await LossCategory.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch loss categories" }); }
});
router.get("/operational-loss/events", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.nearMiss !== undefined) filter.nearMiss = req.query.nearMiss === "true";
    if (req.query.status) filter.status = req.query.status;
    const items = await LossEvent.find(filter).sort({ date: -1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch loss events" }); }
});
router.post("/operational-loss/events", async (req, res) => {
  try {
    const { insertLossEventSchema } = await import("@workspace/db");
    const parsed = insertLossEventSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const amountEGP = toEGP(parsed.data.amount, parsed.data.currency);
    logger.info({ inputCurrency: parsed.data.currency, inputAmount: parsed.data.amount, convertedAmount: amountEGP }, "Currency conversion");
    const item = await LossEvent.create({ ...parsed.data, amount: amountEGP });
    const amount = amountEGP;
    const baselCategory = parsed.data.category;

    /* ── Basel-to-Risk taxonomy mapping ── */
    const TAXONOMY_MAP = {
      EF:  { keywords: ['External Fraud', 'External', 'Cyber'],        delta: 2 },
      IF:  { keywords: ['Internal Fraud', 'Internal'],                  delta: 2 },
      EPWS: { keywords: ['Employment', 'HR', 'Workplace'],              delta: 1 },
      CPBP: { keywords: ['Clients', 'Products', 'Business Practice', 'Compliance'], delta: 2 },
      DPA: { keywords: ['Physical', 'Asset', 'Security', 'Disaster'],  delta: 1 },
      BDSF: { keywords: ['Business Disruption', 'System', 'IT', 'Technology'], delta: 1 },
      EDPM: { keywords: ['Execution', 'Process', 'Operations', 'Transaction'], delta: 2 },
    };

    const taxonomy = TAXONOMY_MAP[baselCategory];
    const autoLinkedRiskIds: string[] = [];

    /* ── CASCADE 1: Auto-match risks via taxonomy → update ALL matches ── */
    let riskUpdated = false;
    if (taxonomy) {
      const allRisks = await Risk.find().lean();
      const matched = allRisks.filter(r =>
        taxonomy.keywords.some(kw =>
          (r.riskCategory || '').toLowerCase().includes(kw.toLowerCase())
        )
      );
      for (const risk of matched) {
        if (risk._id) {
          const delta = amount >= 1000000 ? 2 : amount >= 500000 ? 1 : 0;
          if (delta > 0) {
            const update = {
              impactFinance: Math.min(5, (risk.impactFinance || 1) + delta),
              impactOperational: Math.min(5, (risk.impactOperational || 1) + Math.max(0, delta - 1)),
            };
            const updatedRisk = { ...risk, ...update };
            const riskScore = calcRiskScore(updatedRisk);
            const residualScore = calcResidualScore(riskScore, updatedRisk.controlStatus);
            const scores = {
              overallScore: riskScore,
              riskScore,
              inherentLevel: scoreToLevel(riskScore),
              residualScore,
              overallRisk: scoreToLevel(residualScore),
            };
            await Risk.findByIdAndUpdate(risk._id, { ...update, ...scores });
            autoLinkedRiskIds.push(risk.riskId);
          }
        }
      }
      riskUpdated = autoLinkedRiskIds.length > 0;
      const joined = autoLinkedRiskIds.join(',');
      if (joined && item._id) {
        await LossEvent.findByIdAndUpdate(item._id, {
          riskId: autoLinkedRiskIds[0] || '',
          autoLinkedRiskIds: joined,
        });
      }
    }

    /* ── CASCADE 2: Basel Capital CET1 Deduction (RWA-based) ── */
    const rwaItems = await RWATrend.find().lean();
    const totalRWA = rwaItems.length > 0
      ? (rwaItems[rwaItems.length - 1].credit + rwaItems[rwaItems.length - 1].market + rwaItems[rwaItems.length - 1].operational) * 1_000_000
      : 70_900_000_000;
    const ratios = await CapitalRatio.find().lean();
    const cet1 = ratios.find(r => r.name === 'CET1');
    if (cet1 && cet1._id) {
      const deductionRatio = (amount / totalRWA) * 100;
      const newCet1 = Math.max(0, cet1.value - deductionRatio);
      await CapitalRatio.findByIdAndUpdate(cet1._id, {
        value: parseFloat(newCet1.toFixed(4)),
      });
    }

    /* ── CASCADE 2b: Liquidity Impact (External Fraud / Cyber only) ── */
    if (baselCategory === "EF" || baselCategory === "BDSF") {
      const liquidityItems = await LiquidityRatio.find().lean();
      const lcr = liquidityItems.find(r => r.name === "LCR");
      if (lcr && lcr._id) {
        const lcrImpact = (amount / 100_000_000) * 100;
        await LiquidityRatio.findByIdAndUpdate(lcr._id, {
          value: Math.max(100, parseFloat((lcr.value - lcrImpact).toFixed(2))),
        });
      }
    }

    /* ── CASCADE 3: Remediation Task (if > EGP 500,000) ── */
    let remediationTaskId = "";
    if (amount > 500000) {
      const { insertBreachTaskSchema } = await import("@workspace/db");
      const categoryToBreachType: Record<string, "cyber" | "operational" | "compliance"> = {
        EF: "cyber", IF: "operational", EPWS: "operational",
        CPBP: "compliance", DPA: "operational",
        BDSF: "cyber", EDPM: "operational",
      };
      const breachType = categoryToBreachType[baselCategory] ?? "operational";
      const sla = { cyber: 1, operational: 24, compliance: 48 }[breachType];
      const due = new Date(Date.now() + sla * 60 * 60 * 1000);
      const taskData = insertBreachTaskSchema.parse({
        kriMeasurementId: "",
        kriCatalogId: "",
        riskOwnerId: autoLinkedRiskIds[0] || "",
        breachType,
        title: `[Auto] Loss Event EGP ${(amount / 1000000).toFixed(2)}M — ${parsed.data.title}`,
        description: `Urgent investigation triggered by operational loss event ${parsed.data.id}: ${parsed.data.title}. Gross loss EGP ${(amount / 1000000).toFixed(3)}M, ${parsed.data.eventType}, ${parsed.data.businessLine}. Auto-linked risks: ${autoLinkedRiskIds.join(', ') || 'none'}.`,
        severity: amount >= 1000000 ? "Critical" : "High",
        status: "Open",
        dueBy: due.toISOString(),
      });
      const task = await BreachTask.create(taskData);
      remediationTaskId = task._id || "";
      if (remediationTaskId && item._id) {
        await LossEvent.findByIdAndUpdate(item._id, { remediationTaskId });
      }
    }

    res.status(201).json({
      item,
      cascades: {
        riskUpdated,
        autoLinkedRisks: autoLinkedRiskIds,
        autoLinkedCount: autoLinkedRiskIds.length,
        capitalDeducted: !!cet1,
        remediationCreated: amount > 500000,
        remediationTaskId,
      },
    });
  } catch (err) { logger.error({ err }, "Failed to create loss event"); res.status(500).json({ error: "Failed to create loss event" }); }
});
router.get("/operational-loss/monthly", async (_req, res) => {
  try {
    const items = await MonthlyLoss.find().sort({ month: 1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch monthly loss" }); }
});

/* ─── TPRM ─── */
router.get("/tprm/vendors", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.tier) filter.tier = Number(req.query.tier);
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    if (req.query.status) filter.status = req.query.status;
    const items = await Vendor.find(filter).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch vendors" }); }
});
router.post("/tprm/vendors", async (req, res) => {
  try {
    const { insertVendorSchema } = await import("@workspace/db");
    const parsed = insertVendorSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const item = await Vendor.create(parsed.data);
    res.status(201).json({ item });
  } catch { res.status(500).json({ error: "Failed to create vendor" }); }
});
router.patch("/tprm/vendors/:id", async (req, res) => {
  try {
    const item = await Vendor.findByIdAndUpdate(req.params.id, req.body);
    if (!item) { res.status(404).json({ error: "Vendor not found" }); return; }
    res.json({ item });
  } catch { res.status(500).json({ error: "Failed to update vendor" }); }
});

/* ─── Regulatory Calendar ─── */
router.get("/regulatory-calendar/submissions", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    const items = await Submission.find(filter).sort({ due: 1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch submissions" }); }
});
router.patch("/regulatory-calendar/submissions/:id", async (req, res) => {
  try {
    const item = await Submission.findByIdAndUpdate(req.params.id, req.body);
    if (!item) { res.status(404).json({ error: "Submission not found" }); return; }
    res.json({ item });
  } catch { res.status(500).json({ error: "Failed to update submission" }); }
});

/* ─── Examination Tracker ─── */
router.get("/examinations", async (_req, res) => {
  try {
    const items = await Examination.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch examinations" }); }
});
router.get("/findings", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.examId) filter.examId = req.query.examId;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    const items = await Finding.find(filter).sort({ raised: -1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch findings" }); }
});
router.get("/findings/aging", async (_req, res) => {
  try {
    const items = await Finding.find().lean();
    const ranges = [
      { range: "0-30d", min: 0, max: 30 },
      { range: "31-60d", min: 31, max: 60 },
      { range: "61-90d", min: 61, max: 90 },
      { range: "90+d", min: 91, max: Infinity },
    ];
    const colors = ["#2d7d46", "#d4af37", "#b8860b", "#c41e3a"];
    const aging = ranges.map((r, i) => ({
      range: r.range,
      count: items.filter((f) => f.status !== "closed" && f.agingDays >= r.min && f.agingDays <= r.max).length,
      fill: colors[i],
    }));
    res.json({ items: aging });
  } catch { res.status(500).json({ error: "Failed to compute aging" }); }
});
router.patch("/findings/:id", async (req, res) => {
  try {
    const item = await Finding.findByIdAndUpdate(req.params.id, req.body);
    if (!item) { res.status(404).json({ error: "Finding not found" }); return; }
    res.json({ item });
  } catch { res.status(500).json({ error: "Failed to update finding" }); }
});

/* ─── Board Pack ─── */
router.get("/board-pack/templates", async (_req, res) => {
  try {
    const items = await PackTemplate.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch templates" }); }
});
router.get("/board-pack/kris", async (req, res) => {
  try {
    const items = await BKRIRecord.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch KRI records" }); }
});
router.get("/board-pack/risks", async (_req, res) => {
  try {
    const items = await TopRisk.find().sort({ rank: 1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch top risks" }); }
});
router.get("/board-pack/maturity", async (_req, res) => {
  try {
    const items = await MaturityDimension.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch maturity data" }); }
});

/* ─── AML ─── */
router.get("/aml/fatf-recommendations", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.risk) filter.risk = req.query.risk;
    const items = await FATFRecommendation.find(filter).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch FATF recommendations" }); }
});
router.patch("/aml/fatf-recommendations/:id", async (req, res) => {
  try {
    const item = await FATFRecommendation.findByIdAndUpdate(req.params.id, req.body);
    if (!item) { res.status(404).json({ error: "FATF recommendation not found" }); return; }
    res.json({ item });
  } catch { res.status(500).json({ error: "Failed to update FATF recommendation" }); }
});
router.get("/aml/sar-data", async (_req, res) => {
  try {
    const items = await SARMonthly.find().sort({ month: 1 }).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch SAR data" }); }
});
router.get("/aml/kyc-exceptions", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.risk) filter.risk = req.query.risk;
    const items = await KYCException.find(filter).lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch KYC exceptions" }); }
});
router.post("/aml/kyc-exceptions", async (req, res) => {
  try {
    const { insertKYCExceptionSchema } = await import("@workspace/db");
    const parsed = insertKYCExceptionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const item = await KYCException.create(parsed.data);
    res.status(201).json({ item });
  } catch { res.status(500).json({ error: "Failed to create KYC exception" }); }
});
router.get("/aml/high-risk-segments", async (_req, res) => {
  try {
    const items = await HighRiskSegment.find().lean();
    res.json({ items });
  } catch { res.status(500).json({ error: "Failed to fetch high-risk segments" }); }
});

export default router;
