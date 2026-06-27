import { KriMeasurement, KriCatalog, BreachTask } from "@workspace/db";
import { logger } from "../lib/logger";
import { buildBreachAlert, buildEscalationAlert, sendNotification } from "./notification-service";

function createDueDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function getOverdueHours(dueBy: string): number {
  return (Date.now() - new Date(dueBy).getTime()) / (1000 * 60 * 60);
}

export async function handleMeasurementApproved(
  measurementId: string,
  metricType: 'KPI' | 'KRI'
): Promise<void> {
  logger.info({ measurementId, metricType }, "Measurement approved — running breach validation");
  if (metricType === "KPI") {
    const measurements = await KriMeasurement.find({ _id: measurementId } as any).lean();
    const meas = measurements[0];
    if (!meas || meas.appetiteStatus !== "Red") return;
  }
  if (metricType === "KRI") {
    const measurements = await KriMeasurement.find({ _id: measurementId } as any).lean();
    const meas = measurements[0];
    if (!meas) return;
    if (meas.appetiteStatus === "Red") {
      await createBreachTask(meas);
    }
  }
}

async function createBreachTask(meas: any): Promise<void> {
  const catalogs = await KriCatalog.find({ _id: meas.catalogId } as any).lean();
  const cat = catalogs[0];
  if (!cat) return;
  const existing = await BreachTask.find({ kriMeasurementId: meas._id } as any).lean();
  if (existing.length > 0) return;
  const dueDate = createDueDate(48);
  const task = await BreachTask.create({
    kriMeasurementId: meas._id ?? "",
    kriCatalogId: meas.catalogId,
    riskOwnerId: cat.riskOwnerId,
    escalationLevel: "Level0_Owner",
    title: `Remediation: ${cat.name} breached risk appetite`,
    description: `KRI ${cat.code} (${cat.name}) entered Red zone with value ${meas.currentValue}. Immediate remediation required.`,
    severity: "Critical",
    status: "Open",
    dueBy: dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  logger.info({ taskId: task._id, kriCode: cat.code, dueDate }, "Breach remediation task created");
  try {
    const vars = {
      metricCode: cat.code,
      metricName: cat.name,
      riskCategory: cat.riskCategory,
      currentValue: String(meas.currentValue ?? ""),
      threshold: `Red zone (min: ${cat.redMin}, max: ${cat.redMax})`,
      owner: cat.riskOwnerId,
      dueDate,
      recipientAddress: `${cat.riskOwnerId}@bank.eg`,
      recipientPhone: "",
    };
    const alerts = buildBreachAlert(vars);
    await sendNotification(alerts.email);
    await sendNotification(alerts.sms);
  } catch (err) {
    logger.error({ err }, "Failed to send breach alert notifications");
  }
}

export async function runEscalationCheck(): Promise<void> {
  logger.info("Running escalation matrix check");
  const tasks = await BreachTask.find({ status: { $ne: "Closed" } } as any).lean();
  for (const task of tasks) {
    try {
      if (task.status === "Resolved") continue;
      const overdueHours = getOverdueHours(task.dueBy);
      if (overdueHours <= 0) continue;
      if (overdueHours >= 72 && task.escalationLevel !== "Level2_CRO_CEO") {
        await escalateToLevel2(task);
      } else if (overdueHours >= 48 && task.escalationLevel === "Level0_Owner") {
        await escalateToLevel1(task);
      }
    } catch (err) {
      logger.error({ err, taskId: task._id }, "Escalation check failed for task");
    }
  }
}

async function escalateToLevel1(task: any): Promise<void> {
  await BreachTask.findByIdAndUpdate(task._id ?? "", {
    escalationLevel: "Level1_DeptHead",
    level1EscalatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  logger.info({ taskId: task._id }, "Escalated to Level 1 — Department Head");
  try {
    const vars = {
      taskId: task._id ?? "",
      metricName: task.title,
      owner: task.riskOwnerId,
      level: "1",
      overdueHours: String(Math.round(getOverdueHours(task.dueBy))),
      dueDate: task.dueBy,
      escalationMessage: "This task has exceeded the 48-hour SLA. The Department Head has been notified and must intervene.",
      recipientType: "DeptHead",
      recipientAddress: `${task.deptHeadId ?? "dept-head"}@bank.eg`,
    };
    const alert = buildEscalationAlert(vars);
    await sendNotification(alert);
  } catch (err) {
    logger.error({ err, taskId: task._id }, "Failed to send Level 1 escalation");
  }
}

async function escalateToLevel2(task: any): Promise<void> {
  await BreachTask.findByIdAndUpdate(task._id ?? "", {
    escalationLevel: "Level2_CRO_CEO",
    level2EscalatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  logger.info({ taskId: task._id }, "Escalated to Level 2 — CRO/CEO");
  try {
    const vars = {
      taskId: task._id ?? "",
      metricName: task.title,
      owner: task.riskOwnerId,
      level: "2",
      overdueHours: String(Math.round(getOverdueHours(task.dueBy))),
      dueDate: task.dueBy,
      escalationMessage: "CRITICAL: This task has exceeded the 72-hour SLA. CRO and CEO have been notified for executive intervention.",
      recipientType: "CRO",
      recipientAddress: "cro@bank.eg",
    };
    const alert = buildEscalationAlert(vars);
    await sendNotification(alert);
    await sendNotification({ ...alert, recipientAddress: "ceo@bank.eg", recipientType: "CEO" });
  } catch (err) {
    logger.error({ err, taskId: task._id }, "Failed to send Level 2 escalation");
  }
}

export async function resolveBreachTask(
  taskId: string,
  rootCauseAnalysis: string,
  evidenceFilePath: string
): Promise<any> {
  const task = await BreachTask.findByIdAndUpdate(taskId, {
    status: "Resolved",
    rootCauseAnalysis,
    evidenceFilePath,
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  logger.info({ taskId }, "Breach task resolved");
  return task;
}
