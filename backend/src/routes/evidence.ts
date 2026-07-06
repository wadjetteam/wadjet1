import { Router } from "express";
import { Evidence, EvidenceControlMap } from "@workspace/db";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { findById, queryParamOptional, routeParam } from "../lib/store-helpers";
import multer from "multer";
import * as crypto from "crypto";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.get("/evidence", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const controlId = queryParamOptional(req.query.controlId);
  const frameworkCode = queryParamOptional(req.query.frameworkCode);
  if (frameworkCode) filter.frameworkCode = frameworkCode;
  const items = await Evidence.find(filter).sort({ uploadedAt: -1 }).lean();
  if (controlId) {
    const maps = await EvidenceControlMap.find({ controlId }).lean();
    const evidenceIds = new Set(maps.map(m => m.evidenceId));
    const filtered = items.filter(i => i._id && evidenceIds.has(i._id));
    res.json({ items: filtered });
  } else {
    res.json({ items });
  }
}));

router.get("/evidence/:id", asyncHandler(async (req, res) => {
  const item = await findById(Evidence, req.params.id);
  if (!item) throw new AppError(404, "Evidence not found");
  res.json({ item });
}));

router.post("/evidence", upload.single("file"), asyncHandler(async (req, res) => {
  const file = req.file;
  const { controlId, frameworkCode } = req.body;
  const sha256Hash = crypto.createHash("sha256").update(`${controlId}|${frameworkCode}|${Date.now()}`).digest("hex");
  const item = await Evidence.create({
    fileName: file?.originalname ?? "uploaded_file",
    fileSize: file?.size ?? 0,
    mimeType: file?.mimetype ?? "application/octet-stream",
    storagePath: file?.path ?? "",
    sha256Hash,
    uploadedBy: req.body.uploadedBy ?? "system",
    uploadedAt: new Date().toISOString(),
    status: "UPLOADED",
    isApproved: false,
    deletedAt: null,
  });
  if (controlId && item._id) {
    await EvidenceControlMap.create({
      evidenceId: item._id,
      controlId,
      frameworkCode: frameworkCode ?? "",
      mappedBy: req.body.uploadedBy ?? "system",
      mappedAt: new Date().toISOString(),
    });
  }
  res.status(201).json({ item });
}));

router.delete("/evidence/:id", asyncHandler(async (req, res) => {
  const item = await Evidence.findByIdAndUpdate(routeParam(req.params.id), { deletedAt: new Date().toISOString() });
  if (!item) throw new AppError(404, "Evidence not found");
  res.json({ success: true });
}));

export default router;
