import { Router } from "express";
import { randomUUID, createHash } from "node:crypto";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { getCollection } from "@workspace/db";

interface AuditEntryDoc {
  _id?: string;
  entryId: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details: unknown;
  previousHash: string;
  currentHash: string;
  timestamp: string;
}

function computeHash(entry: Omit<AuditEntryDoc, "currentHash" | "_id">): string {
  const data = `${entry.entryId}|${entry.action}|${entry.entityType}|${entry.entityId}|${entry.userId}|${JSON.stringify(entry.details)}|${entry.previousHash}|${entry.timestamp}`;
  return createHash("sha256").update(data).digest("hex");
}

const auditEntries = getCollection<AuditEntryDoc>("audit_trail");

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { action, entityType, entityId, userId } = req.query;
  const all = await auditEntries.find().lean();
  let filtered = all;
  if (action) filtered = filtered.filter(e => e.action === action);
  if (entityType) filtered = filtered.filter(e => e.entityType === entityType);
  if (entityId) filtered = filtered.filter(e => e.entityId === entityId);
  if (userId) filtered = filtered.filter(e => e.userId === userId);
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json({ entries: filtered });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const all = await auditEntries.find().lean();
  const entry = all.find(e => e.entryId === id);
  if (!entry) throw new AppError(404, "Audit entry not found");
  res.json({ entry });
}));

router.post("/verify", asyncHandler(async (_req, res) => {
  const all = await auditEntries.find().lean();
  all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const broken: string[] = [];
  let expectedPrev = "";

  for (const entry of all) {
    const { currentHash, ...rest } = entry;
    delete (rest as Record<string, unknown>)._id;
    const recalculated = computeHash(rest as AuditEntryDoc);
    if (recalculated !== entry.currentHash) broken.push(entry.entryId);
    if (rest.previousHash !== expectedPrev) broken.push(entry.entryId);
    expectedPrev = entry.currentHash;
  }

  res.json({ valid: broken.length === 0, brokenEntries: broken, totalEntries: all.length });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { action, entityType, entityId, userId, details } = req.body;
  if (!action || !entityType || !entityId || !userId) {
    throw new AppError(400, "action, entityType, entityId, and userId are required");
  }

  const all = await auditEntries.find().lean();
  all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const previousHash = all.length > 0 ? all[0].currentHash : "";

  const entry: Omit<AuditEntryDoc, "currentHash" | "_id"> = {
    entryId: randomUUID(),
    action,
    entityType,
    entityId,
    userId,
    details: details ?? {},
    previousHash,
    timestamp: new Date().toISOString(),
  };

  const currentHash = computeHash(entry);
  const saved = await auditEntries.create({ ...entry, currentHash } as AuditEntryDoc);
  res.status(201).json({ entry: saved });
}));

export default router;
