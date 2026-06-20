# SOBAYA — Sprint 8 États & Reporting

Base officielle : Sprint 7 Prestataires & Interventions.

## Objectif

Ajouter un module de pilotage financier sans dépendre de Firebase Storage, CinetPay, SMS, WhatsApp ou API externe.

## Ajouts principaux

- Route `/rapports`
- Module `ReportsManager`
- Service de calcul `services/reports.ts`
- Revenus sur période
- Revenus mensuels
- Taux d'occupation
- Vacance locative
- Impayés déclarés depuis les soldes de contrats actifs
- Coût maintenance depuis les interventions
- Résultat net simple : encaissements - coût maintenance
- Rapport par bien
- Rapport mensuel
- Export CSV compatible Excel
- Export PDF via fenêtre d'impression navigateur

## Collections utilisées

Aucune nouvelle collection.

Le sprint lit uniquement les données existantes :

- `properties`
- `contracts`
- `payments`
- `maintenanceInterventions`

## Firebase

Pas de Firebase Storage.
Pas de nouvelle règle Firestore obligatoire.

Si le menu Rapports n'apparaît pas pour un ancien compte, vérifier que le membre dispose au minimum de `payments.read` ou que le compte est propriétaire/super_admin.

## Plan de tests

1. Installer et compiler :

```bash
npm install
npm run build
npm run dev
```

2. Tester l'accès :

- Se connecter
- Ouvrir `/rapports`
- Vérifier l'apparition du menu Rapports

3. Tester les filtres :

- Modifier la date de début
- Modifier la date de fin
- Cliquer sur Actualiser
- Vérifier que les montants changent selon la période

4. Tester les indicateurs :

- Revenus période
- Occupation
- Vacance locative
- Résultat net
- Loyer mensuel attendu
- Impayés déclarés
- Coût maintenance

5. Tester rapport par bien :

- Vérifier que chaque bien actif apparaît
- Vérifier les encaissements par bien
- Vérifier les coûts maintenance si des interventions existent
- Vérifier le résultat net

6. Tester rapport mensuel :

- Vérifier les mois affichés
- Vérifier le nombre de paiements
- Vérifier revenus / maintenance / net

7. Tester exports :

- Export Excel rapport par bien
- Export mensuel
- Export PDF / impression

## Validation attendue

Sprint 8 validé si :

- Build local OK
- Aucun module existant cassé
- Rapports chargés sans erreur Firestore
- Exports fonctionnels
- Données isolées par organisation
