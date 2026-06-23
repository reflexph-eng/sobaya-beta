# SOBAYA — Patch 10.2 Intelligence Locative

## Objectif

Permettre à SOBAYA de reprendre correctement des contrats déjà existants avant l'utilisation de l'application, puis de calculer automatiquement la situation locative réelle : mois payés, mois partiels, mois impayés, arriérés, prochaine période à payer.

## Ajouts principaux

### 1. Assistant de reprise des contrats existants

Dans le formulaire contrat, ajout du type de reprise :

- Nouveau contrat SOBAYA
- Contrat existant avant SOBAYA

Pour un contrat existant, le propriétaire peut renseigner :

- date réelle de début du contrat ;
- dernier paiement connu avant SOBAYA ;
- période couverte par ce dernier paiement ;
- solde initial restant dû ;
- caution déjà reçue ;
- avance déjà reçue.

Cette approche évite de ressaisir plusieurs années d'historique.

### 2. Moteur d'arriérés

Nouveau service :

```ts
services/rent-arrears.ts
```

Il calcule pour chaque contrat :

- mensualité attendue ;
- mois attendus ;
- mois payés ;
- mois partiellement payés ;
- mois impayés ;
- montant total dû ;
- dernier mois payé ;
- prochaine période à payer ;
- statut locatif : à jour, en retard, partiel, en avance, inactif.

### 3. Paiements intelligents

Le formulaire de paiement propose désormais automatiquement la prochaine période à payer selon la situation réelle du contrat.

Exemple :

- dernier paiement connu : avril-mai 2026 ;
- date actuelle : juin 2026 ;
- SOBAYA propose juin 2026 comme prochaine période.

### 4. Dashboard

La carte impayés devient une lecture plus métier :

- arriérés locatifs ;
- nombre de locataires en retard ;
- actions prioritaires de relance basées sur le moteur d'arriérés.

### 5. Liste des contrats

Chaque contrat affiche maintenant une situation locative synthétique :

- à jour ;
- en retard ;
- paiement partiel ;
- en avance ;
- dernier mois payé ;
- prochaine période ;
- arriérés détectés.

## Compatibilité

Aucune migration Firestore obligatoire.

Les anciens contrats continuent de fonctionner. Les nouveaux champs sont optionnels.

Les paiements existants sont conservés. Si un paiement possède déjà `periodStart` et `periodEnd`, ils sont utilisés. Sinon, le système peut se rabattre sur `paymentDate`.

Les quittances et QR codes ne sont pas cassés.

## Fichiers principaux modifiés

- `types/contract.ts`
- `services/contracts.ts`
- `services/rent-arrears.ts`
- `components/contracts/contract-form.tsx`
- `components/contracts/contracts-manager.tsx`
- `components/payments/payment-form.tsx`
- `components/payments/payments-manager.tsx`
- `components/dashboard/dashboard-overview.tsx`
- `package.json`

## Test technique

Build validé :

```bash
npm run build
```

Résultat : compilation Next.js réussie, pages générées avec succès.

## Risque résiduel

Faible.

Le moteur d'arriérés est en lecture/calcul et n'impose pas de migration destructive. La seule vigilance en test concerne les cas de contrats très anciens avec plusieurs paiements partiels ou périodes irrégulières.
