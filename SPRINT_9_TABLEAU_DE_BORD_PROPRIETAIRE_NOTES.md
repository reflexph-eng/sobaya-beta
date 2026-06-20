# SOBAYA Sprint 9 — Tableau de Bord Propriétaire

## Objectif

Renforcer le tableau de bord principal afin qu'un propriétaire ou gestionnaire voie immédiatement l'état réel de son patrimoine : revenus, impayés, occupation, maintenance, trésorerie et rentabilité par bien.

## Ajouts

- Tableau de bord propriétaire connecté aux données réelles existantes.
- KPIs : trésorerie du mois, revenus annuels, taux d'occupation, impayés.
- Cockpit visuel : occupation, recouvrement, maintenance.
- Rentabilité par bien : encaissements, maintenance, net annuel, attendu mensuel.
- Actions prioritaires : relances de loyers, contrats à renouveler, urgences maintenance.
- Cartes rapides vers Biens, Contrats, Paiements, Maintenance et Interventions.
- Compatibilité multi-organisation conservée.

## Collections lues

- organizations/{orgId}/properties
- organizations/{orgId}/tenants
- organizations/{orgId}/contracts
- organizations/{orgId}/payments
- organizations/{orgId}/maintenanceTickets
- organizations/{orgId}/maintenanceInterventions

## Firebase

Aucune nouvelle collection n'est introduite dans ce sprint. Si les règles Sprint 8 sont déjà déployées, aucun déploiement Firebase supplémentaire n'est normalement nécessaire.

## Tests locaux recommandés

1. Lancer `npm install` si nécessaire.
2. Lancer `npm run build`.
3. Lancer `npm run dev`.
4. Ouvrir `/dashboard`.
5. Vérifier les indicateurs avec des données connues :
   - nombre de biens actifs ;
   - taux d'occupation ;
   - revenus mensuels ;
   - revenus annuels ;
   - impayés ;
   - tickets maintenance ouverts ;
   - coût maintenance ;
   - rentabilité par bien.
6. Créer un paiement et vérifier que les revenus évoluent.
7. Créer une intervention avec coût et vérifier l'impact sur le net.
8. Tester sur mobile : les cartes doivent rester lisibles.

## Non-régression à vérifier

- Biens
- Locataires
- Contrats
- Paiements
- Quittances PDF / QR
- Rapports Sprint 8
- Maintenance
- Prestataires
- Interventions
- Admin / Journal
