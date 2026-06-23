import type { FurnishedRate } from "@/types/property";

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
export type BookingPaymentStatus = "unpaid" | "partial" | "paid";
export type RatePeriod = "daily" | "weekly" | "monthly";
/** Sprint 11.2 — distingue une réservation créée en back-office d'une demande initiée par un visiteur de la marketplace. */
export type BookingSource = "backoffice" | "marketplace";

export type { FurnishedRate };

export interface Booking {
  id: string;
  organizationId: string;
  bookingNumber: string;
  propertyId: string;
  propertyName: string;
  /** Le locataire/client n'est pas forcément déjà connu dans tenants — réservation possible avec juste un nom + téléphone. */
  tenantId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  ratePeriod: RatePeriod;
  nightsCount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: BookingPaymentStatus;
  status: BookingStatus;
  /** Sprint 11.2 — "marketplace" si créée par un visiteur public, "backoffice" sinon. Absent = ancienne donnée, traitée comme backoffice. */
  source?: BookingSource;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
}

export type BookingFormValues = Omit<Booking, "id" | "organizationId" | "bookingNumber" | "propertyName" | "nightsCount" | "paymentStatus" | "createdAt" | "updatedAt">;

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  checked_in: "Arrivée effectuée",
  checked_out: "Départ effectué",
  cancelled: "Annulée"
};

export const RATE_PERIOD_LABELS: Record<RatePeriod, string> = {
  daily: "Journalière",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle"
};
