# SOBAYA — Sprint 11.1 : Publication marketplace différenciée

## Bonne surprise de départ

La distinction Particulier / Agent immobilier / Agence existait déjà dans
le modèle d'organisation depuis l'origine du projet (`OrganizationType`,
choisi à l'inscription dans `register-form.tsx`). Ce sprint ne créait donc
rien de nouveau côté donnée source — il s'agissait uniquement de propager
cette information, déjà connue, jusqu'à la marketplace publique (Sprint
11.0), qui l'ignorait complètement jusqu'ici.

## Périmètre couvert

- [x] Capture du type de vendeur (`sellerType`) au moment de la publication
      d'une annonce, repris automatiquement du type de l'organisation
- [x] Badge visuel sur chaque carte d'annonce (`/marketplace`) et sur la
      fiche détail (`/marketplace/[listingId]`) : « Particulier », « Agent
      immobilier », « Agence immobilière »
- [x] Filtre de recherche par type d'annonceur sur la page marketplace

## Compatibilité avec les annonces déjà publiées (Sprint 11.0)

Le champ `sellerType` est optionnel sur `PublicListing`, pas obligatoire :
les annonces publiées avant ce sprint n'ont pas cette donnée et ne
planteront pas. Le badge ne s'affiche simplement pas pour elles (repli
neutre), plutôt que d'afficher une valeur fausse ou de bloquer l'affichage.
Cohérent avec la façon dont chaque champ optionnel ajouté rétroactivement a
été géré depuis le Sprint 10.3.5 (GPS, tarif meublé...). Republier ces
annonces (les retirer puis les republier) leur ajoutera automatiquement le
type de vendeur.

## Découverte importante en cours de sprint : épinglage de la dépendance Firebase

En relançant `npm install` pour ce sprint, le build a échoué avec une
erreur webpack sans rapport avec le code de ce sprint
(`Module parse failed` dans une dépendance interne d'`undici`, utilisée par
le SDK Firebase). Cause identifiée : `package.json` déclarait
`"firebase": "^10.12.2"` — le symbole `^` autorise npm à installer
n'importe quelle version `10.x` plus récente. Entre les sprints précédents
et celui-ci, npm a publié `firebase@10.14.1`, qui embarque une version plus
récente d'`undici` utilisant une syntaxe JavaScript (champs privés de
classe) que le compilateur SWC de Next.js 14.2.4 ne sait pas analyser.

**Ce n'est pas un bug introduit par ce sprint** : c'est un risque latent
présent dans le projet depuis le début, qui s'est simplement déclenché
maintenant parce que le temps a passé et qu'une nouvelle version de
`firebase` est sortie entre-temps. Corrigé en épinglant la version exacte
(`"firebase": "10.12.2"`, sans `^`) dans `package.json`, pour que ce
problème ne puisse plus resurgir au hasard d'un futur `npm install` — ni
chez Lanfia, ni chez un futur collaborateur qui cloncrait le projet.

## Détail technique

### Modèle (`types/listing.ts`)

`sellerType?: OrganizationType` ajouté à `PublicListing`. Constante
`SELLER_TYPE_LABELS` exportée pour centraliser les libellés affichés,
réutilisant exactement les mêmes intitulés que `register-form.tsx`
("Propriétaire Particulier" simplifié en "Particulier" pour l'affichage
public, plus court et adapté à un badge).

### Service (`services/listings.ts`)

`publishListing` accepte désormais un paramètre `sellerType` explicite,
fourni par l'appelant (le composant de publication) plutôt que déduit
automatiquement à l'intérieur du service — plus simple à tracer et à
tester, et cohérent avec le fait que `publishListing` ne reçoit déjà pas
l'organisation complète, seulement les champs dont il a besoin.

`listPublicListings` filtre par `sellerType` sur la page déjà récupérée,
suivant le même principe que les autres critères secondaires (type de
bien, meublé) — voir la note déjà présente dans le code sur les limites de
cette approche de filtrage post-pagination.

## Fichiers modifiés

- `types/listing.ts` — ajout de `sellerType` et `SELLER_TYPE_LABELS`
- `services/listings.ts` — propagation et filtrage du type de vendeur
- `components/properties/property-listing-toggle.tsx` — passage du type
  d'organisation à la publication
- `components/properties/properties-manager.tsx` — passage de
  `organization.type` au composant de publication
- `components/marketplace/marketplace-browser.tsx` — badge sur chaque carte,
  filtre de recherche par type de vendeur
- `components/marketplace/listing-detail.tsx` — badge sur la fiche détail
- `package.json` — épinglage de la version exacte de `firebase`

## Validation technique

- `npx tsc --noEmit` : 0 erreur.
- `npm install` (réinstallation propre, `node_modules` et `package-lock.json`
  supprimés au préalable) : `firebase@10.12.2` confirmé installé.
- `npm run build` : `Compiled successfully`, 38 routes générées — même
  nombre qu'au Sprint 11.0, ce sprint n'ajoute aucune nouvelle route, juste
  un enrichissement des pages existantes.
- Avertissements ESLint inchangés (`<img>`), aucun nouveau.

## Déploiement Firebase requis pour ce sprint

**Aucun.** Ce sprint enrichit une collection déjà créée au Sprint 11.0
(`publicListings`) avec un champ supplémentaire — aucune nouvelle règle de
sécurité ni nouvel index n'est nécessaire, le champ `sellerType` n'est filtré
que sur la page déjà récupérée, pas via une requête Firestore dédiée.

## Risques résiduels

- Si demain `sellerType` devait être filtré directement côté Firestore
  (`where("sellerType", "==", ...)`) pour de meilleures performances à plus
  grande échelle, cela nécessiterait un nouvel index composite (comme pour
  `city`) — à anticiper si ce filtre devient un critère de recherche
  fréquent et que le post-filtrage commence à montrer ses limites.
- L'épinglage de `firebase` à une version fixe signifie que les correctifs
  de sécurité ou de bugs publiés par Firebase dans des versions plus
  récentes ne seront plus appliqués automatiquement. À réévaluer
  périodiquement (ex. une fois par trimestre) en testant une montée de
  version contrôlée plutôt qu'en laissant npm le faire sans prévenir.
