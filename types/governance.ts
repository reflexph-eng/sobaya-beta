/**
 * Sprint 10.4.0 — Gouvernance & conformité.
 *
 * Les contenus des textes légaux (LEGAL_DOCUMENTS_CONTENT plus bas) sont des
 * VERSIONS DE TRAVAIL PROVISOIRES, rédigées pour permettre de construire et
 * tester la mécanique technique (consentement, blocage d'accès, historique).
 * Elles ne constituent PAS un avis juridique et ne doivent PAS être publiées
 * telles quelles : elles doivent être relues, complétées et validées par un
 * juriste compétent en droit ivoirien (protection des données personnelles,
 * droit du numérique, droit de la consommation) avant toute mise en production.
 */

export type LegalDocumentType = "cgu" | "cgs" | "privacy_policy" | "verification_policy" | "legal_notice";

export interface LegalDocumentVersion {
  /** Numéro de version simple et croissant, ex. "1.0", "1.1", "2.0". */
  version: string;
  /** Contenu au format Markdown simple, affiché tel quel. */
  content: string;
  /** Date à partir de laquelle cette version est en vigueur. */
  effectiveDate: string;
  /** true tant que le texte n'a pas été validé par un juriste. */
  isDraft: boolean;
}

export interface UserConsent {
  id: string;
  userId: string;
  documentType: LegalDocumentType;
  version: string;
  acceptedAt: Date | unknown;
  /** Conservé pour traçabilité en cas de litige, sans valeur de preuve d'identité à lui seul. */
  ipAddress?: string | null;
  userAgent?: string | null;
}
