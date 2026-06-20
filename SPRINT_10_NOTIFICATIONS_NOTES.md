# SOBAYA — Sprint 10 Notifications In-App

## Objectif
Ajouter un centre de notifications interne Firestore, sans Firebase Storage, sans SMS, sans email et sans API externe.

## Ajouts principaux
- Collection `notifications` dans chaque organisation.
- Page `/notifications`.
- Menu latéral Notifications avec badge des notifications non lues.
- Marquer une notification comme lue.
- Marquer toutes les notifications comme lues.
- Génération intelligente des rappels contrats et loyers :
  - loyer en retard,
  - contrat arrivant à échéance,
  - contrat expiré.
- Notifications automatiques lors de :
  - création paiement,
  - paiement partiel,
  - création ticket maintenance,
  - affectation maintenance,
  - affectation prestataire,
  - intervention terminée.
- Intégration `activityLogs` via l'action `NOTIFICATION_CREATED`.
- Règles Firestore ajoutées pour `notifications`.

## Collections Firestore
- `organizations/{orgId}/notifications`

## Permissions ajoutées
- `notifications.view`
- `notifications.manage`

## Tests recommandés
1. Déployer les règles Firestore :
   `firebase deploy --only firestore:rules`
2. Ouvrir `/notifications`.
3. Vérifier que le menu affiche Notifications.
4. Créer un paiement complet : une notification Paiement reçu doit apparaître.
5. Créer un paiement partiel : une notification Paiement partiel doit apparaître.
6. Créer un ticket maintenance : une notification Maintenance doit apparaître.
7. Affecter un ticket maintenance : une notification Affectation doit apparaître.
8. Créer une intervention avec prestataire : notification Prestataire affecté.
9. Terminer une intervention : notification Intervention terminée.
10. Cliquer sur Générer les rappels : vérifier les alertes loyer en retard / contrat échéance.
11. Tester Marquer lu et Tout marquer lu.
12. Vérifier que les notifications sont isolées par organisation.

## Validation technique sandbox
- `npm run lint` : OK
- `npm run typecheck` : OK
- `npm run build` : compilation Next.js OK, puis timeout sandbox pendant les étapes finales de build.

## Note importante
Après intégration locale, exécuter :
`firebase deploy --only firestore:rules`
