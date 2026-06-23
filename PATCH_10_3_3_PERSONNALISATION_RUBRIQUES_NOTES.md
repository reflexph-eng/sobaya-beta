# Patch 10.3.3 — Personnalisation des rubriques dashboard

## Objectif
Permettre à l'admin d'organisation / super admin de définir les rubriques visibles sur le dashboard selon le profil métier : particulier, agent immobilier, agence immobilière et super admin.

## Ajouts

- Nouveau typage `DashboardSettings` dans `types/organization.ts`.
- Nouveau service `services/dashboard-config.ts` :
  - catalogue des widgets dashboard ;
  - rubriques par défaut par profil ;
  - fonction de visibilité avec fallback sécurisé.
- Nouvelle fonction `updateOrganizationDashboardSettings()` dans `services/organizations.ts`.
- Nouveau composant `components/settings/dashboard-widgets-settings.tsx`.
- Page Organisation enrichie avec le paramétrage des rubriques.
- Dashboard principal harmonisé pour masquer/afficher les cartes selon la configuration.

## Principe de sécurité fonctionnelle

Si aucune configuration n'est enregistrée, SOBAYA conserve automatiquement les rubriques par défaut. Le patch ne casse donc pas les dashboards existants.

## Profils couverts

- Particulier
- Agent immobilier
- Agence immobilière
- Super admin

## Widgets configurables

- Trésorerie du mois
- Revenus annuels
- Taux d'occupation
- Arriérés locatifs
- Propriétaires mandants
- Biens confiés
- Commissions estimées
- Reversements propriétaires
- Cockpit métier
- Biens actifs
- Locataires actifs
- Coût maintenance
- Quittances
- Rentabilité par bien
- Actions prioritaires
- Pilotage mandants
- Accès rapides
- Widgets préparatoires super admin

## Impact

- Aucune migration obligatoire.
- Aucune nouvelle collection Firestore.
- La configuration est stockée sur le document organisation.
- Les règles Firestore existantes autorisent déjà la mise à jour par `settings.manage` ou super admin.

## Risque

Faible. Le patch ajoute une couche de personnalisation avec fallback par défaut.
