import express, { type NextFunction, type Request, type Response } from "express";
import { apkStatus, ensureApk, openApk, resetApkForTests } from "./apk";
import { getConfig, resetConfigForTests, TOKEN_TTL_MS, type CommerceConfig } from "./config";
import { sendDownloadEmail, type EmailResult } from "./email";
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
import { getStore, resetStoreForTests } from "./store";
import { hashDownloadToken, isTokenShape, mintDownloadToken, sealDownloadToken, unsealDownloadToken } from "./tokens";

const DOWNLOAD_LOCK_MS = 2 * 60 * 1000;
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
    });
  });

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

  app.get(
    "/api/download/:token",
    asyncRoute(async (req, res) => {
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
      const claim = store.claim(tokenHash, DOWNLOAD_LOCK_MS);
      if (claim !== "ok") {
        const status = claim === "busy" ? 409 : claim === "missing" ? 404 : 410;
        res.status(status).json({ error: claim === "missing" ? "not_found" : claim });
        return;
      }
      const apk = await openApk(config);
      if (!apk) {
        store.release(tokenHash);
        res.status(503).json({ error: "apk_unavailable" });
        return;
      }
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", 'attachment; filename="L-Studio-Pro.apk"');
      res.setHeader("Content-Length", String(apk.size));
      res.setHeader("Cache-Control", "no-store, private");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");

      let settled = false;
      const finishOk = () => {
        if (settled) return;
        settled = true;
        store.complete(tokenHash);
      };
      const finishFail = () => {
        if (settled) return;
        settled = true;
        store.release(tokenHash);
      };
      apk.stream.on("error", () => {
        finishFail();
        res.destroy();
      });
      res.on("finish", finishOk);
      res.on("close", () => {
        if (!res.writableFinished) finishFail();
      });
      apk.stream.pipe(res);
    }),
  );

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
