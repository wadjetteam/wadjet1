import { logger } from "../config/logger";

export type IntegrationProtocol = "REST" | "SOAP" | "SFTP" | "SMTP" | "GRPC";

export type AuthMethod = "API_KEY" | "OAUTH2" | "BASIC" | "JWT" | "MUTUAL_TLS";

export interface IntegrationProvider {
  name: string;
  protocol: IntegrationProtocol;
  authMethod: AuthMethod;
  baseUrl: string;
  apiKey?: string;
  oauth2?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
  };
  basic?: {
    username: string;
    password: string;
  };
  tls?: {
    certPath: string;
    keyPath: string;
    caPath?: string;
  };
  timeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
  enabled: boolean;
}

export interface IntegrationEndpoint {
  name: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  contentType: "json" | "xml" | "form-data" | "octet-stream";
  expectsResponse: boolean;
  responseType?: "json" | "xml" | "binary";
}

export interface Integration {
  provider: IntegrationProvider;
  endpoints: IntegrationEndpoint[];
}

export interface IntegrationMap {
  regulatory_reporter?: Integration;
  grc_exchange?: Integration;
  audit_archive?: Integration;
}

function readEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

type IntegrationLoadFn = (envPrefix: string, defaults: {
  name: string;
  endpoints: IntegrationEndpoint[];
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  protocol?: IntegrationProtocol;
  authMethod?: AuthMethod;
}) => Integration | undefined;

const loadIntegration: IntegrationLoadFn = (envPrefix, defaults) => {
  const baseUrl = readEnv(`${envPrefix}_URL`, "");
  if (!baseUrl) {
    logger.warn(`${envPrefix}_URL not set — ${defaults.name} disabled`);
    return;
  }
  const authMethod = (readEnv(`${envPrefix}_AUTH`, defaults.authMethod ?? "API_KEY") || defaults.authMethod ?? "API_KEY") as AuthMethod;
  return {
    provider: {
      name: defaults.name,
      protocol: (readEnv(`${envPrefix}_PROTOCOL`, defaults.protocol ?? "REST") || "REST") as IntegrationProtocol,
      authMethod,
      baseUrl,
      apiKey: readEnv(`${envPrefix}_API_KEY`, ""),
      oauth2: authMethod === "OAUTH2" ? {
        tokenUrl: readEnv(`${envPrefix}_OAUTH_TOKEN_URL`, ""),
        clientId: readEnv(`${envPrefix}_OAUTH_CLIENT_ID`, ""),
        clientSecret: readEnv(`${envPrefix}_OAUTH_CLIENT_SECRET`, ""),
        scopes: readEnv(`${envPrefix}_OAUTH_SCOPES`, "read write").split(","),
      } : undefined,
      timeoutMs: Number(readEnv(`${envPrefix}_TIMEOUT_MS`, String(defaults.timeoutMs ?? 30000))),
      retryCount: Number(readEnv(`${envPrefix}_RETRY_COUNT`, String(defaults.retryCount ?? 3))),
      retryDelayMs: Number(readEnv(`${envPrefix}_RETRY_DELAY_MS`, String(defaults.retryDelayMs ?? 1000))),
      enabled: readEnv(`${envPrefix}_ENABLED`, "true") === "true",
    },
    endpoints: defaults.endpoints,
  };
};

export function loadIntegrationConfig(): IntegrationMap {
  logger.info("Loading external integration configuration");
  return {
    regulatory_reporter: loadIntegration("CBE", {
      name: "Central Bank Reporting",
      endpoints: [
        { name: "Submit Risk Report", path: "/api/v1/regulatory/risk-report", method: "POST", contentType: "json", expectsResponse: true, responseType: "json" },
        { name: "Submit Breach Notification", path: "/api/v1/regulatory/breach", method: "POST", contentType: "json", expectsResponse: true, responseType: "json" },
        { name: "Check Submission Status", path: "/api/v1/regulatory/status/:submissionId", method: "GET", contentType: "json", expectsResponse: true, responseType: "json" },
      ],
    }),
    grc_exchange: loadIntegration("GRC", {
      name: "External GRC Exchange",
      endpoints: [
        { name: "Push Risk Register", path: "/api/v1/exchange/risks", method: "POST", contentType: "json", expectsResponse: true, responseType: "json" },
        { name: "Pull Control Library", path: "/api/v1/exchange/controls", method: "GET", contentType: "json", expectsResponse: true, responseType: "json" },
      ],
      retryCount: 2, retryDelayMs: 500, timeoutMs: 15000,
    }),
    audit_archive: loadIntegration("AUDIT_ARCHIVE", {
      name: "Audit Archive",
      endpoints: [
        { name: "Archive Audit Log", path: "/api/v1/archive", method: "POST", contentType: "json", expectsResponse: true, responseType: "json" },
        { name: "Retrieve Archived Record", path: "/api/v1/archive/:recordId", method: "GET", contentType: "json", expectsResponse: true, responseType: "json" },
      ],
    }),
  };
}

export async function sendIntegrationRequest<T>(
  integration: Integration,
  endpointName: string,
  pathParams: Record<string, string>,
  body?: unknown
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const endpoint = integration.endpoints.find((e) => e.name === endpointName);
  if (!endpoint) {
    return { ok: false, error: `Unknown endpoint: ${endpointName}` };
  }
  if (!integration.provider.enabled) {
    return { ok: false, error: `Integration ${integration.provider.name} is disabled` };
  }
  let url = `${integration.provider.baseUrl}${endpoint.path}`;
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  }
  const headers: Record<string, string> = {
    "Content-Type": endpoint.contentType === "json" ? "application/json" : endpoint.contentType,
  };
  const auth = integration.provider;
  if (auth.apiKey) {
    headers["X-API-Key"] = auth.apiKey;
  } else if (auth.authMethod === "BASIC" && auth.basic) {
    headers["Authorization"] = `Basic ${Buffer.from(`${auth.basic.username}:${auth.basic.password}`).toString("base64")}`;
  }
  for (let attempt = 0; attempt <= auth.retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), auth.timeoutMs);
      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        logger.warn({ status: response.status, endpoint: endpointName }, `Integration request failed: ${errorText}`);
        if (attempt < auth.retryCount) {
          await new Promise((r) => setTimeout(r, auth.retryDelayMs));
          continue;
        }
        return { ok: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      const data = endpoint.expectsResponse
        ? (await response.json() as T)
        : undefined;
      return { ok: true, data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < auth.retryCount) {
        logger.warn({ attempt, endpoint: endpointName }, `Retry after error: ${msg}`);
        await new Promise((r) => setTimeout(r, auth.retryDelayMs));
        continue;
      }
      return { ok: false, error: msg };
    }
  }
  return { ok: false, error: "Max retries exceeded" };
}
