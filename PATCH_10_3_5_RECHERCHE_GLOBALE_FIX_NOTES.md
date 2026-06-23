# SOBAYA — Patch 10.3.5 Correctif Recherche Globale

## Contexte

Lors de l'audit UX/fonctionnel du Patch 10.3.4, un bug fonctionnel bloquant a été
identifié sur la fonctionnalité phare du patch : la recherche globale.

## Bug constaté

`components/layout/global-search.tsx` construit des liens de résultat du type :

```
/biens?search=...
/locataires?search=...
/contrats?search=...
/proprietaires?search=...
```

Mais aucun des quatre composants cibles (`PropertiesManager`, `TenantsManager`,
`ContractsManager`, `OwnerMandatesManager`) ne lisait le paramètre `search` depuis
`useSearchParams()`. Résultat : cliquer un résultat de recherche globale ouvrait
la page cible avec la liste complète, non filtrée, sans surlignage ni indication —
l'utilisateur devait re-chercher manuellement l'élément qu'il venait de sélectionner.
Seul `?etat=`, `?mandants=` (biens) et `?contractId=` (paiements, impayés) étaient
réellement exploités.

## Correctif appliqué

Pour chacun des 4 managers concernés :

- Lecture de `searchParams.get("search")`, normalisé en minuscules.
- Application du filtre sur les champs déjà utilisés par `GlobalSearch` pour
  construire ses `tokens` (nom, référence, téléphone, email selon le module),
  afin de garder une cohérence stricte entre ce que la recherche promet de
  trouver et ce que la page affiche.
- Ajout d'un badge visuel "Recherche : « terme »" au-dessus de la liste, pour
  que l'utilisateur sache qu'un filtre est actif (cohérent avec le badge déjà
  existant "Biens confiés uniquement" sur `/biens`).
- Ajout d'un message "Aucun résultat ne correspond à la recherche" distinct du
  message "Aucun [bien/locataire/contrat/propriétaire] enregistré", pour ne pas
  laisser penser que la base est vide quand c'est seulement le filtre qui est trop
  restrictif.

## Fichiers modifiés

- `components/properties/properties-manager.tsx`
- `components/tenants/tenants-manager.tsx`
- `components/contracts/contracts-manager.tsx`
- `components/owner-mandates/owner-mandates-manager.tsx`

## Risques de régression

- Aucun changement de règles Firestore.
- Aucun changement de schéma de données.
- Filtrage additif (purement côté client, sur les listes déjà chargées) : les
  filtres existants (`etat`, `mandants`, `contractId`) restent inchangés et se
  combinent avec `search` sans conflit.

## Validation technique

- `npx tsc --noEmit` : OK, 0 erreur.
- `npm run build` : `Compiled successfully`, 30 routes générées, aucune régression
  de taille de bundle significative (+0.1 à +0.4 kB par page concernée).

## Limite assumée

Ce correctif répare le parcours utilisateur cassé sans changer l'architecture de
la recherche globale elle-même (toujours un chargement complet des collections
côté client, voir section correspondante du rapport d'audit). Une vraie recherche
serveur paginée reste recommandée à moyen terme — voir le rapport d'audit complet.
