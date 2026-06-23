# SOBAYA — Sprint 10.3.7 : Maintenance & interventions

## Constat de départ — sprint très court par rapport aux précédents

Avant de coder quoi que ce soit, ce sprint a commencé par un audit de
l'existant (Sprints 6 et 7, déjà livrés dans le projet). Résultat : la quasi-
totalité du périmètre demandé par la roadmap était déjà construite et
fonctionnelle :

| Élément demandé par la roadmap | État avant ce sprint |
|---|---|
| Déclaration incident | ✅ Déjà fait (Sprint 6 — module `maintenanceTickets`) |
| Priorité | ✅ Déjà fait (faible/normale/haute/urgente) |
| Affectation prestataire | ✅ Déjà fait (Sprint 7 — module `serviceProviders` + `maintenanceInterventions`) |
| Historique interventions | ✅ Déjà fait (`maintenanceLogs`, historique technique visible sur la fiche du bien) |
| Statut des demandes | ✅ Déjà fait (ouvert → affecté → en cours → en attente → résolu → clôturé / annulé) |
| **Photos incident** | ❌ Seul élément manquant |

Ce sprint ne couvre donc que l'écart réel identifié : les photos d'incident.
Refaire ou retoucher le reste aurait été un travail inutile et un risque de
régression sur des modules déjà solides et déjà utilisés.

## Détail technique

### Nouveau type partagé (`types/gallery.ts`)

Plutôt que de dupliquer la structure `PropertyPhoto` (Sprint 10.3.5) ou de la
réutiliser telle quelle (ce qui aurait introduit un couplage artificiel entre
biens et maintenance, et un risque de casser la galerie des biens en la
modifiant), un type générique `GalleryPhoto` a été créé. Il ne porte pas la
notion de « photo principale », qui n'a pas de sens pour un incident.
`PropertyPhoto` reste inchangé.

### Modèle de données (`types/maintenance.ts`)

Ajout de `photos?: GalleryPhoto[]` sur `MaintenanceTicket`, optionnel pour
rester rétrocompatible avec tous les tickets déjà créés via les Sprints 6/7.

### Stockage (`services/maintenance.ts`)

`addMaintenanceTicketPhoto` et `removeMaintenanceTicketPhoto`, sur le même
principe défensif que la galerie des biens (validation type JPEG/PNG/WebP,
taille max 5 Mo) mais avec deux différences volontaires :

- **Pas de notion de photo principale** (un incident n'a pas de photo
  "vitrine", contrairement à un bien).
- **Plafond à 10 photos** plutôt que 6 : un incident peut nécessiter
  plusieurs angles ou un avant/après, contrairement à la présentation
  commerciale d'un bien qui n'a pas besoin d'autant de prises de vue.

Chemin de stockage : `organizations/{orgId}/maintenanceTickets/{ticketId}/{uuid}.{ext}`,
couvert par les règles Storage génériques déjà en place (`organizations/{orgId}/**`),
aucune modification de `storage.rules` nécessaire.

### Formulaire (`components/maintenance/maintenance-ticket-form.tsx`)

Nouveau composant `MaintenanceTicketPhotos` intégré après les notes internes.
Même limite assumée que pour les biens : disponible uniquement en édition
d'un ticket déjà créé (il faut un `ticketId` pour construire le chemin
Storage), avec un message explicite à la création.

## Fichiers modifiés ou créés

- `types/gallery.ts` — nouveau type générique `GalleryPhoto`
- `types/maintenance.ts` — ajout du champ `photos` sur `MaintenanceTicket`
- `services/maintenance.ts` — upload/suppression de photos, initialisation
  `photos: []` à la création d'un ticket
- `components/maintenance/maintenance-ticket-photos.tsx` — nouveau composant
- `components/maintenance/maintenance-ticket-form.tsx` — intégration de la
  galerie, passage de `organizationId`/`actor`
- `components/maintenance/maintenance-manager.tsx` — passage de
  `organizationId`/`actor` au formulaire

## Validation technique

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : `Compiled successfully`, 31 routes générées,
  `/maintenance` passe de 5.53 kB à 6.57 kB (cohérent avec l'ajout de la
  galerie).
- 2 avertissements ESLint non bloquants (`<img>` plutôt que `next/image`),
  un déjà présent depuis le Sprint 10.3.5, un nouveau ici — même rationnel
  qu'à l'époque (images dynamiques uploadées par l'utilisateur).

## Risques résiduels

Aucun nouveau risque structurant identifié. Ce sprint étant un ajout ciblé
sur un module déjà mature et déjà testé, il n'introduit pas de nouvelle
collection Firestore ni de nouvelle logique métier à surveiller.
