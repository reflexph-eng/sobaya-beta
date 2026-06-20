# SOBAYA — PATCH 10.1 Administration SaaS Avancée

## Base officielle
SOBAYA_SPRINT_10_NOTIFICATIONS.zip validé localement.

## Objectif
Renforcer les outils Super Admin avant la phase BETA 1.0, sans toucher aux flux métier validés.

## Ajouts principaux

### Administration SaaS
- Nouveau cockpit `/admin`
- Cartes globales : organisations, utilisateurs, biens, encaissements
- Accès rapide aux outils Super Admin

### Organisations
- Page `/admin/organizations`
- Liste globale des organisations
- Statut organisation : active, suspended, archived
- Actions : réactiver, suspendre, archiver
- Volumes par organisation : utilisateurs, biens, contrats, paiements, maintenance

### Statistiques plateforme
- Page `/admin/platform`
- Total organisations
- Organisations actives/suspendues/archivées
- Utilisateurs
- Biens, locataires, contrats
- Paiements et encaissements globaux
- Tickets maintenance
- Notifications

### Journal global
- Page `/admin/audit`
- Consolidation des activityLogs multi-organisations

### Recherche globale
- Page `/admin/search`
- Recherche dans : biens, locataires, contrats, paiements, maintenance, prestataires, interventions

### Support & diagnostic
- Page `/admin/support`
- Vue de diagnostic par organisation
- Détection simple des organisations à surveiller

### Paramètres SaaS
- Page `/admin/settings`
- Vision modules actifs pour la BETA
- Modules futurs après test terrain

### Préparation abonnements
- Page `/admin/subscriptions`
- Collection `subscriptions`
- Plans préparés : Starter, Pro, Agence
- Aucun paiement externe intégré à ce stade

## Sécurité
- Accès protégé côté interface par `globalRole === super_admin`
- Règles Firestore mises à jour pour `/subscriptions/{organizationId}`
- Les règles existantes multi-organisations sont conservées

## Commandes recommandées

```bash
npm install
npm run lint
npm run typecheck
npm run build
firebase deploy --only firestore:rules
npm run dev
```

## Plan de tests

### 1. Super Admin
- Se connecter avec un compte `globalRole: super_admin`
- Ouvrir `/admin`
- Vérifier les cartes globales
- Vérifier les liens vers les pages admin

### 2. Organisation standard
- Se connecter avec un compte non super_admin
- Ouvrir `/admin`
- Vérifier que l'accès est refusé par l'interface

### 3. Organisations
- Ouvrir `/admin/organizations`
- Vérifier la liste des organisations
- Suspendre une organisation de test
- Réactiver l'organisation
- Vérifier le changement dans Firestore

### 4. Statistiques plateforme
- Ouvrir `/admin/platform`
- Comparer les compteurs avec les données réelles Firestore

### 5. Journal global
- Ouvrir `/admin/audit`
- Vérifier que les logs récents apparaissent

### 6. Recherche globale
- Ouvrir `/admin/search`
- Rechercher un nom de locataire, un bien ou un paiement existant
- Vérifier les résultats retournés

### 7. Support
- Ouvrir `/admin/support`
- Vérifier les signaux par organisation

### 8. Abonnements préparatoires
- Ouvrir `/admin/subscriptions`
- Affecter un plan Starter / Pro / Agence à une organisation de test
- Vérifier la collection `subscriptions`
- Vérifier la mise à jour de l'organisation

## Important
Ce patch ne déclenche aucun paiement, aucun SMS, aucun email, aucun Storage Firebase.
