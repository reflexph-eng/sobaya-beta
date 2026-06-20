# PATCH 10.1.6 — Paiements par période locative + QR quittance téléchargée

## Corrections incluses

- Ajout des champs de période dans le formulaire de paiement :
  - `periodStart`
  - `periodEnd`
  - `periodLabel`
  - `periodMonths`
- Calcul automatique du montant attendu selon la période couverte.
- Gestion du paiement simple, multi-mois et paiement partiel.
- Calcul automatique :
  - montant attendu,
  - solde restant,
  - trop-perçu.
- Affichage de la période couverte dans l'historique des paiements.
- Publication de la période dans la quittance publique.
- Ajout du QR code dans la quittance téléchargée HTML.
- Mise à jour du message de notification paiement avec la période couverte.

## Règle métier

Le paiement couvre maintenant une période réelle, par exemple :

- Janvier 2026
- Janvier 2026 à Mars 2026

La quittance affiche explicitement la période couverte.

## Tests effectués

- `npm run typecheck` : OK
- `npm run lint` : OK
- `npm run build` : compilation OK, timeout sandbox pendant génération statique.

## Note

Le QR code utilise le lien public `/receipt/[receiptNumber]`. En local, le lien reste local. En ligne, il devient automatiquement le domaine Vercel/SOBAYA.
