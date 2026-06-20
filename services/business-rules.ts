import type { Contract } from "@/types/contract";
import type { PaymentStatus } from "@/types/payment";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";

export function isActiveContract(contract: Pick<Contract, "status" | "isDeleted">) {
  return contract.status === "active" && contract.isDeleted !== true;
}

export function findActiveContractForProperty(contracts: Contract[], propertyId: string, ignoredContractId?: string) {
  return contracts.find((contract) => isActiveContract(contract) && contract.propertyId === propertyId && contract.id !== ignoredContractId);
}

export function findActiveContractForTenant(contracts: Contract[], tenantId: string, ignoredContractId?: string) {
  return contracts.find((contract) => isActiveContract(contract) && contract.tenantId === tenantId && contract.id !== ignoredContractId);
}

export function findActiveContractForPropertyTenant(contracts: Contract[], propertyId: string, tenantId: string, ignoredContractId?: string) {
  return contracts.find((contract) => isActiveContract(contract) && contract.propertyId === propertyId && contract.tenantId === tenantId && contract.id !== ignoredContractId);
}

export function expectedMonthlyPayment(contract?: Pick<Contract, "monthlyRent" | "charges"> | null) {
  if (!contract) return 0;
  return (Number(contract.monthlyRent) || 0) + (Number(contract.charges) || 0);
}

export function computePaymentStatus(amount: number, expectedAmount: number): PaymentStatus {
  if (expectedAmount <= 0) return amount > 0 ? "completed" : "pending";
  if (amount <= 0) return "pending";
  return amount >= expectedAmount ? "completed" : "partial";
}

export function computePaymentBalance(amount: number, expectedAmount: number) {
  return {
    remaining: Math.max(expectedAmount - amount, 0),
    overpaid: Math.max(amount - expectedAmount, 0)
  };
}

export function propertyLabel(property: Property, activeContract?: Contract) {
  const state = activeContract ? `Occupé par ${activeContract.tenantName}` : property.status === "available" ? "Disponible" : property.status;
  return `${property.name} — ${property.commune || property.city || "Localisation non renseignée"} — ${state}`;
}

export function tenantLabel(tenant: Tenant, activeContract?: Contract) {
  const state = activeContract ? `lié à ${activeContract.propertyName}` : "sans contrat actif détecté";
  return `${tenant.fullName} — ${tenant.phone || "Téléphone non renseigné"} — ${state}`;
}
