# SOBAYA — Patch 10.2.1 Harmonisation Recouvrement

Objectif : harmoniser l'intelligence locative du Patch 10.2 dans les écrans opérationnels afin que les arriérés deviennent actionnables.

## Ajouts principaux

- Nouvelle page `/impayes` : liste des locataires en retard, montant dû, mois concernés, dernier mois payé, recherche, appel, relance WhatsApp et encaissement rapide.
- Menu dashboard : ajout de l'entrée **Impayés**.
- Dashboard : les actions prioritaires de relance pointent maintenant vers `/impayes` au lieu de `/paiements`.
- Paiements : un lien `/paiements?contractId=...` ouvre automatiquement le formulaire avec le contrat concerné.
- Locataires : la liste affiche maintenant la situation locative issue du moteur 10.2 : dette actuelle, mois dus, dernier mois payé et bouton de relance.
- Notifications : la génération des rappels utilise désormais le moteur `computeRentSituations()` au lieu de l'ancien couple `nextDueDate + balance`.
- Reporting : les impayés affichés utilisent désormais les arriérés intelligents du moteur 10.2.
- Journal d'activité : ajout de l'action `TENANT_REMINDER_SENT` pour tracer les relances WhatsApp déclenchées depuis SOBAYA.

## Risques maîtrisés

- Pas de nouvelle collection Firestore.
- Pas de migration obligatoire.
- Pas de modification destructive sur paiements, contrats, quittances ou QR publics.
- Les relances WhatsApp sont ouvertes via lien externe `wa.me` avec message prérempli.
- Si le téléphone du locataire manque ou est mal renseigné, la page affiche un avertissement et ouvre WhatsApp sans numéro direct.

## Vérifications techniques

- `npm run typecheck` : OK.
- `npm run build` : compilation, lint/typecheck et génération des pages OK ; la commande reste bloquée localement sur `Collecting build traces` dans cet environnement, probablement lié à l'environnement d'exécution. Aucun problème TypeScript détecté.
