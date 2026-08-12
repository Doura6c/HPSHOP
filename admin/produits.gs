/**
 * HPSHOP — Publication des produits en JSON pour le site
 * ------------------------------------------------------
 * À coller dans : Google Sheet → Extensions → Apps Script
 * Puis : Déployer → Nouveau déploiement → Application Web
 *        - Exécuter en tant que : Moi
 *        - Qui a accès : Tout le monde
 * Copie l'URL de déploiement (…/exec) et colle-la dans index.html (PRODUITS_SHEET_URL).
 *
 * La feuille doit s'appeler "Produits" avec, en 1re ligne, ces colonnes :
 * id | nom | cat | emoji | prix | old | stock | badge | desc | img | imgs | pub | usage | video
 *
 * Champs multi-valeurs (imgs, pub, usage) : séparer par «  |  » (barre verticale).
 * cat  = beaute | sante | auto | maison | tech | mode
 * stock = TRUE / FALSE (case à cocher)
 * badge = chaud | new | top   (ou vide)
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Produits');
  var out = [];
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return String(h).trim(); });
    for (var r = 1; r < data.length; r++) {
      var o = {};
      headers.forEach(function (h, i) { o[h] = data[r][i]; });
      if (o.id === '' || o.id === null || o.id === undefined) continue; // ligne vide
      out.push({
        id: Number(o.id),
        nom: str(o.nom),
        cat: str(o.cat).toLowerCase(),
        emoji: str(o.emoji) || '🛍',
        prix: formatPrice(o.prix),
        old: (o.old === '' || o.old == null) ? '' : formatPrice(o.old),
        stock: toBool(o.stock),
        badge: normBadge(o.badge),
        desc: str(o.desc),
        img: str(o.img),
        imgs: splitVal(o.imgs),
        pub: splitVal(o.pub),
        usage: splitVal(o.usage),
        video: str(o.video)
      });
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function str(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }

function toBool(v) {
  if (typeof v === 'boolean') return v;
  var s = String(v).trim().toLowerCase();
  return s === 'true' || s === 'vrai' || s === 'oui' || s === '1' || s === 'x' || s === 'yes';
}

function normBadge(v) {
  var s = String(v || '').trim().toLowerCase();
  return (s === 'chaud' || s === 'new' || s === 'top') ? s : '';
}

/** Découpe un champ multi-valeurs sur «  |  » ou sur les retours à la ligne. */
function splitVal(v) {
  if (v === undefined || v === null || v === '') return [];
  return String(v).split(/\s*\|\s*|\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
}

/** 245000 ou "245 000" → "245 000" (espaces normaux, compatibles avec le site). */
function formatPrice(v) {
  if (v === '' || v == null) return '';
  var n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
}
