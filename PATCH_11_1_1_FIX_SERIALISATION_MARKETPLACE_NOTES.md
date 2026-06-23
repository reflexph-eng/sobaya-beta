# SOBAYA — Correctif : sérialisation Firestore Server → Client Component

## Bug signalé par Lanfia en test réel

En testant `/marketplace` (Sprint 11.0/11.1), l'erreur runtime suivante
apparaissait dans le terminal au lieu d'afficher la liste des annonces :

```
Error: Only plain objects, and a few built-ins, can be passed to Client
Components from Server Components. Classes or null prototypes are not
supported.
```

## Cause

`app/(public)/marketplace/page.tsx` et `app/(public)/marketplace/[listingId]/page.tsx`
sont des **Server Components** (fonctions `async` qui lisent directement
Firestore côté serveur). Elles passent leurs résultats en props à des
**Client Components** (`MarketplaceBrowser`, `ListingDetail`, tous deux
`"use client"`).

Next.js App Router interdit explicitement de passer des instances de classe
d'un Server Component à un Client Component — seuls des objets, tableaux et
valeurs primitives "plain" sont autorisés, car la frontière serveur/client
sérialise les props en arrière-plan. Or les documents Firestore renvoient
leurs champs de date (`publishedAt`, `updatedAt`, `uploadedAt` sur chaque
photo) comme des instances de la classe `Timestamp`, pas comme des chaînes
ou des objets simples.

**Pourquoi ce bug n'était jamais apparu avant ce sprint** : c'est la
première fois dans le projet qu'une page Server Component transmet des
données Firestore brutes à un composant client. Toutes les pages du
dashboard sont elles-mêmes des Client Components qui lisent Firestore
directement depuis le navigateur (`useEffect` + service), donc cette
frontière de sérialisation n'avait jamais été franchie jusqu'ici.

Un second problème de même nature a été identifié en marge du premier : le
curseur de pagination (`ListingPage.cursor`) était un objet
`QueryDocumentSnapshot` complet — une classe Firestore complexe, encore
moins sérialisable qu'un simple `Timestamp`, et qui de toute façon n'avait
aucune raison de transiter par le rendu serveur initial.

## Correctif

### Utilitaire générique (`lib/serialize-firestore.ts`)

Nouvelle fonction `serializeFirestoreData`, qui parcourt récursivement
n'importe quelle structure de données et convertit chaque `Timestamp`
Firestore rencontré (détecté par la présence d'une méthode `toDate()`) en
chaîne ISO 8601. Appliquée dans les deux pages Server Component avant
transmission aux composants client :

```ts
const initialPage = serializeFirestoreData(await listPublicListings());
```

Cette fonction est générique et réutilisable pour toute future page
Server Component du projet qui lirait directement Firestore — pas un
correctif ponctuel limité à la marketplace.

### Curseur de pagination repensé (`services/listings.ts`)

`ListingPage.cursor` n'est plus un `QueryDocumentSnapshot` mais une simple
chaîne (date ISO du `publishedAt` du dernier élément de la page). Firestore
accepte nativement une valeur de champ brute en argument de `startAfter()`
(pas seulement un snapshot complet), donc la pagination fonctionne à
l'identique côté Firestore, tout en restant sérialisable de bout en bout.

## Validation

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : `Compiled successfully`, 38 routes générées.
- **Test runtime dédié** : simulation d'un faux objet `Timestamp` Firestore
  (classe avec méthode `toDate()`), passé dans `serializeFirestoreData`, puis
  vérifié avec `JSON.stringify` (le test exact que Next.js applique en
  interne pour valider qu'une donnée est transmissible d'un Server à un
  Client Component) et une vérification récursive qu'aucune instance de
  classe ne subsiste dans le résultat. Les deux vérifications passent,
  y compris sur des structures imbriquées (galerie de photos avec
  timestamps individuels).

## Fichiers modifiés ou créés

- `lib/serialize-firestore.ts` — nouvel utilitaire (créé)
- `app/(public)/marketplace/page.tsx` — application de la sérialisation (modifié)
- `app/(public)/marketplace/[listingId]/page.tsx` — application de la sérialisation (modifié)
- `services/listings.ts` — curseur de pagination repensé en chaîne sérialisable (modifié)

## Pourquoi ce bug n'a pas été détecté avant livraison

`npx tsc --noEmit` et `npm run build` ne détectent pas ce type d'erreur :
c'est une vérification que Next.js effectue à l'exécution (runtime), pas à
la compilation. Le typage TypeScript de `QueryDocumentSnapshot` et de
`Timestamp` est parfaitement valide du point de vue du compilateur — le
problème n'existe qu'au moment où Next.js sérialise réellement les props
pour les transmettre au client. C'est un angle mort connu de la validation
automatisée utilisée jusqu'ici dans ce projet ; seul un test fonctionnel en
conditions réelles (comme celui effectué par Lanfia) pouvait le révéler.
