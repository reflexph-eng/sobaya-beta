import type { DashboardProfileKey, DashboardWidgetKey } from "@/types/organization";

export type DashboardWidgetDefinition = {
  key: DashboardWidgetKey;
  label: string;
  description: string;
  defaultProfiles: DashboardProfileKey[];
};

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  { key: "cashflow", label: "Trésorerie du mois", description: "Revenus encaissés, maintenance et net mensuel.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "annualRevenue", label: "Revenus annuels", description: "Total annuel et net annuel.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "occupancy", label: "Taux d’occupation", description: "Occupation calculée sur les biens louables.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "arrears", label: "Arriérés locatifs", description: "Montant dû et locataires en retard.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "mandates", label: "Propriétaires mandants", description: "Propriétaires clients suivis par l’agent ou l’agence.", defaultProfiles: ["agent", "agency"] },
  { key: "entrustedProperties", label: "Biens confiés", description: "Biens rattachés à un propriétaire mandant.", defaultProfiles: ["agent", "agency"] },
  { key: "commissions", label: "Commissions estimées", description: "Commission agence calculée sur les encaissements.", defaultProfiles: ["agent", "agency"] },
  { key: "payouts", label: "Reversements propriétaires", description: "Montants estimés à reverser aux mandants.", defaultProfiles: ["agent", "agency"] },
  { key: "platformOrganization", label: "Organisation active", description: "Vue super admin de l’organisation consultée.", defaultProfiles: ["super_admin"] },
  { key: "platformAccountType", label: "Type de compte", description: "Segmentation de l’organisation.", defaultProfiles: ["super_admin"] },
  { key: "platformUsers", label: "Utilisateurs locaux", description: "Indicateur organisationnel simple.", defaultProfiles: ["super_admin"] },
  { key: "platformModules", label: "Modules actifs", description: "Préparation des futurs abonnements et modules.", defaultProfiles: ["super_admin"] },
  { key: "profileCockpit", label: "Cockpit métier", description: "Carte centrale de pilotage par profil.", defaultProfiles: ["owner", "agent", "agency", "super_admin"] },
  { key: "propertySummary", label: "Biens actifs", description: "Synthèse du patrimoine actif.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "tenantSummary", label: "Locataires actifs", description: "Fiches locataires actives.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "maintenanceCost", label: "Coût maintenance", description: "Coût annuel de maintenance enregistré.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "receipts", label: "Quittances", description: "Nombre de quittances générées.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "profitability", label: "Rentabilité par bien", description: "Top biens par rentabilité annuelle.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "priorityActions", label: "Actions prioritaires", description: "Relances, renouvellements et urgences maintenance.", defaultProfiles: ["owner", "agent", "agency"] },
  { key: "mandatePilot", label: "Pilotage mandants", description: "Encaissements, commissions et reversements estimés.", defaultProfiles: ["agent", "agency"] },
  { key: "quickAccess", label: "Accès rapides", description: "Cartes Patrimoine, Contrats et Maintenance.", defaultProfiles: ["owner", "agent", "agency", "super_admin"] }
];

export function defaultDashboardWidgetsForProfile(profile: DashboardProfileKey) {
  return DASHBOARD_WIDGETS.filter((widget) => widget.defaultProfiles.includes(profile)).map((widget) => widget.key);
}

export function isDashboardWidgetVisible(profile: DashboardProfileKey, widget: DashboardWidgetKey, enabledWidgets?: Partial<Record<DashboardProfileKey, DashboardWidgetKey[]>>) {
  const configured = enabledWidgets?.[profile];
  if (configured && configured.length > 0) return configured.includes(widget);
  return defaultDashboardWidgetsForProfile(profile).includes(widget);
}
