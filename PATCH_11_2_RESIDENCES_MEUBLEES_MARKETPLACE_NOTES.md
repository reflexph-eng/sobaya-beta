# SOBAYA — Sprint 11.2 : Résidences meublées sur la marketplace

## Décision validée avec Lanfia avant développement

Question posée : quand un visiteur de la marketplace veut réserver une
résidence meublée, doit-il bloquer directement les dates, ou seulement
soumettre une demande que l'organisation confirme ? Réponse : le plus sûr.

Choix retenu : **demande uniquement, statut "pending"**, jamais de blocage
direct de dates par un visiteur non authentifié. Raisons :
- aucune vérification d'identité ni de paiement à ce stade du projet — un
  visiteur malveillant pourrait sinon bloquer toutes les disponibilités
  d'une résidence par simple spam ;
- cohérent avec le pattern déjà existant du formulaire de contact
  (Sprint 11.0) : le visiteur soumet, l'organisation traite ;
- réversible vers plus d'automatisation plus tard, quand le paiement en
  ligne (Phase 5 de la roadmap) introduira un vrai engagement financier
  qui dissuade les demandes fantaisistes.

## Le vrai sujet de ce sprint : la sécurité d'accès, pas l'interface

La difficulté de ce sprint n'était pas l'UI (formulaire de dates, montant
estimé) mais l'accès à une collection **privée** par un **visiteur anonyme**.
Les réservations (`organizations/{orgId}/bookings`) sont une donnée interne
à l'organisation, protégée par des règles Firestore qui exigent un membre
authentifié avec la permission `bookings.create`. Un visiteur de la
marketplace n'a ni l'un ni l'autre.

### Ce qui a été explicitement refusé pour rester sûr

- **Lecture des réservations existantes par un visiteur** : jamais
  autorisée. `allow read` sur `bookings` reste strictement réservé aux
  membres de l'organisation — aucune exception. Conséquence assumée :
  aucune vérification de disponibilité réelle n'est faite côté visiteur
  avant l'envoi de sa demande (voir limites plus bas).
- **Réutilisation de `createBooking`** (la fonction back-office existante) :
  impossible telle quelle, car elle appelle `listBookings` en interne pour
  vérifier les conflits — donc elle exigerait `bookings.read`, qu'un
  visiteur n'a pas. Une fonction dédiée et plus restreinte
  (`submitPublicBookingRequest`) a été créée à la place, qui n'effectue
  aucune lecture, seulement une création strictement encadrée.
- **Notification automatique de l'organisation** : envisagée puis écartée
  pour ce sprint, car elle aurait nécessité une exception de sécurité
  supplémentaire sur la collection `notifications` (même contrainte
  `isOrgMember`). La demande reste visible dans le module Réservations
  existant (statut "pending", marquée `source: "marketplace"`), ce qui
  suffit fonctionnellement sans élargir davantage la surface de règles à
  auditer pour un gain marginal.

### Règle Firestore : exception strictement encadrée, pas une porte ouverte

La règle `create` sur `bookings` a été étendue avec une clause
supplémentaire, qui n'autorise la création publique QUE si toutes ces
conditions sont réunies simultanément :
- `organizationId` correspond exactement à l'organisation ciblée ;
- `status == 'pending'` — impossible pour un visiteur de créer une
  réservation déjà confirmée ;
- `source == 'marketplace'` — marqueur explicite qui distingue ces demandes
  des réservations back-office, utile pour l'audit futur ;
- présence des champs minimaux attendus (`guestName`, `guestPhone`,
  `propertyId`).

Aucune де ces conditions n'élargit le droit de **lecture**, de
**modification** ou de **suppression** : un visiteur peut uniquement créer
une entrée pending et rien d'autre, jamais en lire ni en modifier.

## Périmètre couvert

- [x] Formulaire de demande de séjour sur la fiche détail d'une résidence
      meublée (`/marketplace/[listingId]`), avec dates, estimation du
      montant (réutilise `estimateBookingAmount` du Sprint 10.3.6), nom,
      téléphone, email, notes
- [x] La demande crée un `Booking` réel dans le système de l'organisation,
      visible immédiatement dans son module Réservations existant
      (`/reservations`), statut "En attente"
- [x] Filtre "Meublé uniquement" déjà présent depuis le Sprint 11.0,
      conservé comme mécanisme de recherche par type de séjour

## Limite assumée, à connaître

**Pas de vérification de disponibilité réelle avant l'envoi d'une
demande.** Le formulaire ne consulte jamais les réservations existantes
(impossible sans donner un accès en lecture publique aux réservations
internes, ce qui aurait été un risque de sécurité bien plus grave que
l'inconvénient inverse). Un visiteur peut donc demander des dates déjà
prises par une autre réservation confirmée — c'est à l'organisation de le
constater en traitant la demande dans `/reservations`, où
`findConflictingBooking` (Sprint 10.3.6) reste disponible pour l'aider à le
repérer avant de confirmer.

C'est un compromis : la roadmap demande "Disponibilités" mais la rendre
fiable publiquement nécessiterait soit une projection publique partielle
des dates occupées (nouveau risque de fuite d'information commerciale :
fréquence d'occupation d'un bien), soit un système de blocage temporaire
("hold") plus complexe — les deux dépassent le périmètre raisonnable de ce
sprint et sont identifiés comme évolution possible plutôt que traités à la
hâte.

## Fichiers modifiés ou créés

- `types/booking.ts` — ajout de `BookingSource` et du champ `source`
- `services/bookings.ts` — `submitPublicBookingRequest`, correction d'un
  import manquant (`RatePeriod`) détecté au build
- `components/marketplace/booking-request-form.tsx` — nouveau formulaire
- `components/marketplace/listing-detail.tsx` — affichage conditionnel
  (formulaire de réservation pour le meublé, formulaire de contact générique
  sinon)
- `firestore.rules` — exception de création strictement encadrée sur
  `bookings`

## Validation technique

- `npx tsc --noEmit` : 0 erreur (n'a pas détecté l'import manquant —
  confirmé une nouvelle fois que `npm run build` reste la vérification de
  référence, déjà observé sur un sprint précédent).
- `npm run build` : `Compiled successfully` après correction, 38 routes
  générées. `/marketplace/[listingId]` passe de 5.84 à 8.05 kB.
- Avertissements ESLint inchangés (`<img>`), aucun nouveau.

## Déploiement Firebase requis pour ce sprint

**Oui** : `firebase deploy --only firestore:rules`, pour la nouvelle clause
de création publique sur `bookings`. Sans ce déploiement, le formulaire de
demande de séjour échouera avec une erreur de permission à la soumission.

Aucun nouvel index Firestore nécessaire : `submitPublicBookingRequest`
n'effectue qu'une création, aucune requête avec tri/filtre combiné.

## Risques résiduels

- Comme `listingContactRequests` (Sprint 11.0), aucune limitation de débit
  n'encadre la création de demandes de réservation publiques — un visiteur
  malveillant pourrait créer un grand nombre de demandes "pending" sans
  conséquence directe (elles ne bloquent rien), mais cela polluerait le
  module Réservations de l'organisation. À surveiller si des abus sont
  constatés.
- Le numéro de réservation des demandes marketplace
  (`SBY-RES-WEB-xxxxx`) n'est pas séquentiel comme les réservations
  créées en back-office (`SBY-RES-0001`...). C'est volontaire (générer un
  numéro séquentiel nécessiterait une lecture bloquée pour un visiteur),
  mais cela crée une légère incohérence visuelle dans la liste des
  réservations d'une organisation, qui mélangera les deux formats.
