/**
 * Sprint 10.4.0 — structure de données posée en avance pour le signalement
 * d'annonce, fonctionnalité qui ne devient utilisable qu'avec la marketplace
 * publique (Sprint 11.0). Aucune interface n'est construite dans ce sprint :
 * uniquement le modèle et la collection Firestore, prêts à être branchés.
 */

export type ListingReportReason = "fake_listing" | "already_rented" | "wrong_price" | "inappropriate_content" | "scam_suspicion" | "other";
export type ListingReportStatus = "pending" | "reviewed" | "dismissed" | "listing_removed";

export interface ListingReport {
  id: string;
  /** ID du bien/annonce signalé — référence vers la future collection d'annonces marketplace (Sprint 11.0). */
  listingId: string;
  organizationId: string;
  reason: ListingReportReason;
  details?: string;
  reporterUserId?: string | null;
  reporterContact?: string | null;
  status: ListingReportStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | unknown;
  createdAt: Date | unknown;
}

export const LISTING_REPORT_REASON_LABELS: Record<ListingReportReason, string> = {
  fake_listing: "Annonce fictive",
  already_rented: "Bien déjà loué/indisponible",
  wrong_price: "Prix erroné ou trompeur",
  inappropriate_content: "Contenu inapproprié",
  scam_suspicion: "Suspicion d'arnaque",
  other: "Autre"
};
