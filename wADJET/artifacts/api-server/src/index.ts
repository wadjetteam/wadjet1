import { Risk, waitForDB } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";
import { startSchedulers } from "./services/scheduler";
import path from "path";
import { fileURLToPath } from "url";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedRisks() {
  const existing = await Risk.find().lean();
  if (existing.length > 0) {
    logger.info({ count: existing.length }, "Risks already present");
    return;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const xlsx = await import("xlsx");
  const workbook = xlsx.default.readFile(
    path.resolve(__dirname, "../../../attached_assets/Risk_Assessment_v3_1781339321638.xlsx")
  );
  const ws = workbook.Sheets["Risk Rigister"];
  const data: unknown[][] = xlsx.default.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
  const rows = data.slice(3).filter((r: any) => r[0] && String(r[0]).startsWith("R-"));

  const excelDateToISO = (v: unknown): string | null => {
    if (!v || typeof v !== "number") return null;
    return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  };

  for (const r of rows) {
    await Risk.create({
      riskId: String(r[0] ?? ""),
      process: String(r[1] ?? ""),
      subProcess: String(r[2] ?? ""),
      assetSystem: String(r[3] ?? ""),
      ownerTeam: String(r[4] ?? ""),
      riskCategory: String(r[5] ?? ""),
      threat: String(r[6] ?? ""),
      vulnerability: String(r[7] ?? ""),
      severity: String(r[8] ?? ""),
      riskTitle: String(r[9] ?? ""),
      riskDescription: String(r[10] ?? ""),
      riskRef: String(r[11] ?? ""),
      likelihood: Number(r[12]) || 1,
      impactFinance: Number(r[13]) || 1,
      impactRegulatory: Number(r[14]) || 1,
      impactReputational: Number(r[15]) || 1,
      impactSafety: Number(r[16]) || 1,
      impactOperational: Number(r[17]) || 1,
      impactC: Number(r[18]) || 1,
      impactI: Number(r[19]) || 1,
      impactA: Number(r[20]) || 1,
      overallScore: Number(r[21]) || 0,
      riskScore: Number(r[22]) || 0,
      inherentLevel: String(r[23] ?? ""),
      existingControls: String(r[24] ?? "").replace(/\r\n/g, "; "),
      residualScore: Number(r[25]) || 0,
      overallRisk: String(r[26] ?? ""),
      treatment: String(r[27] ?? ""),
      status: String(r[28] ?? "Open"),
      mitigationActions: String(r[29] ?? "").replace(/\r\n/g, "; "),
      deadline: excelDateToISO(r[30]),
      owner: String(r[31] ?? ""),
    });
  }

  const count = await (await Risk.find().lean()).length;
  logger.info({ count }, "Database seeded");
}

async function main() {
  await waitForDB();
  await seedRisks();
  logger.info("Database ready");

  startSchedulers();
  logger.info("Background schedulers started");

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
