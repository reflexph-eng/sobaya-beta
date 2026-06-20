# SOBAYA — Patch 5.2.1 UX, Responsive & Dashboard

## Objectif
Stabilisation UX du MVP sans impact Firestore ni modification des règles de sécurité.

## Changements principaux
- Dashboard enrichi avec revenus mensuels, revenus annuels, occupation, loyers en retard.
- Bloc Alertes de pilotage : retards, contrats à renouveler, paiements du mois.
- KPI harmonisés via composant `MetricCard`.
- États vides harmonisés via composant `EmptyState`.
- Badges statut harmonisés via composant `StatusBadge`.
- Boutons plus adaptés mobile avec largeur responsive et espacement uniforme.
- Pages Biens, Locataires, Contrats et Paiements renforcées pour usage mobile.

## Fichiers créés
- components/ui/metric-card.tsx
- components/ui/empty-state.tsx
- components/ui/status-badge.tsx

## Fichiers modifiés
- components/dashboard/dashboard-overview.tsx
- components/properties/properties-manager.tsx
- components/tenants/tenants-manager.tsx
- components/contracts/contracts-manager.tsx
- components/payments/payments-manager.tsx
- components/ui/button.tsx
- components/ui/page-header.tsx

## Validation technique
- `npx tsc --noEmit` : OK.
- `npm run build` non finalisé dans l'environnement d'audit car Next.js a tenté de télécharger le binaire SWC Linux depuis npm, inaccessible sans internet. À exécuter localement sur la machine de développement.

## Tests recommandés
1. Ouvrir Dashboard et vérifier les nouveaux KPI/alertes.
2. Tester Biens sur desktop et mobile.
3. Tester Locataires sur desktop et mobile.
4. Tester Contrats sur desktop et mobile.
5. Tester Paiements, génération quittance et ouverture publique.
6. Vérifier que les créations/modifications/archives fonctionnent comme avant.
