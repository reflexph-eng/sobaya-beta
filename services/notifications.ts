import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { Contract } from "@/types/contract";
import { computeRentSituations } from "@/services/rent-arrears";
import type { Payment } from "@/types/payment";
import type { SobayaNotification, NotificationPayload } from "@/types/notification";

function notificationsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "notifications");
}

function notificationRef(organizationId: string, notificationId: string) {
  return doc(db, "organizations", organizationId, "notifications", notificationId);
}

export async function createNotification(organizationId: string, payload: NotificationPayload, actor?: Actor) {
  const ref = await addDoc(notificationsCollection(organizationId), {
    organizationId,
    userId: payload.userId ?? "all",
    type: payload.type,
    title: payload.title,
    message: payload.message,
    entityType: payload.entityType,
    entityId: payload.entityId,
    entityLabel: payload.entityLabel ?? payload.title,
    severity: payload.severity ?? "info",
    isRead: false,
    createdBy: actor?.userId ?? "system",
    createdAt: serverTimestamp(),
    readAt: null
  });

  await createActivityLog(organizationId, {
    action: "NOTIFICATION_CREATED",
    entityType: "notification",
    entityId: ref.id,
    entityLabel: payload.title,
    details: payload.message,
    ...actor
  });

  return ref;
}

export async function listNotifications(organizationId: string): Promise<SobayaNotification[]> {
  const q = query(notificationsCollection(organizationId), orderBy("createdAt", "desc"), limit(150));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, organizationId, ...item.data() }) as SobayaNotification);
}

export async function countUnreadNotifications(organizationId: string): Promise<number> {
  const q = query(notificationsCollection(organizationId), where("isRead", "==", false), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function markNotificationAsRead(organizationId: string, notificationId: string) {
  await updateDoc(notificationRef(organizationId, notificationId), { isRead: true, readAt: serverTimestamp() });
}

export async function markAllNotificationsAsRead(organizationId: string, notifications: SobayaNotification[]) {
  const unread = notifications.filter((item) => !item.isRead).slice(0, 450);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((item) => batch.update(notificationRef(organizationId, item.id), { isRead: true, readAt: serverTimestamp() }));
  await batch.commit();
}

function dateOnly(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysBetween(start: Date, end: Date) {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export async function generateContractReminderNotifications(organizationId: string, contracts: Contract[], payments: Payment[], existing: SobayaNotification[], actor?: Actor) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingKeys = new Set(existing.map((item) => `${item.type}:${item.entityId}:${item.message}`));
  const created = [];

  const rentSituations = computeRentSituations(contracts, payments, today);
  const situationsByContract = new Map(rentSituations.map((situation) => [situation.contractId, situation]));

  for (const contract of contracts) {
    if (contract.isDeleted === true || contract.status !== "active") continue;
    const endDate = dateOnly(contract.endDate);
    const situation = situationsByContract.get(contract.id);

    if (situation && situation.totalDue > 0) {
      const months = situation.dueMonths.map((month) => month.label).slice(0, 4).join(", ");
      const suffix = situation.dueMonths.length > 4 ? ` et ${situation.dueMonths.length - 4} autre(s) mois` : "";
      const message = `${contract.tenantName} doit ${situation.dueMonths.length} mois (${months}${suffix}) pour un total de ${situation.totalDue.toLocaleString("fr-FR")} FCFA sur ${contract.propertyName}.`;
      const key = `payment_overdue:${contract.id}:${message}`;
      if (!existingKeys.has(key)) {
        created.push(await createNotification(organizationId, { type: "payment_overdue", title: "Loyer en retard", message, entityType: "contract", entityId: contract.id, entityLabel: contract.contractNumber, severity: situation.status === "partial" ? "warning" : "danger" }, actor));
      }
    }

    if (endDate) {
      const days = daysBetween(today, endDate);
      if (days >= 0 && days <= 30) {
        const message = `Le contrat ${contract.contractNumber} de ${contract.tenantName} arrive à échéance dans ${days} jour(s).`;
        const key = `contract_expiring:${contract.id}:${message}`;
        if (!existingKeys.has(key)) {
          created.push(await createNotification(organizationId, { type: "contract_expiring", title: "Contrat bientôt à échéance", message, entityType: "contract", entityId: contract.id, entityLabel: contract.contractNumber, severity: "warning" }, actor));
        }
      } else if (days < 0) {
        const message = `Le contrat ${contract.contractNumber} de ${contract.tenantName} est arrivé à échéance.`;
        const key = `contract_expired:${contract.id}:${message}`;
        if (!existingKeys.has(key)) {
          created.push(await createNotification(organizationId, { type: "contract_expired", title: "Contrat expiré", message, entityType: "contract", entityId: contract.id, entityLabel: contract.contractNumber, severity: "danger" }, actor));
        }
      }
    }
  }

  return created.length;
}
