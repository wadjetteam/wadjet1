import { logger } from "../lib/logger";
import { runMonthlyCollection } from "./collection-engine";
import { runEscalationCheck } from "./breach-engine";

let monthlyInterval: ReturnType<typeof setInterval> | null = null;
let escalationInterval: ReturnType<typeof setInterval> | null = null;

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
  setTimeout(() => {
    runMonthlyCollection().catch((err) =>
      logger.error({ err }, "Monthly collection failed")
    );
    monthlyInterval = setInterval(() => {
      runMonthlyCollection().catch((err) =>
        logger.error({ err }, "Monthly collection failed")
      );
    }, 30 * 24 * 60 * 60 * 1000);
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

export function startSchedulers(): void {
  logger.info("Starting background schedulers");
  startMonthlyCron();
  startEscalationCheckCron();
}

export function stopSchedulers(): void {
  if (monthlyInterval) clearInterval(monthlyInterval);
  if (escalationInterval) clearInterval(escalationInterval);
  monthlyInterval = null;
  escalationInterval = null;
  logger.info("Background schedulers stopped");
}
