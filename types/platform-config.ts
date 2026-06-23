/**
 * Sprint Admin — Pilotage modules.
 * Chaque module SOBAYA peut être activé ou désactivé globalement par le
 * super admin depuis /admin/settings. L'état est stocké dans Firestore
 * (collection racine platformConfig, document modules) et lu au chargement
 * du dashboard.
 */

export type SobayanModule =
  | "biens"
  | "locataires"
  | "contrats"
  | "paiements"
  | "reservations"
  | "maintenance"
  | "prestataires"
  | "interventions"
  | "documents"
  | "marketplace"
  | "marketplace_leads"
  | "rapports"
  | "notifications"
  | "impayes"
  | "proprietaires";

export interface ModuleConfig {
  id: SobayanModule;
  label: string;
  description: string;
  route: string;
  /** true = activé par défaut si aucune config n'existe dans Firestore. */
  defaultEnabled: boolean;
  /** Modules qui ne peuvent jamais être désactivés (socle minimum). */
  isCoreModule: boolean;
}

export const SOBAYA_MODULES: ModuleConfig[] = [
  { id: "biens", label: "Biens", description: "Gestion du patrimoine immobilier", route: "/biens", defaultEnabled: true, isCoreModule: true },
  { id: "locataires", label: "Locataires", description: "Dossiers et contacts locataires", route: "/locataires", defaultEnabled: true, isCoreModule: true },
  { id: "contrats", label: "Contrats", description: "Baux et contrats de location", route: "/contrats", defaultEnabled: true, isCoreModule: true },
  { id: "paiements", label: "Paiements", description: "Suivi des loyers et quittances", route: "/paiements", defaultEnabled: true, isCoreModule: true },
  { id: "impayes", label: "Impayés", description: "Suivi des retards de paiement", route: "/impayes", defaultEnabled: true, isCoreModule: false },
  { id: "reservations", label: "Réservations", description: "Résidences meublées courte durée", route: "/reservations", defaultEnabled: true, isCoreModule: false },
  { id: "maintenance", label: "Maintenance", description: "Tickets et suivi d'incidents", route: "/maintenance", defaultEnabled: true, isCoreModule: false },
  { id: "prestataires", label: "Prestataires", description: "Annuaire des prestataires", route: "/prestataires", defaultEnabled: true, isCoreModule: false },
  { id: "interventions", label: "Interventions", description: "Suivi des interventions et devis", route: "/interventions", defaultEnabled: true, isCoreModule: false },
  { id: "documents", label: "Documents", description: "Coffre-fort documentaire", route: "/documents", defaultEnabled: true, isCoreModule: false },
  { id: "marketplace", label: "Marketplace", description: "Publication d'annonces publiques", route: "/marketplace-leads", defaultEnabled: true, isCoreModule: false },
  { id: "marketplace_leads", label: "Demandes marketplace", description: "Leads reçus via la marketplace", route: "/marketplace-leads", defaultEnabled: true, isCoreModule: false },
  { id: "rapports", label: "Rapports", description: "Tableaux de bord et statistiques", route: "/rapports", defaultEnabled: true, isCoreModule: false },
  { id: "notifications", label: "Notifications", description: "Centre de notifications", route: "/notifications", defaultEnabled: true, isCoreModule: false },
  { id: "proprietaires", label: "Propriétaires mandants", description: "Gestion des mandats propriétaires", route: "/proprietaires", defaultEnabled: true, isCoreModule: false }
];

export type ModulesState = Partial<Record<SobayanModule, boolean>>;
