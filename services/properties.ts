import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { Property, PropertyFormValues } from "@/types/property";

function propertiesCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "properties");
}

function propertyRef(organizationId: string, propertyId: string) {
  return doc(db, "organizations", organizationId, "properties", propertyId);
}

export async function listProperties(organizationId: string): Promise<Property[]> {
  const q = query(propertiesCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Property)
    .filter((item) => item.isDeleted !== true);
}

export async function listArchivedProperties(organizationId: string): Promise<Property[]> {
  const q = query(propertiesCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Property)
    .filter((item) => item.isDeleted === true);
}

export async function createProperty(organizationId: string, values: PropertyFormValues, actor?: Actor) {
  const ref = await addDoc(propertiesCollection(organizationId), {
    ...values,
    organizationId,
    photos: [],
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    updatedBy: actor?.userId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "PROPERTY_CREATED", entityType: "property", entityId: ref.id, entityLabel: values.name, ...actor });
  return ref;
}

export async function updateProperty(organizationId: string, propertyId: string, values: PropertyFormValues, actor?: Actor) {
  await updateDoc(propertyRef(organizationId, propertyId), { ...values, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_UPDATED", entityType: "property", entityId: propertyId, entityLabel: values.name, ...actor });
}

export async function archiveProperty(organizationId: string, property: Pick<Property, "id" | "name">, actor?: Actor) {
  await updateDoc(propertyRef(organizationId, property.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_ARCHIVED", entityType: "property", entityId: property.id, entityLabel: property.name, ...actor });
}

export async function restoreProperty(organizationId: string, property: Pick<Property, "id" | "name">, actor?: Actor) {
  await updateDoc(propertyRef(organizationId, property.id), { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_RESTORED", entityType: "property", entityId: property.id, entityLabel: property.name, ...actor });
}

export async function updatePropertyStatus(organizationId: string, propertyId: string, status: Property["status"], actor?: Actor) {
  await updateDoc(propertyRef(organizationId, propertyId), { status, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_UPDATED", entityType: "property", entityId: propertyId, entityLabel: propertyId, details: `Statut du bien mis à jour : ${status}`, ...actor });
}
