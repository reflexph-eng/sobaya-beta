export type GlobalRole = "user" | "support" | "moderator" | "platform_admin" | "super_admin";

export const GLOBAL_ROLE_LABELS: Record<GlobalRole, string> = {
  user: "Utilisateur",
  support: "Support client",
  moderator: "Modérateur",
  platform_admin: "Administrateur plateforme",
  super_admin: "Super Admin"
};

export const GLOBAL_ROLE_DESCRIPTIONS: Record<GlobalRole, string> = {
  user: "Accès standard à son organisation uniquement",
  support: "Voir les organisations et tickets, aide aux utilisateurs",
  moderator: "Marketplace, badges, signalements, leads",
  platform_admin: "Gestion complète sauf création de super admins",
  super_admin: "Accès total à toute la plateforme"
};

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  globalRole: GlobalRole;
  activeOrganizationId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};
