# PATCH 10.1.3 — Position bannière Dashboard

## Objectif

Placer la bannière SOBAYA tout en haut du tableau de bord propriétaire, avant le titre et le descriptif, afin que l'identité visuelle soit immédiatement visible sans repousser inutilement le contenu métier.

## Modifications

- `DashboardVisualBanners` déplacé dans `app/(dashboard)/dashboard/page.tsx` avant `PageHeader`.
- Suppression de l'appel à la bannière dans `DashboardOverview`.
- Aucun changement Firestore.
- Aucun changement Firebase Storage.
- Aucun changement de règles de sécurité.

## Tests recommandés

1. Ouvrir `/dashboard`.
2. Vérifier que la bannière apparaît avant “Tableau de bord propriétaire”.
3. Vérifier que le titre et le sous-texte apparaissent directement sous la bannière.
4. Vérifier que les cartes KPI restent inchangées.
5. Tester mobile/tablette/desktop.
6. Vérifier que les autres pages ne sont pas impactées.
