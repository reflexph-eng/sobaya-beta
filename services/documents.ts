import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { DocumentCategory, DocumentEntityType, OrgDocument } from "@/types/document";

function documentsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "documents");
}

function documentRef(organizationId: string, documentId: string) {
  return doc(db, "organizations", organizationId, "documents", documentId);
}

const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo — plus large que les photos, pour couvrir des PDF scannés (plans, ACD).

function extensionFor(fileType: string) {
  if (fileType === "application/pdf") return "pdf";
  if (fileType === "image/png") return "png";
  if (fileType === "image/webp") return "webp";
  return "jpg";
}

export async function listDocuments(organizationId: string): Promise<OrgDocument[]> {
  const q = query(documentsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as OrgDocument)
    .filter((item) => item.isDeleted !== true);
}

export async function uploadDocument(
  organizationId: string,
  file: File,
  meta: { name: string; category: DocumentCategory; entityType?: DocumentEntityType; entityId?: string; entityLabel?: string; notes?: string },
  actor?: Actor
): Promise<OrgDocument> {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error("Format non supporté. Utilisez un PDF ou une image JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("Fichier trop volumineux (15 Mo maximum).");
  }

  const documentId = crypto.randomUUID();
  const extension = extensionFor(file.type);
  const storagePath = `organizations/${organizationId}/documents/${documentId}.${extension}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const fileUrl = await getDownloadURL(storageRef);

  const payload = {
    name: meta.name.trim() || file.name,
    category: meta.category,
    fileUrl,
    storagePath,
    fileType: file.type,
    fileSizeBytes: file.size,
    entityType: meta.entityType ?? null,
    entityId: meta.entityId ?? null,
    entityLabel: meta.entityLabel ?? null,
    notes: meta.notes?.trim() || null,
    organizationId,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    createdByName: actor?.userName ?? "Utilisateur SOBAYA",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  };

  const ref_ = await addDoc(documentsCollection(organizationId), payload);
  await createActivityLog(organizationId, { action: "DOCUMENT_UPLOADED", entityType: "document", entityId: ref_.id, entityLabel: payload.name, details: meta.entityLabel ? `Rattaché à ${meta.entityLabel}` : "Document libre", ...actor });

  return { id: ref_.id, ...payload } as OrgDocument;
}

export async function updateDocumentMeta(
  organizationId: string,
  documentId: string,
  values: Pick<OrgDocument, "name" | "category" | "notes">,
  actor?: Actor
) {
  await updateDoc(documentRef(organizationId, documentId), {
    name: values.name.trim(),
    category: values.category,
    notes: values.notes?.trim() || null,
    updatedBy: actor?.userId ?? null,
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "DOCUMENT_UPDATED", entityType: "document", entityId: documentId, entityLabel: values.name, ...actor });
}

export async function archiveDocument(organizationId: string, document: Pick<OrgDocument, "id" | "name" | "storagePath">, actor?: Actor) {
  try {
    await deleteObject(ref(storage, document.storagePath));
  } catch {
    // Le fichier peut déjà avoir été supprimé côté Storage ; on continue pour archiver l'entrée Firestore.
  }
  await updateDoc(documentRef(organizationId, document.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "DOCUMENT_ARCHIVED", entityType: "document", entityId: document.id, entityLabel: document.name, ...actor });
}

/** Pratique pour afficher les documents rattachés à une fiche précise (ex. dans l'onglet d'un bien ou d'un contrat). */
export function filterDocumentsForEntity(documents: OrgDocument[], entityType: DocumentEntityType, entityId: string) {
  return documents.filter((document) => document.entityType === entityType && document.entityId === entityId);
}
