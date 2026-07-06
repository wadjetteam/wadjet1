import { Router } from "express";
import {
  CapitalRatio, RWATrend, LiquidityRatio,
  LossCategory, LossEvent, MonthlyLoss,
  Risk,
  calcRiskScore, calcResidualScore, scoreToLevel,
  BASEL_EVENT_TYPES, getCollection,
} from "@workspace/db";
import { asyncHandler, AppError } from "../../middleware/error-handler";
import { routeParam } from "../../lib/store-helpers";
import { logger } from "../../config/logger";

const CURRENCY_RATES: Record<string, number> = {
  EGP: 1, USD: 48.5, EUR: 52.8, GBP: 61.2, SAR: 12.9, AED: 13.2,
};

function toEGP(amount: number, currency: string = "EGP"): number {
  const rate = CURRENCY_RATES[currency.toUpperCase()];
  if (!rate) {
    logger.warn({ currency }, "Unknown currency — defaulting to 1:1 with EGP");
    return amount;
  }
  return amount * rate;
}

const TAXONOMY_MAP: Record<string, { keywords: string[]; delta: number }> = {
  EF:   { keywords: ["External Fraud", "External", "Cyber"],        delta: 2 },
  IF:   { keywords: ["Internal Fraud", "Internal"],                  delta: 2 },
  EPWS: { keywords: ["Employment", "HR", "Workplace"],              delta: 1 },
  CPBP: { keywords: ["Clients", "Products", "Business Practice", "Compliance"], delta: 2 },
  DPA:  { keywords: ["Physical", "Asset", "Security", "Disaster"],  delta: 1 },
  BDSF: { keywords: ["Business Disruption", "System", "IT", "Technology"], delta: 1 },
  EDPM: { keywords: ["Execution", "Process", "Operations", "Transaction"], delta: 2 },
};

const router = Router();

router.get("/operational-loss/config", asyncHandler(async (_req, res) => {
  res.json({
    eventTypes: [...BASEL_EVENT_TYPES],
    businessLines: ["Retail", "Corporate", "Treasury", "SME", "Wealth"],
    statuses: ["open", "closed", "remediated"],
  });
}));

router.get("/operational-loss/categories", asyncHandler(async (_req, res) => {
  const items = await LossCategory.find().lean();
  res.json({ items });
}));

router.get("/operational-loss/events", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.nearMiss !== undefined) filter.nearMiss = req.query.nearMiss === "true";
  if (req.query.status) filter.status = req.query.status;
  const items = await LossEvent.find(filter).sort({ date: -1 }).lean();
  res.json({ items });
}));

async function cascadeRiskUpdates(baselCategory: string, amount: number, eventId: string): Promise<string[]> {
  const taxonomy = TAXONOMY_MAP[baselCategory];
  if (!taxonomy) return [];

  const allRisks = await Risk.find().lean();
  const autoLinkedRiskIds: string[] = [];

  for (const risk of allRisks) {
    if (!risk._id) continue;
    const matches = taxonomy.keywords.some(kw =>
      (risk.riskCategory || "").toLowerCase().includes(kw.toLowerCase())
    );
    if (!matches) continue;

    const delta = amount >= 1_000_000 ? 2 : amount >= 500_000 ? 1 : 0;
    if (delta === 0) continue;

    const update = {
      impactFinance: Math.min(5, (risk.impactFinance || 1) + delta),
      impactOperational: Math.min(5, (risk.impactOperational || 1) + Math.max(0, delta - 1)),
    };
    const updatedRisk = { ...risk, ...update };
    const riskScore = calcRiskScore(updatedRisk);
    const residualScore = calcResidualScore(riskScore, updatedRisk.controlStatus);
    await Risk.findByIdAndUpdate(risk._id, {
      ...update,
      overallScore: riskScore, riskScore, inherentLevel: scoreToLevel(riskScore),
      residualScore, overallRisk: scoreToLevel(residualScore),
    });
    autoLinkedRiskIds.push(risk.riskId);
  }

  if (autoLinkedRiskIds.length > 0) {
    await LossEvent.findByIdAndUpdate(eventId, {
      riskId: autoLinkedRiskIds[0],
      autoLinkedRiskIds: autoLinkedRiskIds.join(","),
    });
  }
  return autoLinkedRiskIds;
}

async function cascadeCapitalDeduction(amount: number, baselCategory: string): Promise<void> {
  const rwaItems = await RWATrend.find().lean();
  const totalRWA = rwaItems.length > 0
    ? (rwaItems[rwaItems.length - 1].credit + rwaItems[rwaItems.length - 1].market + rwaItems[rwaItems.length - 1].operational) * 1_000_000
    : 70_900_000_000;

  const ratios = await CapitalRatio.find().lean();
  const cet1 = ratios.find((r: { name: string }) => r.name === "CET1");
  if (cet1 && cet1._id) {
    const deductionRatio = (amount / totalRWA) * 100;
    await CapitalRatio.findByIdAndUpdate(cet1._id, {
      value: parseFloat(Math.max(0, cet1.value - deductionRatio).toFixed(4)),
    });
  }

  if (baselCategory === "EF" || baselCategory === "BDSF") {
    const liquidityItems = await LiquidityRatio.find().lean();
    const lcr = liquidityItems.find((r: { name: string }) => r.name === "LCR");
    if (lcr && lcr._id) {
      const lcrImpact = (amount / 100_000_000) * 100;
      const liquidityCol = getCollection("liquidity_ratios");
      await liquidityCol.findByIdAndUpdate(lcr._id, {
        value: parseFloat(Math.max(100, lcr.value - lcrImpact).toFixed(2)),
      });
    }
  }
}

router.post("/operational-loss/events", asyncHandler(async (req, res) => {
  const { insertLossEventSchema } = await import("@workspace/db");
  const parsed = insertLossEventSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues.map((i: { message: string }) => i.message).join("; "));
  }

  const amountEGP = toEGP(parsed.data.amount, parsed.data.currency);
  const event = await LossEvent.create({ ...parsed.data, amount: amountEGP });

  const [autoLinkedRiskIds] = await Promise.all([
    cascadeRiskUpdates(parsed.data.category, amountEGP, event._id || ""),
    cascadeCapitalDeduction(amountEGP, parsed.data.category).catch((err: Error) =>
      logger.error({ err }, "Capital deduction cascade failed")
    ),
  ]);

  res.status(201).json({ event, cascades: { riskUpdated: autoLinkedRiskIds.length > 0, autoLinkedRisks: autoLinkedRiskIds } });
}));

router.get("/operational-loss/monthly", asyncHandler(async (_req, res) => {
  const items = await MonthlyLoss.find().sort({ month: 1 }).lean();
  res.json({ items });
}));

export default router;
