import { EvidenceConnector, ApiClient } from "./connector";
import type { ConnectorConfig } from "./types";
import type { EvidenceRecord } from "./types";

export interface SchedulerDependencies {
  config: ConnectorConfig;
  evidenceStore: {
    saveEvidence: (record: EvidenceRecord) => Promise<void>;
    getControlIdByCode: (code: string) => Promise<string | null>;
  };
}

export function createEvidenceScheduler(deps: SchedulerDependencies): {
  run: () => Promise<void>;
  startCron: () => void;
  stopCron: () => void;
} {
  const client = new ApiClient(deps.config);
  const connector = new EvidenceConnector(client, deps.evidenceStore);

  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  async function run(): Promise<void> {
    console.log(`[EvidenceConnector] Running scheduled checks at ${new Date().toISOString()}`);
    try {
      const results = await connector.runAllChecks();
      const compliant = results.filter(r => r.compliant).length;
      const total = results.length;
      console.log(`[EvidenceConnector] ${compliant}/${total} checks passed`);
    } catch (err) {
      console.error("[EvidenceConnector] Run failed:", err);
    }
  }

  function startCron(): void {
    if (intervalHandle) return;

    // Check every 60 seconds whether it's Monday 00:00 (± 1 min window)
    // In production, replace with node-cron or similar
    intervalHandle = setInterval(() => {
      const now = new Date();
      if (now.getUTCDay() === 1 && now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        run();
      }
    }, 60_000);

    console.log("[EvidenceConnector] Cron scheduler started (polling every 60s for Monday 00:00 UTC)");
  }

  function stopCron(): void {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
      console.log("[EvidenceConnector] Cron scheduler stopped");
    }
  }

  return { run, startCron, stopCron };
}
