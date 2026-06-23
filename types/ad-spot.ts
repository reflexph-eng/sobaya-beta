/**
 * Sprint 11.3 (landing page) — Espaces publicitaires de la marketplace.
 * Gérés manuellement par le super admin pour l'instant.
 * Le Sprint 11.5 (Mise en avant des annonces) introduira un système
 * self-service avec paiement pour les annonceurs.
 */
export type AdSpotSlot =
  | "banner_top"      // Bannière horizontale en haut de page, pleine largeur
  | "sidebar_left_1"  // Colonne gauche, emplacement 1 (haut)
  | "sidebar_left_2"  // Colonne gauche, emplacement 2 (bas)
  | "sidebar_right";  // Colonne droite, emplacement unique

export interface AdSpot {
  id: string;
  slot: AdSpotSlot;
  /** URL de l'image à afficher. Stockée dans Firebase Storage ou URL externe. */
  imageUrl: string;
  /** Lien de destination au clic. */
  targetUrl: string;
  /** Texte alternatif pour l'accessibilité. */
  altText: string;
  /** Si false, l'emplacement affiche le placeholder "Espace disponible". */
  isActive: boolean;
  updatedAt: Date | unknown;
  updatedBy?: string | null;
}

export const AD_SPOT_LABELS: Record<AdSpotSlot, string> = {
  banner_top: "Bannière haute (pleine largeur)",
  sidebar_left_1: "Colonne gauche — emplacement 1",
  sidebar_left_2: "Colonne gauche — emplacement 2",
  sidebar_right: "Colonne droite"
};

/** Dimensions indicatives recommandées pour chaque emplacement. */
export const AD_SPOT_DIMENSIONS: Record<AdSpotSlot, string> = {
  banner_top: "1200 × 120 px (ratio 10:1)",
  sidebar_left_1: "300 × 250 px (ratio 6:5)",
  sidebar_left_2: "300 × 250 px (ratio 6:5)",
  sidebar_right: "300 × 600 px (ratio 1:2)"
};
