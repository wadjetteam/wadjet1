export const env = {
  port: Number(process.env["PORT"]),
  nodeEnv: process.env["NODE_ENV"] || "development",
  logLevel: process.env["LOG_LEVEL"] || "info",
  databaseUrl: process.env["DATABASE_URL"] || "",

  cbeReportingUrl: process.env["CBE_REPORTING_URL"] || "",
  cbeApiKey: process.env["CBE_API_KEY"] || "",
  cbeTimeoutMs: Number(process.env["CBE_TIMEOUT_MS"]) || 30000,
  cbeRetryCount: Number(process.env["CBE_RETRY_COUNT"]) || 3,
  cbeEnabled: process.env["CBE_ENABLED"] === "true",

  grcExchangeUrl: process.env["GRC_EXCHANGE_URL"] || "",
  grcAuthMethod: process.env["GRC_AUTH_METHOD"] || "API_KEY",

  auditArchiveUrl: process.env["AUDIT_ARCHIVE_URL"] || "",

  jwtSecret: process.env["JWT_SECRET"] || "default-dev-jwt-secret-change-in-production",
} as const;

export function validateEnv(): void {
  if (!env.port || env.port <= 0) {
    throw new Error("PORT environment variable is required");
  }
}
