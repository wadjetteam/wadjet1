import { Router, type IRouter, type Request, type Response } from "express";
import { Ollama } from "ollama";
import { z } from "zod";

const router: IRouter = Router();

const OLLAMA_HOST = () => process.env["OLLAMA_BASE_URL"] ?? "http://localhost:11434";

/* ── Model priority ranking ─────────────────────────────── */
const MODEL_PRIORITY = [
  "llama3.1:8b",
  "llama3.1",
  "llama3.2",
  "llama3.2:3b",
  "llama3",
  "llama2",
];

function pickBestModel(models: string[]): string | null {
  for (const preferred of MODEL_PRIORITY) {
    const found = models.find((m) => m === preferred || m.startsWith(preferred + ":"));
    if (found) return found;
  }
  const anyLlama = models.find((m) => m.toLowerCase().includes("llama"));
  if (anyLlama) return anyLlama;
  return models[0] ?? null;
}

/* ── Status check with hard 5s timeout ── */
router.get("/chat/status", async (_req: Request, res: Response) => {
  const host = OLLAMA_HOST();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${host}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const models = (data.models ?? []).map((m) => m.name);
    const bestModel = pickBestModel(models);
    res.json({ connected: true, host, models, bestModel });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ connected: false, host, models: [], bestModel: null, error: msg });
  }
});

/* ── Model detection endpoint ── */
router.get("/ai/models", async (_req: Request, res: Response) => {
  const host = OLLAMA_HOST();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${host}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { models?: Array<{ name: string; size?: number }> };
    const models = (data.models ?? []).map((m) => m.name);
    const bestModel = pickBestModel(models);
    res.json({ available: true, models, bestModel });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ available: false, models: [], bestModel: null, error: msg });
  }
});

/* ── GRC context builder ── */
function buildGrcContext(): string {
  const now = new Date().toISOString().split("T")[0];
  return `## Live GRC Snapshot (as of ${now})
- **Compliance Score:** 94.7% (target ≥85%) | Overall status: ON TARGET
- **Critical Risks:** 8 open | 3 have breached SLA windows
- **Policy Attestation:** 100% complete (507/507 personnel)
- **Pending Audits:** 12 scheduled
- **AML — FATF R10 (CDD):** 68% compliant — ongoing monitoring gap (312 legacy accounts, 74% transaction coverage)
- **Basel III CET1:** 14.2% (min 7.0%) | Tier 1: 15.8% | LCR: 128% | NSFR: 112%
- **Total RWA:** EGP 59.9 billion (Credit 71.4% | Market 13.5% | Operational 15.0%)
- **Critical CVEs:** CVE-2026-3412 (CVSS 9.8, SWIFT backend — SLA BREACHED 8h), CVE-2026-3298 (CVSS 9.2, fw-core-branch-05 — imminent)
- **CBE Examination:** Readiness at 87% — control testing gap (89/115 tested)
- **Upcoming Deadlines:** CDD refresh for 312 legacy accounts (July 31 2026), Maadi branch attestation follow-up (June 25 2026)`;
}

/* ── System prompt ── */
const SYSTEM_PROMPT = `You are Wadjet GRC AI Copilot — a senior Governance, Risk & Compliance advisor embedded in the Wadjet GRC platform for an Egyptian commercial bank.

**Your expertise covers:**
- **CBE (Central Bank of Egypt):** Cybersecurity framework circulars, supervisory examination requirements, capital adequacy, AML/CFT supervision
- **Egyptian Law 175/2018 (Anti-Cybercrime Law):** Art 2 (unauthorized access), Art 8 (DDoS/disruption), Art 14 (data interception & disclosure), Art 15 (critical infrastructure attacks), Art 25 (cybercrime investigations) — penalties range from EGP 50K to unlimited civil exposure
- **Egyptian Law 151/2020 (PDPL — Personal Data Protection Law):** Data controller obligations, consent, cross-border transfer restrictions, Article 18 encryption requirements
- **FATF Recommendations:** R10 (Customer Due Diligence), R26 (Financial Intelligence Units), R40 (international cooperation); FATF grey-listing consequences for correspondent banking
- **Basel III/IV:** CET1, Additional Tier 1, Tier 2 capital; LCR, NSFR liquidity ratios; RWA calculation; output floor impact (January 2027)
- **ISO 27001:2022:** Control domains A.5–A.8, ISMS audit evidence, certification readiness
- **PCI DSS v4.0:** Requirement 7 (access control), Requirement 10 (audit logging), SAQ scoping
- **Operational Risk & TPRM:** RCSA methodology, third-party risk tiering, BCP/DRP testing cadence
- **GRC Maturity:** Gap analysis, roadmap prioritization, board-level reporting

**Behavioral rules:**
1. Be concise and professional — enterprise decision-makers read your output
2. Cite specific regulation articles and standard control IDs when relevant (e.g., "CBE Circular 2019/7", "ISO 27001 A.9.1.1", "FATF R10-D")
3. Flag **CRITICAL** items with 🔴 and SLA breaches explicitly
4. Use markdown tables for comparisons, bullet points for action lists
5. When a compliance gap exists, always include: current status, financial/regulatory exposure, and a numbered remediation list with realistic timelines
6. Never speculate beyond your knowledge — if uncertain, state "This requires CBE confirmation" or "Consult your external legal counsel"`;

/* ── Zod schema for chat request ── */
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

const ChatRequestSchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Too many messages — max 50"),
  model: z.string().optional(),
});

/* ── Streaming chat ── */
router.post("/chat", async (req: Request, res: Response) => {
  const parsed = ChatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "validation_error",
      message: "Invalid request body",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { messages, model } = parsed.data;
  const host = OLLAMA_HOST();

  let selectedModel = model ?? process.env["OLLAMA_MODEL"] ?? null;

  if (!selectedModel) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const tagsRes = await fetch(`${host}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      if (tagsRes.ok) {
        const tagsData = (await tagsRes.json()) as { models?: Array<{ name: string }> };
        const available = (tagsData.models ?? []).map((m) => m.name);
        selectedModel = pickBestModel(available) ?? "llama3.2";
      } else {
        selectedModel = "llama3.2";
      }
    } catch {
      selectedModel = "llama3.2";
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const grcContext = buildGrcContext();
  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${grcContext}`;

  try {
    const ollama = new Ollama({ host });
    const ollamaMessages = [
      { role: "system" as const, content: fullSystemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    const stream = await ollama.chat({
      model: selectedModel,
      messages: ollamaMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.message?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      if (chunk.done) {
        res.write(`data: ${JSON.stringify({ done: true, model: selectedModel })}\n\n`);
      }
    }
    res.end();
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : String(err);

    let errorCode = "ollama_error";
    let message = raw;

    if (raw.includes("model") && raw.toLowerCase().includes("not found")) {
      errorCode = "model_not_found";
      message = `Model "${selectedModel}" is not installed. Run: ollama pull ${selectedModel}`;
    } else if (raw.includes("ECONNREFUSED") || raw.includes("fetch failed") || raw.includes("connect")) {
      errorCode = "ollama_offline";
      message = "Ollama is not reachable. Ensure it is running and OLLAMA_BASE_URL is configured.";
    } else if (raw.includes("abort") || raw.includes("timeout")) {
      errorCode = "ollama_timeout";
      message = "Ollama request timed out. The model may be loading — try again in a moment.";
    }

    res.write(`data: ${JSON.stringify({ error: true, errorCode, message })}\n\n`);
    res.end();
  }
});

export default router;
