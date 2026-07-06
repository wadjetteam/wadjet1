import { randomUUID } from "node:crypto";
import type { ConnectorConfig, EvidenceCheck, EvidenceRecord, ScheduledCheck } from "./types";
import { DEFAULT_CHECKS } from "./types";
import { signEvidence, type SignatureInput } from "./signature";

export class ApiClient {
  constructor(private config: ConnectorConfig) {}

  async get<T>(path: string): Promise<T> {
    const url = `${this.config.baseUrl.replace(/\/$/, "")}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    switch (this.config.authType) {
      case "API_KEY":
        headers["X-API-Key"] = this.config.apiKey ?? "";
        break;
      case "BASIC":
        headers["Authorization"] = `Basic ${Buffer.from(
          `${this.config.basic!.username}:${this.config.basic!.password}`,
        ).toString("base64")}`;
        break;
      case "OAUTH2": {
        const token = await this.acquireOAuthToken();
        headers["Authorization"] = `Bearer ${token}`;
        break;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText} — ${url}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private async acquireOAuthToken(): Promise<string> {
    if (!this.config.oauth2) throw new Error("OAuth2 not configured");
    const res = await fetch(this.config.oauth2.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.oauth2.clientId,
        client_secret: this.config.oauth2.clientSecret,
        scope: this.config.oauth2.scopes.join(" "),
      }),
    });
    if (!res.ok) throw new Error(`OAuth2 token request failed: HTTP ${res.status}`);
    const body = (await res.json()) as { access_token: string };
    return body.access_token;
  }
}

function extractByJsonPath(obj: unknown, path: string): unknown {
  const normalized = path.replace(/^\$\.?/, "");
  const keys = normalized.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current.map((item: unknown) =>
        (item as Record<string, unknown>)?.[key],
      );
    } else {
      current = (current as Record<string, unknown>)?.[key];
    }
  }
  return current;
}

function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEquals(v, b[i]));
  }
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as Record<string, unknown>).sort();
    const kb = Object.keys(b as Record<string, unknown>).sort();
    if (ka.join(",") !== kb.join(",")) return false;
    return ka.every(k =>
      deepEquals(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
    );
  }
  return false;
}

export class EvidenceConnector {
  constructor(
    private client: ApiClient,
    private store: {
      saveEvidence: (record: EvidenceRecord) => Promise<void>;
      getControlIdByCode: (code: string) => Promise<string | null>;
    },
    private checks: ScheduledCheck[] = DEFAULT_CHECKS,
  ) {}

  async runAllChecks(): Promise<EvidenceCheck[]> {
    const results: EvidenceCheck[] = [];

    for (const check of this.checks) {
      const result = await this.runSingleCheck(check);
      results.push(result);

      const controlId = await this.store.getControlIdByCode(check.controlCode);
      if (controlId) {
        await this.persistEvidence(result, controlId, check.frameworkCode);
      }
    }

    return results;
  }

  private async runSingleCheck(check: ScheduledCheck): Promise<EvidenceCheck> {
    const checkId = randomUUID();
    const checkedAt = new Date().toISOString();

    let actualValue: unknown;
    try {
      const raw = await this.client.get<unknown>(check.apiEndpoint);
      actualValue = extractByJsonPath(raw, check.jsonPath);
    } catch (err) {
      actualValue = `ERROR: ${(err as Error).message}`;
    }

    const compliant = deepEquals(actualValue, check.expectedValue);

    return {
      checkId,
      controlId: check.controlId,
      controlCode: check.controlCode,
      checkName: check.checkName,
      apiEndpoint: check.apiEndpoint,
      expectedValue: check.expectedValue,
      actualValue,
      compliant,
      checkedAt,
    };
  }

  private async persistEvidence(
    check: EvidenceCheck,
    controlId: string,
    frameworkCode: string,
  ): Promise<void> {
    const signed = signEvidence({
      controlId,
      rawPayload: { check, expectedValue: check.expectedValue, actualValue: check.actualValue },
      compliant: check.compliant,
      checkedAt: check.checkedAt,
      signedBy: `evidence-connector/${check.checkId}`,
    } satisfies SignatureInput);

    const record: EvidenceRecord = {
      evidenceId: signed.evidenceId,
      controlId,
      frameworkCode,
      checkId: check.checkId,
      fileName: `auto-evidence-${check.controlCode}-${check.checkedAt.slice(0, 10)}.json`,
      rawPayload: {
        connectorCheck: check,
        expectedValue: check.expectedValue,
        actualValue: check.actualValue,
      },
      compliant: check.compliant,
      digitalSignature: signed.digitalSignature,
      signedBy: `evidence-connector/${check.checkId}`,
      signedAt: signed.signedAt,
      uploadedAt: new Date().toISOString(),
      status: "UPLOADED",
      storagePath: `auto-evidence/${check.controlCode}/${check.checkedAt.slice(0, 10)}.json`,
    };

    await this.store.saveEvidence(record);
  }
}
