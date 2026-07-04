import { logger } from "./logger";

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
  notification_relay?: Integration;
  audit_archive?: Integration;
}

function readEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadIntegrationConfig(): IntegrationMap {
  logger.info("Loading external integration configuration");
  return {
    regulatory_reporter: loadRegulatoryReporter(),
    grc_exchange: loadGrcExchange(),
    notification_relay: loadNotificationRelay(),
    audit_archive: loadAuditArchive(),
  };
}

function loadRegulatoryReporter(): Integration | undefined {
  const baseUrl = readEnv("CBE_REPORTING_URL", "");
  if (!baseUrl) {
    logger.warn("CBE_REPORTING_URL not set — regulatory reporter disabled");
    return;
  }
  return {
    provider: {
      name: "Central Bank Reporting",
      protocol: "REST",
      authMethod: "API_KEY",
      baseUrl,
      apiKey: readEnv("CBE_API_KEY", ""),
      timeoutMs: Number(readEnv("CBE_TIMEOUT_MS", "30000")),
      retryCount: Number(readEnv("CBE_RETRY_COUNT", "3")),
      retryDelayMs: Number(readEnv("CBE_RETRY_DELAY_MS", "1000")),
      enabled: readEnv("CBE_ENABLED", "true") === "true",
    },
    endpoints: [
      {
        name: "Submit Risk Report",
        path: "/api/v1/regulatory/risk-report",
        method: "POST",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
      {
        name: "Submit Breach Notification",
        path: "/api/v1/regulatory/breach",
        method: "POST",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
      {
        name: "Check Submission Status",
        path: "/api/v1/regulatory/status/:submissionId",
        method: "GET",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
    ],
  };
}

function loadGrcExchange(): Integration | undefined {
  const baseUrl = readEnv("GRC_EXCHANGE_URL", "");
  if (!baseUrl) {
    logger.warn("GRC_EXCHANGE_URL not set — GRC exchange disabled");
    return;
  }
  return {
    provider: {
      name: "External GRC Exchange",
      protocol: "REST",
      authMethod: readEnv("GRC_AUTH_METHOD", "API_KEY") as AuthMethod,
      baseUrl,
      apiKey: readEnv("GRC_API_KEY", ""),
      oauth2: readEnv("GRC_AUTH_METHOD", "") === "OAUTH2" ? {
        tokenUrl: readEnv("GRC_OAUTH_TOKEN_URL", ""),
        clientId: readEnv("GRC_OAUTH_CLIENT_ID", ""),
        clientSecret: readEnv("GRC_OAUTH_CLIENT_SECRET", ""),
        scopes: readEnv("GRC_OAUTH_SCOPES", "read write").split(","),
      } : undefined,
      timeoutMs: Number(readEnv("GRC_TIMEOUT_MS", "15000")),
      retryCount: Number(readEnv("GRC_RETRY_COUNT", "2")),
      retryDelayMs: Number(readEnv("GRC_RETRY_DELAY_MS", "500")),
      enabled: readEnv("GRC_ENABLED", "true") === "true",
    },
    endpoints: [
      {
        name: "Push Risk Register",
        path: "/api/v1/exchange/risks",
        method: "POST",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
      {
        name: "Pull Control Library",
        path: "/api/v1/exchange/controls",
        method: "GET",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
    ],
  };
}

function loadNotificationRelay(): Integration | undefined {
  const baseUrl = readEnv("NOTIFICATION_RELAY_URL", "");
  if (!baseUrl) {
    logger.info("NOTIFICATION_RELAY_URL not set — notification relay uses built-in SMTP/SMS");
    return;
  }
  return {
    provider: {
      name: "Notification Relay",
      protocol: "REST",
      authMethod: "API_KEY",
      baseUrl,
      apiKey: readEnv("NOTIFICATION_RELAY_API_KEY", ""),
      timeoutMs: 10000,
      retryCount: 2,
      retryDelayMs: 500,
      enabled: readEnv("NOTIFICATION_RELAY_ENABLED", "true") === "true",
    },
    endpoints: [
      {
        name: "Send Notification",
        path: "/api/v1/send",
        method: "POST",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
    ],
  };
}

function loadAuditArchive(): Integration | undefined {
  const baseUrl = readEnv("AUDIT_ARCHIVE_URL", "");
  if (!baseUrl) {
    logger.info("AUDIT_ARCHIVE_URL not set — audit archive disabled");
    return;
  }
  return {
    provider: {
      name: "Audit Archive",
      protocol: readEnv("AUDIT_ARCHIVE_PROTOCOL", "REST") as IntegrationProtocol,
      authMethod: readEnv("AUDIT_ARCHIVE_AUTH", "API_KEY") as AuthMethod,
      baseUrl,
      apiKey: readEnv("AUDIT_ARCHIVE_API_KEY", ""),
      timeoutMs: Number(readEnv("AUDIT_ARCHIVE_TIMEOUT_MS", "30000")),
      retryCount: Number(readEnv("AUDIT_ARCHIVE_RETRY_COUNT", "3")),
      retryDelayMs: Number(readEnv("AUDIT_ARCHIVE_RETRY_DELAY_MS", "1000")),
      enabled: readEnv("AUDIT_ARCHIVE_ENABLED", "true") === "true",
    },
    endpoints: [
      {
        name: "Archive Audit Log",
        path: "/api/v1/archive",
        method: "POST",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
      {
        name: "Retrieve Archived Record",
        path: "/api/v1/archive/:recordId",
        method: "GET",
        contentType: "json",
        expectsResponse: true,
        responseType: "json",
      },
    ],
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
