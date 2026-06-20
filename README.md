# SOBAYA — Sprint 5.1 Quittances PDF & QR

Version remplaçable du projet SOBAYA après Sprint 5 validé.

## Inclus

- Paiements validés Sprint 5
- Génération de quittance depuis un paiement
- Page publique `/receipt/[receiptNumber]`
- Vérification publique via collection `publicReceipts`
- QR visuel de vérification
- Impression / sauvegarde PDF via navigateur
- Téléchargement HTML imprimable
- Champs Firestore : `receiptIssuedAt`, `receiptIssuedBy`, `verificationCode`, `receiptPdfUrl`
- Audit log `RECEIPT_ISSUED`

## Important

Après remplacement du dossier, publier les règles Firestore :

```bash
firebase deploy --only firestore:rules
```

Puis lancer :

```bash
npm install
npm run dev
```

## Test conseillé

1. Créer un paiement.
2. Cliquer sur `Générer quittance`.
3. Vérifier la création de `publicReceipts/{receiptNumber}`.
4. Ouvrir `/receipt/{receiptNumber}`.
5. Cliquer `Imprimer / PDF`.
