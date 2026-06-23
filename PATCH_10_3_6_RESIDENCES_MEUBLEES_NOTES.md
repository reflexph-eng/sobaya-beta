# SOBAYA — Sprint 10.3.6 : Gestion des résidences meublées

## Décision d'arbitrage métier validée avec Lanfia avant développement

Deux questions ouvertes ont été tranchées avant de coder, pour éviter de
construire sur une hypothèse fausse :

1. **Un bien meublé peut-il aussi recevoir un contrat classique longue
   durée ?** Réponse : pas encore tranché par le métier → choix du chemin
   le plus sûr et réversible. Aucune exclusion technique n'est imposée dans
   le schéma de données ni dans les règles Firestore. À la place, chaque
   formulaire (contrat classique et réservation) **avertit** sans bloquer
   si l'autre type d'engagement existe déjà sur le même bien. Si le métier
   tranche plus tard pour une exclusion stricte, il suffira de transformer
   l'avertissement en blocage — sans migration de données.

2. **Comment se gère le paiement d'une réservation ?** Réponse : rester
   simple, un seul montant total perçu, sans distinguer acompte/solde.
   C'est ce qui a été implémenté : `totalAmount` et `amountPaid`, le statut
   de paiement (payé/partiel/non payé) étant déduit automatiquement de la
   comparaison des deux.

## Périmètre couvert

- [x] Location journalière / hebdomadaire / mensuelle (tarification)
- [x] Calendrier de disponibilité (détection de chevauchement de séjours)
- [x] Réservations (création, modification, annulation/archivage)
- [x] Occupation (visible via le statut de chaque réservation)
- [x] Tarification flexible (tarif jour/semaine/mois dégressif, frais de
      ménage, caution indicative)

## Périmètre explicitement non couvert ici

- **Vue calendrier visuelle** (type planning avec cases par jour) : ce
  sprint détecte les chevauchements de dates par calcul, mais n'affiche pas
  encore de calendrier graphique. La liste de réservations suffit pour le
  volume actuel ; une vue calendrier dédiée peut être ajoutée plus tard sans
  changer le modèle de données.
- **Paiement multi-tranches détaillé** (historique acompte/solde) : conforme
  à la décision ci-dessus, seul un total perçu est enregistré.
- **Publication marketplace des disponibilités** : c'est le Sprint 11.2
  (Résidences meublées marketplace), qui s'appuiera sur les réservations et
  tarifs posés ici.

## Détail technique

### Nouveau modèle (`types/booking.ts`)

`Booking` : bien, client (nom/téléphone/email — pas besoin d'une fiche
locataire existante), dates d'arrivée/départ, montant total, montant perçu,
statut de paiement déduit, statut de réservation (en attente / confirmée /
arrivée effectuée / départ effectué / annulée).

`FurnishedRate` (rattaché à `Property`, pas à `Booking`) : tarif journalier
obligatoire, tarifs hebdomadaire/mensuel optionnels (calculés par défaut
comme 7× et 30× le tarif journalier si non renseignés), frais de ménage,
caution indicative.

### Détection de conflit de réservation (`services/bookings.ts`)

`findConflictingBooking` vérifie, à la création et à la modification, qu'aucune
autre réservation active (en attente, confirmée, ou arrivée effectuée — les
réservations annulées ou terminées ne comptent pas) ne chevauche les dates
demandées sur le même bien. Si conflit, l'enregistrement est refusé avec un
message explicite donnant le numéro de la réservation en conflit — même
logique défensive que `createContract` qui refuse un contrat actif en
doublon sur un bien déjà occupé.

### Estimation de montant (`estimateBookingAmount`)

Calcule un montant suggéré en décomposant le séjour en blocs de 30 jours
(tarif mensuel), puis 7 jours (tarif hebdomadaire), puis jours restants
(tarif journalier), plus les frais de ménage. Le résultat ne fait que
pré-remplir le champ ; l'utilisateur reste libre de le modifier
manuellement à tout moment, y compris à zéro.

### Permissions et sécurité

Nouvelles permissions `bookings.read/create/update/delete/manage`, suivant
exactement le même pattern que `contracts.*`. Attribuées au rôle `manager`
de la même façon que les contrats (cohérent avec le fait que `manager` gère
déjà la chaîne complète biens → locataires → contrats → paiements). Règles
Firestore dédiées sur `organizations/{orgId}/bookings/{docId}`, répliquant
strictement le pattern déjà en place pour `contracts`.

### Correction d'un bug introduit au Sprint 10.3.5 (corrigé ici, au passage)

En relisant le code des coordonnées GPS pour ajouter le bloc tarification
juste en dessous, un bug a été repéré dans `normalizePropertyValues` et dans
`updateCoordinate` du formulaire bien : la valeur `undefined` y était écrite
directement vers Firestore, ce qui aurait provoqué une erreur runtime lors
de l'enregistrement d'un bien sans coordonnées GPS complètes (Firestore
rejette les valeurs `undefined` explicites par défaut). C'est corrigé :
les champs optionnels manquants sont maintenant écrits comme `null` plutôt
que `undefined`, et la saisie GPS partielle (un seul des deux axes renseigné)
n'écrase plus l'autre axe avec `0` de façon trompeuse.

## Fichiers modifiés ou créés

- `types/booking.ts` — nouveau modèle Booking et FurnishedRate (référence)
- `types/property.ts` — ajout `furnishedRate`, correction des types `null`
- `services/bookings.ts` — nouveau service complet
- `services/reference-numbers.ts` — ajout de l'entité `booking` (SBY-RES-xxxx)
- `services/properties.ts` — correction du bug `undefined` → `null` (rétroactif)
- `services/activity-logs.ts` — ajout des actions `BOOKING_*` et entité `booking`
- `constants/permissions.ts` — permissions `bookings.*`
- `firestore.rules` — règles pour la collection `bookings`
- `components/bookings/booking-form.tsx` — nouveau formulaire
- `components/bookings/bookings-manager.tsx` — nouveau gestionnaire de liste
- `components/properties/property-form.tsx` — bloc tarification meublée,
  correction du bug GPS (rétroactif)
- `components/layout/dashboard-shell.tsx` — entrée de navigation « Réservations »
- `components/layout/global-search.tsx` — intégration des réservations à la
  recherche globale, cohérent avec le correctif du patch précédent
- `app/(dashboard)/reservations/page.tsx` — nouvelle route

## Validation technique

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : `Compiled successfully`, 31 routes générées (nouvelle
  route `/reservations` incluse).
- 1 avertissement ESLint non bloquant, déjà présent depuis le sprint
  précédent (`<img>` dans la galerie photo).

## Risques résiduels à surveiller

- L'avertissement non bloquant entre contrat classique et réservation
  repose sur la discipline de l'utilisateur. Si le métier confirme plus
  tard qu'il faut un blocage strict, c'est un changement simple à faire
  dans `contract-form.tsx` et `booking-form.tsx` (transformer l'encart
  d'avertissement en blocage de soumission), sans toucher au modèle de
  données.
- Pas encore de vue calendrier visuelle : pour une agence gérant plusieurs
  résidences meublées avec beaucoup de réservations, la liste pourrait
  devenir difficile à lire. À surveiller selon l'usage réel.
