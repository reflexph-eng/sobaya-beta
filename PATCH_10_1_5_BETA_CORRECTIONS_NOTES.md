# SOBAYA — PATCH 10.1.5

## UX Mobile + Quittance Pro + Auth V2 + Corrections Bêta

### Corrections incluses

- Remplacement de la barre de navigation mobile basse par un menu hamburger haut.
- Ajout de la déconnexion dans le menu mobile.
- Conservation de la sidebar desktop existante.
- Ajout d'une bannière mobile dédiée : `public/sobaya-visuals/banner-mobile.png`.
- Affichage automatique `banner-top.png` desktop / `banner-mobile.png` mobile.
- Refonte visuelle de la quittance publique : mise en page professionnelle, hiérarchie, tableau de paiement, QR code, zone de validation.
- Auth V2 : choix à l'inscription entre propriétaire particulier, agent immobilier et agence immobilière.
- Préparation des plans Starter / Pro / Agence sans activer la facturation.

### Hors périmètre volontaire

- Le rattachement des paiements aux périodes locatives reste réservé au patch 10.1.6.
- Les règles Firestore ne sont pas modifiées dans ce patch.
- Les modèles de paiements existants restent compatibles.

### Tests effectués

- `npx tsc --noEmit` : OK.
- `npx next lint` : OK.
- `npm run build` : compilation OK, puis timeout pendant la génération statique dans l'environnement sandbox.

### Point d'attention

Le build complet doit être relancé en local ou sur Vercel avec Node 20.x, conformément au `package.json`.
