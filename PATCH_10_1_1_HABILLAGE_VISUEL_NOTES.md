# PATCH 10.1.1 — Habillage Visuel Dashboard

## Objectif
Ajouter une couche graphique légère au tableau de bord SOBAYA avant le déploiement en ligne, sans modifier les flux métier validés.

## Ajouts
- Dossier d'assets remplaçables : `public/sobaya-visuals/`
- Images par défaut :
  - `banner-top.png` — bannière principale du dashboard
  - `encart-left.png` — encart paiements/quittances
  - `encart-right.png` — encart maintenance/interventions
- Composant : `components/dashboard/dashboard-visual-banners.tsx`
- Intégration dans : `components/dashboard/dashboard-overview.tsx`

## Règle de remplacement
Pour changer une image plus tard :
1. Préparer une image aux mêmes dimensions.
2. Garder exactement le même nom de fichier.
3. Remplacer le fichier dans `public/sobaya-visuals/`.
4. Relancer l'application.

Dimensions recommandées :
- `banner-top.png` : 1600 × 420 px
- `encart-left.png` : 760 × 360 px
- `encart-right.png` : 760 × 360 px

## Contraintes respectées
- Aucun Firebase Storage
- Aucune règle Firestore ajoutée
- Aucune API externe
- Aucun impact sur paiements, contrats, maintenance, reporting ou administration
- Images servies localement depuis le dossier `public`

## Plan de tests
1. Lancer `npm install` si nécessaire.
2. Lancer `npm run build`.
3. Lancer `npm run dev`.
4. Ouvrir le dashboard propriétaire.
5. Vérifier que la bannière principale s'affiche.
6. Vérifier que les deux encarts s'affichent sous la bannière.
7. Tester sur mobile ou largeur réduite : les encarts doivent se placer l'un sous l'autre.
8. Remplacer temporairement `banner-top.png` par une autre image du même nom et vérifier que l'affichage change.

## Déploiement Firebase
Pas nécessaire pour ce patch.
Aucune commande `firebase deploy --only firestore:rules` n'est requise, sauf si un autre fichier de règles a été modifié manuellement.
