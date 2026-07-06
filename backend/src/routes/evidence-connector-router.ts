import { Router } from "express";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { EvidenceConnector, ApiClient, signEvidence, verifySignature } from "../services/evidence-connector";
import type { ConnectorConfig } from "../services/evidence-connector";

const router = Router();

const inMemoryChecks: Record<string, unknown>[] = [];
const inMemoryRecords: Record<string, unknown>[] = [];

router.get("/checks", asyncHandler(async (_req, res) => {
  res.json({ checks: inMemoryChecks });
}));

router.post("/checks", asyncHandler(async (req, res) => {
  const { providerName, baseUrl, authType, apiKey, endpoint } = req.body;
  if (!providerName || !baseUrl || !authType) {
    throw new AppError(400, "providerName, baseUrl, and authType are required");
  }

  const config: ConnectorConfig = {
    providerName,
    baseUrl,
    authType,
    apiKey: apiKey ?? "",
    timeoutMs: 10000,
  };

  const client = new ApiClient(config);
  const store = {
    saveEvidence: async () => {},
    getControlIdByCode: async () => null,
  };
  const connector = new EvidenceConnector(client, store);
  const results = await connector.runAllChecks();

  for (const r of results) inMemoryChecks.push(r as unknown as Record<string, unknown>);
  res.status(201).json({ checks: results });
}));

router.get("/records", asyncHandler(async (_req, res) => {
  res.json({ records: inMemoryRecords });
}));

router.post("/records", asyncHandler(async (req, res) => {
  const { controlId, rawPayload, compliant, signedBy } = req.body;
  if (!controlId) throw new AppError(400, "controlId is required");

  const signed = signEvidence({
    controlId,
    rawPayload,
    compliant: compliant ?? false,
    checkedAt: new Date().toISOString(),
    signedBy: signedBy ?? "user",
  });

  const record = {
    evidenceId: signed.evidenceId,
    controlId,
    rawPayload,
    compliant: compliant ?? false,
    digitalSignature: signed.digitalSignature,
    signedBy: signedBy ?? "user",
    signedAt: signed.signedAt,
    uploadedAt: new Date().toISOString(),
    status: "UPLOADED",
  };

  inMemoryRecords.push(record);
  res.status(201).json({ record });
}));

export default router;
