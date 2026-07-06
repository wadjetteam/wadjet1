export interface ComponentType {
  typeCode: string;
  displayName: string;
  renderer: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface ComponentDefinition {
  code: string;
  typeCode: string;
  name: string;
  description: string;
  dataDomain: string;
  queryTemplate: string;
  queryTemplateNeo4j: string;
  queryParams: Array<{ name: string; type: string; default: unknown }>;
}

export interface RoleDefinition {
  roleCode: string;
  displayName: string;
  priority: number;
  description: string;
}

export interface PermissionEntry {
  roleCode: string;
  componentCode: string;
  visible: boolean;
  dataScope: DataScope;
  maxRows: number | null;
  allowExport: boolean;
}

export type DataScope =
  | "OWN_DEPT"
  | "OWN_RECORDS"
  | "ALL_DEPT"
  | "ALL_READ"
  | "AGGREGATE_ONLY";

export interface LayoutItem {
  componentCode: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardTemplate {
  roleCode: string;
  name: string;
  isDefault: boolean;
  layout: LayoutItem[];
}

export interface ResolvedDashboardComponent {
  component: ComponentDefinition;
  permission: PermissionEntry;
  layout: { x: number; y: number; w: number; h: number };
}

export interface UserContext {
  userId: string;
  roleCode: string;
  department?: string;
}
