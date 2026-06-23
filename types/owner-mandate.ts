export type OwnerMandateType = "individual" | "company";
export type MandateFeeType = "percentage" | "fixed" | "none";
export type OwnerMandateStatus = "active" | "archived";

export interface OwnerMandate {
  id: string;
  organizationId: string;
  ownerNumber?: string;
  fullName: string;
  type: OwnerMandateType;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: OwnerMandateStatus;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
}

export type OwnerMandateFormValues = Omit<OwnerMandate, "id" | "organizationId" | "createdAt" | "updatedAt">;
