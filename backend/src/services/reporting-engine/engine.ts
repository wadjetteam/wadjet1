import { COMPONENTS, COMPONENT_TYPES, ROLES, PERMISSIONS, DASHBOARD_TEMPLATES } from "./seed-data";
import { buildScopeClause, buildRowLimitClause } from "./scope-builder";
import type {
  ComponentDefinition,
  PermissionEntry,
  ResolvedDashboardComponent,
  UserContext,
  DataScope,
} from "./types";

export class UnauthorizedComponentError extends Error {
  constructor(componentCode: string, roleCode: string) {
    super(`Component "${componentCode}" is not visible to role "${roleCode}"`);
    this.name = "UnauthorizedComponentError";
  }
}

export class DashboardEngine {
  getComponentLibrary(): ComponentDefinition[] {
    return COMPONENTS;
  }

  getComponentTypes() {
    return COMPONENT_TYPES;
  }

  getRoles() {
    return ROLES;
  }

  resolveDashboard(user: UserContext): ResolvedDashboardComponent[] {
    const userPermissionMap = this.getPermissionMap(user.roleCode);
    const template = DASHBOARD_TEMPLATES.find(
      t => t.roleCode === user.roleCode && t.isDefault,
    );
    if (!template) return [];

    const resolved: ResolvedDashboardComponent[] = [];

    for (const item of template.layout) {
      const component = COMPONENTS.find(c => c.code === item.componentCode);
      const permission = userPermissionMap.get(item.componentCode);

      if (!component || !permission || !permission.visible) continue;

      resolved.push({
        component,
        permission,
        layout: { x: item.x, y: item.y, w: item.w, h: item.h },
      });
    }

    return resolved;
  }

  authorizeComponentAccess(
    user: UserContext,
    componentCode: string,
  ): { component: ComponentDefinition; permission: PermissionEntry; scopeClause: string } {
    const permissionMap = this.getPermissionMap(user.roleCode);
    const permission = permissionMap.get(componentCode);

    if (!permission || !permission.visible) {
      throw new UnauthorizedComponentError(componentCode, user.roleCode);
    }

    const component = COMPONENTS.find(c => c.code === componentCode);
    if (!component) {
      throw new Error(`Component "${componentCode}" not found in library`);
    }

    const dialect = "sql";
    const scope = buildScopeClause(permission.dataScope as DataScope, user, dialect);
    const limitClause = buildRowLimitClause(permission.maxRows, dialect);

      let query = component.queryTemplate.replace(":scopeCondition", scope.sql);
    query = query.replace(":limit", String(permission.maxRows ?? 1000));
    query = `${query} ${limitClause}`;

    return { component, permission, scopeClause: query };
  }

  canExport(user: UserContext, componentCode: string): boolean {
    const permissionMap = this.getPermissionMap(user.roleCode);
    const perm = permissionMap.get(componentCode);
    return perm?.allowExport ?? false;
  }

  authorizedQueryParams(user: UserContext, componentCode: string): Record<string, string> {
    const permissionMap = this.getPermissionMap(user.roleCode);
    const permission = permissionMap.get(componentCode);
    if (!permission || !permission.visible) return {};

    const scope = buildScopeClause(permission.dataScope as DataScope, user, "sql");
    return { ...scope.params, userId: user.userId, dept: user.department ?? "" };
  }

  private getPermissionMap(roleCode: string): Map<string, PermissionEntry> {
    const map = new Map<string, PermissionEntry>();
    for (const p of PERMISSIONS) {
      if (p.roleCode === roleCode) {
        map.set(p.componentCode, p);
      }
    }
    return map;
  }
}
