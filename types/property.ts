export type PropertyType = "apartment" | "house" | "studio" | "office" | "store" | "land" | "other";
export type PropertyStatus = "available" | "occupied" | "maintenance" | "archived";
export type PropertyAvailabilityStatus = "available" | "withdrawn";
export type PropertyOperationalStatus = "normal" | "maintenance";
/** Mode d'exploitation commerciale du bien (le calendrier de réservation viendra au Sprint 10.3.6). */
export type PropertyExploitationMode = "long_term" | "furnished_short_term";

export interface PropertyPhoto {
  id: string;
  url: string;
  storagePath: string;
  isPrimary: boolean;
  uploadedAt: Date | unknown;
}

export interface PropertyCoordinates {
  lat: number;
  lng: number;
}

export interface FurnishedRate {
  dailyRate: number;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
  cleaningFee?: number | null;
  securityDeposit?: number | null;
}

export interface Property {
  id: string;
  organizationId: string;
  name: string;
  reference: string;
  type: PropertyType;
  city: string;
  commune: string;
  address: string;
  description: string;
  rooms: number;
  monthlyRent: number;
  charges: number;
  ownerMandateId?: string;
  ownerName?: string;
  mandateStartDate?: string;
  mandateEndDate?: string;
  managementFeeType?: "percentage" | "fixed" | "none";
  managementFeeValue?: number;
  status: PropertyStatus;
  /** Décision commerciale : le bien est-il mis sur le marché locatif ? */
  availabilityStatus?: PropertyAvailabilityStatus;
  /** État opérationnel : le bien est-il exploitable ou bloqué par maintenance/travaux ? */
  operationalStatus?: PropertyOperationalStatus;
  /** Sprint 10.3.5 */
  exploitationMode?: PropertyExploitationMode;
  isFurnished?: boolean;
  surfaceArea?: number;
  amenities?: string[];
  coordinates?: PropertyCoordinates | null;
  /** Sprint 10.3.6 — uniquement pertinent si exploitationMode === "furnished_short_term" */
  furnishedRate?: FurnishedRate | null;
  photos: string[];
  photoGallery?: PropertyPhoto[];
  /** Sprint 11.0 — référence à l'annonce publique active, le cas échéant. */
  publicListingId?: string | null;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
}

export interface PropertyFormValues {
  name: string;
  reference: string;
  type: PropertyType;
  city: string;
  commune: string;
  address: string;
  description: string;
  rooms: number;
  monthlyRent: number;
  charges: number;
  ownerMandateId?: string;
  ownerName?: string;
  mandateStartDate?: string;
  mandateEndDate?: string;
  managementFeeType?: "percentage" | "fixed" | "none";
  managementFeeValue?: number;
  status: PropertyStatus;
  availabilityStatus: PropertyAvailabilityStatus;
  operationalStatus: PropertyOperationalStatus;
  exploitationMode: PropertyExploitationMode;
  isFurnished: boolean;
  surfaceArea: number;
  amenities: string[];
  coordinates?: PropertyCoordinates;
  furnishedRate?: FurnishedRate;
}

export const PROPERTY_AMENITIES: { value: string; label: string }[] = [
  { value: "parking", label: "Parking" },
  { value: "security", label: "Gardiennage / sécurité" },
  { value: "pool", label: "Piscine" },
  { value: "ac", label: "Climatisation" },
  { value: "generator", label: "Groupe électrogène" },
  { value: "water_tank", label: "Réserve d'eau / château d'eau" },
  { value: "wifi", label: "Wifi inclus" },
  { value: "balcony", label: "Balcon / terrasse" },
  { value: "elevator", label: "Ascenseur" },
  { value: "garden", label: "Jardin / cour" }
];

export const PROPERTY_PHOTO_MAX = 6;
