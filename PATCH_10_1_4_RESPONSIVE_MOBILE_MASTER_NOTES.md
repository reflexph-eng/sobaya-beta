# PATCH 10.1.4 — Responsive Mobile Master

Objectif : corriger l’affichage mobile observé après déploiement Vercel.

## Corrections apportées

- Ajout du viewport mobile dans `app/layout.tsx` pour empêcher le rendu desktop compressé sur téléphone.
- Sidebar desktop réservée aux grands écrans (`lg`).
- Navigation mobile en barre basse compacte avec icônes et défilement horizontal.
- Contenu principal optimisé mobile avec marges réduites.
- Bannière SOBAYA réduite sur mobile : 72 px, puis 104 px tablette, 140 px desktop.
- KPI et cartes mieux empilés sur téléphone.
- Rentabilité par bien rendue moins dense sur mobile.

## Firebase

Aucun déploiement Firebase requis.

## Tests prioritaires

1. Ouvrir l’URL Vercel sur téléphone.
2. Vérifier que la sidebar desktop ne s’affiche plus à gauche.
3. Vérifier que la navigation est en bas.
4. Vérifier que la bannière reste fine.
5. Vérifier que les cartes KPI sont lisibles en une colonne.
6. Tester Dashboard, Biens, Locataires, Contrats, Paiements, Rapports, Notifications, Maintenance.

## Déploiement

Après intégration :

```bash
npm install
npm run build
git add .
git commit -m "Patch 10.1.4 responsive mobile master"
git push origin main
```

Vercel redéploiera automatiquement.
