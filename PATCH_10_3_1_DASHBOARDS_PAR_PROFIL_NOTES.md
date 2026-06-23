# Patch 10.3.1 — Dashboards par profil

## Objectif
Adapter le tableau de bord SOBAYA au type de compte : particulier, agent immobilier, agence immobilière et super admin.

## Ajouts principaux

- Détection du profil dashboard depuis `organization.type` et `profile.globalRole`.
- Titre et description du cockpit adaptés au profil.
- Actions principales adaptées : encaisser, relancer, mandants, plateforme, organisations.
- Chargement des propriétaires mandants dans le dashboard.
- Indicateurs spécifiques agent/agence :
  - propriétaires mandants actifs ;
  - biens confiés ;
  - commissions estimées ;
  - montant estimé à reverser aux propriétaires ;
  - biens sans mandant.
- Bloc “Pilotage mandants” pour agent/agence.
- Bloc de préparation super admin pour la future personnalisation SaaS.

## Ce qui n'a pas été modifié

- Règles Firestore inchangées.
- Paiements, contrats, quittances et arriérés non migrés.
- Aucun changement destructif sur les données existantes.

## Risques

- Faible risque métier : le patch ne change pas les calculs de loyers ni les paiements.
- Risque UX modéré : certains indicateurs agence dépendront du bon rattachement des biens aux propriétaires mandants.
- Les commissions sont des estimations tant que le module de reversement propriétaire n'est pas un module complet.

## Test recommandé

1. Compte particulier : vérifier que le dashboard reste centré sur patrimoine / loyers / impayés.
2. Compte agent immobilier : vérifier l'affichage mandants, biens confiés, commissions.
3. Compte agence : vérifier la même logique avec plusieurs propriétaires mandants.
4. Super admin : vérifier que les raccourcis plateforme et organisations apparaissent.
