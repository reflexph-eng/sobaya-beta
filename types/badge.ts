/**
 * Sprint 10.4.0 — structure de données posée en avance pour les badges de
 * confiance, dont l'attribution automatique dépend de mécanismes pas encore
 * construits (vérification CNI, contrôle de mandat, inspection SOBAYA —
 * Phases 2/3 de la roadmap). Ce sprint ne pose que le modèle : quels badges
 * existent, sur quel type d'entité, et qui peut les attribuer manuellement
 * en attendant l'automatisation. Aucune UI d'attribution n'est construite ici.
 */

export type BadgeType =
  | "verified_account"      // ✅ Compte vérifié (Sprint 12.0)
  | "verified_property"     // ✅ Bien vérifié (Sprint 12.1)
  | "certified_agent"       // ⭐ Agent certifié (Sprint 12.2)
  | "certified_agency"      // ⭐ Agence certifiée (Sprint 12.2)
  | "inspected_property";   // 🏅 Bien inspecté (Sprint 12.3)

export type BadgeTargetType = "user" | "property" | "organization";

export interface Badge {
  id: string;
  type: BadgeType;
  targetType: BadgeTargetType;
  targetId: string;
  /** Nom lisible de la cible, pour affichage dans l'interface admin. */
  targetLabel: string;
  organizationId: string;
  /** Tant que l'automatisation (Phases 2/3) n'existe pas, un badge ne peut être posé que manuellement par un super admin. */
  grantedBy: string;
  grantedByName?: string | null;
  grantedAt: Date | unknown;
  /** Optionnel : date à laquelle le badge doit être revérifié (ex. validité d'une CNI). */
  expiresAt?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export const BADGE_LABELS: Record<BadgeType, string> = {
  verified_account: "✅ Compte vérifié",
  verified_property: "✅ Bien vérifié",
  certified_agent: "⭐ Agent certifié",
  certified_agency: "⭐ Agence certifiée",
  inspected_property: "🏅 Bien inspecté"
};

export const BADGE_TARGET_FOR_TYPE: Record<BadgeType, BadgeTargetType> = {
  verified_account: "user",
  verified_property: "property",
  certified_agent: "user",
  certified_agency: "organization",
  inspected_property: "property"
};
