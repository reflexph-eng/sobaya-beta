import type { LegalDocumentType, LegalDocumentVersion } from "@/types/governance";

/**
 * ⚠️ CONTENU PROVISOIRE — NE PAS PUBLIER SANS VALIDATION JURIDIQUE ⚠️
 *
 * Ces textes sont des trames de travail rédigées pour permettre de construire
 * et tester la mécanique de consentement (acceptation, blocage d'accès,
 * historisation des versions). Ils sont volontairement génériques et
 * incomplets sur plusieurs points spécifiques au droit ivoirien :
 *   - régime de protection des données personnelles applicable et autorité
 *     de contrôle compétente (à confirmer : ARTCI / loi sur la protection
 *     des données à caractère personnel) ;
 *   - régime fiscal et obligations déclaratives liées à l'activité d'agence
 *     immobilière et d'intermédiation ;
 *   - droit de rétractation et délais applicables aux services à distance ;
 *   - clauses limitatives de responsabilité et leur opposabilité réelle.
 *
 * Chaque champ `isDraft: true` doit rester à `true` tant qu'un juriste n'a
 * pas validé le texte. Le composant d'affichage peut afficher un bandeau
 * d'avertissement basé sur ce champ.
 */

export const LEGAL_DOCUMENTS: Record<LegalDocumentType, LegalDocumentVersion> = {
  cgu: {
    version: "0.1",
    effectiveDate: "2026-06-21",
    isDraft: true,
    content: `# Conditions Générales d'Utilisation (CGU) — Brouillon de travail

**Version provisoire — non validée juridiquement.**

## 1. Objet

Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme SOBAYA, éditée par Cabinet Grain de Sel (à compléter : forme juridique exacte, SARLU, numéro RCCM, siège social).

## 2. Acceptation

L'utilisation de SOBAYA implique l'acceptation pleine et entière des présentes CGU. Le défaut d'acceptation empêche l'accès au service.

## 3. Description du service

SOBAYA est une plateforme de gestion immobilière permettant la gestion de biens, locataires, contrats, paiements et services associés.

## 4. Compte utilisateur

Chaque utilisateur est responsable de la confidentialité de ses identifiants et de l'exactitude des informations renseignées.

## 5. Obligations de l'utilisateur

(À compléter : usage conforme, interdiction de fraude, exactitude des données saisies, responsabilité sur les documents téléversés.)

## 6. Responsabilité

(À compléter avec un juriste : limites de responsabilité de l'éditeur, notamment concernant l'exactitude des informations saisies par les utilisateurs eux-mêmes.)

## 7. Résiliation

(À compléter : conditions de suspension ou de suppression de compte.)

## 8. Droit applicable

(À confirmer : droit ivoirien, juridiction compétente.)`
  },
  cgs: {
    version: "0.1",
    effectiveDate: "2026-06-21",
    isDraft: true,
    content: `# Conditions Générales de Service (CGS) — Brouillon de travail

**Version provisoire — non validée juridiquement.**

## 1. Objet

Les présentes CGS précisent les conditions commerciales et techniques de fourniture des services SOBAYA (abonnements, fonctionnalités incluses selon le plan, modalités de paiement).

## 2. Plans et tarification

(À compléter : détail des plans, ce qui est gratuit vs payant, modalités de facturation.)

## 3. Niveau de service

(À compléter : engagement de disponibilité, le cas échéant, et limites.)

## 4. Données et propriété

Les données saisies par l'utilisateur (biens, locataires, contrats) restent sa propriété. SOBAYA agit en tant que prestataire technique hébergeant ces données.

## 5. Suspension et résiliation du service

(À compléter : cas de suspension pour impayé, violation des CGU, etc.)`
  },
  privacy_policy: {
    version: "0.1",
    effectiveDate: "2026-06-21",
    isDraft: true,
    content: `# Politique de confidentialité — Brouillon de travail

**Version provisoire — non validée juridiquement.**

## 1. Données collectées

SOBAYA collecte notamment : identité et coordonnées des utilisateurs, données relatives aux biens immobiliers, locataires et propriétaires gérés, données de paiement, documents téléversés (pièces d'identité, contrats, factures).

## 2. Finalités du traitement

Ces données sont utilisées pour permettre la gestion locative, l'émission de quittances, le suivi des paiements et la communication entre les parties.

## 3. Conservation des données

(À compléter avec un juriste : durées de conservation par type de donnée, notamment les pièces d'identité.)

## 4. Partage des données

Les données ne sont pas partagées avec des tiers à des fins commerciales. (À compléter : sous-traitants techniques éventuels — hébergement, paiement mobile money.)

## 5. Droits des personnes concernées

(À compléter selon le régime applicable : droit d'accès, de rectification, de suppression, et modalités d'exercice.)

## 6. Sécurité

Les données sont hébergées sur une infrastructure sécurisée avec contrôle d'accès par organisation et par rôle.

## 7. Contact

(À compléter : adresse de contact dédiée aux questions de confidentialité.)`
  },
  verification_policy: {
    version: "0.1",
    effectiveDate: "2026-06-21",
    isDraft: true,
    content: `# Politique de vérification — Brouillon de travail

**Version provisoire — non validée juridiquement.**

## 1. Objet

Cette politique décrit les principes de vérification appliqués aux comptes, biens et professionnels référencés sur SOBAYA (badges de confiance).

## 2. Niveaux de vérification

- **Compte vérifié** : identité du titulaire du compte contrôlée.
- **Bien vérifié** : mandat et documents de propriété contrôlés.
- **Professionnel certifié** : statut d'agent ou d'agence contrôlé.
- **Bien inspecté** : visite physique réalisée par SOBAYA.

## 3. Limites de la vérification

La vérification ne constitue pas une garantie absolue et n'engage pas la responsabilité de SOBAYA au-delà des contrôles effectivement réalisés. (À compléter avec un juriste.)

## 4. Processus de contestation

(À compléter : comment un utilisateur peut contester le retrait d'un badge.)`
  },
  legal_notice: {
    version: "0.1",
    effectiveDate: "2026-06-21",
    isDraft: true,
    content: `# Mentions légales — Brouillon de travail

**Version provisoire — non validée juridiquement.**

## Éditeur

Cabinet Grain de Sel (SARLU)
(À compléter : adresse complète, numéro RCCM, numéro de compte contribuable, capital social.)

## Directeur de publication

(À compléter.)

## Hébergement

(À compléter : nom et adresse de l'hébergeur des données — Firebase/Google Cloud.)

## Contact

(À compléter : adresse email et/ou téléphone de contact.)`
  }
};
