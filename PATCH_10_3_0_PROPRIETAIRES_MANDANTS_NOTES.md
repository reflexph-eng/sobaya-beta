# SOBAYA — Patch 10.3.0

## Propriétaires mandants & portefeuille agence

Objectif : permettre à un agent immobilier ou une agence de gérer des biens appartenant à plusieurs propriétaires qui ne possèdent pas forcément de compte SOBAYA.

### Ajouts principaux

- Nouveau module `Propriétaires mandants` accessible depuis le menu.
- Nouvelle collection Firestore : `organizations/{organizationId}/ownerMandates`.
- Référence automatique propriétaire : `SBY-PRO-0001`.
- Fiche propriétaire : nom, type, téléphone, email, adresse, notes, statut.
- Rattachement d’un bien à un propriétaire mandant.
- Informations de mandat sur le bien : début, fin, commission fixe / pourcentage / aucune.
- Propagation propriétaire et commission vers le contrat.
- Calcul à l’encaissement : commission agence et net propriétaire à reverser.
- Tableau propriétaire avec biens, contrats, commissions et net propriétaire.

### Règle métier

Un bien peut rester un bien propre sans propriétaire mandant. Pour une agence ou un agent, le rattachement à un propriétaire mandant permet de piloter le patrimoine confié.

### Risque

Moyen-faible : le patch ajoute une couche métier sans casser les biens, contrats, paiements et arriérés existants. Les anciens biens restent compatibles car `ownerMandateId` est optionnel.

### Vérification

- `npm run typecheck` : OK.
- `next build` : compilation OK ; génération statique interrompue par limite de temps locale après validation TypeScript/ESLint.
