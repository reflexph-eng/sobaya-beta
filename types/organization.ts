export type OrganizationType = "owner" | "real_estate_agent" | "agency" | "enterprise";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "suspended" | "cancelled";
export type OrganizationRole = "owner" | "admin" | "manager" | "agent" | "viewer";
export type SubscriptionPlan = "starter" | "pro" | "agency" | "business";
export type DashboardProfileKey = "owner" | "agent" | "agency" | "super_admin";
export type DashboardWidgetKey =
  | "cashflow"
  | "annualRevenue"
  | "occupancy"
  | "arrears"
  | "mandates"
  | "entrustedProperties"
  | "commissions"
  | "payouts"
  | "platformOrganization"
  | "platformAccountType"
  | "platformUsers"
  | "platformModules"
  | "profileCockpit"
  | "propertySummary"
  | "tenantSummary"
  | "maintenanceCost"
  | "receipts"
  | "profitability"
  | "priorityActions"
  | "mandatePilot"
  | "quickAccess";

export type DashboardSettings = {
  enabledWidgets?: Partial<Record<DashboardProfileKey, DashboardWidgetKey[]>>;
  updatedAt?: unknown;
};

export type Organization = {
  id: string;
  name: string;
  /** Nom affiché sur les quittances et documents. Si vide, utilise `name`. */
  receiptDisplayName?: string;
  type: OrganizationType;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  ownerId: string;
  dashboardSettings?: DashboardSettings;
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
