import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ActivityAction =
  | "PROPERTY_CREATED" | "PROPERTY_UPDATED" | "PROPERTY_ARCHIVED" | "PROPERTY_RESTORED"
  | "TENANT_CREATED" | "TENANT_UPDATED" | "TENANT_ARCHIVED" | "TENANT_RESTORED"
  | "CONTRACT_CREATED" | "CONTRACT_UPDATED" | "CONTRACT_ARCHIVED" | "CONTRACT_RESTORED"
  | "PAYMENT_CREATED" | "PAYMENT_UPDATED" | "PAYMENT_ARCHIVED" | "PAYMENT_RESTORED"
  | "RECEIPT_ISSUED"
  | "MAINTENANCE_TICKET_CREATED" | "MAINTENANCE_TICKET_UPDATED" | "MAINTENANCE_TICKET_ARCHIVED" | "MAINTENANCE_LOG_ADDED"
  | "PROVIDER_CREATED" | "PROVIDER_UPDATED" | "PROVIDER_ARCHIVED"
  | "INTERVENTION_CREATED" | "INTERVENTION_UPDATED" | "INTERVENTION_ARCHIVED"
  | "NOTIFICATION_CREATED"
  | "ORGANIZATION_UPDATED";

export type ActivityEntityType = "property" | "tenant" | "contract" | "payment" | "maintenance" | "provider" | "intervention" | "notification" | "organization";

export interface ActivityLog {
  id: string;
  organizationId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityLabel: string;
  userId: string;
  userName: string;
  details?: string;
  createdAt: unknown;
}

export type Actor = {
  userId?: string | null;
  userName?: string | null;
};

function logsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "activityLogs");
}

export async function createActivityLog(
  organizationId: string,
  payload: Omit<ActivityLog, "id" | "organizationId" | "createdAt" | "userId" | "userName"> & Actor
) {
  try {
    return await addDoc(logsCollection(organizationId), {
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      entityLabel: payload.entityLabel,
      details: payload.details ?? "",
      organizationId,
      userId: payload.userId ?? "system",
      userName: payload.userName ?? "Utilisateur SOBAYA",
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("SOBAYA activity log skipped", error);
    return null;
  }
}

export async function listActivityLogs(organizationId: string, entityType?: ActivityEntityType | "all"): Promise<ActivityLog[]> {
  // Requête volontairement simple : évite les index composites Firestore pour les filtres.
  const q = query(logsCollection(organizationId), orderBy("createdAt", "desc"), limit(100));
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map((item) => ({ id: item.id, organizationId, ...item.data() }) as ActivityLog);
  return entityType && entityType !== "all"
    ? logs.filter((log) => log.entityType === entityType)
    : logs;
}

export function formatLogDate(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toLocaleString("fr-FR");
  return "Date non disponible";
}
