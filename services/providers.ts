import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { ServiceProvider, ServiceProviderFormValues } from "@/types/provider";

function providersCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "serviceProviders");
}

function providerRef(organizationId: string, providerId: string) {
  return doc(db, "organizations", organizationId, "serviceProviders", providerId);
}

function hydrateProviderPayload(values: ServiceProviderFormValues) {
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    specialty: values.specialty,
    city: values.city.trim(),
    status: values.status,
    notes: values.notes.trim()
  };
}

export async function listServiceProviders(organizationId: string): Promise<ServiceProvider[]> {
  const q = query(providersCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as ServiceProvider)
    .filter((item) => item.isDeleted !== true);
}

export async function createServiceProvider(organizationId: string, values: ServiceProviderFormValues, actor?: Actor) {
  const payload = hydrateProviderPayload(values);
  const ref = await addDoc(providersCollection(organizationId), {
    ...payload,
    organizationId,
    averageRating: 0,
    ratingCount: 0,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    updatedBy: actor?.userId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "PROVIDER_CREATED", entityType: "provider", entityId: ref.id, entityLabel: payload.name, details: `${payload.specialty} · ${payload.city}`, ...actor });
  return ref;
}

export async function updateServiceProvider(organizationId: string, providerId: string, values: ServiceProviderFormValues, actor?: Actor) {
  const payload = hydrateProviderPayload(values);
  await updateDoc(providerRef(organizationId, providerId), { ...payload, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROVIDER_UPDATED", entityType: "provider", entityId: providerId, entityLabel: payload.name, details: `${payload.status} · ${payload.specialty}`, ...actor });
}

export async function archiveServiceProvider(organizationId: string, provider: Pick<ServiceProvider, "id" | "name">, actor?: Actor) {
  await updateDoc(providerRef(organizationId, provider.id), { status: "archived", isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROVIDER_ARCHIVED", entityType: "provider", entityId: provider.id, entityLabel: provider.name, ...actor });
}

export async function updateProviderRating(organizationId: string, providerId: string, averageRating: number, ratingCount: number, actor?: Actor) {
  await updateDoc(providerRef(organizationId, providerId), { averageRating, ratingCount, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
}
