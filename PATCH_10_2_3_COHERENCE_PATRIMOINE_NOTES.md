# Patch 10.2.3 — Cohérence Patrimoine Immobilier

## Objectif

Séparer clairement trois réalités métier qui étaient mélangées dans un seul champ `status` :

1. Occupation réelle du bien : calculée automatiquement à partir des contrats actifs.
2. Mise en location : décision du propriétaire/agence (`available` ou `withdrawn`).
3. État opérationnel : bien exploitable ou en maintenance/travaux.

## Changements principaux

- Ajout des champs `availabilityStatus` et `operationalStatus` sur les biens.
- Ajout du service `services/property-situation.ts` pour calculer la situation réelle d’un bien.
- Le formulaire de création/modification d’un bien ne demande plus à l’utilisateur de choisir manuellement “Occupé”.
- Un bien devient “Occupé” uniquement lorsqu’il a un contrat actif rattaché à un locataire.
- Ajout du cas métier : bien libre mais retiré du marché / non proposé à la location.
- Blocage de la création d’un contrat actif sur un bien retiré du marché ou en maintenance.
- Harmonisation des statistiques Biens, Dashboard et Rapports avec le nouveau modèle.

## Règles métier

- Occupé = contrat actif + locataire affecté.
- Disponible = libre + mis en location + état normal.
- Retiré du marché = libre mais volontairement non proposé à la location.
- Maintenance = bien non exploitable immédiatement.
- Le taux d’occupation est calculé sur les biens réellement louables : occupés + disponibles.

## Compatibilité

Le champ historique `status` est conservé pour ne pas casser les anciens écrans et anciennes données.
La nouvelle source de vérité métier est `computePropertySituation()`.

## Risques

- Faible à moyen : le patch touche biens, contrats, dashboard et rapports.
- Pas de migration obligatoire.
- Les anciens biens sans `availabilityStatus` ou `operationalStatus` sont interprétés comme disponibles et normaux.
