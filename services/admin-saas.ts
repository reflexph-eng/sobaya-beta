import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ActivityLog } from "@/services/activity-logs";
import type { AdminGlobalSearchResult, AdminOrganizationSummary, PlatformStats, SubscriptionDraft } from "@/types/admin-saas";

type AnyRecord = Record<string, any>;

function orgCollection(organizationId: string, collectionName: string) {
  return collection(db, "organizations", organizationId, collectionName);
}

function text(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function moneyValue(item: AnyRecord) {
  return Number(item.amountPaid ?? item.amount ?? item.montant ?? 0) || 0;
}

function isArchived(item: AnyRecord) {
  return item.status === "archived" || item.isDeleted === true || item.deletedAt;
}

async function readSubCollection(organizationId: string, collectionName: string) {
  try {
    const snapshot = await getDocs(collection(db, "organizations", organizationId, collectionName));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AnyRecord));
  } catch (error) {
    console.warn(`SOBAYA admin read skipped: ${collectionName}`, error);
    return [];
  }
}

export async function listAdminOrganizationSummaries(): Promise<AdminOrganizationSummary[]> {
  const organizationsSnapshot = await getDocs(collection(db, "organizations"));
  const organizations = organizationsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AnyRecord));

  const summaries = await Promise.all(organizations.map(async (organization) => {
    const [members, properties, tenants, contracts, payments, tickets, interventions, notifications, logs] = await Promise.all([
      readSubCollection(organization.id, "members"),
      readSubCollection(organization.id, "properties"),
      readSubCollection(organization.id, "tenants"),
      readSubCollection(organization.id, "contracts"),
      readSubCollection(organization.id, "payments"),
      readSubCollection(organization.id, "maintenanceTickets"),
      readSubCollection(organization.id, "maintenanceInterventions"),
      readSubCollection(organization.id, "notifications"),
      readSubCollection(organization.id, "activityLogs")
    ]);

    return {
      id: organization.id,
      name: organization.name ?? "Organisation sans nom",
      ownerId: organization.ownerId,
      type: organization.type,
      subscriptionPlan: organization.subscriptionPlan ?? "starter",
      subscriptionStatus: organization.subscriptionStatus ?? "trial",
      status: organization.status ?? (organization.subscriptionStatus === "suspended" ? "suspended" : "active"),
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      usersCount: members.filter((item) => item.status !== "disabled").length,
      propertiesCount: properties.filter((item) => !isArchived(item)).length,
      tenantsCount: tenants.filter((item) => !isArchived(item)).length,
      contractsCount: contracts.filter((item) => !isArchived(item)).length,
      paymentsCount: payments.filter((item) => !isArchived(item)).length,
      maintenanceTicketsCount: tickets.filter((item) => !isArchived(item)).length,
      interventionsCount: interventions.filter((item) => !isArchived(item)).length,
      notificationsCount: notifications.length,
      totalCollected: payments.filter((item) => !isArchived(item)).reduce((sum, item) => sum + moneyValue(item), 0),
      lastActivityAt: logs[0]?.createdAt ?? organization.updatedAt
    } satisfies AdminOrganizationSummary;
  }));

  return summaries.sort((a, b) => a.name.localeCompare(b.name));
}

export function computePlatformStats(organizations: AdminOrganizationSummary[]): PlatformStats {
  return organizations.reduce((acc, organization) => {
    acc.organizationsTotal += 1;
    if (organization.status === "suspended") acc.organizationsSuspended += 1;
    else if (organization.status === "archived") acc.organizationsArchived += 1;
    else acc.organizationsActive += 1;
    acc.usersTotal += organization.usersCount;
    acc.propertiesTotal += organization.propertiesCount;
    acc.tenantsTotal += organization.tenantsCount;
    acc.contractsTotal += organization.contractsCount;
    acc.paymentsTotal += organization.paymentsCount;
    acc.totalCollected += organization.totalCollected;
    acc.maintenanceOpen += organization.maintenanceTicketsCount;
    acc.interventionsTotal += organization.interventionsCount;
    acc.notificationsTotal += organization.notificationsCount;
    return acc;
  }, {
    organizationsTotal: 0,
    organizationsActive: 0,
    organizationsSuspended: 0,
    organizationsArchived: 0,
    usersTotal: 0,
    propertiesTotal: 0,
    tenantsTotal: 0,
    contractsTotal: 0,
    paymentsTotal: 0,
    totalCollected: 0,
    maintenanceOpen: 0,
    interventionsTotal: 0,
    notificationsTotal: 0
  } as PlatformStats);
}

export async function updateOrganizationAdminStatus(organizationId: string, status: "active" | "suspended" | "archived") {
  await updateDoc(doc(db, "organizations", organizationId), {
    status,
    subscriptionStatus: status === "active" ? "active" : status,
    updatedAt: serverTimestamp()
  });
}

export async function listGlobalActivityLogs(): Promise<ActivityLog[]> {
  const organizations = await listAdminOrganizationSummaries();
  const logsByOrg = await Promise.all(organizations.map(async (organization) => {
    try {
      const snapshot = await getDocs(query(orgCollection(organization.id, "activityLogs"), orderBy("createdAt", "desc"), limit(30)));
      return snapshot.docs.map((item) => ({ id: item.id, organizationId: organization.id, organizationName: organization.name, ...item.data() } as ActivityLog & { organizationName: string }));
    } catch {
      return [];
    }
  }));
  return logsByOrg.flat().slice(0, 150);
}

export async function globalAdminSearch(term: string): Promise<AdminGlobalSearchResult[]> {
  const needle = text(term).trim();
  if (!needle || needle.length < 2) return [];
  const organizations = await listAdminOrganizationSummaries();
  const results: AdminGlobalSearchResult[] = [];

  for (const organization of organizations) {
    const [properties, tenants, contracts, payments, tickets, providers, interventions] = await Promise.all([
      readSubCollection(organization.id, "properties"),
      readSubCollection(organization.id, "tenants"),
      readSubCollection(organization.id, "contracts"),
      readSubCollection(organization.id, "payments"),
      readSubCollection(organization.id, "maintenanceTickets"),
      readSubCollection(organization.id, "serviceProviders"),
      readSubCollection(organization.id, "maintenanceInterventions")
    ]);

    properties.filter((item) => text(`${item.name} ${item.address} ${item.city}`).includes(needle)).forEach((item) => results.push({ id: item.id, organizationId: organization.id, organizationName: organization.name, type: "Bien", title: item.name ?? "Bien", subtitle: item.address ?? item.city ?? "", href: "/biens" }));
    tenants.filter((item) => text(`${item.fullName} ${item.name} ${item.phone} ${item.email}`).includes(needle)).forEach((item) => results.push({ id: item.id, organizationId: organization.id, organizationName: organization.name, type: "Locataire", title: item.fullName ?? item.name ?? "Locataire", subtitle: item.phone ?? item.email ?? "", href: "/locataires" }));
    contracts.filter((item) => text(`${item.reference} ${item.tenantName} ${item.propertyName}`).includes(needle)).forEach((item) => results.push({ id: item.id, organizationId: organization.id, organizationName: organization.name, type: "Contrat", title: item.reference ?? "Contrat", subtitle: `${item.propertyName ?? "Bien"} · ${item.tenantName ?? "Locataire"}`, href: "/contrats" }));
    payments.filter((item) => text(`${item.reference} ${item.tenantName} ${item.propertyName} ${item.receiptNumber}`).includes(needle)).forEach((item) => results.push({ id: item.id, organizationId: organization.id, organizationName: organization.name, type: "Paiement", title: item.reference ?? item.receiptNumber ?? "Paiement", subtitle: `${moneyValue(item).toLocaleString("fr-FR")} FCFA`, href: "/paiements" }));
    tickets.filter((item) => text(`${item.title} ${item.description} ${item.tenantName} ${item.propertyName}`).includes(needle)).forEach((item) => results.push({ id: item.id, organizationId: organization.id, organizationName: organization.name, type: "Maintenance", title: item.title ?? "Ticket", subtitle: `${item.propertyName ?? "Bien"} · ${item.status ?? ""}`, href: "/maintenance" }));
    providers.filter((item) => text(`${item.name} ${item.company} ${item.phone} ${item.specialty}`).includes(needle)).forEach((item) => results.push({ id: item.id, organizationId: organization.id, organizationName: organization.name, type: "Prestataire", title: item.name ?? item.company ?? "Prestataire", subtitle: item.specialty ?? item.phone ?? "", href: "/prestataires" }));
    interventions.filter((item) => text(`${item.title} ${item.providerName} ${item.ticketTitle} ${item.propertyName}`).includes(needle)).forEach((item) => results.push({ id: item.id, organizationId: organization.id, organizationName: organization.name, type: "Intervention", title: item.title ?? item.ticketTitle ?? "Intervention", subtitle: item.providerName ?? item.status ?? "", href: "/interventions" }));
  }

  return results.slice(0, 50);
}

export async function saveSubscriptionDraft(payload: SubscriptionDraft) {
  await setDoc(doc(db, "subscriptions", payload.organizationId), {
    ...payload,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  await updateDoc(doc(db, "organizations", payload.organizationId), {
    subscriptionPlan: payload.plan,
    subscriptionStatus: payload.status,
    updatedAt: serverTimestamp()
  });
}
