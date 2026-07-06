export interface ConnectorConfig {
  providerName: string;
  baseUrl: string;
  authType: "API_KEY" | "OAUTH2" | "BASIC";
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
  timeoutMs: number;
}

export interface EvidenceCheck {
  checkId: string;
  controlId: string;
  controlCode: string;
  checkName: string;
  apiEndpoint: string;
  expectedValue: unknown;
  actualValue: unknown;
  compliant: boolean;
  checkedAt: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  controlId: string;
  frameworkCode: string;
  checkId: string;
  fileName: string;
  rawPayload: unknown;
  compliant: boolean;
  digitalSignature: string;
  signedBy: string;
  signedAt: string;
  uploadedAt: string;
  status: "UPLOADED";
  storagePath: string;
}

export interface ScheduledCheck {
  connectorId: string;
  controlId: string;
  controlCode: string;
  checkName: string;
  cronExpression: string;
  apiEndpoint: string;
  expectedValue: unknown;
  jsonPath: string;
  frameworkCode: string;
}

export const DEFAULT_CHECKS: ScheduledCheck[] = [
  {
    connectorId: "aws-iam-001",
    controlId: "ctrl-iam-mfa",
    controlCode: "IAM-MFA-001",
    checkName: "MFA Enforcement on Admin Accounts",
    cronExpression: "0 0 * * 1",
    apiEndpoint: "/iam/list-admins",
    expectedValue: true,
    jsonPath: "$.allAdmins.mfaEnabled",
    frameworkCode: "ISO27001:2022",
  },
  {
    connectorId: "aws-elb-002",
    controlId: "ctrl-elb-tls",
    controlCode: "ELB-TLS-001",
    checkName: "TLS 1.3 Enabled on Load Balancers",
    cronExpression: "0 0 * * 1",
    apiEndpoint: "/elb/describe-listeners",
    expectedValue: "TLSv1.3",
    jsonPath: "$.listeners[*].sslPolicy",
    frameworkCode: "ISO27001:2022",
  },
];
