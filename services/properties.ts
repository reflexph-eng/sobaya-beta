import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, startAfter, type QueryConstraint, type QueryDocumentSnapshot, type DocumentData, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import { ensureReference } from "@/services/reference-numbers";
import { legacyStatusFromSituation } from "@/services/property-situation";
import type { Property, PropertyFormValues, PropertyPhoto } from "@/types/property";
import { PROPERTY_PHOTO_MAX } from "@/types/property";

function propertiesCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "properties");
}

function propertyRef(organizationId: string, propertyId: string) {
  return doc(db, "organizations", organizationId, "properties", propertyId);
}

function normalizePropertyValues(values: PropertyFormValues) {
  const normalized = {
    ...values,
    availabilityStatus: values.availabilityStatus ?? "available",
    operationalStatus: values.operationalStatus ?? "normal",
    exploitationMode: values.exploitationMode ?? "long_term",
    isFurnished: values.isFurnished ?? false,
    surfaceArea: Number(values.surfaceArea || 0),
    amenities: values.amenities ?? [],
    // Firestore rejette les valeurs `undefined` explicites : on retire ces clés plutôt que de les écrire à `undefined`.
    coordinates: values.coordinates ?? null,
    furnishedRate: values.furnishedRate
      ? {
          dailyRate: Number(values.furnishedRate.dailyRate || 0),
          weeklyRate: values.furnishedRate.weeklyRate ?? null,
          monthlyRate: values.furnishedRate.monthlyRate ?? null,
          cleaningFee: values.furnishedRate.cleaningFee ?? null,
          securityDeposit: values.furnishedRate.securityDeposit ?? null
        }
      : null
  };
  return {
    ...normalized,
    // Champ historique conservé pour compatibilité : l'occupation réelle est calculée depuis les contrats.
    status: legacyStatusFromSituation(normalized, false)
  };
}

/**
 * Comportement par défaut INCHANGÉ : charge toute la collection, comme avant.
 * C'est volontaire — plusieurs appelants (dashboard, recherche globale, stats)
 * dépendent du jeu complet pour leurs agrégats et seraient silencieusement faux
 * si on limitait par défaut. La pagination est disponible en opt-in explicite
 * via { paginate: true, pageSize, cursor } pour les écrans de liste qui n'ont
 * besoin que d'une page à la fois (ex. future vue Biens paginée).
 */
export async function listProperties(organizationId: string, options?: { paginate?: boolean; pageSize?: number; cursor?: QueryDocumentSnapshot<DocumentData> }): Promise<Property[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (options?.paginate) {
    constraints.push(limit(options.pageSize ?? 50));
    if (options.cursor) constraints.push(startAfter(options.cursor));
  }
  const q = query(propertiesCollection(organizationId), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Property)
    .filter((item) => item.isDeleted !== true);
}

export async function listArchivedProperties(organizationId: string): Promise<Property[]> {
  const q = query(propertiesCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Property)
    .filter((item) => item.isDeleted === true);
}

export async function createProperty(organizationId: string, values: PropertyFormValues, actor?: Actor) {
  const reference = await ensureReference(organizationId, "property", values.reference);
  const normalizedValues = normalizePropertyValues(values);
  const ref = await addDoc(propertiesCollection(organizationId), {
    ...normalizedValues,
    reference,
    organizationId,
    photos: [],
    photoGallery: [],
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    updatedBy: actor?.userId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "PROPERTY_CREATED", entityType: "property", entityId: ref.id, entityLabel: values.name, ...actor });
  return ref;
}

export async function updateProperty(organizationId: string, propertyId: string, values: PropertyFormValues, actor?: Actor) {
  const normalizedValues = normalizePropertyValues(values);
  await updateDoc(propertyRef(organizationId, propertyId), { ...normalizedValues, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_UPDATED", entityType: "property", entityId: propertyId, entityLabel: values.name, ...actor });
}

export async function archiveProperty(organizationId: string, property: Pick<Property, "id" | "name">, actor?: Actor) {
  await updateDoc(propertyRef(organizationId, property.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_ARCHIVED", entityType: "property", entityId: property.id, entityLabel: property.name, ...actor });
}

export async function restoreProperty(organizationId: string, property: Pick<Property, "id" | "name">, actor?: Actor) {
  await updateDoc(propertyRef(organizationId, property.id), { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_RESTORED", entityType: "property", entityId: property.id, entityLabel: property.name, ...actor });
}

export async function updatePropertyStatus(organizationId: string, propertyId: string, status: Property["status"], actor?: Actor) {
  await updateDoc(propertyRef(organizationId, propertyId), { status, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "PROPERTY_UPDATED", entityType: "property", entityId: propertyId, entityLabel: propertyId, details: `Statut du bien mis à jour : ${status}`, ...actor });
}

/** Mise à jour ciblée, sans repasser par toute la normalisation du formulaire — utilisée par la publication marketplace (Sprint 11.0). */
export async function setPropertyListingId(organizationId: string, propertyId: string, publicListingId: string | null, actor?: Actor) {
  await updateDoc(propertyRef(organizationId, propertyId), { publicListingId, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
}

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function addPropertyPhoto(organizationId: string, property: Pick<Property, "id" | "name" | "photoGallery">, file: File, actor?: Actor): Promise<PropertyPhoto> {
  const existing = property.photoGallery ?? [];
  if (existing.length >= PROPERTY_PHOTO_MAX) {
    throw new Error(`Maximum ${PROPERTY_PHOTO_MAX} photos par bien. Supprimez une photo avant d'en ajouter une nouvelle.`);
  }
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new Error("Format non supporté. Utilisez une image JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Image trop volumineuse (5 Mo maximum).");
  }

  const photoId = crypto.randomUUID();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `organizations/${organizationId}/properties/${property.id}/${photoId}.${extension}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  const photo: PropertyPhoto = {
    id: photoId,
    url,
    storagePath,
    isPrimary: existing.length === 0,
    uploadedAt: new Date()
  };

  const gallery = [...existing, photo];
  await updateDoc(propertyRef(organizationId, property.id), {
    photoGallery: gallery,
    photos: gallery.map((p) => p.url),
    updatedBy: actor?.userId ?? null,
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "PROPERTY_UPDATED", entityType: "property", entityId: property.id, entityLabel: property.name, details: "Photo ajoutée", ...actor });

  return photo;
}

export async function removePropertyPhoto(organizationId: string, property: Pick<Property, "id" | "name" | "photoGallery">, photoId: string, actor?: Actor) {
  const existing = property.photoGallery ?? [];
  const target = existing.find((p) => p.id === photoId);
  if (!target) return;

  try {
    await deleteObject(ref(storage, target.storagePath));
  } catch {
    // Le fichier peut déjà avoir été supprimé côté Storage ; on continue pour nettoyer Firestore.
  }

  let remaining = existing.filter((p) => p.id !== photoId);
  if (target.isPrimary && remaining.length > 0) {
    remaining = remaining.map((p, index) => ({ ...p, isPrimary: index === 0 }));
  }

  await updateDoc(propertyRef(organizationId, property.id), {
    photoGallery: remaining,
    photos: remaining.map((p) => p.url),
    updatedBy: actor?.userId ?? null,
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "PROPERTY_UPDATED", entityType: "property", entityId: property.id, entityLabel: property.name, details: "Photo supprimée", ...actor });
}

export async function setPropertyPrimaryPhoto(organizationId: string, property: Pick<Property, "id" | "name" | "photoGallery">, photoId: string, actor?: Actor) {
  const existing = property.photoGallery ?? [];
  const gallery = existing.map((p) => ({ ...p, isPrimary: p.id === photoId }));
  await updateDoc(propertyRef(organizationId, property.id), {
    photoGallery: gallery,
    photos: gallery.map((p) => p.url),
    updatedBy: actor?.userId ?? null,
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "PROPERTY_UPDATED", entityType: "property", entityId: property.id, entityLabel: property.name, details: "Photo principale modifiée", ...actor });
}
