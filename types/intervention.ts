export type MaintenanceInterventionStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type QuoteStatus = "pending" | "accepted" | "rejected";

export interface InterventionQuote {
  amount: number;
  status: QuoteStatus;
  /** URL du fichier PDF du devis, uploadé dans Firebase Storage (optionnel). */
  fileUrl?: string | null;
  storagePath?: string | null;
  sentAt?: string | null;
  respondedAt?: string | null;
  notes?: string | null;
}

export interface MaintenanceIntervention {
  id: string;
  organizationId: string;
  ticketId: string;
  ticketTitle: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  interventionDate: string;
  workDescription: string;
  estimatedCost: number;
  finalCost: number;
  status: MaintenanceInterventionStatus;
  rating: number;
  ratingComment: string;
  /** Sprint Phase 4 — devis associé à cette intervention. */
  quote?: InterventionQuote | null;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type MaintenanceInterventionFormValues = Pick<MaintenanceIntervention, "ticketId" | "providerId" | "interventionDate" | "workDescription" | "estimatedCost" | "finalCost" | "status" | "rating" | "ratingComment">;
