# 📊 Google Sheets — Enregistrer chaque commande dans un tableur

> Objectif : chaque commande passée sur le site est écrite **en parallèle** dans un Google Sheet,
> **en plus** de l'envoi au CRM (le CRM n'est pas modifié).
>
> Méthode retenue : **Google Apps Script** (100 % gratuit, **sans Service Account**, sans dépendance npm).
> C'est la plus simple pour ce site statique. Le code serverless `api/log-order.js` relaie la commande
> vers une URL Apps Script stockée dans la variable d'environnement `GOOGLE_SHEETS_WEBHOOK_URL`.
>
> Tant que cette variable n'est pas définie sur Vercel, la fonctionnalité est **dormante** (aucune erreur).

---

## Schéma du flux

```
Client commande
      │
      ├──► /api/submit-order ──► CRM Aleton (webhook existant — inchangé)
      │
      └──► /api/log-order  ──►  Google Apps Script  ──►  Google Sheet (1 ligne par commande)
              (best-effort, n'impacte jamais la commande ni le CRM)
```

---

## Étape 1 — Créer le Google Sheet

1. Va sur https://sheets.new (crée une feuille vierge).
2. Nomme-la par ex. **HPSHOP — Commandes**.
3. Sur la **ligne 1**, colle ces en-têtes (colonnes A → L) :

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Date | Code | Réf externe | Nom | Téléphone | Adresse | Ville | Produits | Quantité | Total (GNF) | Paiement | Statut |

---

## Étape 2 — Créer le script Apps Script

1. Dans le Sheet : menu **Extensions → Apps Script**.
2. Supprime le code par défaut, colle ceci :

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      data.receivedAt || new Date().toISOString(),
      data.code || "",
      data.externalRef || "",
      data.nom || "",
      data.telephone || "",
      data.adresse || "",
      data.ville || "",
      data.produits || "",
      data.quantite || "",
      data.total || "",
      data.paiement || "",
      data.statut || ""
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Clique **Enregistrer** (icône disquette).

---

## Étape 3 — Déployer en Web App

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Type (roue dentée) : **Application Web**.
3. Configuration :
   - **Description** : `HPSHOP commandes`
   - **Exécuter en tant que** : *Moi* (ton compte)
   - **Qui a accès** : **Tout le monde** (« Anyone »)
4. Clique **Déployer**, autorise les permissions (choisis ton compte → *Autoriser*).
5. **Copie l'URL de l'application Web** (format `https://script.google.com/macros/s/XXXX/exec`).

---

## Étape 4 — Brancher l'URL sur Vercel

1. Vercel → projet **hpshop-afrique** → **Settings → Environment Variables**.
2. Ajoute :
   - **Name** : `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value** : l'URL `.../exec` copiée à l'étape 3
   - **Environments** : Production (+ Preview si tu veux tester)
3. **Save**, puis **redéploie** (Deployments → ⋯ → Redeploy) pour que la variable soit prise en compte.

---

## Étape 5 — Tester

1. Passe une **fausse commande** sur le site (nom « TEST SHEETS »).
2. Vérifie qu'une **nouvelle ligne** apparaît dans le Google Sheet en quelques secondes.
3. Supprime la ligne de test ensuite.

> Si rien n'apparaît : vérifie que le déploiement Apps Script est en accès **« Tout le monde »**,
> que l'URL se termine par `/exec`, et que la variable Vercel a bien été ajoutée **puis redéployée**.

---

## Notes

- Le log Sheets est **best-effort** : si Apps Script est lent ou indisponible, la commande part quand même
  au CRM et le client n'est pas bloqué (`api/log-order.js` renvoie 200 sans erreur bloquante).
- Aucune clé secrète exposée côté navigateur : l'URL Apps Script reste dans la variable d'env Vercel
  (le navigateur appelle seulement `/api/log-order`).
- Alternative « Service Account + googleapis » : possible mais inutilement lourde ici (ajout de dépendances
  npm à un site jusqu'ici sans build). La méthode Apps Script ci-dessus est recommandée.
