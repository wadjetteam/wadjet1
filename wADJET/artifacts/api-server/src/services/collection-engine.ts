import { KpiCatalog, KriCatalog, KpiMeasurement, KriMeasurement } from "@workspace/db";
import { logger } from "../lib/logger";
import { buildReviewAlert, sendNotification } from "./notification-service";

function getCurrentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getNextPeriod(current: string): string {
  const [y, m] = current.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function evaluateKpiThresholds(catalogId: string, value: number): Promise<string | null> {
  const catalogs = await KpiCatalog.find({ _id: catalogId } as any).lean();
  const cat = catalogs[0];
  if (!cat) return null;
  if (cat.criticalThreshold != null && value >= cat.criticalThreshold) return "Red";
  if (cat.warningThreshold != null && value >= cat.warningThreshold) return "Amber";
  return "Green";
}

async function evaluateKriAppetite(catalogId: string, value: number): Promise<string | null> {
  const catalogs = await KriCatalog.find({ _id: catalogId } as any).lean();
  const cat = catalogs[0];
  if (!cat) return null;
  if (cat.redMin != null && cat.redMax != null && value >= cat.redMin && value <= cat.redMax) return "Red";
  if (cat.amberMin != null && cat.amberMax != null && value >= cat.amberMin && value <= cat.amberMax) return "Amber";
  if (cat.greenMin != null && cat.greenMax != null && value >= cat.greenMin && value <= cat.greenMax) return "Green";
  return "Amber";
}

async function getPreviousMeasurement(catalogId: string, period: string): Promise<number | null> {
  const [y, m] = period.split("-").map(Number);
  let prevM = m - 1;
  let prevY = y;
  if (prevM === 0) { prevM = 12; prevY -= 1; }
  const prevPeriod = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const prev = await KriMeasurement.find({ catalogId, period: prevPeriod } as any).lean();
  return prev.length > 0 ? (prev[0].currentValue ?? null) : null;
}

function calculateTrend(
  currentValue: number,
  previousValue: number | null
): { percentageChange: number | null; trendDirection: 'Increasing' | 'Stable' | 'Decreasing' } {
  if (previousValue == null || previousValue === 0) {
    return { percentageChange: null, trendDirection: "Stable" };
  }
  const change = ((currentValue - previousValue) / previousValue) * 100;
  let direction: 'Increasing' | 'Stable' | 'Decreasing' = "Stable";
  if (change > 5) direction = "Increasing";
  else if (change < -5) direction = "Decreasing";
  return { percentageChange: Math.round(change * 100) / 100, trendDirection: direction };
}

async function processKpiManual(cat: any, period: string): Promise<void> {
  const existing = await KpiMeasurement.find({ catalogId: cat._id, period } as any).lean();
  if (existing.length > 0) return;
  await KpiMeasurement.create({
    catalogId: cat._id ?? "",
    period,
    status: "Draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  logger.info({ kpiCode: cat.code, period }, "Created blank KPI measurement (Manual)");
}

async function processKpiCalculated(cat: any, period: string): Promise<void> {
  const existing = await KpiMeasurement.find({ catalogId: cat._id, period } as any).lean();
  if (existing.length > 0) return;
  try {
    let value: number | null = null;
    if (cat.calculationFormula) {
      const prev = await KpiMeasurement.find({ catalogId: cat._id } as any).lean();
      const ctx = { previousValue: prev.length > 0 ? (prev[prev.length - 1].currentValue ?? 0) : 0, target: cat.targetValue };
      const safe = cat.calculationFormula
        .replace(/prev_value/g, String(ctx.previousValue))
        .replace(/target/g, String(ctx.target));
      try {
        value = Function(`"use strict"; return (${safe})`)();
      } catch {
        value = null;
      }
    }
    const appetiteStatus = value != null ? await evaluateKpiThresholds(cat._id ?? "", value) : null;
    await KpiMeasurement.create({
      catalogId: cat._id ?? "",
      period,
      currentValue: value,
      status: value != null ? "Pending Review" : "Draft",
      appetiteStatus: appetiteStatus as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info({ kpiCode: cat.code, period, value }, "Created KPI measurement (Calculated)");
  } catch (err) {
    logger.error({ err, kpiCode: cat.code }, "Failed to process Calculated KPI");
  }
}

async function processKpiIntegrated(cat: any, period: string): Promise<void> {
  const existing = await KpiMeasurement.find({ catalogId: cat._id, period } as any).lean();
  if (existing.length > 0) return;
  try {
    if (!cat.apiEndpoint) {
      logger.warn({ kpiCode: cat.code }, "Integrated KPI has no apiEndpoint — skipping");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(cat.apiEndpoint, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
    const data = await response.json();
    let value: number | null = null;
    if (cat.apiJsonKey) {
      const keys = cat.apiJsonKey.split(".");
      let ptr: any = data;
      for (const k of keys) { if (ptr != null) ptr = ptr[k]; }
      value = typeof ptr === "number" ? ptr : parseFloat(String(ptr));
    } else {
      value = typeof data === "number" ? data : null;
    }
    if (value == null || isNaN(value)) throw new Error(`Could not extract value using key: ${cat.apiJsonKey}`);
    const appetiteStatus = await evaluateKpiThresholds(cat._id ?? "", value);
    await KpiMeasurement.create({
      catalogId: cat._id ?? "",
      period,
      currentValue: value,
      status: "Pending Review",
      appetiteStatus: appetiteStatus as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info({ kpiCode: cat.code, period, value }, "Created KPI measurement (Integrated)");
  } catch (err: any) {
    logger.error({ err: err.message, kpiCode: cat.code }, "Failed to process Integrated KPI");
    await KpiMeasurement.create({
      catalogId: cat._id ?? "",
      period,
      status: "Draft",
      comments: `API collection failed: ${err.message}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

async function processKriMeasurement(cat: any, period: string): Promise<void> {
  const existing = await KriMeasurement.find({ catalogId: cat._id, period } as any).lean();
  if (existing.length > 0) return;
  try {
    let value: number | null = null;
    if (cat.isIntegrated && cat.apiEndpoint) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(cat.apiEndpoint, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const data = await response.json();
      if (cat.apiJsonKey) {
        const keys = cat.apiJsonKey.split(".");
        let ptr: any = data;
        for (const k of keys) { if (ptr != null) ptr = ptr[k]; }
        value = typeof ptr === "number" ? ptr : parseFloat(String(ptr));
      } else {
        value = typeof data === "number" ? data : null;
      }
    }
    const previousValue = value != null ? await getPreviousMeasurement(cat._id ?? "", period) : null;
    const trend = value != null && previousValue != null
      ? calculateTrend(value, previousValue)
      : { percentageChange: null, trendDirection: null as any };
    const appetiteStatus = value != null ? await evaluateKriAppetite(cat._id ?? "", value) : null;
    await KriMeasurement.create({
      catalogId: cat._id ?? "",
      period,
      currentValue: value,
      status: value != null ? "Pending Review" : "Draft",
      appetiteStatus: appetiteStatus as any,
      previousValue,
      percentageChange: trend.percentageChange,
      trendDirection: trend.trendDirection,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info({ kriCode: cat.code, period, value }, "Created KRI measurement");
  } catch (err: any) {
    logger.error({ err: err.message, kriCode: cat.code }, "Failed to process KRI");
    await KriMeasurement.create({
      catalogId: cat._id ?? "",
      period,
      status: "Draft",
      comments: `Collection failed: ${err.message}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function runMonthlyCollection(): Promise<void> {
  logger.info("Starting monthly KPI/KRI collection cycle");
  const period = getCurrentPeriod();
  const kpis = await KpiCatalog.find({ isActive: true } as any).lean();
  const kris = await KriCatalog.find({ isActive: true } as any).lean();
  for (const cat of kpis) {
    try {
      switch (cat.calculationType) {
        case "Manual": await processKpiManual(cat, period); break;
        case "Calculated": await processKpiCalculated(cat, period); break;
        case "Integrated": await processKpiIntegrated(cat, period); break;
      }
    } catch (err) {
      logger.error({ err, kpiCode: cat.code }, "Error processing KPI");
    }
  }
  for (const cat of kris) {
    try {
      await processKriMeasurement(cat, period);
    } catch (err) {
      logger.error({ err, kriCode: cat.code }, "Error processing KRI");
    }
  }
  logger.info({ kpiCount: kpis.length, kriCount: kris.length }, "Monthly collection cycle complete");
}

export async function runManualCollectionForCatalog(catalogId: string, metricType: 'KPI' | 'KRI'): Promise<any> {
  const period = getCurrentPeriod();
  if (metricType === "KPI") {
    const catalogs = await KpiCatalog.find({ _id: catalogId } as any).lean();
    const cat = catalogs[0];
    if (!cat) throw new Error("KPI catalog not found");
    switch (cat.calculationType) {
      case "Manual": await processKpiManual(cat, period); break;
      case "Calculated": await processKpiCalculated(cat, period); break;
      case "Integrated": await processKpiIntegrated(cat, period); break;
    }
    const meas = await KpiMeasurement.find({ catalogId, period } as any).lean();
    return meas[0] ?? null;
  } else {
    const catalogs = await KriCatalog.find({ _id: catalogId } as any).lean();
    const cat = catalogs[0];
    if (!cat) throw new Error("KRI catalog not found");
    await processKriMeasurement(cat, period);
    const meas = await KriMeasurement.find({ catalogId, period } as any).lean();
    return meas[0] ?? null;
  }
}
