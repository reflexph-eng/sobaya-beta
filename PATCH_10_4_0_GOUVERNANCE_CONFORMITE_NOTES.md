# SOBAYA — Sprint 10.4.0 : Gouvernance & conformité (mécanique technique)

## Avertissement à lire en premier — IMPORTANT

**Ce sprint construit la mécanique technique de gestion du consentement et
de la conformité. Il ne fournit PAS de textes juridiques validés.**

Les contenus de CGU, CGS, politique de confidentialité, politique de
vérification et mentions légales (`constants/legal-documents.ts`) sont des
**versions de travail provisoires**, rédigées uniquement pour permettre de
construire et tester la mécanique (acceptation, blocage d'accès, historique
des versions). Ils sont marqués `isDraft: true` et affichent un bandeau
d'avertissement visible partout où ils apparaissent (page publique, écran
de consentement).

**Ces textes ne doivent pas être publiés en l'état.** Ils doivent être
relus, complétés et validés par un juriste compétent en droit ivoirien
avant toute mise en production réelle, notamment sur :
- le régime de protection des données personnelles applicable et l'autorité
  de contrôle compétente (à confirmer : ARTCI) ;
- le régime fiscal et les obligations déclaratives de l'activité d'agence
  immobilière et d'intermédiation ;
- les durées de conservation des données, en particulier les pièces
  d'identité téléversées dans le coffre-fort documentaire ;
- les clauses limitatives de responsabilité et leur opposabilité réelle.

C'était l'arbitrage validé avec Lanfia avant développement : construire la
mécanique avec des textes provisoires, à remplacer plus tard sans toucher
au code.

## Décisions d'arbitrage validées avant développement

1. **Signalement d'annonce** : structure de données posée (collection
   `listingReports`, types, règles Firestore), **sans interface
   utilisateur**. Cette fonctionnalité suppose des annonces publiques, qui
   n'existent qu'à partir du Sprint 11.0 (marketplace). Construire une
   interface maintenant aurait été du travail jeté, puisqu'il n'y a encore
   rien à signaler.

2. **Gestion des badges** : structure de données posée (collection
   `badges`, types, règles Firestore), **sans logique d'attribution
   automatique**. Les badges réels (Compte vérifié, Bien vérifié, Agent
   certifié...) dépendent de mécanismes de vérification qui n'existent pas
   encore (CNI, contrôle de mandat, inspection — Phases 2/3, Sprints
   12.0 à 12.3). Seule l'attribution manuelle par un super admin est
   permise par les règles, en attendant l'automatisation.

## Périmètre couvert avec interface complète

- [x] Pages publiques pour CGU, CGS, Politique de confidentialité,
      Politique de vérification, Mentions légales (`/legal/cgu`,
      `/legal/cgs`, `/legal/confidentialite`, `/legal/verification`,
      `/legal/mentions-legales`)
- [x] Consentement utilisateur : écran de blocage qui force l'acceptation
      des documents requis (CGU + Politique de confidentialité) avant
      d'accéder au tableau de bord
- [x] Historique des consentements, consultable depuis la page Profil
- [x] Footer avec liens légaux sur la page d'accueil publique

## Détail technique

### Modèle de versionnage (`types/governance.ts`, `constants/legal-documents.ts`)

Chaque document légal a un numéro de version (`"0.1"` pour l'instant, en
cohérence avec son statut de brouillon). Un consentement enregistré porte
la version exacte acceptée. Si le texte est mis à jour (ex. passage en
version `"1.0"` après validation juridique), tous les utilisateurs devront
re-consentir automatiquement : `findMissingConsents` compare la version
acceptée à la version actuellement en vigueur, pas seulement le type de
document.

### Stockage du consentement (`services/governance.ts`)

Les consentements sont stockés sous `users/{userId}/consents/{consentId}`,
**au niveau utilisateur global et non par organisation** — cohérent avec le
fait que les CGU s'appliquent à la personne qui utilise SOBAYA, pas à une
organisation en particulier. Chaque entrée est horodatée côté serveur
(`serverTimestamp()`) et conserve le user-agent du navigateur pour
traçabilité.

**Un consentement ne peut jamais être modifié ou supprimé** une fois créé
(`allow update, delete: if false` dans les règles Firestore) : seule la
création de nouvelles entrées est possible. C'est volontaire, pour
préserver la valeur de preuve de l'historique en cas de besoin (litige,
audit) — un consentement horodaté modifiable après coup n'aurait aucune
valeur probante.

### Blocage d'accès (`components/providers/auth-guard.tsx`)

Le point de contrôle a été placé dans `AuthGuard`, qui encadre déjà tout le
groupe de routes `(dashboard)`. Après vérification de l'authentification et
de l'organisation active (logique déjà existante, inchangée), une nouvelle
vérification charge les consentements de l'utilisateur et affiche
`ConsentGate` en plein écran si des documents requis manquent — l'app
réelle (menu, dashboard, tout le reste) n'est rendue qu'une fois le
consentement complet.

**Choix défensif important** : si la lecture des consentements échoue (ex.
problème réseau temporaire, ou règles Firestore pas encore déployées sur un
environnement donné), l'utilisateur n'est **pas bloqué** — on considère par
défaut qu'aucun consentement n'est requis plutôt que de transformer une
erreur technique en blocage total d'accès à l'application. C'est un
compromis assumé entre rigueur de conformité et résilience opérationnelle.

### Pages publiques (`app/(public)/legal/[type]/page.tsx`)

Une seule route dynamique (`generateStaticParams`) plutôt que 5 pages
dupliquées, génère 5 pages statiques au build (`/legal/cgu`, `/legal/cgs`,
`/legal/confidentialite`, `/legal/verification`, `/legal/mentions-legales`).

### Rendu de texte (`components/ui/simple-markdown.tsx`)

Un petit renderer Markdown maison (titres `#`/`##`, gras `**texte**`,
paragraphes) plutôt qu'une dépendance externe : le contenu structuré des
textes légaux n'a pas besoin de plus, et ça évite d'ajouter une dépendance
réseau pour un besoin aussi limité. Si les textes définitifs validés par un
juriste nécessitent plus (listes à puces, liens, tableaux), remplacer ce
composant par une vraie librairie markdown à ce moment-là.

## Fichiers créés

- `types/governance.ts` — modèle de version de document légal et de consentement
- `types/listing-report.ts` — structure de données pour le signalement (sans UI)
- `types/badge.ts` — structure de données pour les badges (sans UI d'attribution)
- `constants/legal-documents.ts` — contenu provisoire des 5 textes légaux
- `services/governance.ts` — enregistrement et lecture des consentements
- `components/ui/simple-markdown.tsx` — rendu minimal des textes légaux
- `components/governance/consent-gate.tsx` — écran de blocage de consentement
- `components/governance/consent-history.tsx` — historique sur la page Profil
- `components/layout/legal-footer.tsx` — footer avec liens légaux
- `app/(public)/legal/[type]/page.tsx` — pages publiques des textes légaux
- `app/(dashboard)/profil/page.tsx` — ajout de l'historique des consentements (modifié)
- `app/(public)/page.tsx` — ajout du footer légal (modifié)
- `components/providers/auth-guard.tsx` — intégration du blocage de consentement (modifié)
- `firestore.rules` — règles pour `users/{userId}/consents`, `listingReports`, `badges` (modifié)

## Validation technique

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : `Compiled successfully`, 36 routes générées (5 nouvelles
  pages légales statiques + `/profil` enrichi).
- Aucun nouvel avertissement ESLint (les 2 préexistants sur `<img>`
  persistent, sans rapport avec ce sprint).

## Déploiement Firebase requis pour ce sprint

**Oui, cette fois : `firebase deploy --only firestore:rules`** est
nécessaire, car ce sprint introduit trois nouvelles zones de règles
(sous-collection `consents`, et collections `listingReports` et `badges`)
qui n'existaient pas avant. Sans ce déploiement, le blocage de consentement
ne fonctionnera pas correctement (le comportement défensif décrit plus haut
fera qu'aucun blocage n'apparaîtra du tout, par sécurité — pas d'erreur
visible, mais la fonctionnalité sera simplement inactive).

Aucune règle Storage nouvelle n'est nécessaire pour ce sprint.

## Risques résiduels et points d'attention

- **Priorité absolue avant toute mise en production** : faire valider les
  textes légaux par un juriste, puis mettre à jour
  `constants/legal-documents.ts` (changer `isDraft` à `false` et incrémenter
  la version, ce qui redemandera automatiquement le consentement à tous les
  utilisateurs déjà inscrits).
- Le champ `ipAddress` du consentement est toujours `null` : il ne peut pas
  être capturé de façon fiable depuis le navigateur seul. Si l'adresse IP
  doit être tracée pour une valeur probante renforcée, cela nécessitera une
  fonction serveur (Cloud Function) plutôt qu'un appel client direct à
  Firestore — actuellement hors périmètre.
- `listingReports` autorise la création par n'importe qui
  (`allow create: if true`), de façon anticipée pour permettre un
  signalement par un visiteur non connecté de la marketplace au Sprint 11.0.
  Cette règle devra être revue avec une validation de contenu plus stricte
  (limitation de débit, modération) au moment où l'interface sera
  réellement construite.
