import { Router, type IRouter } from "express";
import * as crypto from "crypto";
import {
  AutomationRule, ApiConnector, ComplianceAssessment, Control,
  ControlStatusAudit,
  insertAutomationRuleSchema, insertApiConnectorSchema, insertControlStatusAuditSchema,
  updateAutomationRuleSchema, updateApiConnectorSchema,
} from "@workspace/db";

const router: IRouter = Router();

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

// ============================================================
// RULES ENGINE — Pure TypeScript evaluator
// ============================================================

type EvalContext = {
  apiResponse: Record<string, any>;
  environment: Record<string, any>;
};

function evaluateCondition(cond: { field: string; operator: string; value: any }, ctx: EvalContext): boolean {
  const actualValue = getNestedValue(ctx, cond.field);
  switch (cond.operator) {
    case 'EQ': return actualValue === cond.value;
    case 'NEQ': return actualValue !== cond.value;
    case 'GT': return actualValue > cond.value;
    case 'GTE': return actualValue >= cond.value;
    case 'LT': return actualValue < cond.value;
    case 'LTE': return actualValue <= cond.value;
    case 'IN': return Array.isArray(cond.value) && cond.value.includes(actualValue);
    case 'CONTAINS': return String(actualValue).includes(String(cond.value));
    default: return false;
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

async function evaluateRule(rule: any, ctx: EvalContext): Promise<{ matched: boolean; status: string; score: number }> {
  const results = rule.condition.conditions.map((c: any) => evaluateCondition(c, ctx));
  const matched = rule.condition.operator === 'AND'
    ? results.every(Boolean)
    : results.some(Boolean);
  if (matched) {
    return {
      matched: true,
      status: rule.action.compliantStatus,
      score: rule.action.score,
    };
  }
  return { matched: false, status: 'Not Assessed', score: 0 };
}

async function applyRuleResult(rule: any, result: { status: string; score: number }, userId: string) {
  // Find the control
  const controls = await Control.find({ _id: rule.controlId } as any).lean();
  if (controls.length === 0) return;
  const control = controls[0];

  // Find existing assessment
  const existing = await ComplianceAssessment.find({ controlId: rule.controlId } as any).lean();

  const prevHash = await getLastStatusHash(rule.controlId);
  const auditRaw = `${result.status}|${rule.controlId}|${rule._id}|${Date.now()}|${prevHash}`;
  const auditHash = computeHash(auditRaw);

  await ControlStatusAudit.create({
    controlId: rule.controlId,
    frameworkCode: rule.frameworkCode,
    source: 'AUTOMATION',
    automationRuleId: rule._id,
    status: result.status,
    score: result.score,
    assessedBy: `system:rule-${rule._id}`,
    assessedAt: new Date().toISOString(),
    previousHash: prevHash,
    hash: auditHash,
  });

  if (existing.length > 0) {
    const a = existing[0];
    // Only update if not in override cooldown
    if (a.overrideExpiresAt && new Date(a.overrideExpiresAt) > new Date()) return;
    await ComplianceAssessment.findByIdAndUpdate(a._id ?? "", {
      status: result.status,
      score: result.score,
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
      status: result.status as any,
      score: result.score,
      source: 'AUTOMATION',
      sourceRuleId: rule._id,
      assessedBy: `system:rule-${rule._id}`,
      assessedAt: new Date().toISOString(),
    });
  }
}

// ============================================================
// CRUD: Automation Rules
// ============================================================

router.get("/automation/rules", async (_req, res) => {
  try {
    const items = await AutomationRule.find().lean();
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch rules: " + err.message });
  }
});

router.get("/automation/rules/:id", async (req, res) => {
  try {
    const items = await AutomationRule.find({ _id: req.params.id } as any).lean();
    if (items.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ item: items[0] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch rule: " + err.message });
  }
});

router.post("/automation/rules", async (req, res) => {
  try {
    const parsed = insertAutomationRuleSchema.parse(req.body);
    const item = await AutomationRule.create(parsed);
    res.status(201).json({ item });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: "Invalid input", details: err.issues });
      return;
    }
    res.status(500).json({ error: "Failed to create rule: " + err.message });
  }
});

router.put("/automation/rules/:id", async (req, res) => {
  try {
    const parsed = updateAutomationRuleSchema.parse(req.body);
    const item = await AutomationRule.findByIdAndUpdate(req.params.id, { ...parsed, updatedAt: new Date().toISOString() }, { new: true });
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ item });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: "Invalid input", details: err.issues });
      return;
    }
    res.status(500).json({ error: "Failed to update rule: " + err.message });
  }
});

router.delete("/automation/rules/:id", async (req, res) => {
  try {
    const item = await AutomationRule.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete rule: " + err.message });
  }
});

// ============================================================
// CRUD: API Connectors
// ============================================================

router.get("/automation/connectors", async (_req, res) => {
  try {
    const items = await ApiConnector.find().lean();
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch connectors: " + err.message });
  }
});

router.post("/automation/connectors", async (req, res) => {
  try {
    const parsed = insertApiConnectorSchema.parse(req.body);
    const item = await ApiConnector.create(parsed);
    res.status(201).json({ item });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: "Invalid input", details: err.issues });
      return;
    }
    res.status(500).json({ error: "Failed to create connector: " + err.message });
  }
});

router.put("/automation/connectors/:id", async (req, res) => {
  try {
    const parsed = updateApiConnectorSchema.parse(req.body);
    const item = await ApiConnector.findByIdAndUpdate(req.params.id, parsed, { new: true });
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ item });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update connector: " + err.message });
  }
});

router.delete("/automation/connectors/:id", async (req, res) => {
  try {
    const item = await ApiConnector.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete connector: " + err.message });
  }
});

// ============================================================
// Evaluate Rules (triggered by cron or webhook)
// ============================================================

router.post("/automation/evaluate", async (req, res) => {
  try {
    const { frameworkCode, context } = req.body;
    const filter: any = { isActive: true };
    if (frameworkCode) filter.frameworkCode = frameworkCode;
    const rules = await AutomationRule.find(filter).lean();
    const results = [];
    const ctx: EvalContext = {
      apiResponse: context || {},
      environment: process.env as any,
    };
    for (const rule of rules) {
      const result = await evaluateRule(rule, ctx);
      if (result.matched) {
        await applyRuleResult(rule, result, "system");
        results.push({ ruleId: rule._id, ruleName: rule.name, result });
      }
    }
    res.json({ evaluated: rules.length, matched: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: "Evaluation failed: " + err.message });
  }
});

// ============================================================
// Manual Override
// ============================================================

router.post("/compliance/override", async (req, res) => {
  try {
    const { controlId, frameworkCode, status, score, overrideReason } = req.body;
    if (!overrideReason || overrideReason.trim().length < 10) {
      res.status(400).json({ error: "Override reason is mandatory (min 10 characters)" });
      return;
    }
    const existing = await ComplianceAssessment.find({ controlId } as any).lean();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    let item;
    if (existing.length > 0) {
      item = await ComplianceAssessment.findByIdAndUpdate(
        existing[0]._id ?? "",
        {
          status: status || existing[0].status,
          score: score ?? existing[0].score,
          source: 'OVERRIDE',
          overrideReason: overrideReason.trim(),
          overrideExpiresAt: expiresAt,
          assessedBy: (req as any).user?.id || "anonymous",
          assessedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { new: true }
      );
    } else {
      res.status(404).json({ error: "No existing assessment to override" });
      return;
    }
    const prevHash = await getLastStatusHash(controlId);
    const auditRaw = `${status}|${controlId}|OVERRIDE|${Date.now()}|${prevHash}`;
    const auditHash = computeHash(auditRaw);
    await ControlStatusAudit.create({
      controlId,
      frameworkCode,
      source: 'OVERRIDE',
      status: status || "Not Assessed",
      score: score ?? 0,
      overrideReason: overrideReason.trim(),
      overrideExpiresAt: expiresAt,
      assessedBy: (req as any).user?.id || "anonymous",
      assessedAt: new Date().toISOString(),
      previousHash: prevHash,
      hash: auditHash,
    });
    res.json({ item, overrideExpiresAt: expiresAt });
  } catch (err: any) {
    res.status(500).json({ error: "Override failed: " + err.message });
  }
});

// ============================================================
// Status Audit Trail for a specific control
// ============================================================

router.get("/compliance/status-audit/:controlId", async (req, res) => {
  try {
    const items = await ControlStatusAudit.find({ controlId: req.params.controlId } as any).lean();
    const sorted = items.sort((a: any, b: any) =>
      new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime()
    );
    res.json({ items: sorted });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch status audit: " + err.message });
  }
});

export default router;