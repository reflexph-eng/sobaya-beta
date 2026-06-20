# SOBAYA — Sprint 6 Maintenance

## Périmètre livré

- Remplacement de l'écran placeholder Maintenance par un vrai dashboard opérationnel.
- Collection Firestore `maintenanceTickets` : création, modification, archivage logique, priorités, statuts, affectation, échéance, coûts et notes internes.
- Collection Firestore `maintenanceLogs` : historique d'intervention par ticket.
- Intégration `activityLogs` : création ticket, mise à jour ticket, archivage ticket, ajout historique.
- Multi-organisations : toutes les lectures/écritures restent sous `organizations/{organizationId}`.
- Responsive : liste tickets + panneau historique en desktop, empilement mobile.

## Collections Firestore

- `organizations/{organizationId}/maintenanceTickets/{ticketId}`
- `organizations/{organizationId}/maintenanceLogs/{logId}`
- `organizations/{organizationId}/activityLogs/{logId}`

## Règles Firestore

- Lecture/écriture maintenance réservée aux membres ayant `maintenance.manage` ou au `super_admin`.
- `maintenanceLogs` ajouté aux règles.

## Validation technique locale

- `npm run typecheck` : OK.
- `npm run build` : lancé, mais le sandbox ne peut pas télécharger le binaire natif `@next/swc-linux-x64-gnu` depuis npm à cause de l'accès réseau bloqué. Le projet doit builder normalement dans l'environnement local après `npm install`/dépendances natives Next présentes.
