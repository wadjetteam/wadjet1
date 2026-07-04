import { Router, type IRouter, type Request, type Response } from "express";
import { loadIntegrationConfig, sendIntegrationRequest } from "../lib/integration-config";
import { logger } from "../lib/logger";

const router: IRouter = Router();
let config = loadIntegrationConfig();

function getStatus(integration: import("../lib/integration-config").Integration): "connected" | "disconnected" | "error" {
  if (!integration.provider.enabled) return "disconnected";
  if (!integration.provider.baseUrl) return "disconnected";
  return "connected";
}

router.get("/integrations", (_req: Request, res: Response) => {
  const summary = Object.entries(config)
    .filter(([_, v]) => v !== undefined)
    .map(([key, integration]) => ({
      key,
      name: integration!.provider.name,
      protocol: integration!.provider.protocol,
      authMethod: integration!.provider.authMethod,
      enabled: integration!.provider.enabled,
      endpointCount: integration!.endpoints.length,
      status: getStatus(integration!),
      lastSync: null,
    }));
  res.json({ integrations: summary });
});

router.get("/integrations/:name", (req: Request, res: Response) => {
  const integration = config[req.params.name as keyof typeof config];
  if (!integration) {
    res.status(404).json({ error: `Integration "${req.params.name}" not configured` });
    return;
  }
  res.json({
    provider: {
      name: integration.provider.name,
      protocol: integration.provider.protocol,
      authMethod: integration.provider.authMethod,
      baseUrl: integration.provider.baseUrl.replace(/\/?$/, ""),
      enabled: integration.provider.enabled,
      timeoutMs: integration.provider.timeoutMs,
      retryCount: integration.provider.retryCount,
    },
    endpoints: integration.endpoints.map((e) => ({
      name: e.name,
      path: e.path,
      method: e.method,
    })),
  });
});

router.patch("/integrations/:name", (req: Request, res: Response) => {
  const entry = config[req.params.name as keyof typeof config];
  if (!entry) {
    res.status(404).json({ error: `Integration "${req.params.name}" not configured` });
    return;
  }
  const { baseUrl, apiKey, enabled, timeoutMs, retryCount } = req.body ?? {};
  if (baseUrl !== undefined) entry.provider.baseUrl = baseUrl;
  if (apiKey !== undefined) entry.provider.apiKey = apiKey;
  if (enabled !== undefined) entry.provider.enabled = enabled;
  if (timeoutMs !== undefined) entry.provider.timeoutMs = Number(timeoutMs);
  if (retryCount !== undefined) entry.provider.retryCount = Number(retryCount);
  logger.info({ integration: req.params.name }, "Integration config updated (runtime)");
  res.json({ ok: true });
});

router.post("/integrations/:name/test", async (req: Request, res: Response) => {
  const integration = config[req.params.name as keyof typeof config];
  if (!integration) {
    res.status(404).json({ error: `Integration "${req.params.name}" not configured` });
    return;
  }
  if (!integration.provider.enabled) {
    res.json({ ok: false, status: "disconnected", message: "Integration is disabled" });
    return;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), integration.provider.timeoutMs);
    const response = await fetch(integration.provider.baseUrl, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    res.json({ ok: response.ok, status: response.ok ? "connected" : "error", message: `HTTP ${response.status}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ ok: false, status: "error", message: msg });
  }
});

router.post("/integrations/:name/:endpoint", async (req: Request, res: Response) => {
  const integration = config[req.params.name as keyof typeof config];
  if (!integration) {
    res.status(404).json({ error: `Integration "${req.params.name}" not configured` });
    return;
  }
  const endpointName = req.params.endpoint.replace(/-/g, " ");
  const result = await sendIntegrationRequest(
    integration,
    endpointName,
    req.body?.pathParams ?? {},
    req.body?.payload
  );
  if (!result.ok) {
    logger.warn({ integration: req.params.name, endpoint: endpointName }, `Integration call failed: ${result.error}`);
    res.status(502).json({ error: result.error });
    return;
  }
  res.json({ data: result.data });
});

export default router;
