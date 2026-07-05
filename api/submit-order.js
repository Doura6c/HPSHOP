// Proxy sécurisé — la clé API n'est jamais visible dans le navigateur.
// Vercel l'injecte depuis la variable d'environnement CRMCOD_API_KEY.

const CRMCOD_URL = "https://cod-crm-zeta.vercel.app/api/webhook/order";
const ALLOWED_ORIGIN = "https://hpshop-afrique.vercel.app";
const MAX_BODY_BYTES = 50 * 1024; // 50 Ko

// Filet de secours : si le CRM est injoignable, on écrit la commande dans le
// Google Sheet côté serveur (marquée "SECOURS") pour ne JAMAIS perdre une commande.
const SHEETS_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  || "https://script.google.com/macros/s/AKfycbzuS64zYIi6yE8QVvkSBxs-bkYWsOZxnVnsi3O64DK1lklaQQrLFCC1vsVLZIgYJCiF/exec";

async function backupToSheet(body) {
  if (!SHEETS_URL) return false;
  try {
    const c = body?.customer ?? {};
    const items = Array.isArray(body?.items) ? body.items : [];
    const row = {
      code: body?.externalRef ?? "",
      externalRef: body?.externalRef ?? "",
      nom: c.fullName ?? "",
      telephone: c.phone ?? "",
      adresse: c.address ?? "",
      ville: c.city ?? "",
      produits: items.map((it) => `${it.name} × ${it.quantity}`).join(" | "),
      quantite: items.reduce((n, it) => n + (Number(it.quantity) || 0), 0),
      total: body?.total ?? "",
      paiement: body?.paymentMethod ?? "",
      omId: body?.paymentRef ?? "",
      statut: "⚠️ SECOURS — CRM INJOIGNABLE (à traiter)",
      source: (body?.source ?? "site") + " · secours serveur",
      receivedAt: new Date().toISOString(),
    };
    const r = await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    return r.ok;
  } catch (e) {
    console.error("[submit-order] secours Sheet échoué:", e);
    return false;
  }
}

// Rate limiting en mémoire par IP (10 req/min)
const _rl = new Map();
function isRateLimited(ip) {
  const now = Date.now(), windowMs = 60_000, max = 10;
  const r = _rl.get(ip) ?? { n: 0, reset: now + windowMs };
  if (now > r.reset) { r.n = 0; r.reset = now + windowMs; }
  r.n++;
  _rl.set(ip, r);
  return r.n > max;
}

export default async function handler(req, res) {
  const isProd = process.env.NODE_ENV === "production";
  const origin = req.headers.origin ?? "";

  // Headers de sécurité sur toutes les réponses
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Origin allowlist (en prod uniquement)
  if (isProd && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Origine non autorisée" });
  }
  res.setHeader("Access-Control-Allow-Origin", isProd ? ALLOWED_ORIGIN : "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  // Rate limiting par IP
  const ip = (req.headers["x-forwarded-for"] ?? "").split(",")[0].trim()
    || req.socket?.remoteAddress
    || "unknown";
  if (isRateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Trop de requêtes. Réessayez dans une minute." });
  }

  // Taille du payload
  if (Number(req.headers["content-length"] ?? 0) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Requête trop volumineuse" });
  }

  const apiKey = process.env.CRMCOD_API_KEY;
  if (!apiKey) {
    console.error("[submit-order] CRMCOD_API_KEY manquante");
    return res.status(500).json({ error: "Configuration serveur invalide" });
  }

  try {
    const upstream = await fetch(CRMCOD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Key": apiKey, // clé ajoutée côté serveur, invisible navigateur
      },
      body: JSON.stringify(req.body),
    });
    let data = {};
    try { data = await upstream.json(); } catch { /* réponse non-JSON */ }

    if (upstream.ok) {
      return res.status(upstream.status).json(data); // CRM a bien reçu la commande
    }

    // Le CRM a répondu mais pas OK → filet de secours Google Sheet
    const saved = await backupToSheet(req.body);
    if (saved) {
      return res.status(200).json({
        ok: true, backup: true,
        order: { code: req.body?.externalRef },
        note: "Commande enregistrée en secours (CRM indisponible).",
      });
    }
    return res.status(upstream.status || 502).json(data);
  } catch (err) {
    console.error("[submit-order] Erreur proxy:", err);
    // CRM injoignable (réseau/timeout) → filet de secours Google Sheet
    const saved = await backupToSheet(req.body);
    if (saved) {
      return res.status(200).json({
        ok: true, backup: true,
        order: { code: req.body?.externalRef },
        note: "Commande enregistrée en secours (CRM injoignable).",
      });
    }
    return res.status(502).json({ error: "Erreur de communication avec le CRM" });
  }
}
