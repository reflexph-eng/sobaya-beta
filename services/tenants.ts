import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { Tenant, TenantFormValues } from "@/types/tenant";

function tenantsCollection(organizationId: string) { return collection(db, "organizations", organizationId, "tenants"); }
function tenantRef(organizationId: string, tenantId: string) { return doc(db, "organizations", organizationId, "tenants", tenantId); }

export async function listTenants(organizationId: string): Promise<Tenant[]> {
  const q = query(tenantsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Tenant)
    .filter((item) => item.isDeleted !== true);
}

export async function listArchivedTenants(organizationId: string): Promise<Tenant[]> {
  const q = query(tenantsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Tenant)
    .filter((item) => item.isDeleted === true);
}

export async function createTenant(organizationId: string, values: TenantFormValues, actor?: Actor) {
  const ref = await addDoc(tenantsCollection(organizationId), { ...values, organizationId, tenantScore: 50, identityVerified: false, documents: [], isDeleted: false, deletedAt: null, deletedBy: null, createdBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "TENANT_CREATED", entityType: "tenant", entityId: ref.id, entityLabel: values.fullName, ...actor });
  return ref;
}

export async function updateTenant(organizationId: string, tenantId: string, values: TenantFormValues, actor?: Actor) {
  await updateDoc(tenantRef(organizationId, tenantId), { ...values, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "TENANT_UPDATED", entityType: "tenant", entityId: tenantId, entityLabel: values.fullName, ...actor });
}

export async function archiveTenant(organizationId: string, tenant: Pick<Tenant, "id" | "fullName">, actor?: Actor) {
  await updateDoc(tenantRef(organizationId, tenant.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "TENANT_ARCHIVED", entityType: "tenant", entityId: tenant.id, entityLabel: tenant.fullName, ...actor });
}

export async function restoreTenant(organizationId: string, tenant: Pick<Tenant, "id" | "fullName">, actor?: Actor) {
  await updateDoc(tenantRef(organizationId, tenant.id), { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "TENANT_RESTORED", entityType: "tenant", entityId: tenant.id, entityLabel: tenant.fullName, ...actor });
}
