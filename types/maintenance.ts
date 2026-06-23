import type { GalleryPhoto } from "@/types/gallery";

export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceStatus = "open" | "assigned" | "in_progress" | "waiting" | "resolved" | "closed" | "cancelled";

export interface MaintenanceTicket {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo: string;
  assignedPhone: string;
  dueDate: string;
  estimatedCost: number;
  finalCost: number;
  notes: string;
  /** Sprint 10.3.7 — photos illustrant l'incident, uploadées vers Firebase Storage. */
  photos?: GalleryPhoto[];
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface MaintenanceLog {
  id: string;
  organizationId: string;
  ticketId: string;
  ticketTitle: string;
  status: MaintenanceStatus;
  message: string;
  createdAt: Date | unknown;
  createdBy?: string | null;
  createdByName?: string | null;
}

export type MaintenanceTicketFormValues = Pick<MaintenanceTicket, "title" | "description" | "propertyId" | "tenantId" | "priority" | "status" | "assignedTo" | "assignedPhone" | "dueDate" | "estimatedCost" | "finalCost" | "notes">;
export type MaintenanceLogFormValues = Pick<MaintenanceLog, "status" | "message">;
