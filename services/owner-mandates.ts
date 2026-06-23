import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import { ensureReference } from "@/services/reference-numbers";
import type { OwnerMandate, OwnerMandateFormValues } from "@/types/owner-mandate";

function ownersCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "ownerMandates");
}

function ownerRef(organizationId: string, ownerId: string) {
  return doc(db, "organizations", organizationId, "ownerMandates", ownerId);
}

export async function listOwnerMandates(organizationId: string): Promise<OwnerMandate[]> {
  const q = query(ownersCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as OwnerMandate)
    .filter((item) => item.isDeleted !== true && item.status !== "archived");
}

export async function listArchivedOwnerMandates(organizationId: string): Promise<OwnerMandate[]> {
  const q = query(ownersCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as OwnerMandate)
    .filter((item) => item.isDeleted === true || item.status === "archived");
}

export async function createOwnerMandate(organizationId: string, values: OwnerMandateFormValues, actor?: Actor) {
  const ownerNumber = await ensureReference(organizationId, "ownerMandate", values.ownerNumber);
  const ref = await addDoc(ownersCollection(organizationId), {
    ...values,
    ownerNumber,
    organizationId,
    status: values.status ?? "active",
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    updatedBy: actor?.userId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "OWNER_MANDATE_CREATED", entityType: "ownerMandate", entityId: ref.id, entityLabel: values.fullName, ...actor });
  return ref;
}

export async function updateOwnerMandate(organizationId: string, ownerId: string, values: OwnerMandateFormValues, actor?: Actor) {
  const ownerNumber = values.ownerNumber?.trim() || await ensureReference(organizationId, "ownerMandate");
  await updateDoc(ownerRef(organizationId, ownerId), { ...values, ownerNumber, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "OWNER_MANDATE_UPDATED", entityType: "ownerMandate", entityId: ownerId, entityLabel: values.fullName, ...actor });
}

export async function archiveOwnerMandate(organizationId: string, owner: Pick<OwnerMandate, "id" | "fullName">, actor?: Actor) {
  await updateDoc(ownerRef(organizationId, owner.id), { status: "archived", isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "OWNER_MANDATE_ARCHIVED", entityType: "ownerMandate", entityId: owner.id, entityLabel: owner.fullName, ...actor });
}
