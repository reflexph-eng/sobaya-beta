export type OrganizationType = "owner" | "agency" | "enterprise";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "suspended" | "cancelled";
export type OrganizationRole = "owner" | "admin" | "manager" | "agent" | "viewer";

export type Organization = {
  id: string;
  name: string;
  type: OrganizationType;
  subscriptionPlan: "starter" | "pro" | "business";
  subscriptionStatus: SubscriptionStatus;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OrganizationMember = {
  userId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  status: "active" | "invited" | "disabled";
  permissions: string[];
  joinedAt?: unknown;
  updatedAt?: unknown;
};
