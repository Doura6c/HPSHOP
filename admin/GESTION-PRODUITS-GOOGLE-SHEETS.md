# 🛒 Gérer les produits HPSHOP depuis Google Sheets

Objectif : gérer **prix, stock, nouveaux produits, descriptions** dans un simple tableur Google.
Le site lit la feuille automatiquement au chargement. **Aucun code, aucun redéploiement.**

> Sécurité : tant que ce n'est pas branché, le site utilise les 22 produits déjà intégrés dans `index.html`.
> Si la feuille tombe en panne, le site repasse automatiquement sur ces produits intégrés. **Le site ne casse jamais.**

---

## Étape 1 — Créer le Google Sheet et importer tes produits actuels

1. Va sur https://sheets.new (nouvelle feuille vierge).
2. Menu **Fichier → Importer → Importer (Upload)** → charge le fichier **`admin/produits-seed.csv`** (il contient déjà tes 22 produits).
   - Option d'import : **« Remplacer la feuille actuelle »**, séparateur **virgule**.
3. Renomme l'onglet (en bas) en **`Produits`** (exactement, avec la majuscule).

Tu as maintenant un tableau avec ces colonnes :

| Colonne | Rôle | Exemple |
|---|---|---|
| `id` | Identifiant unique — **ne jamais changer** un id existant | `1` |
| `nom` | Nom du produit | `Shilajit Gummies Himalayen` |
| `cat` | Catégorie : `beaute` `sante` `auto` `maison` `tech` `mode` | `sante` |
| `emoji` | Emoji de secours si pas d'image | `🍯` |
| `prix` | Prix de vente (tape juste le nombre) | `245000` |
| `old` | Prix barré (facultatif) | `360000` |
| `stock` | En stock ? Case à cocher | `TRUE` / `FALSE` |
| `badge` | `chaud`, `new`, `top` ou vide | `chaud` |
| `desc` | Description courte | `Cure de minéraux…` |
| `img` | Image principale | `assets/products/p01.jpg` ou une URL |
| `imgs` | Autres photos, séparées par ` \| ` | `img-a.jpg \| img-b.jpg` |
| `pub` | Visuels pub, séparés par ` \| ` | `pub1.jpg \| pub2.jpg` |
| `usage` | Mode d'emploi, une étape par ` \| ` | `Étape 1 \| Étape 2` |
| `video` | Vidéo (facultatif) | `assets/videos/p01.mp4` |

> **Astuce colonne `stock`** : sélectionne la colonne → menu **Insertion → Case à cocher**.

---

## Étape 2 — Publier la feuille en JSON (Apps Script)

1. Dans le Sheet : menu **Extensions → Apps Script**.
2. Efface le contenu par défaut et **colle tout le contenu du fichier `admin/produits.gs`**.
3. Clique sur **Enregistrer** (icône disquette).
4. Clique sur **Déployer → Nouveau déploiement**.
   - Type : **Application Web**
   - Description : `Produits HPSHOP`
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
5. Clique **Déployer**, autorise l'accès (choisis ton compte → « Autoriser »).
6. **Copie l'URL** qui se termine par `…/exec`.

> Vérifie que ça marche : colle l'URL `…/exec` dans un navigateur → tu dois voir tes produits en JSON.

---

## Étape 3 — Brancher le site

1. Ouvre `index.html`, cherche la ligne :
   ```js
   const PRODUITS_SHEET_URL = "";
   ```
2. Colle ton URL entre les guillemets :
   ```js
   const PRODUITS_SHEET_URL = "https://script.google.com/macros/s/AKfy.../exec";
   ```
3. Enregistre, puis pousse sur Git (Vercel redéploie tout seul) :
   ```bash
   git add index.html && git commit -m "Produits pilotés par Google Sheets" && git push
   ```

**C'est fini.** Désormais, pour changer un prix ou ajouter un produit, tu modifies juste la feuille Google — le site se met à jour tout seul.

---

## Au quotidien

- **Changer un prix / mettre en rupture** : modifie la cellule `prix` ou décoche `stock`. Effet en quelques minutes (le site garde une copie en cache ~immédiate côté visiteur).
- **Ajouter un produit** : nouvelle ligne, mets un **`id` unique** (jamais réutilisé), remplis les colonnes.
- **Retirer un produit** : supprime sa ligne (ou mets `stock` = FALSE pour le laisser visible mais « épuisé »).
- **Images d'un nouveau produit** : soit tu ajoutes le fichier dans `assets/products/` du dépôt, soit tu colles une URL d'image publique dans `img`.

## En cas de souci
- Le site affiche les anciens produits ? → l'URL est peut-être mal collée, ou le déploiement Apps Script n'est pas en « Tout le monde ». Le site reste fonctionnel entre-temps.
- Après un gros changement, tu peux vider le cache : sur le site, console navigateur → `localStorage.removeItem('hpshop_produits_v1')`.
