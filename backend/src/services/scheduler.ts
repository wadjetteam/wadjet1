import { logger } from "../config/logger";

export function startSchedulers(): void {
  logger.info("Starting background schedulers (no active cron jobs)");
}

export function stopSchedulers(): void {
  logger.info("Background schedulers stopped");
}
