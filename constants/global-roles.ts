import type { GlobalRole } from "@/types/user";

/**
 * Définit quelles sections admin sont accessibles selon le rôle global.
 * Le super_admin a accès à tout par définition — pas besoin de le lister.
 */
export const GLOBAL_ROLE_ACCESS: Record<GlobalRole, {
  canAccessAdmin: boolean;
  canManageOrganizations: boolean;
  canManageSubscriptions: boolean;
  canManageModules: boolean;
  canManageAdSpots: boolean;
  canManageBadges: boolean;
  canModerateListing: boolean;
  canViewSupport: boolean;
  canManageGlobalRoles: boolean;
}> = {
  user: {
    canAccessAdmin: false,
    canManageOrganizations: false,
    canManageSubscriptions: false,
    canManageModules: false,
    canManageAdSpots: false,
    canManageBadges: false,
    canModerateListing: false,
    canViewSupport: false,
    canManageGlobalRoles: false
  },
  support: {
    canAccessAdmin: true,
    canManageOrganizations: false,   // lecture seule via la page support
    canManageSubscriptions: false,
    canManageModules: false,
    canManageAdSpots: false,
    canManageBadges: false,
    canModerateListing: false,
    canViewSupport: true,
    canManageGlobalRoles: false
  },
  moderator: {
    canAccessAdmin: true,
    canManageOrganizations: false,
    canManageSubscriptions: false,
    canManageModules: false,
    canManageAdSpots: true,
    canManageBadges: true,
    canModerateListing: true,
    canViewSupport: true,
    canManageGlobalRoles: false
  },
  platform_admin: {
    canAccessAdmin: true,
    canManageOrganizations: true,
    canManageSubscriptions: true,
    canManageModules: true,
    canManageAdSpots: true,
    canManageBadges: true,
    canModerateListing: true,
    canViewSupport: true,
    canManageGlobalRoles: false      // Ne peut pas créer de super_admin
  },
  super_admin: {
    canAccessAdmin: true,
    canManageOrganizations: true,
    canManageSubscriptions: true,
    canManageModules: true,
    canManageAdSpots: true,
    canManageBadges: true,
    canModerateListing: true,
    canViewSupport: true,
    canManageGlobalRoles: true       // Seul à pouvoir gérer les rôles globaux
  }
};

export function getGlobalAccess(role: GlobalRole) {
  return GLOBAL_ROLE_ACCESS[role] ?? GLOBAL_ROLE_ACCESS.user;
}

/** Liste des rôles qu'un rôle donné peut attribuer à d'autres. */
export const ASSIGNABLE_ROLES: Record<GlobalRole, GlobalRole[]> = {
  user: [],
  support: [],
  moderator: [],
  platform_admin: ["support", "moderator"],
  super_admin: ["support", "moderator", "platform_admin", "super_admin"]
};
