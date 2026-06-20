# SOBAYA — Patch 6.1 Cohérence Métier & Liaisons Intelligentes

## Objectif
Sécuriser les liens métier entre Biens, Contrats, Locataires, Paiements et Maintenance sans refondre l'architecture validée du Sprint 6.

## Correctifs intégrés

### Contrats
- Blocage de création d'un deuxième contrat actif sur un même bien.
- Désactivation visuelle des biens déjà occupés lors de la création d'un contrat actif.
- Message d'alerte si un bien possède déjà un contrat actif.
- Passage automatique du bien en statut `occupied` lorsqu'un contrat actif est créé ou activé.
- Retour automatique du bien en statut `available` lorsqu'un contrat actif est archivé, résilié, expiré ou suspendu.
- Contrôle côté service Firestore pour éviter les incohérences même si l'UI est contournée.

### Paiements
- Sélection d'un contrat => récupération automatique du locataire, du bien, du loyer et des charges.
- Montant attendu prérempli : loyer + charges du contrat.
- Statut calculé automatiquement :
  - montant égal ou supérieur au montant attendu => payé ;
  - montant inférieur au montant attendu => partiel ;
  - montant nul => en attente.
- Affichage du solde restant ou du trop-perçu.
- Le service recalcule le statut avant enregistrement.

### Maintenance
- Chargement des contrats actifs dans le module Maintenance.
- Sélection d'un bien => locataire actif prérempli automatiquement si un contrat actif existe.
- Message de liaison intelligente affichant bien, locataire et contrat.
- Alerte si aucun contrat actif n'est détecté pour le bien sélectionné.

### Architecture
- Ajout du service métier partagé `services/business-rules.ts`.
- Pas de changement de structure Firestore.
- Pas de nouvelle collection.
- Pas de modification obligatoire des règles Firestore par rapport au Sprint 6.

## Plan de tests

### 1. Contrat actif unique
1. Créer un bien Maison 1.
2. Créer un locataire Koffi.
3. Créer un contrat actif Maison 1 + Koffi.
4. Vérifier que Maison 1 passe en statut occupé.
5. Tenter de créer un deuxième contrat actif sur Maison 1.
6. Résultat attendu : blocage avec message d'alerte.

### 2. Bien occupé non disponible
1. Aller dans Contrats.
2. Mettre le statut du nouveau contrat sur Actif.
3. Ouvrir la liste des biens.
4. Résultat attendu : les biens déjà occupés sont visibles mais désactivés/identifiés comme occupés.

### 3. Paiement intelligent
1. Créer un contrat actif avec loyer 100 000 et charges 10 000.
2. Aller dans Paiements.
3. Sélectionner le contrat.
4. Résultat attendu : montant attendu 110 000 prérempli.
5. Saisir 50 000.
6. Résultat attendu : statut Partiel + solde restant 60 000.
7. Saisir 110 000.
8. Résultat attendu : statut Payé.

### 4. Maintenance intelligente
1. Aller dans Maintenance.
2. Créer un ticket.
3. Sélectionner Maison 1.
4. Résultat attendu : Koffi apparaît automatiquement comme locataire actif.
5. Créer le ticket.
6. Résultat attendu : ticket lié au bien, au locataire et visible dans l'historique.

### 5. Non-régression
- Biens : création, modification, archivage OK.
- Locataires : création, modification, archivage OK.
- Contrats : création, modification, archivage OK.
- Paiements : création, édition, quittance OK.
- Maintenance : création, édition, historique OK.
- Dashboard : chargement OK.
- Multi-organisation : isolation conservée.

## Commandes recommandées

```bash
npm install
npm run build
npm run dev
```

Puis tests fonctionnels.

## Firebase
Aucun `firebase deploy --only firestore:rules` n'est nécessaire si les règles Sprint 6 sont déjà déployées.
