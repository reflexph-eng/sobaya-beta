import type { SubscriptionStatus } from "@/types/organization";

export type AdminOrganizationStatus = "active" | "suspended" | "archived";
export type AdminSubscriptionPlan = "starter" | "pro" | "agence" | "business";

export type AdminOrganizationSummary = {
  id: string;
  name: string;
  ownerId?: string;
  type?: string;
  subscriptionPlan?: AdminSubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus | "trial" | "active" | "suspended" | "cancelled";
  status?: AdminOrganizationStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  usersCount: number;
  propertiesCount: number;
  tenantsCount: number;
  contractsCount: number;
  paymentsCount: number;
  maintenanceTicketsCount: number;
  interventionsCount: number;
  notificationsCount: number;
  totalCollected: number;
  lastActivityAt?: unknown;
};

export type PlatformStats = {
  organizationsTotal: number;
  organizationsActive: number;
  organizationsSuspended: number;
  organizationsArchived: number;
  usersTotal: number;
  propertiesTotal: number;
  tenantsTotal: number;
  contractsTotal: number;
  paymentsTotal: number;
  totalCollected: number;
  maintenanceOpen: number;
  interventionsTotal: number;
  notificationsTotal: number;
};

export type AdminGlobalSearchResult = {
  id: string;
  organizationId: string;
  organizationName: string;
  type: "Bien" | "Locataire" | "Contrat" | "Paiement" | "Maintenance" | "Prestataire" | "Intervention";
  title: string;
  subtitle: string;
  href: string;
};

export type SubscriptionDraft = {
  organizationId: string;
  organizationName: string;
  plan: "starter" | "pro" | "agence";
  status: "trial" | "active" | "suspended" | "cancelled";
  startDate?: string;
  endDate?: string;
};
