import "dotenv/config";
import app from "./app";
import { logger } from "./config/logger";
import { env, validateEnv } from "./config/env";
import { startSchedulers } from "./services/scheduler";

validateEnv();

async function main(): Promise<void> {
  const { waitForDB } = await import("@workspace/db");
  await waitForDB();

  const { seedComplianceData } = await import("@workspace/db/seed/compliance-seed.ts");
  const { seedRisks, seedBankingModules } = await import("./seed");

  await Promise.all([
    seedRisks().catch(e => logger.warn({ err: e }, "Risk seed failed")),
    seedComplianceData().catch(e => logger.warn({ err: e }, "Compliance seed failed")),
    seedBankingModules().catch(e => logger.warn({ err: e }, "Banking seed failed")),
  ]);

  logger.info("Database ready");

  startSchedulers();

  app.listen(env.port, () => {
    logger.info({ port: env.port }, "Server listening");
  });
}

main().catch(err => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
