export type ServiceProviderStatus = "active" | "inactive" | "archived";
export type ServiceProviderSpecialty = "plomberie" | "electricite" | "climatisation" | "peinture" | "serrurerie" | "maconnerie" | "menuiserie" | "jardinage" | "nettoyage" | "securite" | "autre";

export interface ServiceProvider {
  id: string;
  organizationId: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  specialty: ServiceProviderSpecialty;
  city: string;
  status: ServiceProviderStatus;
  averageRating: number;
  ratingCount: number;
  notes: string;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type ServiceProviderFormValues = Pick<ServiceProvider, "name" | "company" | "phone" | "email" | "specialty" | "city" | "status" | "notes">;
