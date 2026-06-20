# PATCH 10.1.2 — Bannière unique Dashboard

## Objectif
Alléger l'habillage visuel avant le déploiement en ligne.

## Modifications
- Conservation d'une seule image : `public/sobaya-visuals/banner-top.png`.
- Suppression des encarts secondaires : `encart-left.png` et `encart-right.png`.
- Intégration de la bannière en haut du tableau de bord propriétaire.
- Bannière en position sticky : elle reste visible en haut pendant le scroll.
- Hauteur réduite pour ne pas masquer les KPI.
- Largeur 100% et adaptation responsive.

## Remplacement de l'image
Pour changer la bannière plus tard :

```txt
public/sobaya-visuals/banner-top.png
```

Remplacer le fichier en gardant exactement le même nom.

## Firebase
Aucun déploiement Firebase requis pour ce patch.

## Tests
1. Ouvrir `/dashboard`.
2. Vérifier que seule la bannière principale apparaît.
3. Vérifier que les encarts gauche/droite ne s'affichent plus.
4. Scroller : la bannière doit rester visible en haut.
5. Vérifier mobile/tablette/desktop.
6. Remplacer `banner-top.png` par une autre image du même nom et recharger.
