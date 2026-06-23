# SOBAYA — Sprint 10.3.5 : Biens enrichis

## Périmètre couvert

D'après la roadmap officielle (Phase 1 — Socle immobilier professionnel) :

- [x] Galerie 6 photos avec photo principale
- [x] Type de bien *(existait déjà avant ce sprint)*
- [x] Mode d'exploitation (longue durée / meublé courte-moyenne durée)
- [x] Résidence meublée (booléen + mode d'exploitation)
- [x] Coordonnées GPS + lien carte (Google Maps)
- [x] Équipements (liste à cocher)
- [x] Surface
- [x] Nombre de pièces *(existait déjà avant ce sprint)*
- [x] Statut du bien *(existait déjà avant ce sprint)*

## Périmètre explicitement renvoyé à des sprints ultérieurs

Pour ne pas anticiper des décisions qui appartiennent à d'autres sprints de la
roadmap et risquer de devoir défaire du travail :

- **Calendrier de disponibilité, réservations, tarification flexible** :
  c'est le Sprint 10.3.6 (Gestion des résidences meublées). Ce sprint pose
  seulement les champs de base (`exploitationMode`, `isFurnished`) sur
  lesquels le 10.3.6 pourra s'appuyer.
- **Carte interactive avec recherche par zone** : c'est le Sprint 11.3
  (Marketplace publique). Ce sprint expose seulement une saisie GPS manuelle
  (latitude/longitude) et un lien de consultation vers Google Maps, sans
  intégrer de SDK cartographique (qui implique souvent une clé API et un
  coût récurrent — décision à valider explicitement avant de l'engager).
- **Documents techniques, plans, ACD** : c'est le Sprint 10.3.8 (Coffre-fort
  documentaire). Volontairement non traité ici pour ne pas dupliquer la
  future logique de stockage de documents avec celle des photos.

## Détail technique

### Modèle de données (`types/property.ts`)

Nouveaux champs sur `Property`, tous optionnels pour rester rétrocompatibles
avec les biens déjà créés avant ce sprint :

- `exploitationMode: "long_term" | "furnished_short_term"`
- `isFurnished: boolean`
- `surfaceArea: number`
- `amenities: string[]` (liste fermée définie dans `PROPERTY_AMENITIES`)
- `coordinates?: { lat: number; lng: number }`
- `photoGallery?: PropertyPhoto[]` — chaque photo a un `id`, une `url` Storage,
  un `storagePath` (pour permettre la suppression), et `isPrimary`.

Le champ `photos: string[]` existant est conservé en parallèle de
`photoGallery` (liste des URLs uniquement) pour ne rien casser côté
affichage existant qui pourrait déjà lire `photos`.

### Stockage des photos (`services/properties.ts`)

Firebase Storage était déjà configuré dans le projet (client + règles de
sécurité génériques `organizations/{orgId}/**`) mais jamais utilisé. Ce
sprint l'active réellement :

- `addPropertyPhoto` : upload vers `organizations/{orgId}/properties/{propertyId}/{uuid}.{ext}`,
  validation du type (JPEG/PNG/WebP), validation de la taille (5 Mo max),
  blocage strict à 6 photos par bien, première photo automatiquement
  définie comme principale.
- `removePropertyPhoto` : suppression du fichier Storage et de l'entrée
  Firestore ; si la photo supprimée était la principale, la suivante de la
  liste reprend ce statut automatiquement.
- `setPropertyPrimaryPhoto` : changement manuel de la photo principale.

Toutes ces actions sont journalisées dans `activity-logs` comme le reste des
modifications de bien.

### Pagination Firestore — décision importante

L'audit précédent avait identifié l'absence de pagination comme un risque
structurant. Ce sprint introduit la capacité technique de paginer
(`listProperties(organizationId, { paginate: true, pageSize, cursor })`),
**mais le comportement par défaut reste strictement inchangé** : sans
options, `listProperties` continue de charger toute la collection, exactement
comme avant.

C'est un choix délibéré, pas un oubli : plusieurs écrans (dashboard,
recherche globale, statistiques propriétaires, rapports) dépendent du jeu
de données complet pour calculer des totaux exacts. Activer une pagination
par défaut aurait silencieusement faussé ces chiffres sans que personne ne
s'en aperçoive — un bug bien pire que l'absence de pagination elle-même.

La bascule de la page `/biens` elle-même vers une pagination réelle (avec
UI de type "page suivante") est un sprint à part entière, à traiter
consciemment quand le volume de biens par organisation le justifiera.

### Formulaire (`components/properties/property-form.tsx`)

Nouveaux champs ajoutés à la grille existante (surface, mode d'exploitation,
case "bien meublé", latitude/longitude avec lien Google Maps si renseigné),
section équipements à cocher sous forme de chips, et galerie photo intégrée
en bas du formulaire.

Limite assumée : la galerie photo n'est disponible qu'en édition d'un bien
déjà créé (il faut un `propertyId` pour construire le chemin Storage). À la
création, un message explique qu'il faut d'abord enregistrer la fiche avant
d'ajouter des photos. C'est un compromis simple ; le supprimer impliquerait
un upload vers un dossier temporaire puis un déplacement après création,
ce qui ajoute de la complexité pour un gain d'usage marginal (la majorité
des créations de fiches se font progressivement de toute façon).

## Fichiers modifiés ou créés

- `types/property.ts` — nouveaux champs et constantes (modifié)
- `services/properties.ts` — upload/suppression photos, pagination opt-in (modifié)
- `components/properties/property-photo-gallery.tsx` — nouveau composant
- `components/properties/property-form.tsx` — nouveaux champs + galerie (modifié)
- `components/properties/properties-manager.tsx` — passage organizationId/actor (modifié)

## Validation technique

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : `Compiled successfully`, 30 routes générées.
- 1 avertissement ESLint non bloquant (`<img>` plutôt que `next/image` dans
  la galerie) — accepté car il s'agit d'images dynamiques uploadées par
  l'utilisateur, peu pertinentes pour l'optimisation statique de Next.js.

## Risques résiduels à surveiller

- Pas de redimensionnement/compression des photos côté client avant upload :
  une photo de 5 Mo prise par un smartphone récent sera uploadée telle
  quelle. Sur connexion mobile ivoirienne, ça peut être lent. À envisager
  pour un futur sprint (compression côté navigateur avant upload).
- Les règles Storage actuelles (`organizations/{orgId}/**` en lecture/écriture
  pour tout membre actif) ne distinguent pas qui peut supprimer une photo
  par rapport à qui peut juste lire — cohérent avec le niveau de granularité
  déjà choisi pour Storage dans le reste du projet, mais à revoir si un jour
  un rôle "lecture seule" doit être introduit pour les photos spécifiquement.
