import { KriCatalog, KriMeasurement, BreachTask } from "@workspace/db";
import { logger } from "../lib/logger";

export interface AppetiteComplianceReport {
  reportDate: string;
  totalKris: number;
  overallComplianceRate: number;
  byCategory: Array<{
    riskCategory: string;
    totalKris: number;
    greenCount: number;
    amberCount: number;
    redCount: number;
    outsideAppetitePercent: number;
  }>;
}

export interface OverdueBreachSummary {
  reportDate: string;
  totalOverdueTasks: number;
  level1Escalated: number;
  level2Escalated: number;
  tasks: Array<{
    taskId: string;
    title: string;
    escalationLevel: string;
    owner: string;
    dueBy: string;
    overdueHours: number;
    status: string;
    kriCatalogId: string;
  }>;
}

export async function getAppetiteComplianceReport(): Promise<AppetiteComplianceReport> {
  logger.info("Generating CBE Appetite Compliance Report");
  const kris = await KriCatalog.find({ isActive: true } as any).lean();
  const measurements = await KriMeasurement.find({ status: "Approved" } as any).lean();
  const latestByKri = new Map<string, any>();
  for (const m of measurements) {
    const existing = latestByKri.get(m.catalogId);
    if (!existing || m.period > existing.period) {
      latestByKri.set(m.catalogId, m);
    }
  }
  const categories = new Map<string, { total: number; green: number; amber: number; red: number }>();
  let totalGreen = 0, totalRed = 0, totalKris = 0;
  for (const kri of kris) {
    const key = kri.riskCategory || "Uncategorized";
    if (!categories.has(key)) categories.set(key, { total: 0, green: 0, amber: 0, red: 0 });
    const cat = categories.get(key)!;
    cat.total++;
    totalKris++;
    const meas = latestByKri.get(kri._id ?? "");
    if (meas) {
      switch (meas.appetiteStatus) {
        case "Green": cat.green++; totalGreen++; break;
        case "Red": cat.red++; totalRed++; break;
        default: cat.amber++; break;
      }
    } else {
      cat.amber++;
    }
  }
  const overallComplianceRate = totalKris > 0 ? Math.round((totalGreen / totalKris) * 10000) / 100 : 0;
  return {
    reportDate: new Date().toISOString(),
    totalKris,
    overallComplianceRate,
    byCategory: Array.from(categories.entries()).map(([riskCategory, data]) => ({
      riskCategory,
      totalKris: data.total,
      greenCount: data.green,
      amberCount: data.amber,
      redCount: data.red,
      outsideAppetitePercent: data.total > 0 ? Math.round((data.red / data.total) * 10000) / 100 : 0,
    })),
  };
}

export async function getOverdueBreachSummary(): Promise<OverdueBreachSummary> {
  logger.info("Generating overdue breach summary for Audit Committee");
  const tasks = await BreachTask.find({ status: { $ne: "Closed" } } as any).lean();
  const overdueTasks = tasks.filter((t) => {
    const hours = (Date.now() - new Date(t.dueBy).getTime()) / (1000 * 60 * 60);
    return hours > 0;
  });
  return {
    reportDate: new Date().toISOString(),
    totalOverdueTasks: overdueTasks.length,
    level1Escalated: overdueTasks.filter((t) => t.escalationLevel === "Level1_DeptHead").length,
    level2Escalated: overdueTasks.filter((t) => t.escalationLevel === "Level2_CRO_CEO").length,
    tasks: overdueTasks.map((t) => ({
      taskId: t._id ?? "",
      title: t.title,
      escalationLevel: t.escalationLevel,
      owner: t.riskOwnerId,
      dueBy: t.dueBy,
      overdueHours: Math.round((Date.now() - new Date(t.dueBy).getTime()) / (1000 * 60 * 60) * 100) / 100,
      status: t.status,
      kriCatalogId: t.kriCatalogId,
    })),
  };
}
