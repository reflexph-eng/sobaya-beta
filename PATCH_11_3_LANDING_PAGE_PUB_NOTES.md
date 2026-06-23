# SOBAYA — Sprint 11.3 : Landing page marketplace + espaces publicitaires

## Décision stratégique

La marketplace devient la page d'accueil (`/`). L'ancienne présentation
SOBAYA (pitch SaaS + "Créer mon espace") est conservée sur `/a-propos` —
accessible depuis le lien "Gérer mes biens" dans le header.

Raisonnement : un propriétaire/agence qui visite le site voit directement
que la marketplace est vivante avec de vrais biens — argument de vente plus
convaincant qu'un pitch textuel abstrait. Le bouton "Démarrer" reste dans
le header sur toutes les pages publiques.

## Espaces publicitaires

4 emplacements, gérés manuellement par le super admin depuis `/admin/pub` :

| Emplacement | Dimensions recommandées | Position |
|---|---|---|
| Bannière haute | 1200 × 120 px | Au-dessus des annonces, pleine largeur |
| Colonne gauche 1 | 300 × 250 px | Sidebar gauche, en haut |
| Colonne gauche 2 | 300 × 250 px | Sidebar gauche, en bas |
| Colonne droite | 300 × 600 px | Sidebar droite |

Les sidebars sont masquées sur mobile/tablette (visibles uniquement sur
grand écran `lg:` — ≥1024px) pour ne pas dégrader l'expérience mobile.

Quand un emplacement est vide, un placeholder sobre "Espace publicitaire
disponible" s'affiche avec les dimensions, pour montrer aux annonceurs
potentiels où leurs pubs apparaîtront.

## Modèle de données : `adSpots` (collection racine Firestore)

Un document par emplacement, avec l'ID = le nom du slot (`banner_top`,
`sidebar_left_1`, etc.) — facile à lire et mettre à jour sans requête.
Champs : `imageUrl`, `targetUrl`, `altText`, `isActive`, `updatedAt`,
`updatedBy`. Si `isActive: false` ou image manquante, le placeholder
s'affiche à la place.

## Déploiement Firebase requis

`firebase deploy --only firestore:rules` — nouvelle collection `adSpots`
avec lecture publique totale et écriture réservée au super admin.

## Fichiers créés ou modifiés

- `types/ad-spot.ts` — types et constantes
- `services/ad-spots.ts` — lecture/écriture Firestore
- `components/marketplace/ad-banner.tsx` — composant générique (pub ou placeholder)
- `components/admin-saas/ad-spots-manager.tsx` — panneau admin
- `app/(dashboard)/admin/pub/page.tsx` — route admin
- `app/(public)/page.tsx` — nouvelle landing page (marketplace + pub)
- `app/(public)/a-propos/page.tsx` — ancienne page d'accueil conservée
- `app/(public)/marketplace/page.tsx` — redirige vers `/`
- `components/layout/public-header.tsx` — lien "Gérer mes biens" → `/a-propos`
- `components/layout/dashboard-shell.tsx` — entrée "Espaces pub" dans Admin
- `firestore.rules` — règles pour `adSpots`
