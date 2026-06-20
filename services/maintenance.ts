import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import { createNotification } from "@/services/notifications";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { MaintenanceLog, MaintenanceLogFormValues, MaintenanceTicket, MaintenanceTicketFormValues } from "@/types/maintenance";

function ticketsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "maintenanceTickets");
}

function ticketRef(organizationId: string, ticketId: string) {
  return doc(db, "organizations", organizationId, "maintenanceTickets", ticketId);
}

function logsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "maintenanceLogs");
}

function hydrateTicketPayload(values: MaintenanceTicketFormValues, properties: Property[], tenants: Tenant[]) {
  const property = properties.find((item) => item.id === values.propertyId);
  const tenant = tenants.find((item) => item.id === values.tenantId);
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    propertyId: values.propertyId,
    propertyName: property?.name ?? "Bien non renseigné",
    tenantId: values.tenantId,
    tenantName: tenant?.fullName ?? "Locataire non renseigné",
    priority: values.priority,
    status: values.status,
    assignedTo: values.assignedTo.trim(),
    assignedPhone: values.assignedPhone.trim(),
    dueDate: values.dueDate,
    estimatedCost: Number(values.estimatedCost || 0),
    finalCost: Number(values.finalCost || 0),
    notes: values.notes.trim()
  };
}

export async function listMaintenanceTickets(organizationId: string): Promise<MaintenanceTicket[]> {
  const q = query(ticketsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as MaintenanceTicket)
    .filter((item) => item.isDeleted !== true);
}

export async function listMaintenanceLogs(organizationId: string): Promise<MaintenanceLog[]> {
  const q = query(logsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, organizationId, ...item.data() }) as MaintenanceLog);
}

export async function createMaintenanceTicket(organizationId: string, values: MaintenanceTicketFormValues, properties: Property[], tenants: Tenant[], actor?: Actor) {
  const payload = hydrateTicketPayload(values, properties, tenants);
  const ref = await addDoc(ticketsCollection(organizationId), {
    ...payload,
    organizationId,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    updatedBy: actor?.userId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await addMaintenanceLog(organizationId, ref.id, payload.title, { status: payload.status, message: "Ticket de maintenance créé." }, actor);
  await createActivityLog(organizationId, { action: "MAINTENANCE_TICKET_CREATED", entityType: "maintenance", entityId: ref.id, entityLabel: payload.title, details: `${payload.propertyName} · ${payload.priority}`, ...actor });
  await createNotification(organizationId, { type: "maintenance_created", title: "Nouveau ticket maintenance", message: `${payload.title} · ${payload.propertyName} · priorité ${payload.priority}.`, entityType: "maintenance", entityId: ref.id, entityLabel: payload.title, severity: payload.priority === "urgent" ? "danger" : payload.priority === "high" ? "warning" : "info" }, actor);
  if (payload.assignedTo) {
    await createNotification(organizationId, { type: "maintenance_assigned", title: "Ticket maintenance affecté", message: `${payload.title} est affecté à ${payload.assignedTo}.`, entityType: "maintenance", entityId: ref.id, entityLabel: payload.title, severity: "info" }, actor);
  }
  return ref;
}

export async function updateMaintenanceTicket(organizationId: string, ticketId: string, values: MaintenanceTicketFormValues, properties: Property[], tenants: Tenant[], actor?: Actor) {
  const payload = hydrateTicketPayload(values, properties, tenants);
  await updateDoc(ticketRef(organizationId, ticketId), { ...payload, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await addMaintenanceLog(organizationId, ticketId, payload.title, { status: payload.status, message: "Ticket mis à jour." }, actor);
  await createActivityLog(organizationId, { action: "MAINTENANCE_TICKET_UPDATED", entityType: "maintenance", entityId: ticketId, entityLabel: payload.title, details: `${payload.status} · ${payload.assignedTo || "Non affecté"}`, ...actor });
  if (payload.assignedTo) {
    await createNotification(organizationId, { type: "maintenance_assigned", title: "Ticket maintenance affecté", message: `${payload.title} est affecté à ${payload.assignedTo}.`, entityType: "maintenance", entityId: ticketId, entityLabel: payload.title, severity: "info" }, actor);
  }
}

export async function archiveMaintenanceTicket(organizationId: string, ticket: Pick<MaintenanceTicket, "id" | "title">, actor?: Actor) {
  await updateDoc(ticketRef(organizationId, ticket.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "MAINTENANCE_TICKET_ARCHIVED", entityType: "maintenance", entityId: ticket.id, entityLabel: ticket.title, ...actor });
}

export async function addMaintenanceLog(organizationId: string, ticketId: string, ticketTitle: string, values: MaintenanceLogFormValues, actor?: Actor) {
  const ref = await addDoc(logsCollection(organizationId), {
    organizationId,
    ticketId,
    ticketTitle,
    status: values.status,
    message: values.message.trim(),
    createdBy: actor?.userId ?? null,
    createdByName: actor?.userName ?? "Utilisateur SOBAYA",
    createdAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "MAINTENANCE_LOG_ADDED", entityType: "maintenance", entityId: ticketId, entityLabel: ticketTitle, details: values.message, ...actor });
  return ref;
}
