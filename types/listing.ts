import type { PropertyCoordinates, PropertyExploitationMode, PropertyPhoto, PropertyType, FurnishedRate } from "@/types/property";
import type { OrganizationType } from "@/types/organization";

/**
 * Sprint 11.0 — Marketplace publique.
 *
 * PublicListing est une PROJECTION CONTRÔLÉE d'un bien, pas une copie brute.
 * Volontairement, certains champs du bien d'origine ne sont jamais inclus :
 * ownerMandateId, ownerName, managementFeeType, managementFeeValue (données
 * de mandat et de commission, strictement internes à l'organisation), ainsi
 * que mandateStartDate/mandateEndDate. C'est une décision de sécurité : même
 * une erreur de code ailleurs ne peut pas faire fuiter ces champs publiquement,
 * puisqu'ils n'existent tout simplement pas dans ce type.
 */
export interface PublicListing {
  id: string;
  /** Référence vers le bien et l'organisation d'origine, pour le lien back-office et la sécurité des règles. */
  propertyId: string;
  organizationId: string;
  organizationName: string;
  /** Sprint 11.1 — type de vendeur, repris de l'organisation au moment de la publication. Optionnel pour rester compatible avec les annonces publiées avant ce sprint. */
  sellerType?: OrganizationType;
  /** Coordonnées de contact volontairement limitées à l'organisation, jamais à un membre individuel. */
  contactPhone: string;
  contactWhatsapp?: string;
  title: string;
  description: string;
  type: PropertyType;
  city: string;
  commune: string;
  rooms: number;
  surfaceArea?: number;
  monthlyRent: number;
  charges: number;
  exploitationMode: PropertyExploitationMode;
  isFurnished: boolean;
  amenities: string[];
  coordinates?: PropertyCoordinates | null;
  furnishedRate?: FurnishedRate | null;
  photoGallery: PropertyPhoto[];
  isActive: boolean;
  /** Sprint 11.5 — mise en avant. isFeatured = true après validation par le super admin. */
  isFeatured?: boolean;
  /** Date ISO jusqu'à laquelle la mise en avant est active. Après cette date, isFeatured est ignoré. */
  featuredUntil?: string | null;
  /** Statut de la demande de mise en avant : pending = en attente de validation admin. */
  featuredRequest?: "pending" | "approved" | "rejected" | null;
  publishedAt: Date | unknown;
  updatedAt: Date | unknown;
}

export interface ListingContactRequest {
  id: string;
  listingId: string;
  organizationId: string;
  propertyId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: Date | unknown;
}

export interface ListingSearchFilters {
  city?: string;
  type?: PropertyType;
  minRooms?: number;
  maxRent?: number;
  furnishedOnly?: boolean;
  sellerType?: OrganizationType;
}

export const SELLER_TYPE_LABELS: Record<OrganizationType, string> = {
  owner: "Particulier",
  real_estate_agent: "Agent immobilier",
  agency: "Agence immobilière",
  enterprise: "Entreprise"
};
