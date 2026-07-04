import { logger } from "../lib/logger";
import { runMonthlyCollection } from "./collection-engine";
import { runEscalationCheck } from "./breach-engine";
import { AutomationRule, ComplianceAssessment, Control, ControlStatusAudit } from "@workspace/db";
import * as crypto from "crypto";

const MAX_SAFE_DELAY = 0x7fffffff; // 2,147,483,647 ms — setTimeout clamps beyond this to 1

function safeSetTimeout(fn: () => void, delay: number): void {
  if (delay <= MAX_SAFE_DELAY) {
    setTimeout(fn, delay);
  } else {
    setTimeout(() => safeSetTimeout(fn, delay - MAX_SAFE_DELAY), MAX_SAFE_DELAY);
  }
}

let monthlyInterval: ReturnType<typeof setInterval> | null = null;
let escalationInterval: ReturnType<typeof setInterval> | null = null;
let automationInterval: ReturnType<typeof setInterval> | null = null;

function computeHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function getLastStatusHash(controlId: string): Promise<string> {
  const logs = await ControlStatusAudit.find({ controlId } as any).lean();
  const sorted = logs.sort((a: any, b: any) =>
    new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime()
  );
  return sorted.length > 0 ? sorted[0].hash : "";
}

async function evaluateAutomationRules(): Promise<void> {
  try {
    const rules = await AutomationRule.find({ isActive: true, ruleType: "SCHEDULED" } as any).lean();
    if (rules.length === 0) return;
    logger.info({ count: rules.length }, "Evaluating scheduled automation rules");
    for (const rule of rules) {
      const controls = await Control.find({ _id: rule.controlId } as any).lean();
      if (controls.length === 0) continue;
      const existing = await ComplianceAssessment.find({ controlId: rule.controlId } as any).lean();
      if (existing.length > 0 && existing[0].overrideExpiresAt && new Date(existing[0].overrideExpiresAt) > new Date()) continue;
      // Simulate API check: for now, always set based on rule action
      // In production this would call the actual API connector
      const prevHash = await getLastStatusHash(rule.controlId);
      const auditRaw = `${rule.action.compliantStatus}|${rule.controlId}|${rule._id}|${Date.now()}|${prevHash}`;
      const auditHash = computeHash(auditRaw);
      await ControlStatusAudit.create({
        controlId: rule.controlId,
        frameworkCode: rule.frameworkCode,
        source: 'AUTOMATION',
        automationRuleId: rule._id,
        status: rule.action.compliantStatus,
        score: rule.action.score,
        assessedBy: `system:rule-${rule._id}`,
        assessedAt: new Date().toISOString(),
        previousHash: prevHash,
        hash: auditHash,
      });
      if (existing.length > 0) {
        await ComplianceAssessment.findByIdAndUpdate(existing[0]._id ?? "", {
          status: rule.action.compliantStatus,
          score: rule.action.score,
          source: 'AUTOMATION',
          sourceRuleId: rule._id,
          assessedBy: `system:rule-${rule._id}`,
          assessedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        await ComplianceAssessment.create({
          controlId: rule.controlId,
          frameworkCode: rule.frameworkCode,
          status: rule.action.compliantStatus as any,
          score: rule.action.score,
          source: 'AUTOMATION',
          sourceRuleId: rule._id,
          assessedBy: `system:rule-${rule._id}`,
          assessedAt: new Date().toISOString(),
        });
      }
    }
    logger.info({ evaluated: rules.length }, "Automation rules evaluation complete");
  } catch (err) {
    logger.error({ err }, "Automation rules evaluation failed");
  }
}

function calculateMsUntilNextUtcHour(): number {
  const now = Date.now();
  const nextHour = new Date(Math.ceil(now / 3600000) * 3600000);
  return nextHour.getTime() - now;
}

function calculateMsUntilFirstOfMonth(): number {
  const now = new Date();
  let nextMonth = now.getMonth() + 1;
  let year = now.getFullYear();
  if (nextMonth > 11) { nextMonth = 0; year += 1; }
  const firstOfNext = new Date(year, nextMonth, 1, 0, 0, 0, 0);
  return firstOfNext.getTime() - now.getTime();
}

function startMonthlyCron(): void {
  const msUntilFirst = calculateMsUntilFirstOfMonth();
  logger.info({ msUntilFirst }, "Scheduling monthly collection cron (1st of month)");
  safeSetTimeout(() => {
    runMonthlyCollection().catch((err) =>
      logger.error({ err }, "Monthly collection failed")
    );
    startMonthlyCron();
  }, msUntilFirst);
}

function startEscalationCheckCron(): void {
  const msUntilHour = calculateMsUntilNextUtcHour();
  logger.info({ msUntilHour }, "Scheduling escalation check cron (every hour)");
  setTimeout(() => {
    runEscalationCheck().catch((err) =>
      logger.error({ err }, "Escalation check failed")
    );
    escalationInterval = setInterval(() => {
      runEscalationCheck().catch((err) =>
        logger.error({ err }, "Escalation check failed")
      );
    }, 60 * 60 * 1000);
  }, msUntilHour);
}

function startAutomationCron(): void {
  const msUntilHour = calculateMsUntilNextUtcHour();
  logger.info({ msUntilHour }, "Scheduling automation rules cron (every hour)");
  setTimeout(() => {
    evaluateAutomationRules().catch((err) =>
      logger.error({ err }, "Automation rules initial evaluation failed")
    );
    automationInterval = setInterval(() => {
      evaluateAutomationRules().catch((err) =>
        logger.error({ err }, "Automation rules periodic evaluation failed")
      );
    }, 60 * 60 * 1000);
  }, msUntilHour);
}

export function startSchedulers(): void {
  logger.info("Starting background schedulers");
  startMonthlyCron();
  startEscalationCheckCron();
  startAutomationCron();
}

export function stopSchedulers(): void {
  if (monthlyInterval) clearInterval(monthlyInterval);
  if (escalationInterval) clearInterval(escalationInterval);
  if (automationInterval) clearInterval(automationInterval);
  monthlyInterval = null;
  escalationInterval = null;
  automationInterval = null;
  logger.info("Background schedulers stopped");
}
