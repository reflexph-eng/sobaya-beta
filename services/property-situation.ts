import type { Contract } from "@/types/contract";
import type { Property } from "@/types/property";
import { findActiveContractForProperty } from "@/services/business-rules";

export type PropertyOccupationStatus = "occupied" | "free";
export type PropertyAvailabilityStatus = "available" | "withdrawn";
export type PropertyOperationalStatus = "normal" | "maintenance";

export type PropertySituation = {
  occupationStatus: PropertyOccupationStatus;
  availabilityStatus: PropertyAvailabilityStatus;
  operationalStatus: PropertyOperationalStatus;
  isRentable: boolean;
  activeContract?: Contract;
  label: string;
  detail: string;
  dashboardBucket: "occupied" | "available" | "withdrawn" | "maintenance";
};

export function getPropertyAvailability(property: Partial<Property>): PropertyAvailabilityStatus {
  if (property.availabilityStatus === "withdrawn") return "withdrawn";
  if (property.status === "archived") return "withdrawn";
  return "available";
}

export function getPropertyOperationalStatus(property: Partial<Property>): PropertyOperationalStatus {
  if (property.operationalStatus === "maintenance" || property.status === "maintenance") return "maintenance";
  return "normal";
}

export function computePropertySituation(property: Property, contracts: Contract[] = []): PropertySituation {
  const activeContract = findActiveContractForProperty(contracts, property.id);
  const occupationStatus: PropertyOccupationStatus = activeContract ? "occupied" : "free";
  const availabilityStatus = getPropertyAvailability(property);
  const operationalStatus = getPropertyOperationalStatus(property);
  const isRentable = availabilityStatus === "available" && operationalStatus === "normal";

  if (occupationStatus === "occupied") {
    return {
      occupationStatus,
      availabilityStatus,
      operationalStatus,
      isRentable,
      activeContract,
      label: "Occupé",
      detail: `Contrat actif${activeContract?.tenantName ? ` · ${activeContract.tenantName}` : ""}`,
      dashboardBucket: "occupied"
    };
  }

  if (operationalStatus === "maintenance") {
    return {
      occupationStatus,
      availabilityStatus,
      operationalStatus,
      isRentable,
      label: "Maintenance",
      detail: "Libre mais non exploitable immédiatement",
      dashboardBucket: "maintenance"
    };
  }

  if (availabilityStatus === "withdrawn") {
    return {
      occupationStatus,
      availabilityStatus,
      operationalStatus,
      isRentable,
      label: "Retiré du marché",
      detail: "Libre mais volontairement non mis en location",
      dashboardBucket: "withdrawn"
    };
  }

  return {
    occupationStatus,
    availabilityStatus,
    operationalStatus,
    isRentable,
    label: "Disponible",
    detail: "Libre et prêt à être loué",
    dashboardBucket: "available"
  };
}

export function legacyStatusFromSituation(property: Partial<Property>, hasActiveContract: boolean): Property["status"] {
  if (property.status === "archived") return "archived";
  // Compatibilité : si l'ancien champ dit déjà occupé, on le conserve tant qu'un contrat ne le remet pas à jour.
  // Les écrans métier utilisent désormais les contrats actifs comme source de vérité.
  if (hasActiveContract || property.status === "occupied") return "occupied";
  if (getPropertyOperationalStatus(property) === "maintenance") return "maintenance";
  return "available";
}
