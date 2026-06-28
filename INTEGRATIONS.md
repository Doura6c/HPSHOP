# INTEGRATIONS — HPSHOP Afrique

**Date :** 2026-06-28
**Stack réelle :** ⚠️ **Site statique** (`index.html` mono-fichier + CSS/JS inline) déployé sur Vercel,
avec 2 fonctions serverless dans `/api`. **Ce n'est PAS du Next.js** — le brief supposait Next/App Router,
mais il n'y a ni `package.json`, ni `_app.js`/`layout.js`, ni `/lib`. Les intégrations ont donc été
implémentées **en vanilla** (constante Pixel dans `index.html`, fonctions serverless sans dépendance npm).
**CRM (`api/submit-order.js`) non modifié**, comme demandé.

---

## CORRECTIONS UX (Phase 1)

| # | Fix | Statut | Détail |
|---|-----|--------|--------|
| 1 | Navbar fixe au scroll | ✅ | `nav{position:fixed;top:36px}` + ticker fixe + `body{padding-top}` (déjà en place) |
| 2 | Compteur produits dynamique | ✅ | `.dyn-count` / `.ticker-count` / `#statProduits` = `produits.length` (18). Plus aucun 18/24 en dur |
| 3 | Scroll en haut à l'ouverture produit | ✅ | `pdOverlay.scrollTop = 0` dans `openPD()` |
| 4 | Layout commande côte à côte | ✅ | `.pd-split` : visuel gauche **sticky**, formulaire droite ; empilé sur mobile |
| 5 | Galerie multimédia ordonnée | ✅ | Packshot → miniatures → vidéo (autoplay/muted/loop) → images pub/lifestyle |
| 6 | « Mode d'utilisation » ouvert par défaut | ✅ | Accordéon `accBlock(..., true)` ouvert au chargement |
| 7 | Upsell volume (remises 2/3 unités) | ❌ **volontairement non appliqué** | Tu l'avais fait **retirer explicitement** (« franchement c'était pas une bonne idée »). Non réintroduit. Dis-moi si tu changes d'avis |
| 8 | Message COD pro sous « Commander » | ✅ | Bandeau de réassurance + engagement COD déjà présents sous le bouton |

> Bonus déjà livrés cette session : suivi de commande branché sur le CRM (`/suivi`), bouton « Suivre ma commande »
> en bas de page, hero avec vrais produits, compteur de commandes animé.

---

## PIXEL META (Phase 2)

**Avant :** ❌ aucun Pixel (seul GA4 `G-BFYZW97PJT` présent).
**Après :** ✅ Pixel Meta installé (code de base + événements), **dormant** tant que l'ID n'est pas saisi.

**Configuration (site statique → pas d'env var) :**
Le Pixel ID se met dans `index.html` :
```js
window.META_PIXEL_ID = "YOUR_PIXEL_ID"; // ← remplacer par l'ID (15-16 chiffres)
```
Tant que c'est le placeholder, `fbq` ne se charge pas (aucune erreur, rien ne casse).
La **CSP** (ligne 9) a été élargie : `script-src … connect.facebook.net` + `img-src … www.facebook.com`,
plus le `<noscript>` fallback. (Le Pixel ID est **public**, ce n'est pas un secret.)

**Événements trackés :**

| Événement Meta | Déclencheur | Données |
|----------------|-------------|---------|
| `PageView` | Chargement de page (init) | — |
| `ViewContent` | Ouverture fiche produit (`openPD`) | `content_ids:["HP-<id>"]`, `content_name`, `content_type:'product'`, `value`, `currency:'GNF'` |
| `InitiateCheckout` | Clic « Commander » (récap) **et** ouverture checkout panier | `content_ids`, `value`, `currency:'GNF'`, `num_items` |
| `Purchase` | Commande confirmée (flux simple **et** panier) | `content_ids`, `content_name`, `value`, `currency:'GNF'`, `num_items` |
| `Lead` | Commande confirmée | `content_name`, `value`, `currency:'GNF'` |

> Co-tracking GA4 ajouté au passage (l'achat du flux **simple** n'était pas tracké GA auparavant — corrigé).

**Comment vérifier :** installe l'extension Chrome **Meta Pixel Helper**, mets ton vrai ID, recharge le site →
elle doit afficher PageView, puis ViewContent en ouvrant un produit, etc. ⚠️ `value` est en **GNF tel quel**
(ne pas diviser par 1 000 000).

---

## GOOGLE SHEETS (Phase 3)

**Avant :** ❌ aucune connexion Sheets.
**Après :** ✅ relais prêt, **dormant** tant que `GOOGLE_SHEETS_WEBHOOK_URL` n'est pas configurée.

**Architecture (méthode Apps Script — gratuite, sans Service Account, sans npm) :**
```
Commande ─┬─► /api/submit-order ─► CRM Aleton           (inchangé)
          └─► /api/log-order    ─► Apps Script ─► Google Sheet   (best-effort, parallèle)
```
- Nouveau fichier serverless : `api/log-order.js` (relaie vers l'URL Apps Script, no-op si non configuré).
- Front : `logToSheets({...})` appelé en *fire-and-forget* dans les 2 flux (simple + panier) — **ne bloque jamais** la commande, **ne touche pas** le CRM.
- Setup détaillé : **`GOOGLE_SHEETS_SETUP.md`**.

**Structure du Sheet (colonnes A→L) :**
`Date | Code | Réf externe | Nom | Téléphone | Adresse | Ville | Produits | Quantité | Total (GNF) | Paiement | Statut`

**Variables d'environnement (Vercel) :**
| Variable | Usage |
|----------|-------|
| `GOOGLE_SHEETS_WEBHOOK_URL` | URL du déploiement Apps Script (Web App `/exec`) |
| `CRMCOD_API_KEY` | (déjà existant) clé du webhook CRM |

> Note : la méthode « Service Account + googleapis » du brief a été écartée — elle imposerait d'ajouter des
> dépendances npm + un build à un site jusqu'ici 100 % statique. Apps Script donne le même résultat, gratuitement.

---

## À FAIRE PAR L'ADMIN (toi)

1. **Pixel Meta** : récupère ton ID dans **Meta Business Suite → Events Manager → Sources de données**,
   colle-le dans `index.html` (`window.META_PIXEL_ID`), remplace aussi `YOUR_PIXEL_ID` dans le `<noscript>`, redéploie.
2. **Google Sheets** : suis **`GOOGLE_SHEETS_SETUP.md`** (créer le Sheet + Apps Script + déployer en Web App),
   puis ajoute `GOOGLE_SHEETS_WEBHOOK_URL` dans **Vercel → Settings → Environment Variables** et **redéploie**.
3. **Test** : passe une commande test → vérifie Pixel Helper (events) **et** la nouvelle ligne dans le Sheet, puis supprime la ligne.

---

## PROCHAINES ÉTAPES RECOMMANDÉES

- **Meta Lead Ads → même Google Sheet** (colonne `SOURCE = META_ADS`) pour centraliser tous les prospects.
- **Notification WhatsApp client** après commande (WhatsApp Cloud API ; CallMeBot ne marche que vers ton numéro boutique).
- **Conversions API (CAPI) Meta** côté serverless pour fiabiliser le tracking malgré les bloqueurs (le Pixel navigateur seul perd ~20-30 % des events).
- **Dashboard temps réel** des commandes (le Google Sheet peut servir de base immédiate via Looker Studio).
