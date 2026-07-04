import { Router, type IRouter } from "express";
import {
  Risk,
  insertRiskSchema,
  updateRiskSchema,
  calcRiskScore,
  scoreToLevel,
  calcResidualScore,
  ragStatus,
} from "@workspace/db";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router: IRouter = Router();

function computeScores(body: any) {
  const riskScore = calcRiskScore(body);
  const inherentLevel = scoreToLevel(riskScore);
  const residualScore = calcResidualScore(riskScore, body.controlStatus);
  const overallRisk = scoreToLevel(residualScore);
  return {
    overallScore: riskScore,
    riskScore,
    inherentLevel,
    residualScore,
    overallRisk,
  };
}

router.get("/risks", async (_req, res) => {
  try {
    const risks = await Risk.find().sort({ riskId: 1 }).lean();
    res.json({ risks });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch risks" });
  }
});

router.post("/risks", async (req, res) => {
  const parsed = insertRiskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const data = { ...parsed.data, ...computeScores(parsed.data) };
    const risk = await Risk.create(data);
    res.status(201).json({ risk });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: "Risk with this ID already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create risk" });
  }
});

router.patch("/risks/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const update = { ...req.body, ...computeScores(req.body) };
    const risk = await Risk.findByIdAndUpdate(id, update, { new: true });
    if (!risk) {
      res.status(404).json({ error: "Risk not found" });
      return;
    }
    res.json({ risk });
  } catch (err) {
    res.status(500).json({ error: "Failed to update risk" });
  }
});

router.delete("/risks/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const risk = await Risk.findByIdAndDelete(id);
    if (!risk) {
      res.status(404).json({ error: "Risk not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete risk" });
  }
});

router.get("/risks/template", (_req, res) => {
  const filePath = path.join(__dirname, "../risk_template.xlsx");
  res.download(filePath, "Wadjet_GRC_Risk_Register_Template.xlsx", (err) => {
    if (err) res.status(500).json({ error: "Template not available" });
  });
});

export default router;
