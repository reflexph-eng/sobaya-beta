# SOBAYA — Sprint 10.3.8 : Coffre-fort documentaire

## Décision d'architecture validée avant développement

Question posée à Lanfia : organiser le coffre-fort comme une collection
unique rattachable à n'importe quelle entité (avec une page centrale), ou
comme des documents éclatés directement sur chaque fiche, sans page centrale ?
Réponse : laisser le plus simple et le plus évolutif décider.

Choix retenu : **collection unique `documents`, rattachable optionnellement à
n'importe quelle entité (bien, locataire, contrat, propriétaire mandant), ou
laissée libre (document d'organisation non rattaché)**, avec une page
centrale `/documents` qui devient le vrai coffre-fort consultable.

Raisons : une seule logique de code à maintenir (upload, sécurité,
suppression) plutôt que dupliquée sur 4 modules différents ; la page
`/documents`, placeholder depuis l'origine du projet, devient enfin utile ;
extensible sans nouvelle collection si demain il faut rattacher des
documents aux prestataires ou interventions — il suffira d'ajouter une
valeur à `DocumentEntityType`.

## Bonne surprise : une partie de la fondation existait déjà

Avant de coder, l'audit du projet a révélé que deux éléments du Sprint 7
(Prestataires & Interventions) avaient anticipé ce sprint sans le savoir :

- La permission `documents.manage` existait déjà dans
  `constants/permissions.ts`, attribuée aux rôles `manager` et `agent`.
- La règle Firestore pour la collection `documents` existait déjà dans
  `firestore.rules` (lecture/création/modification selon `documents.manage`,
  suppression réservée au super admin).

**Conséquence pratique pour Lanfia : aucun `firebase deploy --only
firestore:rules` n'est nécessaire pour ce sprint.** Les règles étaient déjà
prêtes et déployées (ou en tout cas, déjà présentes dans le fichier livré
aux sprints précédents). Les règles Storage génériques
(`organizations/{orgId}/**`), déjà en place depuis le Sprint 10.3.5, couvrent
aussi le nouveau chemin `organizations/{orgId}/documents/...` sans
modification. **Ce sprint ne nécessite donc aucun déploiement Firebase.**

## Périmètre couvert

- [x] Téléversement de documents (PDF, JPEG, PNG, WebP — 15 Mo max,
      volontairement plus large que les 5 Mo des photos, pour couvrir des
      plans ou ACD scannés en haute résolution)
- [x] Catégorisation : Contrat, CNI, ACD, Facture, Plan, Document technique,
      Autre
- [x] Rattachement optionnel à une fiche (bien, locataire, contrat,
      propriétaire mandant) ou document libre d'organisation
- [x] Page centrale `/documents` avec filtres par catégorie et par type de
      fiche, statistiques (total, rattachés, libres, espace utilisé)
- [x] Archivage sécurisé (suppression du fichier Storage + marquage
      `isDeleted` côté Firestore, cohérent avec le pattern déjà utilisé
      partout ailleurs dans le projet)
- [x] Intégration à la recherche globale, cohérente avec le correctif du
      patch 10.3.5

## Périmètre non couvert ici, volontairement

- **Affichage des documents directement dans l'onglet de chaque fiche**
  (ex. un onglet "Documents" dans la fiche d'un bien qui ne montrerait que
  ses documents rattachés). Le service expose déjà une fonction prête à
  l'emploi pour ça (`filterDocumentsForEntity`), mais l'intégrer dans chaque
  module (biens, locataires, contrats, propriétaires) représente un travail
  UI répétitif sur 4 écrans différents. Pour ce sprint, la page centrale
  `/documents` avec filtre par fiche suffit à couvrir le besoin ; l'intégration
  fine dans chaque onglet peut être ajoutée plus tard sans changer le modèle
  de données.
- **Aperçu intégré du PDF/image** : le bouton "Ouvrir" ouvre le fichier dans
  un nouvel onglet du navigateur plutôt que d'afficher une prévisualisation
  dans la page elle-même. Plus simple, fonctionne nativement sur tous les
  navigateurs sans bibliothèque supplémentaire.

## Détail technique

### Modèle de données (`types/document.ts`)

Type nommé `OrgDocument` (et non `Document`) pour éviter tout conflit avec
le type global `Document` du DOM, qui aurait pu créer des bugs de typage
discrets ailleurs dans le code.

### Service (`services/documents.ts`)

`uploadDocument`, `updateDocumentMeta`, `archiveDocument`,
`listDocuments`, `filterDocumentsForEntity`. Même logique défensive que les
galeries photo (Sprints 10.3.5 et 10.3.7) : validation de type de fichier,
validation de taille, nettoyage du fichier Storage à la suppression.

### Bug corrigé en cours de développement

Une erreur de build a été détectée et corrigée avant livraison :
`organizationId` était dupliqué dans l'objet retourné par `uploadDocument`
(une fois explicitement, une fois via le spread de `payload` qui le
contenait déjà), ce que TypeScript a signalé comme erreur de compilation.
Corrigé avant tout test — n'a jamais atteint un état livré cassé.

## Fichiers modifiés ou créés

- `types/document.ts` — nouveau modèle `OrgDocument`
- `services/documents.ts` — nouveau service complet
- `services/activity-logs.ts` — ajout des actions `DOCUMENT_*` et entité `document`
- `components/documents/document-upload-form.tsx` — formulaire de
  téléversement avec rattachement optionnel
- `components/documents/documents-manager.tsx` — page centrale avec filtres
  et statistiques
- `app/(dashboard)/documents/page.tsx` — remplacement du placeholder
- `components/layout/global-search.tsx` — intégration des documents à la
  recherche globale

## Validation technique

- `npx tsc --noEmit` : 0 erreur.
- `npm run build` : `Compiled successfully`, 31 routes générées.
  `/documents` passe de 147 B (placeholder) à 7.23 kB (page fonctionnelle).
- 2 avertissements ESLint non bloquants déjà connus (`<img>` dans les
  galeries photo des sprints précédents) — aucun nouveau.

## Déploiement Firebase requis pour ce sprint

**Aucun.** Les règles Firestore et Storage nécessaires étaient déjà en place
avant ce sprint. Seul le code applicatif a changé.

## Risques résiduels

- Pas de limite de quota d'espace de stockage par organisation : un usage
  intensif du coffre-fort (beaucoup de PDF/plans volumineux) pourrait faire
  grimper la facture Firebase Storage sans alerte. À surveiller si le volume
  de documents par organisation devient important.
- La métrique "Espace utilisé" sur la page `/documents` est calculée
  côté client à partir de la liste complète des documents — cohérent avec
  l'absence générale de pagination déjà signalée dans le rapport d'audit
  (section 3.3), pas un problème spécifique à ce sprint.
