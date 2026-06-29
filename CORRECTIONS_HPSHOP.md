# AUDIT 360° & CORRECTIONS — HPSHOP Afrique

**Date :** 2026-06-29
**Méthode :** audit complet du codebase réel (pas un template générique).

> ⚠️ **Constat clé :** la quasi-totalité des fixes demandés **était déjà en place** (travail réalisé au cours des sessions précédentes). Ce rapport reflète l'**état réel** du code, pas une todo théorique. Aucune fonctionnalité existante n'a été cassée.

---

## PHASE 0 — CARTOGRAPHIE DU CODEBASE

| Élément | Réalité |
|---------|---------|
| **Stack** | **Site statique** : un seul `index.html` (HTML + CSS + JS **inline**). **PAS de framework** (ni Next.js, ni React). Déployé sur **Vercel**. |
| **Routing** | Ancres `#produits`, `#produit-<id>` (hash routing JS). Redirects dans `vercel.json` (`/suivi-commande`, `/admin`). |
| **Données produits** | Tableau JS `const produits = [...]` dans `index.html` (**18 produits**), champs : id, nom, cat, emoji, img, imgs, pub, prix, old, stock, badge, desc, usage, video. |
| **Composants** | Tout inline dans `index.html` : ticker, navbar, hero, grille produits, **modal produit** (galerie + formulaire COD), panier (drawer + checkout), modals récap/succès, popup newsletter -10%, footer. |
| **Fonctions serverless** (`/api`) | `submit-order.js` (proxy CRM, clé cachée) · `log-order.js` (relais Google Sheets). |
| **Intégrations actives** | **CRM** (cod-crm via `/api/submit-order`) · **Google Sheets** (Apps Script via `/api/log-order`) · **WhatsApp** (liens wa.me + fallback) · **Rapido** (mention livraison) · **Suivi commande** (page CRM `/suivi`). |
| **Meta Pixel** | ✅ **Présent et actif** (ID `695091440542974`) — PageView, ViewContent, InitiateCheckout, Purchase, Lead. |
| **Analytics** | ✅ **GA4** (`G-BFYZW97PJT`) + helpers `trackOrder/trackViewProduct/trackAddToCart`. |
| **Suivi commande** | ✅ Code commande CRM affiché + bouton « Suivre ma commande » + page `/suivi`. |

---

## PHASE 1 — AUDIT 360°

| Axe | Problème | Localisation | Sévérité | État |
|-----|----------|--------------|----------|------|
| Navbar scroll | — | `nav{position:fixed;top:36px}` + `body{padding-top}` | — | ✅ Déjà corrigé |
| Scroll modal | — | `openPD()` → `pdOverlay.scrollTop=0` | — | ✅ Déjà corrigé |
| Compteur produits | — | `.dyn-count`/`.ticker-count`/`#statProduits` = `produits.length` (18) | — | ✅ Dynamique |
| Lazy loading | OK | `IntersectionObserver` custom (`data-bg`) | 🟡 | ✅ En place (amélioration webp possible) |
| Erreurs console | Aucune | — | — | ✅ Vérifié |
| Meta SEO | OK | title, description, OG, Twitter, JSON-LD | 🟡 | ✅ Complet |
| Mode d'emploi | — | accordéon `accBlock(..., true)` **ouvert par défaut** | — | ✅ Déjà corrigé |
| Produits suggérés | — | `.cross-sell-grid{display:flex;overflow-x:auto}` horizontal | — | ✅ Horizontal |
| Réassurance COD | — | `.pd-trust` (3 icônes) + `.trust-band` (847 cmd, 96%, 24H) + strip | — | ✅ Présent |
| Mention COD pro | — | `.cod-notice` (modal) + `.cod-notice-global` (footer) | — | ✅ Présent |
| CTAs | OK | « 🛒 Commander maintenant », vert dominant, full-width mobile | — | ✅ Bons |
| Pricing | OK | prix barré + prix promo + -X% + « livraison gratuite » | — | ✅ Clair |
| Copywriting | OK | descriptions complètes, ton direct GN, aucune faute trouvée | 🟡 | ✅ Correct |
| **Upsell volume** | **Retiré** | — | — | ❌ **Volontairement absent (voir ci-dessous)** |

---

## PHASE 2 — CORRECTIONS

| Fix demandé | Statut | Détail |
|-------------|--------|--------|
| **FIX 1** — Mode d'emploi ouvert | ✅ Déjà fait | Accordéon « 📋 Comment utiliser ce produit » ouvert par défaut |
| **FIX 2** — Navbar fixe | ✅ Déjà fait | `position:fixed` + compensation `padding-top` |
| **FIX 3** — Scroll to top | ✅ Déjà fait | `scrollTop=0` à l'ouverture modal |
| **FIX 4** — Compteur dynamique | ✅ Déjà fait | `produits.length` partout |
| **FIX 5** — Suggérés horizontaux | ✅ Déjà fait | Flex + scroll-snap, cartes 140px |
| **FIX 6** — Upsell volume | ❌ **NON ré-appliqué — décision du propriétaire** | Implémenté puis **retiré à ta demande explicite** (« supprime les remises, franchement c'était pas une bonne idée »). Re-l'ajouter contredirait ta décision. **Dis-moi si tu veux le réactiver.** Reste seulement à faire : suppression du CSS mort `.pd-upsell` (fait dans ce passage). |
| **FIX 7** — Mention COD footer | ✅ Déjà fait | `.cod-notice-global` |
| **FIX 8** — Copywriting/CTAs | ✅ Vérifié | CTAs déjà engageants, aucune faute trouvée |
| **FIX 9** — Bloc réassurance | ✅ Déjà fait | `.pd-trust` + `.trust-band` |

**Seule modification de code dans ce passage :** suppression de ~9 lignes de **CSS mort `.pd-upsell`** (résidu de l'upsell retiré). Aucune autre intervention pour ne rien casser.

---

## PHASE 3 — DESIGN

| Point | État |
|-------|------|
| Palette (rouge/or/vert) | ✅ Cohérente via variables CSS `--red/--gold/--green` |
| Typo (Bebas Neue / Nunito) | ✅ Cohérente |
| Lisibilité mobile fiches | ✅ Layout `pd-split` empilé, inputs 16px (anti-zoom iOS), cibles ≥48px |
| Ratio images produits | ✅ `object-fit:contain` uniforme |
| Hover cartes | ✅ `transform:translateY(-6px)` + ombre |

---

## PHASE 4 — RECOMMANDATIONS RESTANTES (par priorité)

### 🔴 Top 3 leviers de conversion à traiter maintenant
1. **Lancer la pub Meta (Lead Ads / Formulaire instantané)** — toute l'infra est prête (Pixel, Sheet, suivi). C'est LE levier de croissance immédiat. *Bloqueur actuel : ajouter un moyen de paiement sur le compte pub.*
2. **Vérifier le domaine `hpshop-afrique.vercel.app` dans Meta + configurer les 8 événements (AEM)** → fiabilise le suivi des achats iOS pour optimiser les campagnes.
3. **Mettre de vraies vidéos/preuves sociales** (avis clients réels au lieu des avis générés `defaultAvis`) → renforce la confiance COD.

### 🟠 Moyen
- Images en **webp/avif** + `loading="lazy"` natif (gain de poids/vitesse).
- Notification **WhatsApp automatique au client** (WhatsApp Cloud API) après commande.
- Externaliser le catalogue `produits` en JSON (maintenance plus simple).

### 🟡 Faible
- Nettoyage CSS mort résiduel éventuel.
- `og-image.jpg` à jour et représentatif.

---

## AVIS PROFESSIONNEL — les 3 urgences conversion

1. **Le site est techniquement prêt à convertir.** Le frein n'est plus le code, c'est le **trafic** : priorité absolue = **lancer les pubs**.
2. **Ne pas réintroduire les remises volume** sans raison : sur un marché COD où les colis refusés coûtent cher, gonfler le panier au checkout augmente les refus. La décision de les retirer était la bonne.
3. **Preuve sociale réelle** (vrais avis, vraies vidéos d'unboxing) = le plus gros multiplicateur de confiance restant pour un acheteur guinéen qui ne connaît pas encore la marque.

---

*Audit réalisé sur le code réel. Aucune fonctionnalité cassée. Modifications minimales et justifiées.*
