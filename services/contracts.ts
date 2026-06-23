import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { Contract, ContractFormValues } from "@/types/contract";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import { findActiveContractForProperty } from "@/services/business-rules";
import { ensureReference } from "@/services/reference-numbers";

function contractsCollection(organizationId: string) { return collection(db, "organizations", organizationId, "contracts"); }
function contractRef(organizationId: string, contractId: string) { return doc(db, "organizations", organizationId, "contracts", contractId); }
function propertyRef(organizationId: string, propertyId: string) { return doc(db, "organizations", organizationId, "properties", propertyId); }

function computeNextDueDate(startDate: string, dueDay: number) {
  const base = startDate ? new Date(startDate) : new Date();
  const safeDueDay = Math.min(Math.max(Number(dueDay) || 1, 1), 28);
  const candidate = new Date(base.getFullYear(), base.getMonth(), safeDueDay);
  if (candidate < base) candidate.setMonth(candidate.getMonth() + 1);
  return candidate.toISOString().slice(0, 10);
}

function isPropertyRentable(property?: Property) {
  if (!property) return false;
  return property.status !== "maintenance" && property.availabilityStatus !== "withdrawn" && property.operationalStatus !== "maintenance";
}

function hydrateContractPayload(values: ContractFormValues, properties: Property[], tenants: Tenant[]) {
  const property = properties.find((item) => item.id === values.propertyId);
  const tenant = tenants.find((item) => item.id === values.tenantId);
  const dueDay = Math.min(Math.max(Number(values.dueDay) || 1, 1), 28);
  const nextDueBase = values.onboardingMode === "existing" && values.migrationLastPaidPeriodEnd ? values.migrationLastPaidPeriodEnd : values.startDate;
  return { ...values, propertyName: property?.name ?? "Bien non renseigné", ownerMandateId: property?.ownerMandateId ?? "", ownerName: property?.ownerName ?? "", managementFeeType: property?.managementFeeType ?? "none", managementFeeValue: Number(property?.managementFeeValue ?? 0), tenantName: tenant?.fullName ?? "Locataire non renseigné", monthlyRent: Number(values.monthlyRent) || 0, charges: Number(values.charges) || 0, deposit: Number(values.deposit) || 0, advance: Number(values.advance) || 0, dueDay, onboardingMode: values.onboardingMode ?? "new", realContractStartDate: values.realContractStartDate || values.startDate, migrationLastPaymentAmount: Number(values.migrationLastPaymentAmount || 0), migrationBalance: Number(values.migrationBalance || 0), migrationDeposit: Number(values.migrationDeposit || values.deposit || 0), migrationAdvance: Number(values.migrationAdvance || values.advance || 0), nextDueDate: computeNextDueDate(nextDueBase, dueDay), balance: Number(values.migrationBalance || 0) };
}

export async function listContracts(organizationId: string): Promise<Contract[]> {
  const q = query(contractsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Contract)
    .filter((item) => item.isDeleted !== true);
}

export async function listArchivedContracts(organizationId: string): Promise<Contract[]> {
  const q = query(contractsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Contract)
    .filter((item) => item.isDeleted === true);
}

export async function createContract(organizationId: string, values: ContractFormValues, properties: Property[], tenants: Tenant[], actor?: Actor) {
  const existingContracts = await listContracts(organizationId);
  const activeConflict = values.status === "active" ? findActiveContractForProperty(existingContracts, values.propertyId) : undefined;
  if (activeConflict) {
    throw new Error(`Ce bien possède déjà un contrat actif : ${activeConflict.contractNumber}.`);
  }
  const selectedProperty = properties.find((property) => property.id === values.propertyId);
  if (values.status === "active" && !isPropertyRentable(selectedProperty)) {
    throw new Error("Ce bien n'est pas louable actuellement : il est retiré du marché ou en maintenance.");
  }
  const contractNumber = await ensureReference(organizationId, "contract", values.contractNumber);
  const payload = { ...hydrateContractPayload(values, properties, tenants), contractNumber };
  const ref = await addDoc(contractsCollection(organizationId), { ...payload, organizationId, isDeleted: false, deletedAt: null, deletedBy: null, createdBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  if (payload.status === "active") {
    await updateDoc(propertyRef(organizationId, payload.propertyId), { status: "occupied", updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  }
  await createActivityLog(organizationId, { action: "CONTRACT_CREATED", entityType: "contract", entityId: ref.id, entityLabel: contractNumber, details: `${payload.propertyName} · ${payload.tenantName}`, ...actor });
  return ref;
}

export async function updateContract(organizationId: string, contractId: string, values: ContractFormValues, properties: Property[], tenants: Tenant[], actor?: Actor) {
  const existingContracts = await listContracts(organizationId);
  const previous = existingContracts.find((contract) => contract.id === contractId);
  const activeConflict = values.status === "active" ? findActiveContractForProperty(existingContracts, values.propertyId, contractId) : undefined;
  if (activeConflict) {
    throw new Error(`Ce bien possède déjà un contrat actif : ${activeConflict.contractNumber}.`);
  }
  const selectedProperty = properties.find((property) => property.id === values.propertyId);
  if (values.status === "active" && !isPropertyRentable(selectedProperty)) {
    throw new Error("Ce bien n'est pas louable actuellement : il est retiré du marché ou en maintenance.");
  }
  const contractNumber = values.contractNumber?.trim() || previous?.contractNumber || await ensureReference(organizationId, "contract");
  const payload = { ...hydrateContractPayload({ ...values, contractNumber }, properties, tenants), contractNumber };
  const batch = writeBatch(db);
  batch.update(contractRef(organizationId, contractId), { ...payload, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  if (previous?.propertyId && previous.propertyId !== payload.propertyId && previous.status === "active") {
    batch.update(propertyRef(organizationId, previous.propertyId), { status: "available", updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  }
  if (payload.status === "active") {
    batch.update(propertyRef(organizationId, payload.propertyId), { status: "occupied", updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  } else if (previous?.status === "active") {
    batch.update(propertyRef(organizationId, previous.propertyId), { status: "available", updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  }
  await batch.commit();
  await createActivityLog(organizationId, { action: "CONTRACT_UPDATED", entityType: "contract", entityId: contractId, entityLabel: contractNumber, details: `${payload.propertyName} · ${payload.tenantName}`, ...actor });
}

export async function archiveContract(organizationId: string, contract: Pick<Contract, "id" | "contractNumber" | "propertyId" | "status">, actor?: Actor) {
  const batch = writeBatch(db);
  batch.update(contractRef(organizationId, contract.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  if (contract.status === "active" && contract.propertyId) {
    batch.update(propertyRef(organizationId, contract.propertyId), { status: "available", updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  }
  await batch.commit();
  await createActivityLog(organizationId, { action: "CONTRACT_ARCHIVED", entityType: "contract", entityId: contract.id, entityLabel: contract.contractNumber, ...actor });
}

export async function restoreContract(organizationId: string, contract: Pick<Contract, "id" | "contractNumber">, actor?: Actor) {
  await updateDoc(contractRef(organizationId, contract.id), { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "CONTRACT_RESTORED", entityType: "contract", entityId: contract.id, entityLabel: contract.contractNumber, ...actor });
}
