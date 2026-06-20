export type GlobalRole = "user" | "super_admin";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  globalRole: GlobalRole;
  activeOrganizationId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};
