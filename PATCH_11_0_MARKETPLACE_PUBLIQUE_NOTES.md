# SOBAYA — Sprint 11.0 : Marketplace publique

## Rappel du contexte — pourquoi ce sprint est différent des précédents

C'est le premier sprint où du contenu SOBAYA devient visible par des
**visiteurs non authentifiés**, potentiellement en volume important. Le
rapport d'audit initial avait identifié ce moment précis comme le bon point
de bascule pour traiter sérieusement la pagination, plutôt que d'attendre
qu'un problème de performance apparaisse une fois la marketplace ouverte au
public. C'est fait dans ce sprint : `listPublicListings` utilise une
pagination réelle (`limit` + `startAfter`) dès sa première version, pas en
correctif après coup.

## Décision de sécurité structurante : projection contrôlée, pas copie brute

Le type `PublicListing` (`types/listing.ts`) n'est volontairement **pas**
une copie du type `Property`. Plusieurs champs du bien d'origine sont
strictement exclus de la collection publique :

- `ownerMandateId`, `ownerName` — identité du propriétaire mandant
- `managementFeeType`, `managementFeeValue` — commission de l'agence
- `mandateStartDate`, `mandateEndDate` — dates de mandat

Ce sont des données internes à l'organisation qui n'ont rien à faire dans
une donnée publique. En les excluant du type lui-même (et non en filtrant
au moment de l'affichage), même une erreur de code future ailleurs dans
l'application ne pourrait pas les faire fuiter sur la marketplace : ces
champs n'existent tout simplement pas dans `PublicListing`.

## Décision validée avec Lanfia avant développement : contact double

Question posée : formulaire de contact seul, téléphone visible seul, ou les
deux ? Réponse : les deux, ce qui correspond aux usages réels du marché
immobilier ivoirien (beaucoup de visiteurs préfèrent appeler ou WhatsApp
directement) tout en captant les demandes pour les visiteurs qui préfèrent
laisser leurs coordonnées sans engager d'appel immédiat.

Garde-fou ajouté de façon autonome (risque faible) : le téléphone affiché
est toujours celui de l'**organisation**, jamais un numéro personnel de
membre — cohérent avec le modèle multi-utilisateurs déjà en place dans
SOBAYA, et plus pérenne (le numéro reste valide même si la personne qui a
publié l'annonce quitte l'organisation).

## Périmètre couvert

- [x] Recherche de biens (ville, type, meublé) avec pagination réelle
- [x] Consultation des annonces (page liste `/marketplace`)
- [x] Fiches détaillées (`/marketplace/[listingId]`) avec galerie photo,
      équipements, localisation GPS si renseignée
- [x] Contact annonceur : téléphone et WhatsApp cliquables + formulaire de
      contact
- [x] Publication depuis le back-office : toggle sur chaque bien dans
      `/biens`, avec saisie du contact public au moment de la publication
- [x] Vue back-office des demandes de contact reçues (`/marketplace-leads`)

## Détail technique

### Pagination réelle (`services/listings.ts`)

`listPublicListings` charge des pages de 20 annonces. Le filtre par ville
est appliqué côté Firestore (`where("city", "==", ...)`) ; les autres
filtres (type de bien, nombre de pièces, loyer max, meublé) sont appliqués
sur la page déjà récupérée, pas sur l'ensemble de la collection. C'est un
compromis assumé et documenté dans le code : une vraie recherche
multi-critères à grande échelle nécessiterait un moteur de recherche dédié
(Algolia, Typesense, ou des index Firestore composites), déjà identifié
comme un chantier futur dans le rapport d'audit (section 7.3). Pour le
volume de lancement de la marketplace, ce compromis reste raisonnable.

La page liste (`MarketplaceBrowser`) charge la première page côté serveur
(rendu initial rapide), puis gère "Voir plus d'annonces" côté client avec
le curseur Firestore (`startAfter`) — pas de réoffset coûteux, chaque page
suivante repart exactement où la précédente s'est arrêtée.

### Sécurité Firestore (`firestore.rules`)

Sur le modèle déjà existant de `publicReceipts` (Sprint 5.1) : collection
racine `publicListings`, lecture totalement publique (`allow read: if
true`), mais création et modification strictement réservées aux membres de
l'organisation propriétaire du bien (vérification `properties.update`).

`listingContactRequests` autorise la création par n'importe qui, y compris
un visiteur non authentifié — indispensable pour qu'un visiteur anonyme
puisse envoyer une demande de contact. La lecture est en revanche réservée
à l'organisation concernée (`properties.read`) ou au super admin.

### Publication depuis le back-office (`components/properties/property-listing-toggle.tsx`)

Un bouton "Publier sur la marketplace" sur chaque carte de bien dans
`/biens`, qui demande un numéro de contact avant publication. La référence
à l'annonce (`publicListingId`) est stockée sur le bien lui-même via une
fonction de mise à jour ciblée (`setPropertyListingId`), plutôt que de
repasser par toute la logique de normalisation du formulaire bien — plus
sûr et plus simple à isoler.

### Erreur corrigée en cours de développement

Une première version du composant de publication contenait du code mort
(`await fetch;` sans usage réel) issu d'une tentative de réutiliser
`updateProperty` pour un besoin qui ne s'y prêtait pas. Repéré et corrigé
avant tout test, en introduisant `setPropertyListingId` comme fonction
dédiée et ciblée plutôt que de détourner une fonction existante pour un
usage différent de son rôle d'origine.

## Fichiers créés

- `types/listing.ts` — `PublicListing`, `ListingContactRequest`, `ListingSearchFilters`
- `services/listings.ts` — publication, recherche paginée, contact
- `components/properties/property-listing-toggle.tsx` — toggle publication sur `/biens`
- `components/marketplace/marketplace-browser.tsx` — liste + recherche + pagination
- `components/marketplace/listing-detail.tsx` — fiche détail + formulaire de contact
- `components/marketplace/marketplace-leads-manager.tsx` — vue back-office des demandes
- `app/(public)/marketplace/page.tsx` — page liste publique
- `app/(public)/marketplace/[listingId]/page.tsx` — page détail publique
- `app/(dashboard)/marketplace-leads/page.tsx` — route back-office

## Fichiers modifiés

- `types/property.ts` — ajout de `publicListingId`
- `services/properties.ts` — ajout de `setPropertyListingId`
- `services/activity-logs.ts` — actions `LISTING_PUBLISHED`/`LISTING_UNPUBLISHED`
- `components/properties/properties-manager.tsx` — intégration du toggle de publication
- `components/layout/dashboard-shell.tsx` — entrée de navigation « Demandes marketplace »
- `app/(public)/page.tsx` — lien vers la marketplace
- `firestore.rules` — règles pour `publicListings` et `listingContactRequests`

## Validation technique

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : `Compiled successfully`, 38 routes générées. Les pages
  marketplace (`/marketplace`, `/marketplace/[listingId]`) sont marquées
  dynamiques (ƒ) — c'est voulu, elles lisent Firestore à chaque requête
  pour refléter les annonces publiées/retirées en temps réel.
- 4 avertissements ESLint non bloquants (`<img>` plutôt que `next/image`),
  cohérents avec le choix déjà fait aux sprints précédents.

## Déploiement Firebase requis pour ce sprint

**Oui** : `firebase deploy --only firestore:rules`, pour les nouvelles
collections `publicListings` et `listingContactRequests`. Sans ce
déploiement, la publication d'un bien échouera avec une erreur de
permission, et la marketplace publique restera vide.

**Également requis : `firebase deploy --only firestore:indexes`.**
Firestore exige un index composite dès qu'une requête combine un filtre
d'égalité (`where`) avec un tri (`orderBy`) sur un champ différent — c'est
le cas de `listPublicListings` (`isActive` + `publishedAt`, et `isActive` +
`city` + `publishedAt` avec le filtre de ville) et de
`listContactRequestsForOrganization` (`organizationId` + `createdAt`).

Le fichier `firestore.indexes.json` définit ces trois index et est
référencé dans `firebase.json`, donc une seule commande les déploie tous :
```
firebase deploy --only firestore:indexes
```
Sans ce déploiement, la page `/marketplace` et la page `/marketplace-leads`
affichent une erreur runtime au chargement (`The query requires an index`),
avec un lien Firebase Console permettant de créer l'index manuellement en
attendant. La construction d'un index prend de 1 à quelques minutes après
déploiement ou création manuelle.

Aucune règle Storage nouvelle n'est nécessaire — les photos publiées sont
les mêmes que celles déjà uploadées sur le bien (Sprint 10.3.5), via les
règles Storage génériques déjà en place.

## Risques résiduels et points d'attention

- **Recherche limitée**, comme expliqué plus haut : convient au lancement,
  mais à remplacer par un moteur de recherche dédié si le volume d'annonces
  par ville devient important et que le filtrage post-pagination commence à
  renvoyer des pages visiblement incomplètes à l'utilisateur.
- **Pas de modération automatique** des demandes de contact : un visiteur
  malveillant pourrait spammer le formulaire. Les règles Firestore
  acceptent toute création qui respecte le schéma minimal (organizationId,
  listingId, nom, téléphone) — une limitation de débit (rate limiting)
  n'est pas en place et devra être ajoutée si des abus sont constatés.
- **Annonce figée à la publication** : si le bien est modifié après
  publication (nouveau loyer, nouvelles photos), l'annonce publique
  n'est **pas** automatiquement resynchronisée — il faudrait republier pour
  refléter les changements. C'est un choix de simplicité pour ce sprint,
  pas un oubli : une synchronisation automatique demanderait un déclencheur
  côté service à chaque modification de bien, qui peut être ajouté plus
  tard si l'usage le justifie.
