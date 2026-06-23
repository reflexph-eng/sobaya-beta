/** Nommé OrgDocument pour éviter le conflit avec le type global `Document` du DOM. */
export type DocumentCategory = "contract" | "id_card" | "acd" | "invoice" | "plan" | "technical" | "other";

export type DocumentEntityType = "property" | "tenant" | "contract" | "ownerMandate" | "organization";

export interface OrgDocument {
  id: string;
  organizationId: string;
  name: string;
  category: DocumentCategory;
  fileUrl: string;
  storagePath: string;
  fileType: string;
  fileSizeBytes: number;
  /** Rattachement optionnel à une fiche existante. Absent/null = document libre, classé au niveau de l'organisation. */
  entityType?: DocumentEntityType | null;
  entityId?: string | null;
  entityLabel?: string | null;
  notes?: string | null;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
  createdBy?: string | null;
  createdByName?: string | null;
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: "Contrat",
  id_card: "Pièce d'identité (CNI)",
  acd: "ACD",
  invoice: "Facture",
  plan: "Plan",
  technical: "Document technique",
  other: "Autre"
};

export const DOCUMENT_ENTITY_LABELS: Record<DocumentEntityType, string> = {
  property: "Bien",
  tenant: "Locataire",
  contract: "Contrat",
  ownerMandate: "Propriétaire mandant",
  organization: "Organisation (document libre)"
};
