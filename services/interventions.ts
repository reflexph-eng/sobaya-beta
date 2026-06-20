import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import { createNotification } from "@/services/notifications";
import { addMaintenanceLog } from "@/services/maintenance";
import { updateProviderRating } from "@/services/providers";
import type { MaintenanceIntervention, MaintenanceInterventionFormValues } from "@/types/intervention";
import type { MaintenanceTicket } from "@/types/maintenance";
import type { ServiceProvider } from "@/types/provider";

function interventionsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "maintenanceInterventions");
}

function interventionRef(organizationId: string, interventionId: string) {
  return doc(db, "organizations", organizationId, "maintenanceInterventions", interventionId);
}

function hydrateInterventionPayload(values: MaintenanceInterventionFormValues, tickets: MaintenanceTicket[], providers: ServiceProvider[]) {
  const ticket = tickets.find((item) => item.id === values.ticketId);
  const provider = providers.find((item) => item.id === values.providerId);
  return {
    ticketId: values.ticketId,
    ticketTitle: ticket?.title ?? "Ticket non renseigné",
    propertyId: ticket?.propertyId ?? "",
    propertyName: ticket?.propertyName ?? "Bien non renseigné",
    tenantId: ticket?.tenantId ?? "",
    tenantName: ticket?.tenantName ?? "Locataire non renseigné",
    providerId: values.providerId,
    providerName: provider?.name ?? "Prestataire non renseigné",
    providerSpecialty: provider?.specialty ?? "autre",
    interventionDate: values.interventionDate,
    workDescription: values.workDescription.trim(),
    estimatedCost: Number(values.estimatedCost || 0),
    finalCost: Number(values.finalCost || 0),
    status: values.status,
    rating: Number(values.rating || 0),
    ratingComment: values.ratingComment.trim()
  };
}

export async function listMaintenanceInterventions(organizationId: string): Promise<MaintenanceIntervention[]> {
  const q = query(interventionsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as MaintenanceIntervention)
    .filter((item) => item.isDeleted !== true);
}

async function recomputeProviderRating(organizationId: string, providerId: string, actor?: Actor) {
  const interventions = await listMaintenanceInterventions(organizationId);
  const rated = interventions.filter((item) => item.providerId === providerId && Number(item.rating) > 0);
  const ratingCount = rated.length;
  const averageRating = ratingCount ? Math.round((rated.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratingCount) * 10) / 10 : 0;
  await updateProviderRating(organizationId, providerId, averageRating, ratingCount, actor);
}

export async function createMaintenanceIntervention(organizationId: string, values: MaintenanceInterventionFormValues, tickets: MaintenanceTicket[], providers: ServiceProvider[], actor?: Actor) {
  const payload = hydrateInterventionPayload(values, tickets, providers);
  const ref = await addDoc(interventionsCollection(organizationId), {
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
  await addMaintenanceLog(organizationId, payload.ticketId, payload.ticketTitle, { status: payload.status === "planned" ? "assigned" : payload.status === "completed" ? "resolved" : payload.status === "cancelled" ? "cancelled" : "in_progress", message: `Intervention affectée à ${payload.providerName}.` }, actor);
  await createActivityLog(organizationId, { action: "INTERVENTION_CREATED", entityType: "intervention", entityId: ref.id, entityLabel: payload.ticketTitle, details: `${payload.providerName} · ${payload.estimatedCost} FCFA`, ...actor });
  await createNotification(organizationId, { type: "provider_assigned", title: "Prestataire affecté", message: `${payload.providerName} est affecté au ticket ${payload.ticketTitle}.`, entityType: "intervention", entityId: ref.id, entityLabel: payload.ticketTitle, severity: "info" }, actor);
  if (payload.status === "completed") {
    await createNotification(organizationId, { type: "intervention_completed", title: "Intervention terminée", message: `${payload.ticketTitle} terminé par ${payload.providerName}. Coût final : ${(payload.finalCost || payload.estimatedCost).toLocaleString("fr-FR")} FCFA.`, entityType: "intervention", entityId: ref.id, entityLabel: payload.ticketTitle, severity: "success" }, actor);
  }
  if (payload.rating > 0) await recomputeProviderRating(organizationId, payload.providerId, actor);
  return ref;
}

export async function updateMaintenanceIntervention(organizationId: string, interventionId: string, values: MaintenanceInterventionFormValues, tickets: MaintenanceTicket[], providers: ServiceProvider[], actor?: Actor) {
  const payload = hydrateInterventionPayload(values, tickets, providers);
  await updateDoc(interventionRef(organizationId, interventionId), { ...payload, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await addMaintenanceLog(organizationId, payload.ticketId, payload.ticketTitle, { status: payload.status === "planned" ? "assigned" : payload.status === "completed" ? "resolved" : payload.status === "cancelled" ? "cancelled" : "in_progress", message: `Intervention mise à jour : ${payload.providerName}.` }, actor);
  await createActivityLog(organizationId, { action: "INTERVENTION_UPDATED", entityType: "intervention", entityId: interventionId, entityLabel: payload.ticketTitle, details: `${payload.status} · ${payload.finalCost || payload.estimatedCost} FCFA`, ...actor });
  if (payload.status === "completed") {
    await createNotification(organizationId, { type: "intervention_completed", title: "Intervention terminée", message: `${payload.ticketTitle} terminé par ${payload.providerName}. Coût final : ${(payload.finalCost || payload.estimatedCost).toLocaleString("fr-FR")} FCFA.`, entityType: "intervention", entityId: interventionId, entityLabel: payload.ticketTitle, severity: "success" }, actor);
  }
  if (payload.rating > 0) await recomputeProviderRating(organizationId, payload.providerId, actor);
}

export async function archiveMaintenanceIntervention(organizationId: string, intervention: Pick<MaintenanceIntervention, "id" | "ticketTitle">, actor?: Actor) {
  await updateDoc(interventionRef(organizationId, intervention.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "INTERVENTION_ARCHIVED", entityType: "intervention", entityId: intervention.id, entityLabel: intervention.ticketTitle, ...actor });
}
