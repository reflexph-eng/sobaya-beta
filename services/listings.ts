import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, startAfter, Timestamp, updateDoc, where, type QueryConstraint } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { Property } from "@/types/property";
import type { OrganizationType } from "@/types/organization";
import type { ListingContactRequest, ListingSearchFilters, PublicListing } from "@/types/listing";

function publicListingsCollection() {
  return collection(db, "publicListings");
}

function publicListingRef(listingId: string) {
  return doc(db, "publicListings", listingId);
}

function contactRequestsCollection() {
  return collection(db, "listingContactRequests");
}

const PAGE_SIZE = 20;

export interface ListingPage {
  listings: PublicListing[];
  /**
   * Curseur sérialisable (chaîne ISO 8601 de la date `publishedAt` du dernier
   * élément), volontairement PAS un QueryDocumentSnapshot Firestore : ce
   * dernier est une instance de classe non sérialisable, ce qui casse le
   * passage de données d'un Server Component vers un Client Component
   * (Next.js App Router l'interdit explicitement). Une simple chaîne de date
   * suffit ici car le tri se fait uniquement sur `publishedAt`.
   */
  cursor: string | null;
  hasMore: boolean;
}

/**
 * Pagination réelle dès la conception : c'est la première collection lue par
 * des visiteurs non authentifiés en volume potentiellement important, donc
 * pas question de charger l'intégralité de la collection comme le reste de
 * l'application le fait encore ailleurs (voir le rapport d'audit, section 3.3).
 *
 * Filtrage IMPORTANT : seul le filtre `city` (égalité exacte) est appliqué
 * côté Firestore via `where`. Les autres filtres (type, pièces, loyer max,
 * meublé, type de vendeur) sont appliqués après coup, côté serveur de rendu,
 * sur la page récupérée — pas sur toute la collection. C'est un compromis
 * assumé : une vraie recherche multi-critères à grande échelle nécessiterait
 * un moteur de recherche dédié (Algolia, Typesense, ou index Firestore
 * composites), déjà identifié comme chantier futur dans le rapport d'audit.
 * Pour le volume de lancement de la marketplace, ce compromis reste
 * raisonnable et n'engage pas de surcoût d'infrastructure supplémentaire.
 */
export async function listPublicListings(filters: ListingSearchFilters = {}, cursor?: string | null, pageSize?: number): Promise<ListingPage> {
  const effectivePageSize = pageSize ?? PAGE_SIZE;
  const constraints: QueryConstraint[] = [where("isActive", "==", true)];
  if (filters.city) {
    constraints.push(where("city", "==", filters.city));
  }
  constraints.push(orderBy("publishedAt", "desc"));
  constraints.push(limit(effectivePageSize + 1));
  if (cursor) constraints.push(startAfter(Timestamp.fromDate(new Date(cursor))));

  const q = query(publicListingsCollection(), ...constraints);
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.slice(0, effectivePageSize);
  const hasMore = snapshot.docs.length > effectivePageSize;

  let listings = docs.map((item) => ({ id: item.id, ...item.data() }) as PublicListing);

  if (filters.type) listings = listings.filter((l) => l.type === filters.type);
  if (filters.minRooms) listings = listings.filter((l) => l.rooms >= filters.minRooms!);
  if (filters.maxRent) listings = listings.filter((l) => l.monthlyRent <= filters.maxRent!);
  if (filters.furnishedOnly) listings = listings.filter((l) => l.isFurnished);
  if (filters.sellerType) listings = listings.filter((l) => l.sellerType === filters.sellerType);

  // Sprint 11.5 — annonces vedettes en tête, les autres ensuite.
  listings.sort((a, b) => {
    const aFeatured = isCurrentlyFeatured(a) ? 1 : 0;
    const bFeatured = isCurrentlyFeatured(b) ? 1 : 0;
    return bFeatured - aFeatured; // featured en premier
  });

  const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
  const lastPublishedAt = lastDoc?.data().publishedAt as Timestamp | undefined;

  return {
    listings,
    cursor: lastPublishedAt ? lastPublishedAt.toDate().toISOString() : null,
    hasMore
  };
}

export async function getPublicListing(listingId: string): Promise<PublicListing | null> {
  const snapshot = await getDoc(publicListingRef(listingId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as PublicListing;
}

export async function publishListing(
  property: Pick<Property, "id" | "organizationId" | "name" | "description" | "type" | "city" | "commune" | "rooms" | "surfaceArea" | "monthlyRent" | "charges" | "exploitationMode" | "isFurnished" | "amenities" | "coordinates" | "furnishedRate" | "photoGallery">,
  organizationName: string,
  sellerType: OrganizationType,
  contact: { contactPhone: string; contactWhatsapp?: string },
  actor?: Actor
) {
  const payload = {
    propertyId: property.id,
    organizationId: property.organizationId,
    organizationName,
    sellerType,
    contactPhone: contact.contactPhone,
    contactWhatsapp: contact.contactWhatsapp ?? null,
    title: property.name,
    description: property.description,
    type: property.type,
    city: property.city,
    commune: property.commune,
    rooms: Number(property.rooms || 0),
    surfaceArea: Number(property.surfaceArea || 0),
    monthlyRent: Number(property.monthlyRent || 0),
    charges: Number(property.charges || 0),
    exploitationMode: property.exploitationMode ?? "long_term",
    isFurnished: property.isFurnished ?? false,
    amenities: property.amenities ?? [],
    coordinates: property.coordinates ?? null,
    furnishedRate: property.furnishedRate ?? null,
    photoGallery: property.photoGallery ?? [],
    isActive: true,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(publicListingsCollection(), payload);
  await createActivityLog(property.organizationId, { action: "LISTING_PUBLISHED", entityType: "property", entityId: property.id, entityLabel: property.name, ...actor });
  return ref.id;
}

export async function unpublishListing(listingId: string, organizationId: string, propertyName: string, actor?: Actor) {
  await updateDoc(publicListingRef(listingId), { isActive: false, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "LISTING_UNPUBLISHED", entityType: "property", entityId: listingId, entityLabel: propertyName, ...actor });
}

export async function submitContactRequest(values: Omit<ListingContactRequest, "id" | "status" | "createdAt">) {
  await addDoc(contactRequestsCollection(), { ...values, status: "new", createdAt: serverTimestamp() });
}

/** Vue back-office : les demandes de contact reçues pour les annonces d'une organisation. */
export async function listContactRequestsForOrganization(organizationId: string): Promise<ListingContactRequest[]> {
  const q = query(contactRequestsCollection(), where("organizationId", "==", organizationId), orderBy("createdAt", "desc"), limit(100));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ListingContactRequest);
}

/** Sprint 11.5 — l'annonceur demande la mise en avant depuis son back-office. */
export async function requestFeaturedListing(listingId: string, organizationId: string, propertyName: string, actor?: Actor) {
  await updateDoc(publicListingRef(listingId), { featuredRequest: "pending", updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "LISTING_FEATURE_REQUESTED", entityType: "property", entityId: listingId, entityLabel: propertyName, ...actor });
}

/** Sprint 11.5 — le super admin approuve la mise en avant pour une durée donnée (en jours). */
export async function approveFeaturedListing(listingId: string, organizationId: string, propertyName: string, durationDays: number, actor?: Actor) {
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + durationDays);
  await updateDoc(publicListingRef(listingId), {
    isFeatured: true,
    featuredUntil: featuredUntil.toISOString(),
    featuredRequest: "approved",
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "LISTING_FEATURE_APPROVED", entityType: "property", entityId: listingId, entityLabel: propertyName, details: `${durationDays} jour(s)`, ...actor });
}

/** Sprint 11.5 — le super admin refuse la demande. */
export async function rejectFeaturedListing(listingId: string, organizationId: string, propertyName: string, actor?: Actor) {
  await updateDoc(publicListingRef(listingId), { featuredRequest: "rejected", isFeatured: false, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "LISTING_FEATURE_REJECTED", entityType: "property", entityId: listingId, entityLabel: propertyName, ...actor });
}

/** Sprint 11.5 — récupère toutes les demandes en attente (pour le panneau admin). */
export async function listPendingFeaturedRequests(): Promise<PublicListing[]> {
  const q = query(publicListingsCollection(), where("featuredRequest", "==", "pending"), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PublicListing);
}

/** Vérifie si une annonce est actuellement en vedette (isFeatured + date non expirée). */
export function isCurrentlyFeatured(listing: PublicListing): boolean {
  if (!listing.isFeatured) return false;
  if (!listing.featuredUntil) return false;
  return new Date(listing.featuredUntil) > new Date();
}

/** Récupère une annonce publique depuis l'ID du bien (pas l'ID de l'annonce). */
export async function getPublicListingByPropertyId(propertyId: string): Promise<PublicListing | null> {
  const q = query(publicListingsCollection(), where("propertyId", "==", propertyId), where("isActive", "==", true), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() } as PublicListing;
}

/** Récupère les annonces actives d'une organisation spécifique pour sa vitrine publique. */
export async function listPublicListingsByOrganization(organizationId: string): Promise<PublicListing[]> {
  const q = query(
    publicListingsCollection(),
    where("organizationId", "==", organizationId),
    where("isActive", "==", true),
    orderBy("publishedAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PublicListing);
}
