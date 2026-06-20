# PATCH 5.2.3 — Branding SOBAYA

## Objectif
Intégrer le logo officiel SOBAYA dans l'application avant le passage au Sprint 6.

## Ajouts
- Création du dossier `public/branding/`
- Ajout de `logo-sobaya.png`
- Ajout de `icon-sobaya.png`
- Ajout de `favicon.ico`
- Ajout du composant réutilisable `components/layout/brand-logo.tsx`

## Intégrations
- Sidebar Dashboard
- Header public
- Page de connexion
- Écran de chargement sécurisé
- Page publique de vérification de quittance
- Métadonnées Next.js / favicon

## Personnalisation future
Pour changer le logo sans modifier le code, remplacer simplement :

- `public/branding/logo-sobaya.png` pour le logo complet
- `public/branding/icon-sobaya.png` pour l'icône
- `public/branding/favicon.ico` pour l'icône navigateur

Conserver les mêmes noms de fichiers.
