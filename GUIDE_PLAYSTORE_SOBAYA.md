# SOBAYA — Guide de publication sur le Google Play Store (TWA)

## Prérequis

- Node.js installé sur ton PC
- Java JDK 11 ou supérieur (https://adoptium.net/)
- Android Studio installé (pour les outils de signature)
- Un compte Google Play Developer (25 USD, une seule fois)
  → https://play.google.com/console/signup

---

## Étape 1 — Déployer SOBAYA en ligne d'abord

Avant de générer l'APK, le site doit être en ligne sur ton domaine final.
Recommandé : Vercel (https://vercel.com)

1. Crée un compte Vercel
2. Importe ton projet depuis GitHub
3. Vercel déploie automatiquement sur une URL du type : `sobaya-xxx.vercel.app`
4. Si tu as un domaine personnalisé (ex: sobaya.ci), configure-le dans Vercel

---

## Étape 2 — Installer Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

---

## Étape 3 — Initialiser le projet Android

```bash
mkdir sobaya-android && cd sobaya-android
bubblewrap init --manifest https://TON-DOMAINE.com/manifest.json
```

Bubblewrap va te poser des questions :
- **Domain** : TON-DOMAINE.com (ex: sobaya.ci)
- **Application ID** : ci.sobaya.app
- **Application name** : SOBAYA
- **Short name** : SOBAYA
- **Display** : standalone
- **Status bar color** : #0F766E
- **Splash screen color** : #0F766E
- **Icon** : /icons/icon-512x512.png
- **Maskable icon** : /icons/icon-maskable-512x512.png
- **Start URL** : /
- **Orientation** : portrait

---

## Étape 4 — Générer le keystore (certificat de signature)

```bash
bubblewrap build
```

Lors du premier build, Bubblewrap génère un fichier `.keystore`.
**IMPORTANT** : conserve ce fichier en lieu sûr — tu en auras besoin pour toutes les mises à jour futures.

---

## Étape 5 — Récupérer le SHA-256 fingerprint

```bash
keytool -list -v -keystore android.keystore
```

Copie la valeur **SHA256** qui s'affiche — tu vas en avoir besoin.

---

## Étape 6 — Mettre à jour assetlinks.json

Dans ton projet SOBAYA, ouvre :
`public/.well-known/assetlinks.json`

Remplace `REMPLACER_PAR_VOTRE_SHA256_FINGERPRINT` par la valeur SHA-256
que tu viens de copier (format : `AA:BB:CC:DD:...`).

Redéploie sur Vercel pour que ce fichier soit accessible en ligne à l'URL :
`https://TON-DOMAINE.com/.well-known/assetlinks.json`

---

## Étape 7 — Vérifier l'intégration TWA

Ouvre dans un navigateur :
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://TON-DOMAINE.com&relation=delegate_permission/common.handle_all_urls
```

Tu dois voir ton `package_name` et `sha256_cert_fingerprints` dans la réponse.

---

## Étape 8 — Publier sur le Play Store

1. Va sur https://play.google.com/console
2. Crée une nouvelle application
3. Remplis les informations :
   - **Nom** : SOBAYA — Gestion Immobilière
   - **Description courte** : Gérez vos biens, locataires et paiements
   - **Description longue** : (voir ci-dessous)
   - **Catégorie** : Business / Productivité
   - **Politique de confidentialité** : https://TON-DOMAINE.com/legal/confidentialite
4. Upload le fichier `.aab` généré par Bubblewrap (dans `sobaya-android/app-release-bundle.aab`)
5. Ajoute des captures d'écran (minimum 2, format téléphone)
6. Soumets pour révision (2 à 7 jours pour la première publication)

---

## Description longue suggérée pour le Play Store

```
SOBAYA est la plateforme de gestion immobilière conçue pour les propriétaires
et agences en Côte d'Ivoire et en Afrique francophone.

✅ Gérez votre patrimoine immobilier
✅ Suivez vos locataires et contrats
✅ Enregistrez les paiements et générez des quittances
✅ Gérez la maintenance et les interventions
✅ Publiez vos annonces sur la marketplace SOBAYA
✅ Suivez vos impayés et relances
✅ Coffre-fort documentaire sécurisé

SOBAYA centralise tout ce dont vous avez besoin pour gérer
votre patrimoine immobilier depuis votre téléphone.
```

---

## Mises à jour futures

Grâce à la technologie TWA, les mises à jour de l'application se font
automatiquement quand tu mets à jour le site web — sans avoir à
republier sur le Play Store.

Seule exception : si tu changes le `package_name` ou le `keystore`,
une nouvelle publication manuelle est nécessaire.

---

## Résumé des fichiers importants à conserver

- `android.keystore` — ton certificat de signature (NE JAMAIS PERDRE)
- `twa-manifest.json` — configuration Bubblewrap
- `public/.well-known/assetlinks.json` — lien entre le site et l'app Android

Cabinet Grain de Sel — SOBAYA V1
