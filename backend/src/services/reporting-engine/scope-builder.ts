import type { DataScope, UserContext } from "./types";

export interface ScopeClause {
  sql: string;
  neo4j: string;
  params: Record<string, string>;
}

export function buildScopeClause(
  scope: DataScope,
  user: UserContext,
  dialect: "sql" | "neo4j",
): ScopeClause {
  switch (scope) {
    case "ALL_READ":
      return { sql: "", neo4j: "", params: {} };

    case "AGGREGATE_ONLY":
      return { sql: "", neo4j: "", params: {} };

    case "OWN_RECORDS":
      return {
        sql: `AND (owner = :userId OR assigned_to = :userId)`,
        neo4j: `AND (r.owner = $userId OR r.assignedTo = $userId)`,
        params: { userId: user.userId },
      };

    case "OWN_DEPT": {
      if (!user.department) {
        return {
          sql: `AND department = :dept`,
          neo4j: `AND (r.department = $dept OR r.department = $dept)`,
          params: { dept: user.department ?? "UNKNOWN" },
        };
      }
      return {
        sql: `AND (department = :dept OR owner_dept = :dept)`,
        neo4j: `AND (r.department = $dept OR r.ownerDept = $dept)`,
        params: { dept: user.department },
      };
    }

    case "ALL_DEPT":
      return {
        sql: `AND department = :dept`,
        neo4j: `AND r.department = $dept`,
        params: { dept: user.department ?? "UNKNOWN" },
      };

    default:
      return { sql: "", neo4j: "", params: {} };
  }
}

export function buildRowLimitClause(
  maxRows: number | null,
  dialect: "sql" | "neo4j",
): string {
  if (maxRows === null) return "";
  return dialect === "sql" ? `LIMIT ${maxRows}` : `LIMIT ${maxRows}`;
}
