import { randomBytes } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { apkByteLength, apkStatus, ensureApk, openApk, resetApkForTests } from "./apk";
import { EARLY_ACCESS_TOKEN_TTL_MS, getConfig, resetConfigForTests, TOKEN_TTL_MS, type CommerceConfig } from "./config";
import { normalizeSignupEmail, sendDownloadEmail, sendEarlyAccessEmail, type EmailResult } from "./email";
import {
  acceptCreatedOrder,
  createOrderAmountWasUnexpected,
  createPaypalOrder,
  ensureCapturedOrder,
  formatCreateOrderAmountDiagnostic,
  orderIdFromWebhook,
  PaypalApiError,
  resetPaypalCacheForTests,
  verifyPaidOrder,
  verifyWebhookSignature,
  type WebhookHeaders,
} from "./paypal";
import { getStore, resetStoreForTests, type ClaimResult } from "./store";
import { hashDownloadToken, isTokenShape, mintDownloadToken, sealDownloadToken, unsealDownloadToken } from "./tokens";

const DOWNLOAD_LOCK_MS = 2 * 60 * 1000;
const EARLY_ACCESS_RESEND_LIMIT = 3;
const EARLY_ACCESS_RESEND_WINDOW_MS = 10 * 60 * 1000;
const EARLY_ACCESS_URL = "https://l-studio.studio/#early-access";
const hits = new Map<string, number[]>();

export type Fulfillment =
  | { ok: true; orderId: string; downloadUrl: string; payerEmail: string; email: EmailResult }
  | { ok: false; error: "already_downloaded" | "payment_not_confirmed" | "not_configured" | "server_error"; orderId?: string; retryable?: boolean };

function allowRate(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function isAllowedOrigin(origin: string, requestHost: string, publicBaseUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1";
  if (local && (parsed.protocol === "http:" || parsed.protocol === "https:")) return true;
  if (parsed.protocol === "https:" && (host === "l-studio.studio" || host === "www.l-studio.studio")) return true;
  const incoming = requestHost.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") || "";
  if (incoming && host === incoming && parsed.protocol === "https:") return true;
  if (publicBaseUrl) {
    try {
      if (new URL(publicBaseUrl).origin === parsed.origin) return true;
    } catch {
      /* ignore invalid PUBLIC_BASE_URL */
    }
  }
  return false;
}

function requestBase(req: Request, config: CommerceConfig): string {
  if (config.publicBaseUrl) return config.publicBaseUrl;
  const host = req.get("host");
  if (!host) return "";
  return `${req.protocol}://${host}`;
}

function normalizePersonName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function earlyAccessOrderId(): string {
  return `ea${randomBytes(16).toString("hex")}`;
}

function earlyAccessCounts(config: CommerceConfig): { limit: number; taken: number; remaining: number } {
  const limit = config.earlyAccessLimit;
  const taken = getStore(config.dataDir).countEarlyAccess();
  return { limit, taken, remaining: Math.max(0, limit - taken) };
}

async function deliverEarlyAccess(
  config: CommerceConfig,
  req: Request,
  orderId: string,
  email: string,
): Promise<{ ok: true; downloadUrl: string } | { ok: false; error: "used" | "server_error" }> {
  const store = getStore(config.dataDir);
  const rawToken = mintDownloadToken();
  const issued = store.issueToken({
    orderId,
    captureId: "early-access",
    payerEmail: email,
    amount: "0.00",
    currency: "EARLY",
    tokenHash: hashDownloadToken(rawToken, config.downloadTokenSecret),
    sealedToken: sealDownloadToken(rawToken, config.downloadTokenSecret),
    ttlMs: EARLY_ACCESS_TOKEN_TTL_MS,
  });
  if (issued.result === "used") return { ok: false, error: "used" };
  const token =
    issued.result === "issued"
      ? rawToken
      : issued.sealedToken
        ? unsealDownloadToken(issued.sealedToken, config.downloadTokenSecret)
        : null;
  if (!token) {
    console.error(`early access token missing for order ${orderId}`);
    return { ok: false, error: "server_error" };
  }
  const base = requestBase(req, config);
  if (!base) return { ok: false, error: "server_error" };
  return { ok: true, downloadUrl: `${base}/api/download/${token}` };
}

async function fulfillOrder(config: CommerceConfig, req: Request, orderId: string): Promise<Fulfillment> {
  if (!config.paypalConfigured || !config.downloadTokenSecret) {
    return { ok: false, error: "not_configured" };
  }
  let order;
  try {
    order = await ensureCapturedOrder(config, orderId);
  } catch (error) {
    const issue = error instanceof PaypalApiError ? error.issue || error.message : "error";
    const status = error instanceof PaypalApiError ? error.status : 500;
    console.error(`commerce capture failed for ${orderId}: ${issue}`);
    return { ok: false, error: "payment_not_confirmed", orderId, retryable: status >= 500 || status === 429 };
  }
  const verified = verifyPaidOrder(order, config.priceCents);
  if (!verified.ok) {
    console.error(`commerce payment rejected for ${orderId}: ${verified.reason}`);
    return { ok: false, error: "payment_not_confirmed", orderId, retryable: false };
  }
  const payment = verified.payment;
  const store = getStore(config.dataDir);
  const rawToken = mintDownloadToken();
  const issued = store.issueToken({
    orderId: payment.orderId,
    captureId: payment.captureId,
    payerEmail: payment.payerEmail,
    amount: payment.amount,
    currency: payment.currency,
    tokenHash: hashDownloadToken(rawToken, config.downloadTokenSecret),
    sealedToken: sealDownloadToken(rawToken, config.downloadTokenSecret),
    ttlMs: TOKEN_TTL_MS,
  });
  if (issued.result === "used") {
    return { ok: false, error: "already_downloaded", orderId: payment.orderId };
  }
  const token = issued.result === "issued" ? rawToken : issued.sealedToken ? unsealDownloadToken(issued.sealedToken, config.downloadTokenSecret) : null;
  if (!token) {
    console.error(`commerce token missing for order ${payment.orderId}`);
    return { ok: false, error: "server_error", orderId: payment.orderId };
  }
  const base = requestBase(req, config);
  const downloadUrl = `${base}/api/download/${token}`;
  let email: EmailResult = "skipped";
  const previousEmail = store.getEmailStatus(payment.orderId);
  if (previousEmail !== "sent") {
    email = await sendDownloadEmail(config, { to: payment.payerEmail, downloadUrl, orderId: payment.orderId });
    store.setEmailStatus(payment.orderId, email);
  } else {
    email = "sent";
  }
  return { ok: true, orderId: payment.orderId, downloadUrl, payerEmail: payment.payerEmail, email };
}

type AcceptScores = { html: number; octet: number; json: number };

function acceptScores(header: string | undefined): AcceptScores {
  const scores: AcceptScores = { html: -1, octet: -1, json: -1 };
  if (!header) return scores;
  for (const part of header.split(",")) {
    const [rawType, ...params] = part.trim().split(";");
    const type = rawType.trim().toLowerCase();
    if (!type) continue;
    let q = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key?.trim().toLowerCase() === "q") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) q = parsed;
      }
    }
    if (q <= 0) continue;
    if (type === "text/html" || type === "application/xhtml+xml") scores.html = Math.max(scores.html, q);
    else if (type === "application/octet-stream" || type === "application/vnd.android.package-archive") scores.octet = Math.max(scores.octet, q);
    else if (type === "application/json") scores.json = Math.max(scores.json, q);
  }
  return scores;
}

function queryFlag(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => queryFlag(item));
  return value === "1" || value === "true";
}

function queryForcesDownload(req: Request): boolean {
  return queryFlag(req.query.download) || queryFlag(req.query.raw);
}

function prefersHtml(req: Request): boolean {
  const scores = acceptScores(req.get("accept"));
  return scores.html > 0 && scores.html > scores.json;
}

function parseByteRange(header: string | undefined, size: number): { start: number; end: number } | "unsatisfiable" | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!/^bytes=/i.test(trimmed)) return null;
  const spec = trimmed.slice(trimmed.indexOf("=") + 1).trim();
  if (!spec || spec.includes(",")) return null;
  const match = /^(\d*)-(\d*)$/.exec(spec);
  if (!match || (match[1] === "" && match[2] === "")) return null;
  if (size <= 0) return "unsatisfiable";
  if (match[1] === "") {
    const suffix = Number(match[2]);
    if (!Number.isInteger(suffix) || suffix <= 0) return "unsatisfiable";
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] === "" ? size - 1 : Number(match[2]);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return "unsatisfiable";
  if (start < 0 || start >= size || end < start) return "unsatisfiable";
  return { start, end: Math.min(end, size - 1) };
}

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
const APK_DISPOSITION = "attachment; filename=\"L-Studio-Pro.apk\"; filename*=UTF-8''L-Studio-Pro.apk";

function varyAccept(res: Response) {
  const current = res.getHeader("Vary");
  const existing = Array.isArray(current) ? current.join(", ") : String(current ?? "");
  if (existing.toLowerCase().split(",").some((part) => part.trim() === "accept")) return;
  res.setHeader("Vary", existing ? `${existing}, Accept` : "Accept");
}

function downloadUnavailableHtml(): string {
  return `<!DOCTYPE html>
<html lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>L Studio download unavailable</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0b0b0c; color: #f4f1ea; font-family: Heebo, Arial, Helvetica, sans-serif; }
  main { max-width: 38rem; margin: 0 auto; padding: 48px 20px 64px; }
  .mark { margin: 0 0 28px; letter-spacing: .18em; font-size: 13px; color: #e3c565; }
  section + section { margin-top: 36px; padding-top: 28px; border-top: 1px solid rgba(244,241,234,.16); }
  h1 { margin: 0 0 12px; font-size: 1.7rem; line-height: 1.25; }
  p { margin: 0 0 14px; font-size: 1.05rem; line-height: 1.55; }
  a { color: #0b0b0c; background: #e3c565; text-decoration: none; font-weight: 700; border-radius: 999px; display: inline-block; padding: 12px 18px; }
  .he { direction: rtl; text-align: right; }
  .en { direction: ltr; text-align: left; }
</style>
</head>
<body>
<main>
  <p class="mark">L STUDIO</p>
  <section class="he" lang="he" dir="rtl">
    <h1>ההורדה לא זמינה</h1>
    <p>קישור ההורדה הזה כבר נוצל, או שפג תוקפו.</p>
    <p>חזרו לעמוד הגישה המוקדמת ושלחו שוב את אותו מייל. יישלח קישור חדש.</p>
    <p><a href="${EARLY_ACCESS_URL}">לקבלת קישור חדש</a></p>
  </section>
  <section class="en" lang="en" dir="ltr">
    <h1>Download unavailable</h1>
    <p>This download link was already used or has expired.</p>
    <p>Go back to Early Access and submit the same email. A new link will be sent.</p>
    <p><a href="${EARLY_ACCESS_URL}">Get a new link</a></p>
  </section>
</main>
</body>
</html>`;
}

function downloadLandingHtml(earlyAccess: boolean): string {
  const retryHe = earlyAccess
    ? "<p>אם הקובץ לא מופיע בהורדות, לחצו שוב. הקישור נשאר פעיל כ-24 שעות.</p>"
    : "<p>הקישור הזה שומר את הקובץ פעם אחת. אם ההורדה נעצרת לפני הסוף, אפשר לנסות שוב.</p>";
  const retryEn = earlyAccess
    ? "<p>If it does not appear in Downloads, tap again. This link stays active for about 24 hours.</p>"
    : "<p>This link saves the file once. If the download stops before it finishes, you can try again.</p>";
  return `<!DOCTYPE html>
<html lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>Save L-Studio-Pro.apk</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0b0b0c; color: #f4f1ea; font-family: Heebo, Arial, Helvetica, sans-serif; }
  main { max-width: 38rem; margin: 0 auto; padding: 48px 20px 64px; }
  .mark { margin: 0 0 28px; letter-spacing: .18em; font-size: 13px; color: #e3c565; }
  section + section { margin-top: 36px; padding-top: 28px; border-top: 1px solid rgba(244,241,234,.16); }
  h1 { margin: 0 0 12px; font-size: 1.7rem; line-height: 1.25; }
  p { margin: 0 0 14px; font-size: 1.05rem; line-height: 1.55; }
  button.save { color: #0b0b0c; background: #e3c565; font: inherit; font-weight: 700; border: 0; border-radius: 999px; display: inline-block; padding: 14px 22px; font-size: 1.05rem; cursor: pointer; }
  .he { direction: rtl; text-align: right; }
  .en { direction: ltr; text-align: left; }
</style>
</head>
<body>
<main>
  <p class="mark">L STUDIO</p>
  <section class="he" lang="he" dir="rtl">
    <h1>הורדת האפליקציה</h1>
    <p>לחצו על הורדה כדי לשמור את קובץ ה-APK. השם בהורדות: L-Studio-Pro.apk.</p>
    ${retryHe}
    <form method="post" action="?download=1">
      <button class="save" type="submit">הורדה</button>
    </form>
  </section>
  <section class="en" lang="en" dir="ltr">
    <h1>Download the APK</h1>
    <p>Tap Download to save the APK. The file in Downloads is named L-Studio-Pro.apk.</p>
    ${retryEn}
    <form method="post" action="?download=1">
      <button class="save" type="submit">Download</button>
    </form>
  </section>
</main>
</body>
</html>`;
}

function sendDownloadLanding(res: Response, earlyAccess: boolean) {
  res.status(200);
  varyAccept(res);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store, private");
  res.send(downloadLandingHtml(earlyAccess));
}

function sendDownloadDenied(req: Request, res: Response, claim: Exclude<ClaimResult, "ok">, forceHtml = false) {
  const status = claim === "busy" ? 409 : claim === "missing" ? 404 : 410;
  const error = claim === "missing" ? "not_found" : claim;
  if ((claim === "used" || claim === "expired") && (forceHtml || prefersHtml(req))) {
    res.status(status);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Robots-Tag", "noindex");
    res.send(downloadUnavailableHtml());
    return;
  }
  res.status(status).json({ error });
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch((error) => {
      console.error(`commerce api error: ${error instanceof Error ? error.message : "error"}`);
      if (!res.headersSent) res.status(500).json({ error: "server_error" });
      else next(error);
    });
  };
}

function readWebhookHeaders(req: Request): WebhookHeaders | null {
  const authAlgo = req.get("paypal-auth-algo") || "";
  const certUrl = req.get("paypal-cert-url") || "";
  const transmissionId = req.get("paypal-transmission-id") || "";
  const transmissionSig = req.get("paypal-transmission-sig") || "";
  const transmissionTime = req.get("paypal-transmission-time") || "";
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) return null;
  return { authAlgo, certUrl, transmissionId, transmissionSig, transmissionTime };
}

export function attachCommerceApi(app: express.Express) {
  app.use("/api", express.json({ limit: "100kb" }));
  app.use("/api", (req, res, next) => {
    const origin = req.get("origin");
    const config = getConfig();
    if (origin) {
      const host = req.get("host") || "";
      if (!isAllowedOrigin(origin, host, config.publicBaseUrl)) {
        res.status(403).json({ error: "origin_not_allowed" });
        return;
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Max-Age", "600");
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    const config = getConfig();
    res.json({
      ok: true,
      paypalMode: config.paypalMode,
      paypalConfigured: config.paypalConfigured && Boolean(config.downloadTokenSecret),
      apkStatus: apkStatus(),
      emailConfigured: config.emailConfigured,
      storage: "sqlite",
      earlyAccessLimit: config.earlyAccessLimit,
      earlyAccessRemaining: earlyAccessCounts(config).remaining,
    });
  });

  app.get("/api/early-access/status", (req, res) => {
    if (!allowRate(`early-status:${clientIp(req)}`, 120, 10 * 60 * 1000)) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    res.json(earlyAccessCounts(getConfig()));
  });

  app.post(
    "/api/early-access",
    asyncRoute(async (req, res) => {
      const config = getConfig();
      const email = normalizeSignupEmail(req.body?.email);
      const name = normalizePersonName(req.body?.name);
      if (!email) {
        res.status(400).json({ error: "invalid_email", message: "Enter a valid email address." });
        return;
      }
      if (!allowRate(`early:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
        res.status(429).json({ error: "rate_limited", message: "Too many attempts. Try again in a few minutes." });
        return;
      }
      if (!config.downloadTokenSecret || !config.emailConfigured) {
        res.status(503).json({ error: "not_configured", message: "Early Access email is not available right now." });
        return;
      }
      const store = getStore(config.dataDir);
      const reserved = store.reserveEarlyAccess({
        email,
        name,
        orderId: earlyAccessOrderId(),
        limit: config.earlyAccessLimit,
      });
      if (reserved.result === "full") {
        res.status(410).json({
          error: "full",
          message: `Early Access is full. All ${config.earlyAccessLimit} tester spots are taken.`,
        });
        return;
      }
      if (reserved.result === "exists" && !allowRate(`early-resend:${email}`, EARLY_ACCESS_RESEND_LIMIT, EARLY_ACCESS_RESEND_WINDOW_MS)) {
        res.status(429).json({
          error: "rate_limited",
          status: "already_registered",
          message: "This email is already registered. Wait a few minutes before asking for another download link.",
        });
        return;
      }
      const delivered = await deliverEarlyAccess(config, req, reserved.orderId, email);
      if (!delivered.ok) {
        res.status(delivered.error === "used" ? 409 : 500).json({
          error: delivered.error === "used" ? "already_downloaded" : "server_error",
          message: "Early Access could not prepare a new download link. Submit the same email again in a few minutes.",
        });
        return;
      }
      const emailResult = await sendEarlyAccessEmail(config, {
        to: email,
        downloadUrl: delivered.downloadUrl,
        orderId: reserved.orderId,
      });
      store.setEarlyAccessEmailStatus(email, emailResult);
      if (emailResult !== "sent") {
        res.status(502).json({
          ok: false,
          error: "email_failed",
          status: reserved.result === "created" ? "registered" : "already_registered",
          message: "The download email could not be sent. Submit the same email again in a few minutes.",
        });
        return;
      }
      if (reserved.result === "exists") {
        res.status(200).json({
          ok: true,
          status: "already_registered",
          email: "sent",
          message: "A new download link was sent. Check your inbox, including spam.",
        });
        return;
      }
      res.status(200).json({ ok: true, status: "registered", email: "sent" });
    }),
  );

  app.get("/api/paypal/config", (_req, res) => {
    const config = getConfig();
    if (!config.paypalConfigured || !config.downloadTokenSecret) {
      res.status(503).json({ configured: false, currency: "USD", mode: config.paypalMode });
      return;
    }
    res.json({
      configured: true,
      clientId: config.paypalClientId,
      currency: "USD",
      mode: config.paypalMode,
      productName: config.productName,
      price: config.priceUsd,
    });
  });

  app.post(
    "/api/paypal/create-order",
    asyncRoute(async (req, res) => {
      const config = getConfig();
      if (!config.paypalConfigured || !config.downloadTokenSecret) {
        res.status(503).json({ error: "not_configured" });
        return;
      }
      if (!allowRate(`create:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
        res.status(429).json({ error: "rate_limited" });
        return;
      }
      try {
        const order = await createPaypalOrder(config);
        const accepted = acceptCreatedOrder(order);
        const diagnostic = formatCreateOrderAmountDiagnostic(order);
        if (!accepted.ok) {
          console.error(`commerce create-order rejected: ${accepted.reason}; ${diagnostic}`);
          res.status(502).json({ error: "paypal_unavailable" });
          return;
        }
        if (createOrderAmountWasUnexpected(order, config.priceCents)) {
          console.warn(diagnostic);
        }
        res.json({ id: accepted.id });
      } catch (error) {
        const issue = error instanceof PaypalApiError ? error.issue || error.message : "error";
        console.error(`commerce create-order failed: ${issue}`);
        res.status(502).json({ error: "paypal_unavailable" });
      }
    }),
  );

  app.post(
    "/api/paypal/capture-order",
    asyncRoute(async (req, res) => {
      const config = getConfig();
      const orderId = typeof req.body?.orderId === "string" ? req.body.orderId.trim() : "";
      if (!/^[A-Z0-9]{8,40}$/.test(orderId)) {
        res.status(400).json({ error: "invalid_order" });
        return;
      }
      if (!allowRate(`capture:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
        res.status(429).json({ error: "rate_limited" });
        return;
      }
      const result = await fulfillOrder(config, req, orderId);
      if (!result.ok) {
        const status = result.error === "already_downloaded" ? 409 : result.error === "not_configured" ? 503 : 402;
        res.status(status).json({ error: result.error, orderId: result.orderId || orderId });
        return;
      }
      res.json({
        ok: true,
        orderId: result.orderId,
        downloadUrl: result.downloadUrl,
        payerEmail: result.payerEmail,
        email: result.email,
      });
    }),
  );

  app.post(
    "/api/paypal/webhook",
    asyncRoute(async (req, res) => {
      const config = getConfig();
      if (!config.paypalConfigured || !config.paypalWebhookId || !config.downloadTokenSecret) {
        console.error("commerce webhook skipped: PAYPAL_WEBHOOK_ID or PayPal credentials are not set");
        res.status(503).json({ error: "webhook_not_configured" });
        return;
      }
      const headers = readWebhookHeaders(req);
      if (!headers) {
        res.status(400).json({ error: "missing_webhook_headers" });
        return;
      }
      const valid = await verifyWebhookSignature(config, headers, req.body);
      if (!valid) {
        res.status(400).json({ error: "invalid_webhook_signature" });
        return;
      }
      const found = orderIdFromWebhook(req.body);
      if (!found) {
        res.json({ ok: true, ignored: true });
        return;
      }
      const result = await fulfillOrder(config, req, found.orderId);
      if (!result.ok && result.retryable) {
        res.status(500).json({ error: "fulfillment_failed" });
        return;
      }
      console.log(`commerce webhook ${found.eventType} for order ${found.orderId}: ${result.ok ? "fulfilled" : result.error}`);
      res.json({ ok: true });
    }),
  );

  const downloadHandler = asyncRoute(async (req, res) => {
      const config = getConfig();
      const token = req.params.token || "";
      if (!isTokenShape(token) || !config.downloadTokenSecret) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      if (!allowRate(`download:${clientIp(req)}`, 60, 10 * 60 * 1000)) {
        res.status(429).json({ error: "rate_limited" });
        return;
      }
      const store = getStore(config.dataDir);
      const tokenHash = hashDownloadToken(token, config.downloadTokenSecret);
      const inspected = store.inspect(tokenHash);
      // The email link is fetched by Gmail and other scanners before a person taps it.
      // A bare GET always returns HTML and does not touch the token. The APK starts
      // only from the Download button (POST) or an explicit ?download=1 / ?raw=1.
      const explicit = req.method === "POST" || queryForcesDownload(req);
      if (!explicit) {
        if (inspected.status === "ok") {
          sendDownloadLanding(res, inspected.earlyAccess);
          return;
        }
        sendDownloadDenied(req, res, inspected.status, true);
        return;
      }
      if (inspected.status !== "ok") {
        sendDownloadDenied(req, res, inspected.status);
        return;
      }
      const claim = store.claim(tokenHash, DOWNLOAD_LOCK_MS);
      if (claim !== "ok") {
        sendDownloadDenied(req, res, claim);
        return;
      }
      const total = await apkByteLength(config);
      if (total == null) {
        store.release(tokenHash);
        res.status(503).json({ error: "apk_unavailable" });
        return;
      }
      const range = parseByteRange(req.get("range"), total);
      if (range === "unsatisfiable") {
        store.release(tokenHash);
        varyAccept(res);
        res.status(416);
        res.setHeader("Content-Range", `bytes */${total}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", "0");
        res.end();
        return;
      }
      const apk = await openApk(config, range ?? undefined);
      if (!apk) {
        store.release(tokenHash);
        res.status(503).json({ error: "apk_unavailable" });
        return;
      }
      const coversAll = !range || (range.start === 0 && range.end === total - 1);
      res.status(range ? 206 : 200);
      varyAccept(res);
      res.setHeader("Content-Type", APK_CONTENT_TYPE);
      res.setHeader("Content-Disposition", APK_DISPOSITION);
      res.setHeader("Content-Length", String(apk.size));
      res.setHeader("Accept-Ranges", "bytes");
      if (range) res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${total}`);
      res.setHeader("Cache-Control", "private, no-transform");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");

      let settled = false;
      let bytesSent = 0;
      const countBytes = (chunk: Buffer | string) => {
        bytesSent += Buffer.byteLength(chunk);
      };
      const fullDelivery = () => coversAll && bytesSent >= total;
      const settle = (complete: boolean) => {
        if (settled) return;
        settled = true;
        apk.stream.off("data", countBytes);
        // A finished stream that the phone did not keep must not burn an Early
        // Access link. Paid links still close after one full file.
        if (complete && fullDelivery()) store.noteSuccessfulDownload(tokenHash);
        else store.release(tokenHash);
      };
      apk.stream.on("data", countBytes);
      apk.stream.on("error", () => {
        settle(false);
        if (!res.destroyed) res.destroy();
      });
      res.on("error", () => {
        apk.stream.destroy();
        settle(false);
      });
      req.on("aborted", () => {
        apk.stream.destroy();
        settle(false);
      });
      res.on("finish", () => {
        settle(fullDelivery());
      });
      res.on("close", () => {
        if (!fullDelivery()) {
          apk.stream.destroy();
          settle(false);
        }
      });
      apk.stream.pipe(res);
  });
  app.get("/api/download/:token", downloadHandler);
  app.post("/api/download/:token", downloadHandler);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use((error: { type?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (error?.type === "entity.parse.failed") {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
    next(error);
  });
}

let prepared = false;
let devApp: Promise<express.Express> | null = null;

export async function prepareCommerce() {
  if (prepared) return;
  prepared = true;
  const config = getConfig();
  getStore(config.dataDir);
  if (config.configError) console.error(`commerce config: ${config.configError}`);
  if (!config.downloadTokenSecret) console.error("commerce config: DOWNLOAD_TOKEN_SECRET is not set");
  void ensureApk(config);
}

export function resetCommerceForTests() {
  prepared = false;
  hits.clear();
  devApp = null;
  resetConfigForTests();
  resetStoreForTests();
  resetApkForTests();
  resetPaypalCacheForTests();
}

export function handleCommerceDevRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!devApp) {
    devApp = (async () => {
      const app = express();
      app.disable("x-powered-by");
      app.set("trust proxy", 1);
      await prepareCommerce();
      attachCommerceApi(app);
      return app;
    })();
  }
  devApp
    .then((app) => {
      app(req, res, next);
    })
    .catch(next);
}
