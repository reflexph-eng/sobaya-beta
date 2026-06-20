import { ROLE_PERMISSIONS } from "@/constants/permissions";
import type { OrganizationRole } from "@/types/organization";

export function getPermissionsForRole(role: OrganizationRole) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(permissions: string[] | undefined, permission: string) {
  return Boolean(permissions?.includes(permission));
}
