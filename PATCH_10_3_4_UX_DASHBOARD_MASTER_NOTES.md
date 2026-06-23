# SOBAYA — Patch 10.3.4 UX Dashboard Master

## 1. Rapport d'audit du ZIP fourni

ZIP audité : version officielle de travail fournie par l'utilisateur, indépendamment du nom du fichier.

### Existant confirmé

- Architecture Next.js App Router conservée.
- Modules existants confirmés : dashboard, biens, propriétaires mandants, locataires, contrats, paiements, impayés, maintenance, prestataires, interventions, rapports, notifications, documents, administration, organisation et profil.
- Services métiers existants confirmés : propriétés, locataires, contrats, paiements, arriérés, situation patrimoniale, mandats, maintenance, interventions, notifications, rapports, administration SaaS et configuration dashboard.
- Patchs validés antérieurs conservés : intelligence locative, relances/impayés, références automatiques, cohérence patrimoine, mandants, dashboards par profil, dashboards actionnables et personnalisation des rubriques.
- Menu mobile hamburger déjà présent, mais navigation encore affichée comme une longue liste.
- Personnalisation dashboard déjà présente via `dashboardSettings.enabledWidgets`.

### Manques identifiés

- Navigation non hiérarchisée : trop d'entrées au même niveau dans le menu desktop et mobile.
- Dashboard encore trop chargé visuellement : beaucoup de KPI et blocs métier affichés simultanément.
- Recherche globale absente au niveau de l'expérience utilisateur courante.
- Fiches biens, locataires et contrats affichées en blocs longs, sans onglets de lecture.
- Sections non repliables sur le dashboard principal.
- Mobile first perfectible : le hamburger existe, mais les contenus longs restaient trop denses.

### Risques de régression analysés

- Risque Firestore : faible, aucun changement de règles ou de schéma obligatoire.
- Risque métier : faible, les services existants sont réutilisés sans modifier les calculs validés.
- Risque UX : maîtrisé par ajout de composants transversaux non destructifs.
- Risque build : contrôlé par compilation TypeScript `npx tsc --noEmit` réussie.

## 2. Spécification finale du Patch 10.3.4

### Navigation hiérarchique

Le menu dashboard est désormais organisé en 5 familles :

1. Tableau de bord
2. Gestion locative
3. Finances
4. Exploitation
5. Administration

Chaque famille est repliable/dépliable sur desktop et mobile. Les permissions existantes restent appliquées. Le super admin conserve l'accès global.

### Recherche globale

Ajout d'une recherche globale intégrée dans le shell et sur le dashboard master :

- biens ;
- locataires ;
- contrats ;
- mandants ;
- références.

La recherche utilise les services existants et redirige vers les modules concernés sans modifier la base de données.

### Dashboard minimaliste

Le dashboard est restructuré autour de 4 blocs prioritaires :

- Priorités : impayés, contrats à renouveler, maintenance urgente ;
- Finances : encaissements, arriérés, commissions, reversements ;
- Patrimoine : occupés, disponibles, retirés du marché, maintenance ;
- Activité récente : paiements, contrats, relances.

Les cartes KPI restent actionnables via liens directs.

### Sections repliables

Ajout d'un composant générique `CollapsibleSection` pour limiter la surcharge visuelle et permettre à l'utilisateur de n'ouvrir que ce dont il a besoin.

### Fiches en onglets

Ajout d'un composant générique `SimpleTabs` et intégration dans :

- Biens : Général, Propriétaire, Contrats, Historique ;
- Locataires : Profil, Contrats, Paiements, Relances ;
- Contrats : Général, Paiements, Arriérés, Documents.

L'onglet Documents prépare le Sprint 11 sans activer Firebase Storage.

### Mobile First

- Menu hamburger conservé et amélioré avec accordéons.
- Largeur de shell desktop ajustée pour un menu plus lisible.
- Dashboard allégé, sections repliables et recherche adaptée mobile.

### Personnalisation admin

La personnalisation existante des rubriques dashboard est préservée. Le patch ne casse pas `dashboardSettings.enabledWidgets` et prépare une future granularité plus avancée côté admin.

## 3. Fichiers modifiés ou ajoutés

### Ajouts

- `components/ui/collapsible-section.tsx`
- `components/ui/tabs.tsx`
- `components/layout/global-search.tsx`
- `PATCH_10_3_4_UX_DASHBOARD_MASTER_NOTES.md`

### Modifications

- `components/layout/dashboard-shell.tsx`
- `components/dashboard/dashboard-overview.tsx`
- `components/properties/properties-manager.tsx`
- `components/tenants/tenants-manager.tsx`
- `components/contracts/contracts-manager.tsx`

## 4. Validation technique

- `npx tsc --noEmit` : OK.
- `npm run build` : compilation Next.js OK ; la commande a dépassé le temps d'exécution de l'environnement pendant les étapes finales, mais la compilation applicative a indiqué `Compiled successfully` avant timeout.

## 5. Préparation audit UX global SOBAYA V1

Après validation du patch, l'audit UX global doit vérifier écran par écran :

- surcharge visuelle ;
- redondances de KPI ;
- cohérence des liens actionnables ;
- lisibilité mobile ;
- cohérence des fiches en onglets ;
- fluidité des parcours Biens → Contrats → Paiements → Impayés ;
- pertinence des blocs admin et super admin.
