# Installation du Pixel Meta (Facebook / Instagram) — HPSHOP AFRIQUE

> Statut : **P0 bloquant** avant l'activation des campagnes pub.
> Le code n'est **PAS encore installé**. Ce document explique comment le poser dès que tu as ton **Pixel ID**.
>
> ⚠️ **Deux pièges déjà identifiés dans `index.html`** (lis la section 0 avant tout) :
> 1. Une **Content-Security-Policy** (ligne 9) bloque actuellement le Pixel → il faut l'élargir, sinon le Pixel ne charge pas et reste invisible.
> 2. Le montant `totalAmount` est **déjà en GNF** (pas en micro-unités) → la `value` de l'événement Purchase doit être `totalAmount` **tel quel**, surtout pas `totalAmount / 1000000`.

---

## 0. À FAIRE EN PREMIER — Élargir la Content-Security-Policy (sinon le Pixel est bloqué)

Le fichier `index.html` contient à la **ligne 9** une balise `<meta http-equiv="Content-Security-Policy" ...>`.
Telle quelle, elle **interdit** au navigateur de :
- charger le script du Pixel depuis `connect.facebook.net` (`script-src`),
- envoyer le pixel image vers `www.facebook.com` (`img-src`).

Résultat sans correction : le Pixel ne se déclenche jamais et Meta Pixel Helper n'affiche rien — alors que le code semble pourtant collé. **C'est la cause #1 d'échec.**

**Modification à appliquer dans la balise CSP de la ligne 9 :**

| Directive | Ajouter |
|---|---|
| `script-src` | `https://connect.facebook.net` |
| `img-src` | `https://www.facebook.com` |
| `connect-src` | déjà couvert par `https:` — rien à ajouter |

La directive `script-src` actuelle ressemble à :
```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
```
→ devient :
```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net;
```

La directive `img-src` actuelle ressemble à :
```
img-src 'self' data: https://images.unsplash.com https://hpshop-afrique.vercel.app;
```
→ devient :
```
img-src 'self' data: https://images.unsplash.com https://hpshop-afrique.vercel.app https://www.facebook.com;
```

> Ne touche à rien d'autre dans la CSP.

---

## 1. Où trouver ton Pixel ID dans Meta Business Manager

1. Va sur **https://business.facebook.com** et connecte-toi avec le compte qui gère la page HPSHOP.
2. Menu (☰ en haut à gauche) → **Tous les outils** → **Gestionnaire d'événements** (*Events Manager*).
   - Lien direct : **https://business.facebook.com/events_manager**
3. Dans la colonne de gauche, clique sur **Sources de données** (icône en losange).
4. **Si tu as déjà un Pixel** : clique dessus → l'**ID** (15–16 chiffres) s'affiche sous le nom du Pixel, en haut. Clique pour le copier.
5. **Si tu n'as pas encore de Pixel** :
   - Clique **+ Connecter des sources de données** → **Web** → **Suivant**.
   - Nomme-le par ex. `HPSHOP Pixel` → **Créer le pixel**.
   - Choisis l'installation **manuelle / par code** (on ne veut pas l'intégration partenaire).
   - L'**ID** s'affiche alors ; copie-le.

Ton Pixel ID ressemble à : `123456789012345` (uniquement des chiffres).

➡️ **Dès que tu as cet ID, transmets-le.** Partout ci-dessous, remplace `VOTRE_PIXEL_ID` par ce numéro (aux **3 endroits** : `fbq('init', …)`, l'`<img>` du `<noscript>`, et — pour ce dernier — le paramètre `id=`).

---

## 2. Code exact à coller dans `index.html`

### Emplacement A — Le Pixel de base, juste avant `</head>`

Coller juste **avant la ligne `</head>`** (actuellement vers la ligne 1219, juste après le bloc Google Analytics) :

```html
<!-- META PIXEL — remplacer VOTRE_PIXEL_ID (2 occurrences ci-dessous) -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'VOTRE_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=VOTRE_PIXEL_ID&ev=PageView&noscript=1"/></noscript>
```

Ce bloc déclenche **PageView** sur chaque chargement de page.

---

### Emplacement B — L'événement Purchase, dans `_envoyerCommande()`

Fonction `_envoyerCommande()` : commence ligne **2160** dans `index.html`.

La ligne `crmOk = r.ok;` se trouve **ligne 2200**. Colle le bloc suivant **juste après cette ligne `crmOk = r.ok;`** (à l'intérieur du `try`, donc bien indenté de la même façon) :

```javascript
      // Meta Pixel — événement de conversion
      if(crmOk && typeof fbq !== 'undefined'){
        fbq('track','Purchase',{
          value: totalAmount,            // ⚠️ déjà en GNF — NE PAS diviser par 1 000 000
          currency: 'GNF',
          content_name: currentProduct.nom,
          content_ids: [String(currentProduct.id)],
          content_type: 'product'
        });
      }
```

**Points de vigilance :**

- ✅ `value: totalAmount` — `totalAmount` est calculé par `parsePrice(currentProduct.prix) * currentQty`, et `parsePrice` fait un `parseInt` : c'est donc **déjà un entier en GNF**. Le diviser par 1 000 000 enverrait une valeur ridicule (~0) à Meta et fausserait le ROAS. **Garde `value: totalAmount`.**
- ✅ Placé après `crmOk = r.ok;` → l'événement ne se déclenche que si la commande a bien été enregistrée côté CRM (commande « réelle »).
- ℹ️ Si plus tard tu veux aussi compter les commandes passées par le **fallback WhatsApp** (quand le CRM est indisponible), il faudra déplacer/dupliquer le `fbq('track','Purchase', …)` dans le bloc `setTimeout(...)` de fin de fonction (vers la ligne 2248). Pour l'instant, on s'en tient au succès CRM.
- 💡 Optionnel : ajouter `fbq('track','InitiateCheckout')` au moment de l'ouverture du formulaire de commande pour optimiser les audiences. Non requis pour le P0.

---

## 3. Vérifier l'installation avec Meta Pixel Helper

1. Installe l'extension Chrome **Meta Pixel Helper** :
   **https://chrome.google.com/webstore** → rechercher « Meta Pixel Helper » → **Ajouter à Chrome**.
   (Éditeur : Meta Platforms, Inc.)
2. Ouvre le site **https://hpshop-afrique.vercel.app** (ou ton URL de prod après déploiement).
3. Clique sur l'icône **`</>`** de Pixel Helper dans la barre d'outils Chrome.
   - ✅ Tu dois voir **1 Pixel détecté**, ton **Pixel ID**, et l'événement **PageView** (en vert, sans avertissement).
   - ❌ Si rien n'apparaît → vérifie d'abord la **CSP (section 0)** : ouvre la console (F12 → onglet *Console*) et cherche une erreur du type `Refused to load the script 'https://connect.facebook.net/...' because it violates the Content Security Policy`. Si tu la vois, la CSP n'a pas été élargie correctement.
4. **Tester l'événement Purchase :** passe une **vraie commande de test** sur le site (remplis le formulaire et confirme).
   - Dans Pixel Helper, tu dois alors voir apparaître l'événement **Purchase** avec `value`, `currency: GNF` et `content_name`.
   - Vérifie que la `value` correspond bien au **montant en GNF** affiché (ex. `150000`), et **pas** une valeur du type `0,15`.
5. **Confirmation côté Meta :** dans **Events Manager → ton Pixel → Aperçu / Test des événements** (*Test Events*), tu peux saisir l'URL du site et voir les événements arriver en temps réel.

> ⏱️ Les événements peuvent mettre quelques minutes à apparaître dans le tableau de bord Events Manager, mais Pixel Helper et l'onglet *Test Events* sont instantanés.

---

## Récapitulatif des changements à faire dans `index.html` (le jour J)

| # | Où | Quoi |
|---|---|---|
| 1 | Ligne 9 (balise CSP) | Ajouter `https://connect.facebook.net` à `script-src` **et** `https://www.facebook.com` à `img-src` |
| 2 | Juste avant `</head>` (~ligne 1219) | Coller le bloc **Pixel de base** (Emplacement A) avec ton Pixel ID |
| 3 | Dans `_envoyerCommande()`, après `crmOk = r.ok;` (~ligne 2200) | Coller le bloc **Purchase** (Emplacement B), `value: totalAmount` |

Une fois les 3 points faits → vérifier avec Pixel Helper (section 3) → déployer.
