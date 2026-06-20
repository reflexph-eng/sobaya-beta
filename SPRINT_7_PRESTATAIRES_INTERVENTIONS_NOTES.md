# SOBAYA — Sprint 7 Prestataires & Interventions

Version : 0.7.0
Base : SOBAYA Patch 6.1 Cohérence Métier

## Objectif

Transformer la maintenance en suivi terrain complet : ticket → prestataire → intervention → coût → évaluation → historique technique du bien.

## Ajouts principaux

### Collections Firestore

- `organizations/{organizationId}/serviceProviders`
- `organizations/{organizationId}/maintenanceInterventions`

### Modules ajoutés

- Page `/prestataires`
- Page `/interventions`
- Bloc interventions lié dans `/maintenance`
- Historique technique visible dans `/biens`

### Prestataires

- Création / modification / archivage
- Spécialités : plomberie, électricité, climatisation, peinture, serrurerie, maçonnerie, menuiserie, jardinage, nettoyage, sécurité, autre
- Filtre par spécialité, statut, recherche
- Note moyenne automatique après évaluation d'intervention

### Interventions

- Affectation à un ticket maintenance
- Récupération automatique du bien et du locataire depuis le ticket
- Récupération du prestataire sélectionné
- Statuts : planifiée, en cours, terminée, annulée
- Coût estimé / coût final
- Évaluation 1 à 5 étoiles
- Journalisation dans `maintenanceLogs` et `activityLogs`

### Cohérence métier

- L'intervention hérite du ticket, du bien, du locataire et du prestataire.
- Le bien affiche un historique technique basé sur les interventions.
- Le module respecte le cloisonnement multi-organisation.

### Permissions

Nouvelles permissions ajoutées :

- `providers.view`
- `providers.manage`
- `interventions.view`
- `interventions.manage`

Compatibilité : les règles Firestore acceptent aussi `maintenance.manage` pour éviter de bloquer les comptes existants après Patch 6.1.

## Commandes de test local

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

## Résultat de validation sandbox

- `npm run lint` : OK
- `npm run typecheck` : OK
- `npm run build` : compilation OK, puis blocage sandbox au stade `Collecting page data` avec `Static worker SIGTERM/EPIPE`. À retester localement sur Windows, ce comportement est lié aux workers Next.js dans l'environnement sandbox.

## Déploiement règles Firebase

Sprint 7 modifie `firestore.rules`. Après intégration locale :

```bash
firebase deploy --only firestore:rules
```

## Plan de tests fonctionnels

1. Prestataires
   - Créer un prestataire actif plombier.
   - Modifier sa ville ou son téléphone.
   - Vérifier la recherche et le filtre spécialité.
   - Archiver le prestataire.

2. Interventions
   - Créer un ticket maintenance.
   - Créer une intervention liée au ticket.
   - Vérifier que le bien et le locataire sont repris automatiquement depuis le ticket.
   - Affecter un prestataire.
   - Passer le statut de planifiée à en cours puis terminée.
   - Ajouter coût final.
   - Ajouter note 1 à 5.

3. Maintenance
   - Ouvrir un ticket.
   - Vérifier que les interventions liées apparaissent sous le ticket.
   - Vérifier que `maintenanceLogs` contient les actions d'intervention.

4. Biens
   - Ouvrir la page Biens.
   - Vérifier que le bien concerné affiche l'historique technique.

5. Activity logs
   - Vérifier les logs : création prestataire, modification prestataire, création intervention, modification intervention.

6. Multi-organisation
   - Créer un prestataire dans une organisation A.
   - Vérifier qu'il n'apparaît pas dans une organisation B.
   - Faire la même vérification pour les interventions.
