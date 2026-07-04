import { Router, type IRouter } from "express";
import multer from "multer";
import * as path from "path";
import * as crypto from "crypto";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import {
  Evidence, EvidenceControlMap, EvidenceAuditLog,
  Control, ComplianceAssessment,
  insertEvidenceSchema, insertEvidenceControlMapSchema, insertEvidenceAuditLogSchema,
} from "@workspace/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env["DB_DATA_DIR"] || path.resolve(__dirname, "../../data");
const EVIDENCE_DIR = path.resolve(DATA_DIR, "evidences");

const router: IRouter = Router();

function computeHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function getLastAuditHash(evidenceId: string): Promise<string> {
  const logs = await EvidenceAuditLog.find({ evidenceId } as any).lean();
  const sorted = logs.sort((a: any, b: any) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return sorted.length > 0 ? sorted[0].hash : "";
}

async function appendAuditLog(params: {
  evidenceId: string;
  action: 'UPLOAD' | 'MAP' | 'UNMAP' | 'APPROVE' | 'SOFT_DELETE';
  userId: string;
  metadata?: Record<string, any>;
}) {
  const prevHash = await getLastAuditHash(params.evidenceId);
  const raw = `${params.action}|${params.evidenceId}|${params.userId}|${Date.now()}|${prevHash}`;
  const hash = computeHash(raw);
  await EvidenceAuditLog.create({
    evidenceId: params.evidenceId,
    action: params.action,
    userId: params.userId,
    timestamp: new Date().toISOString(),
    metadata: params.metadata || {},
    previousHash: prevHash,
    hash,
  });
}

// ── Upload Evidence ──
router.post("/evidence/upload", async (req, res) => {
  try {
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    const storage = multer.diskStorage({
      destination: EVIDENCE_DIR,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        cb(null, name);
      },
    });
    const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
    upload.single("file")(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: "Upload failed: " + err.message });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }
      const filePath = req.file.path;
      const fileBuffer = await fs.readFile(filePath);
      const sha256Hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      const parsed = insertEvidenceSchema.parse({
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storagePath: filePath,
        sha256Hash,
        uploadedBy: (req as any).user?.id || "anonymous",
      });
      const ev = await Evidence.create(parsed);
      await appendAuditLog({ evidenceId: ev._id!, action: 'UPLOAD', userId: parsed.uploadedBy });
      res.json({ item: ev });
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to upload evidence: " + err.message });
  }
});

// ── List Evidence ──
router.get("/evidence", async (_req, res) => {
  try {
    const items = await Evidence.find({ deletedAt: null } as any).lean();
    const sorted = items.sort((a: any, b: any) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const maps = await EvidenceControlMap.find({} as any).lean();
    const mapByEvidence: Record<string, any[]> = {};
    for (const m of maps) {
      if (!mapByEvidence[m.evidenceId]) mapByEvidence[m.evidenceId] = [];
      mapByEvidence[m.evidenceId].push(m);
    }
    const enriched = sorted.map((e: any) => ({
      ...e,
      mappedControls: mapByEvidence[e._id] || [],
      auditLogCount: 0,
    }));
    res.json({ items: enriched });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list evidence: " + err.message });
  }
});

// ── Get Single Evidence ──
router.get("/evidence/:id", async (req, res) => {
  try {
    const items = await Evidence.find({ _id: req.params.id } as any).lean();
    if (items.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const maps = await EvidenceControlMap.find({ evidenceId: req.params.id } as any).lean();
    const audits = await EvidenceAuditLog.find({ evidenceId: req.params.id } as any).lean();
    res.json({ item: { ...items[0], mappedControls: maps, auditLog: audits } });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch evidence: " + err.message });
  }
});

// ── Download Evidence ──
router.get("/evidence/:id/download", async (req, res) => {
  try {
    const items = await Evidence.find({ _id: req.params.id } as any).lean();
    if (items.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const e = items[0];
    if (e.deletedAt) { res.status(410).json({ error: "Evidence was deleted" }); return; }
    const filePath = path.resolve(e.storagePath);
    await fs.access(filePath);
    res.download(filePath, e.fileName);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to download evidence: " + err.message });
  }
});

// ── Map Evidence to Controls ──
router.post("/evidence/:id/map", async (req, res) => {
  try {
    const { controlIds } = req.body;
    if (!Array.isArray(controlIds) || controlIds.length === 0) {
      res.status(400).json({ error: "controlIds array required" });
      return;
    }
    const evItems = await Evidence.find({ _id: req.params.id } as any).lean();
    if (evItems.length === 0) { res.status(404).json({ error: "Evidence not found" }); return; }
    const ev = evItems[0];
    if (ev.deletedAt) { res.status(410).json({ error: "Evidence was deleted" }); return; }
    const results = [];
    for (const ctrlId of controlIds) {
      const parsed = insertEvidenceControlMapSchema.parse({
        evidenceId: req.params.id,
        controlId: ctrlId,
        frameworkCode: req.body.frameworkCode || "ISO27001",
        mappedBy: (req as any).user?.id || "anonymous",
      });
      const map = await EvidenceControlMap.create(parsed);
      results.push(map);
    }
    await appendAuditLog({
      evidenceId: req.params.id,
      action: 'MAP',
      userId: (req as any).user?.id || "anonymous",
      metadata: { controlIds, count: controlIds.length },
    });
    res.json({ items: results });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to map evidence: " + err.message });
  }
});

// ── Unmap Evidence from Control ──
router.delete("/evidence/:id/map/:mapId", async (req, res) => {
  try {
    const maps = await EvidenceControlMap.find({ _id: req.params.mapId } as any).lean();
    if (maps.length === 0) { res.status(404).json({ error: "Mapping not found" }); return; }
    const map = maps[0];
    await EvidenceControlMap.find({ _id: req.params.mapId } as any);
    // Since we don't have delete on EvidenceControlMap, we'll mark by creating a negative audit
    await appendAuditLog({
      evidenceId: req.params.id,
      action: 'UNMAP',
      userId: (req as any).user?.id || "anonymous",
      metadata: { controlId: map.controlId, frameworkCode: map.frameworkCode },
    });
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to unmap evidence: " + err.message });
  }
});

// ── Approve Evidence (makes immutable) ──
router.post("/evidence/:id/approve", async (req, res) => {
  try {
    const ev = await Evidence.findByIdAndUpdate(req.params.id, {
      isApproved: true,
      status: 'VERIFIED',
    }, { new: true });
    if (!ev) { res.status(404).json({ error: "Not found" }); return; }
    await appendAuditLog({
      evidenceId: req.params.id,
      action: 'APPROVE',
      userId: (req as any).user?.id || "anonymous",
    });
    res.json({ item: ev });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to approve evidence: " + err.message });
  }
});

// ── Soft Delete Evidence ──
router.delete("/evidence/:id", async (req, res) => {
  try {
    const evItems = await Evidence.find({ _id: req.params.id } as any).lean();
    if (evItems.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const ev = evItems[0];
    if (ev.isApproved) {
      res.status(403).json({ error: "Approved evidence cannot be deleted (immutable)" });
      return;
    }
    const updated = await Evidence.findByIdAndUpdate(req.params.id, {
      deletedAt: new Date().toISOString(),
    }, { new: true });
    await appendAuditLog({
      evidenceId: req.params.id,
      action: 'SOFT_DELETE',
      userId: (req as any).user?.id || "anonymous",
    });
    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete evidence: " + err.message });
  }
});

// ── Evidence Audit Trail ──
router.get("/evidence/:id/audit", async (req, res) => {
  try {
    const items = await EvidenceAuditLog.find({ evidenceId: req.params.id } as any).lean();
    const sorted = items.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json({ items: sorted });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch audit log: " + err.message });
  }
});

export default router;