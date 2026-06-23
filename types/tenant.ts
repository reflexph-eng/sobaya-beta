export type TenantStatus = "active" | "notice" | "exited" | "suspended";

export interface Tenant {
  id: string;
  organizationId: string;
  tenantNumber?: string;
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  profession: string;
  employer: string;
  identityNumber: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: TenantStatus;
  tenantScore: number;
  identityVerified: boolean;
  documents: string[];
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantFormValues = Omit<Tenant, "id" | "organizationId" | "tenantNumber" | "tenantScore" | "identityVerified" | "documents" | "createdAt" | "updatedAt">;
