import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { LEGAL_DOCUMENTS } from "@/constants/legal-documents";
import type { LegalDocumentType, UserConsent } from "@/types/governance";

function consentsCollection(userId: string) {
  return collection(db, "users", userId, "consents");
}

/** Tous les documents qu'un utilisateur doit avoir acceptés pour accéder au tableau de bord. */
export const REQUIRED_CONSENT_DOCUMENTS: LegalDocumentType[] = ["cgu", "privacy_policy"];

export async function listUserConsents(userId: string): Promise<UserConsent[]> {
  const q = query(consentsCollection(userId), orderBy("acceptedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, userId, ...item.data() }) as UserConsent);
}

export async function recordConsent(userId: string, documentType: LegalDocumentType, userAgent?: string) {
  const version = LEGAL_DOCUMENTS[documentType].version;
  await addDoc(consentsCollection(userId), {
    userId,
    documentType,
    version,
    userAgent: userAgent ?? null,
    ipAddress: null, // Capturée côté serveur si une fonction Cloud est ajoutée plus tard ; non disponible côté client.
    acceptedAt: serverTimestamp()
  });
}

/**
 * Détermine si l'utilisateur doit voir l'écran de consentement : c'est le cas
 * si, pour au moins un document requis, aucun consentement n'a été enregistré
 * pour la version actuellement en vigueur (LEGAL_DOCUMENTS[...].version).
 * Une mise à jour de version (ex. "1.0" -> "1.1") redemande donc le consentement.
 */
export function findMissingConsents(consents: UserConsent[], requiredTypes: LegalDocumentType[] = REQUIRED_CONSENT_DOCUMENTS): LegalDocumentType[] {
  return requiredTypes.filter((type) => {
    const currentVersion = LEGAL_DOCUMENTS[type].version;
    return !consents.some((consent) => consent.documentType === type && consent.version === currentVersion);
  });
}
