# SOBAYA — Patch 5.2.2

## Sécurité, Performance & Nettoyage

Base : Patch 5.2.1.1 validé localement.

## Objectifs

- Durcir Firestore Rules sans casser le multi-organisation.
- Durcir Storage Rules pour préparer le coffre-fort documentaire.
- Empêcher les créations/modifications de documents rattachés à une autre organisation.
- Préserver la consultation publique des quittances.
- Nettoyer les warnings build/lint résiduels.
- Ajouter une meilleure traçabilité `createdBy` / `updatedBy` sur les écritures métier.

## Modifications principales

### Firestore Rules

- Ajout des fonctions de contrôle :
  - `validOrgCreate(orgId)`
  - `validOrgUpdate(orgId)`
  - `canReadOrgData(orgId, permission)`
  - `canCreateOrgData(orgId, permission)`
  - `canUpdateOrgData(orgId, permission)`
- Vérification stricte de `organizationId` sur les collections métier.
- Protection contre les changements d'organisation par update.
- Ajout de `maintenanceAssignments` pour préparer le Sprint 6.
- Sécurisation de `publicReceipts` :
  - lecture publique maintenue,
  - création/update réservées aux membres de l'organisation ou super admin,
  - verrouillage du `receiptNumber`,
  - interdiction de changement d'organisation.

### Storage Rules

- Ajout du support `super_admin`.
- Conservation du périmètre : `organizations/{orgId}/...`.
- Blocage global hors chemins autorisés.

### Services métier

- Ajout de `createdBy` et `updatedBy` sur :
  - biens,
  - locataires,
  - contrats,
  - paiements.
- Ajout de `updatedBy` sur les mises à jour, archivages et restaurations.

### Nettoyage build/lint

- Correction du warning React Hook dans `contracts-manager.tsx` via `useCallback`.
- Neutralisation contrôlée du warning Next Image sur le QR Code, car le service QR externe génère une image dynamique.

## Validation technique réalisée

```bash
npm run typecheck
```

Résultat : OK

```bash
npm run lint -- --max-warnings=0
```

Résultat : OK — 0 warning, 0 erreur

```bash
npm run build
```

Non finalisé dans l'environnement sandbox, car Next tente de télécharger `@next/swc-linux-x64-gnu` depuis npm et l'accès internet est indisponible. À exécuter localement sur la machine de développement.

## Tests recommandés

1. `npm run build`
2. `npm run dev`
3. Tester création/modification/archivage/restauration :
   - bien,
   - locataire,
   - contrat,
   - paiement.
4. Générer une quittance.
5. Ouvrir la quittance publique.
6. Déployer les règles :

```bash
firebase deploy --only firestore:rules,storage
```

7. Retester rapidement les modules après déploiement des règles.

## Résultat attendu

SOBAYA MVP plus stable, plus sécurisé, plus propre, sans changement fonctionnel visible côté utilisateur.
