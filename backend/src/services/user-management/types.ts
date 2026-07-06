export const ALL_PERMISSIONS = [
  { code: "risks", label: "Risk Register" },
  { code: "compliance", label: "Compliance Hub" },
  { code: "evidence", label: "Evidence Connector" },
  { code: "impact", label: "Impact Analysis" },
  { code: "reporting", label: "Reporting Engine" },
  { code: "audit", label: "Audit Trail" },
  { code: "operational-risk", label: "Operational Risk" },
  { code: "cbe-deadlines", label: "CBE Deadlines" },
  { code: "policy", label: "Policy & Attestation" },
  { code: "users", label: "User Management" },
  { code: "admin", label: "Admin Settings" },
] as const;

export type PermissionCode = (typeof ALL_PERMISSIONS)[number]["code"];

export interface UserDoc {
  _id?: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}
